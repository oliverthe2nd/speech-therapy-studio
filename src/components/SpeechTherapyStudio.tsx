import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Clock, Flame, Target, Trophy } from 'lucide-react'
import { AIFeedbackCard } from '@/components/dashboard/ai-feedback-card'
import { Header } from '@/components/dashboard/header'
import type { DashboardExercise } from '@/components/dashboard/recording-section'
import { RecordingSection } from '@/components/dashboard/recording-section'
import { Sidebar } from '@/components/dashboard/sidebar'
import {
  GoalsView,
  HelpView,
  ScheduleView,
  SettingsView,
} from '@/components/dashboard/studio-views'
import { FirstVisitDashboard } from '@/components/dashboard/FirstVisitDashboard'
import { FollowUpDrillBanner } from '@/components/dashboard/FollowUpDrillBanner'
import { GrowthRoadmapSection } from '@/components/dashboard/GrowthRoadmap'
import { PreMeetingWarmUpCard } from '@/components/dashboard/PreMeetingWarmUpCard'
import { BaselineConversationalWizard } from '@/components/BaselineConversationalWizard'
import { BaselineModal } from '@/components/BaselineModal'
import { PracticeLibrary } from '@/components/PracticeLibrary'
import { SessionHistoryPanel } from '@/components/SessionHistoryPanel'
import { ProgressTrendChart } from '@/components/ProgressTrendChart'
import type { FeedbackStatus } from '@/components/FeedbackCard'
import {
  BASELINE_PRACTICE_SENTENCE,
  PRACTICE_LESSONS,
  type AppMode,
  type PhonemeFocus,
  type PracticeLesson,
} from '@/constants/studio'
import type { BaselineStep } from '@/constants/baselineFlow'
import {
  VIEW_HEADERS,
  type StudioView,
} from '@/constants/studioNav'
import { useAudioRecorder } from '@/hooks/useAudioRecorder'
import { usePersonalizedDrills } from '@/hooks/usePersonalizedDrills'
import { StatsRow, type StatItem } from '@/components/dashboard/stats-row'
import { useExecutiveDossier } from '@/hooks/useExecutiveDossier'
import { useStudioNotifications } from '@/hooks/useStudioNotifications'
import { processRecording } from '@/services/speechPipeline'
import type { ExecutiveDossier, GrowthRoadmap, ScoreMetric } from '@/types/analyzeSpeech'
import { useSessionHistory } from '@/hooks/useSessionHistory'
import {
  buildDashboardExercises,
  buildPracticeLibraryExercises,
  lessonToExercise,
  phonemeFocusForExercise,
  pickFollowUpExercise,
  pickRecommendedExercise,
} from '@/utils/recommendedExercise'
import { logSpeechSession, upsertExecutiveDossier, type ScenarioCategory } from '@/lib/database'
import { resolvePracticeFocus } from '@/utils/buildProgressTrend'
import {
  DEFAULT_PHASE_FOCUS,
  pickExerciseForPhaseFocus,
  type PhaseFocus,
} from '@/utils/phaseFocus'
import {
  PRE_MEETING_WARMUP,
  scenarioToExercise,
} from '@/constants/executiveScenarios'

const CHECK_IN_EXERCISE: DashboardExercise = {
  id: 'check-in',
  title: 'Pattern Check-In',
  difficulty: 'Assessment',
  sentence: BASELINE_PRACTICE_SENTENCE,
  category: 'check-in',
}

function scenarioCategoryForLog(
  mode: AppMode,
  exercise: DashboardExercise,
): ScenarioCategory {
  if (mode === 'baseline') return 'check-in'
  if (exercise.category === 'warmup') return 'warmup'
  if (exercise.category === 'clinical') return 'clinical'
  if (exercise.category === 'personalized') return 'personalized'
  return 'executive'
}

type CompletedSession = {
  feedback: string
  transcript: string
  targetSentence: string
  mode: AppMode
  metrics: ScoreMetric[]
  clinicalMetrics: ScoreMetric[]
  coachingTip: string
}

/** v0 SpeakFlow dashboard — wired to Neon + local speech API pipeline. */
export function SpeechTherapyStudio() {
  const [activeView, setActiveView] = useState<StudioView>('dashboard')
  const [appMode, setAppMode] = useState<AppMode>('practice')
  const [activeTargetSentence, setActiveTargetSentence] = useState('')
  const [activePhonemeFocus, setActivePhonemeFocus] =
    useState<PhonemeFocus | null>(null)
  const [baselineModalOpen, setBaselineModalOpen] = useState(false)
  const [baselineStep, setBaselineStep] = useState<BaselineStep>(1)
  const [executiveDossier, setExecutiveDossier] = useState<ExecutiveDossier>({})
  const [growthRoadmap, setGrowthRoadmap] = useState<GrowthRoadmap | null>(null)
  const [stepAcknowledgment, setStepAcknowledgment] = useState('')
  const [selectedExerciseId, setSelectedExerciseId] = useState('')
  const [activatingPhase, setActivatingPhase] = useState<PhaseFocus | null>(null)

  const {
    dossier: storedDossier,
    loading: dossierLoading,
    refresh: refreshDossier,
    applyRoadmap,
    activatePhaseFocus,
  } = useExecutiveDossier()

  const activePhaseFocus: PhaseFocus =
    storedDossier?.activePhaseFocus ?? DEFAULT_PHASE_FOCUS

  const {
    hasBaseline,
    loading: personalizedLoading,
    sentences: personalizedSentences,
    focusAreas: personalizedFocusAreas,
    error: personalizedError,
    refresh: refreshPersonalizedDrills,
    refreshFresh: refreshFreshDrills,
  } = usePersonalizedDrills(activePhaseFocus)

  const {
    sessions: historySessions,
    loading: historyLoading,
    error: historyError,
    practiceCount,
    checkInCount,
    refresh: refreshSessionHistory,
  } = useSessionHistory()

  const hasCompletedCheckIn = hasBaseline || checkInCount > 0

  const [feedbackStatus, setFeedbackStatus] = useState<FeedbackStatus>('idle')
  const [transcript, setTranscript] = useState('')
  const [feedback, setFeedback] = useState('')
  const [latestCoachMetrics, setLatestCoachMetrics] = useState<ScoreMetric[]>([])
  const [completedSession, setCompletedSession] =
    useState<CompletedSession | null>(null)
  const [followUpExercise, setFollowUpExercise] =
    useState<DashboardExercise | null>(null)
  const [errorMessage, setErrorMessage] = useState('')
  const feedbackPanelRef = useRef<HTMLDivElement>(null)
  const recordingSectionRef = useRef<HTMLDivElement>(null)
  const recordingStartedAtRef = useRef<number | null>(null)

  const {
    status: recorderStatus,
    setStatus: setRecorderStatus,
    levels,
    isRecording,
    startRecording,
    stopRecording,
    resetStatus,
  } = useAudioRecorder()

  const exercises = useMemo((): DashboardExercise[] => {
    const list: DashboardExercise[] = [CHECK_IN_EXERCISE]

    personalizedSentences.forEach((sentence, index) => {
      list.push({
        id: `personalized-${index}`,
        title: `Tailored Scenario ${index + 1}`,
        difficulty: 'Tailored',
        sentence,
        category: 'personalized',
        prompt:
          'Deliver this line with boardroom clarity — steady pace, zero fillers, and crisp final consonants.',
      })
    })

    for (const focus of ['R', 'S'] as const) {
      for (const lesson of PRACTICE_LESSONS[focus]) {
        list.push(lessonToExercise(lesson))
      }
    }

    return list
  }, [personalizedSentences])

  const practiceFocus = useMemo(
    () =>
      resolvePracticeFocus({
        sessions: historySessions,
        checkInFocusAreas: personalizedFocusAreas,
        activePhaseFocus,
      }),
    [historySessions, personalizedFocusAreas, activePhaseFocus],
  )

  const practiceLibraryExercises = useMemo(
    () =>
      buildPracticeLibraryExercises({
        personalizedSentences,
        focusAreas: practiceFocus.focusAreas,
      }),
    [personalizedSentences, practiceFocus.focusAreas],
  )

  const dashboardExercises = useMemo(
    () =>
      buildDashboardExercises({
        personalizedSentences,
        focusAreas: practiceFocus.focusAreas,
      }),
    [personalizedSentences, practiceFocus.focusAreas],
  )

  const recommendedExercise = useMemo(
    () =>
      hasCompletedCheckIn
        ? pickRecommendedExercise({
            personalizedSentences,
            focusAreas: practiceFocus.focusAreas,
            checkInFocusAreas: personalizedFocusAreas,
            practiceCount,
          })
        : CHECK_IN_EXERCISE,
    [
      hasCompletedCheckIn,
      personalizedFocusAreas,
      personalizedSentences,
      practiceFocus.focusAreas,
      practiceCount,
    ],
  )

  const selectedExercise = useMemo(() => {
    if (selectedExerciseId === PRE_MEETING_WARMUP.id) {
      return scenarioToExercise(PRE_MEETING_WARMUP)
    }

    if (selectedExerciseId === CHECK_IN_EXERCISE.id) {
      return CHECK_IN_EXERCISE
    }

    const pool = hasCompletedCheckIn ? dashboardExercises : exercises
    const match = pool.find((item) => item.id === selectedExerciseId)
    if (match) return match
    return recommendedExercise
  }, [
    dashboardExercises,
    exercises,
    hasCompletedCheckIn,
    recommendedExercise,
    selectedExerciseId,
  ])

  const recordingTargetSentence =
    appMode === 'baseline' && baselineStep < 3
      ? ''
      : activeTargetSentence.trim() || selectedExercise.sentence.trim()

  const studioDataLoading = historyLoading || personalizedLoading

  const drillReady =
    appMode === 'baseline'
      ? !studioDataLoading
      : Boolean(recordingTargetSentence) && !studioDataLoading

  const resetFeedback = useCallback(() => {
    setTranscript('')
    setFeedback('')
    setLatestCoachMetrics([])
    setCompletedSession(null)
    setFollowUpExercise(null)
    setErrorMessage('')
    setFeedbackStatus('idle')
    resetStatus()
  }, [resetStatus])

  const resetBaselineWizard = useCallback(() => {
    setBaselineStep(1)
    setExecutiveDossier({})
    setGrowthRoadmap(null)
    setStepAcknowledgment('')
  }, [])

  const navigateTo = useCallback((view: StudioView) => {
    setActiveView(view)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const startBaselineCheckIn = useCallback(() => {
    if (feedbackStatus === 'recording' || feedbackStatus === 'processing') {
      return
    }

    resetFeedback()
    resetBaselineWizard()
    setSelectedExerciseId(CHECK_IN_EXERCISE.id)
    setAppMode('baseline')
    setActiveTargetSentence('')
    setActivePhonemeFocus(null)
    setBaselineModalOpen(false)
    navigateTo('dashboard')
  }, [
    feedbackStatus,
    navigateTo,
    resetBaselineWizard,
    resetFeedback,
  ])

  const commitActiveExercise = useCallback((exercise: DashboardExercise) => {
    setSelectedExerciseId(exercise.id)

    if (exercise.id === CHECK_IN_EXERCISE.id) {
      setAppMode('baseline')
      setActiveTargetSentence('')
      setActivePhonemeFocus(null)
      return
    }

    setAppMode('practice')
    setActiveTargetSentence(exercise.sentence)
    setActivePhonemeFocus(phonemeFocusForExercise(exercise))
  }, [])

  const applyExercise = useCallback(
    (exercise: DashboardExercise, skipModal = false) => {
      if (
        feedbackStatus === 'recording' ||
        feedbackStatus === 'processing'
      ) {
        return
      }

      if (exercise.id === CHECK_IN_EXERCISE.id) {
        if (!skipModal && !hasBaseline && checkInCount === 0) {
          setBaselineModalOpen(true)
          return
        }
        startBaselineCheckIn()
        return
      }

      resetFeedback()
      commitActiveExercise(exercise)
    },
    [
      checkInCount,
      commitActiveExercise,
      feedbackStatus,
      hasBaseline,
      resetFeedback,
      startBaselineCheckIn,
    ],
  )

  useEffect(() => {
    if (studioDataLoading) return
    if (appMode === 'baseline') return
    if (activeTargetSentence.trim()) return
    if (feedbackStatus === 'recording' || feedbackStatus === 'processing') {
      return
    }

    commitActiveExercise(
      hasCompletedCheckIn ? recommendedExercise : CHECK_IN_EXERCISE,
    )
  }, [
    activeTargetSentence,
    appMode,
    commitActiveExercise,
    feedbackStatus,
    hasCompletedCheckIn,
    recommendedExercise,
    studioDataLoading,
  ])

  useEffect(() => {
    if (studioDataLoading) return
    if (appMode === 'baseline') return
    if (activeTargetSentence.trim()) return
    if (!selectedExercise.sentence.trim()) return
    if (feedbackStatus === 'recording' || feedbackStatus === 'processing') {
      return
    }

    commitActiveExercise(selectedExercise)
  }, [
    activeTargetSentence,
    appMode,
    commitActiveExercise,
    feedbackStatus,
    selectedExercise,
    studioDataLoading,
  ])

  const handleSelectExercise = useCallback(
    (exercise: DashboardExercise) => {
      applyExercise(exercise)
    },
    [applyExercise],
  )

  const handleConfirmBaseline = useCallback(() => {
    startBaselineCheckIn()
  }, [startBaselineCheckIn])

  const navigateToPracticeWithExercise = useCallback(
    (exerciseId: string) => {
      const exercise =
        practiceLibraryExercises.find((e) => e.id === exerciseId) ??
        exercises.find((e) => e.id === exerciseId)
      if (exercise) {
        applyExercise(exercise, true)
      }
      navigateTo('practice')
    },
    [applyExercise, exercises, navigateTo, practiceLibraryExercises],
  )

  const handleOpenBaseline = useCallback(() => {
    if (feedbackStatus === 'recording' || feedbackStatus === 'processing') {
      return
    }
    setBaselineModalOpen(true)
  }, [feedbackStatus])

  const handleStartFirstCheckIn = useCallback(() => {
    startBaselineCheckIn()
  }, [startBaselineCheckIn])

  const handleStartFocusPractice = useCallback(() => {
    applyExercise(recommendedExercise, true)
    navigateTo('practice')
  }, [applyExercise, navigateTo, recommendedExercise])

  const handleActivatePhaseFocus = useCallback(
    async (phase: PhaseFocus) => {
      if (activatingPhase !== null) return
      setActivatingPhase(phase)
      try {
        await activatePhaseFocus(phase)
        await refreshFreshDrills()
      } catch (err) {
        console.error('Failed to activate phase focus:', err)
      } finally {
        setActivatingPhase(null)
      }
    },
    [activatePhaseFocus, activatingPhase, refreshFreshDrills],
  )

  const handleLaunchActiveFocusDrills = useCallback(() => {
    const exercise = pickExerciseForPhaseFocus(activePhaseFocus, {
      personalizedSentences,
      practiceCount,
    })
    applyExercise(exercise, true)
    navigateTo('practice')
    window.requestAnimationFrame(() => {
      recordingSectionRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    })
  }, [
    activePhaseFocus,
    applyExercise,
    navigateTo,
    personalizedSentences,
    practiceCount,
  ])

  const handleStartWarmUp = useCallback(() => {
    const warmupExercise = scenarioToExercise(PRE_MEETING_WARMUP)
    applyExercise(warmupExercise, true)
    navigateTo('practice')
    window.requestAnimationFrame(() => {
      recordingSectionRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    })
  }, [applyExercise, navigateTo])

  const handleOpenStructuralModule = useCallback(
    (exercise: DashboardExercise) => {
      applyExercise(exercise, true)
      navigateTo('practice')
      window.setTimeout(() => {
        recordingSectionRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        })
      }, 150)
    },
    [applyExercise, navigateTo],
  )

  const handleSelectLesson = useCallback(
    (lesson: PracticeLesson) => {
      const exercise = lessonToExercise(lesson)
      applyExercise(exercise, true)
      navigateTo('practice')
    },
    [applyExercise, navigateTo],
  )

  const handleSelectPersonalizedSentence = useCallback(
    (sentence: string) => {
      const exercise = exercises.find((e) => e.sentence === sentence)
      if (exercise) {
        applyExercise(exercise, true)
      } else {
        setAppMode('practice')
        setActiveTargetSentence(sentence)
        setActivePhonemeFocus(null)
        resetFeedback()
      }
      navigateTo('practice')
    },
    [applyExercise, exercises, navigateTo, resetFeedback],
  )

  const applyFollowUpExercise = useCallback((exercise: DashboardExercise) => {
    commitActiveExercise(exercise)
  }, [commitActiveExercise])

  const stopRecordingAndProcess = useCallback(async () => {
    const recordedSentence =
      appMode === 'baseline' && baselineStep < 3
        ? ''
        : activeTargetSentence
    const recordedExercise = selectedExercise
    const recordedBaselineStep = baselineStep
    const dossierSnapshot = { ...executiveDossier }

    try {
      const blob = await stopRecording()
      setFeedbackStatus('processing')

      const recordingDurationMs = recordingStartedAtRef.current
        ? Date.now() - recordingStartedAtRef.current
        : undefined
      recordingStartedAtRef.current = null

      const targetForAnalysis =
        appMode === 'baseline' && baselineStep === 3
          ? BASELINE_PRACTICE_SENTENCE
          : activeTargetSentence

      const result = await processRecording(blob, {
        mode: appMode,
        targetSentence: targetForAnalysis,
        phonemeFocus: activePhonemeFocus,
        recordingDurationMs,
        baselineStep: appMode === 'baseline' ? baselineStep : undefined,
        priorDossier: appMode === 'baseline' ? dossierSnapshot : undefined,
        activePhaseFocus: appMode === 'practice' ? activePhaseFocus : undefined,
      })

      setTranscript(result.transcript)
      setFeedback(result.feedback)
      setLatestCoachMetrics(result.analysis.metrics ?? [])
      setFeedbackStatus('done')
      setRecorderStatus('idle')

      const mergedDossier: ExecutiveDossier = {
        ...dossierSnapshot,
        ...result.analysis.executiveDossier,
      }
      setExecutiveDossier(mergedDossier)

      const acknowledgment =
        result.analysis.coachHeardText?.trim() ||
        result.feedback.split('\n').find(Boolean)?.trim() ||
        result.feedback
      setStepAcknowledgment(acknowledgment)

      if (result.analysis.growthRoadmap) {
        setGrowthRoadmap(result.analysis.growthRoadmap)
        applyRoadmap(result.analysis.growthRoadmap)
      }

      const sessionSnapshot: CompletedSession = {
        feedback: result.feedback,
        transcript: result.transcript,
        targetSentence: recordedSentence || targetForAnalysis,
        mode: appMode,
        metrics: result.analysis.metrics ?? [],
        clinicalMetrics: result.analysis.clinicalMetrics ?? [],
        coachingTip: result.analysis.coachingTip ?? '',
      }
      setCompletedSession(sessionSnapshot)

      const isBenchmarkStep =
        appMode === 'baseline' && recordedBaselineStep === 3

      if (!isBenchmarkStep) {
        setFollowUpExercise(null)
      } else {
        const followUp = pickFollowUpExercise({
          feedback: result.feedback,
          metrics: result.analysis.metrics ?? [],
          currentSentence: targetForAnalysis,
          personalizedSentences,
          checkInFocusAreas: personalizedFocusAreas,
          practiceCount,
        })
        setFollowUpExercise(followUp)
        applyFollowUpExercise(followUp)
      }

      try {
        await upsertExecutiveDossier({
          dossier: mergedDossier,
          growthRoadmap: result.analysis.growthRoadmap,
          markBaselineComplete: isBenchmarkStep,
          activePhaseFocus: DEFAULT_PHASE_FOCUS,
        })
        await refreshDossier()

        await logSpeechSession({
          mode: appMode,
          targetSentence: recordedSentence || targetForAnalysis || null,
          phonemeFocus: activePhonemeFocus,
          scenarioCategory: scenarioCategoryForLog(appMode, recordedExercise),
          transcript: result.transcript,
          feedback: result.feedback,
          coachMetrics: result.analysis.metrics,
          clinicalMetrics: result.analysis.clinicalMetrics,
          professionalMetrics: result.analysis.professionalMetrics,
          mispronunciations: result.analysis.mispronunciations,
          recordingDurationMs,
          baselineStep:
            appMode === 'baseline' ? recordedBaselineStep : undefined,
        })

        if (isBenchmarkStep) {
          await refreshFreshDrills(result.feedback)
          const baselineFollowUp = pickFollowUpExercise({
            feedback: result.feedback,
            metrics: result.analysis.metrics ?? [],
            currentSentence: targetForAnalysis,
            personalizedSentences,
            checkInFocusAreas: personalizedFocusAreas,
            practiceCount: 0,
          })
          setFollowUpExercise(baselineFollowUp)
          applyFollowUpExercise(baselineFollowUp)
        }

        await refreshSessionHistory()
      } catch (dbError) {
        console.error('Failed to log session to Neon:', dbError)
        if (isBenchmarkStep) {
          await refreshFreshDrills(result.feedback)
        }
      }

      if (appMode === 'baseline' && recordedBaselineStep < 3) {
        const nextStep = (recordedBaselineStep + 1) as BaselineStep
        setBaselineStep(nextStep)
        if (nextStep === 3) {
          setActiveTargetSentence(BASELINE_PRACTICE_SENTENCE)
        }
        setFeedbackStatus('idle')
        setCompletedSession(null)
        setTranscript('')
        setFeedback('')
        setLatestCoachMetrics([])
      } else if (isBenchmarkStep) {
        setAppMode('practice')
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Something went wrong while processing your recording.'
      setErrorMessage(message)
      setFeedbackStatus('error')
      setRecorderStatus('idle')
    }
  }, [
    activePhaseFocus,
    activePhonemeFocus,
    activeTargetSentence,
    appMode,
    applyFollowUpExercise,
    applyRoadmap,
    baselineStep,
    executiveDossier,
    personalizedFocusAreas,
    personalizedSentences,
    practiceCount,
    refreshDossier,
    refreshFreshDrills,
    refreshSessionHistory,
    selectedExercise,
    setRecorderStatus,
    stopRecording,
  ])

  const toggleRecording = useCallback(async () => {
    if (feedbackStatus === 'processing' || recorderStatus === 'processing') {
      return
    }

    const targetSentence =
      appMode === 'baseline' && baselineStep < 3
        ? 'baseline-conversation'
        : activeTargetSentence.trim() || selectedExercise.sentence.trim()
    if (!targetSentence) return

    if (!activeTargetSentence.trim() && appMode !== 'baseline') {
      commitActiveExercise(selectedExercise)
    }

    if (isRecording) {
      await stopRecordingAndProcess()
      return
    }

    setErrorMessage('')
    setFeedbackStatus('recording')

    try {
      await startRecording()
      recordingStartedAtRef.current = Date.now()
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Microphone access was denied or unavailable.'
      setErrorMessage(message)
      setFeedbackStatus('error')
      setRecorderStatus('idle')
    }
  }, [
    activeTargetSentence,
    appMode,
    baselineStep,
    commitActiveExercise,
    feedbackStatus,
    isRecording,
    recorderStatus,
    selectedExercise,
    setRecorderStatus,
    startRecording,
    stopRecordingAndProcess,
  ])

  const sessionStatus: FeedbackStatus =
    feedbackStatus === 'idle' && recorderStatus === 'recording'
      ? 'recording'
      : feedbackStatus === 'idle' && recorderStatus === 'processing'
        ? 'processing'
        : feedbackStatus

  const canRecord = drillReady && sessionStatus !== 'processing'

  const micStatusHint =
    sessionStatus === 'processing'
      ? 'Analyzing your speech…'
        : studioDataLoading
        ? 'Loading your drill…'
        : appMode === 'baseline' && baselineStep < 3
          ? 'Tap record and answer your coach'
          : !recordingTargetSentence
            ? 'Choose a scenario above to start'
            : undefined

  const {
    notifications,
    unreadCount,
    readIds,
    panelOpen: notificationsOpen,
    setPanelOpen: setNotificationsOpen,
    markAllRead: markAllNotificationsRead,
    handleNotificationAction,
  } = useStudioNotifications({
    hasCompletedCheckIn,
    historyLoading,
    sessionStatus,
    practiceCount,
    historyCount: historySessions.length,
    focusAreas: practiceFocus.focusAreas,
    fromProgress: practiceFocus.fromProgress,
    navigateTo,
    onStartBaseline: handleOpenBaseline,
    onStartFocusPractice: handleStartFocusPractice,
  })

  const dashboardStats = useMemo((): StatItem[] => {
    const total = historySessions.length
    const streak = Math.max(checkInCount, practiceCount > 0 ? 1 : 0)
    const accuracy =
      practiceCount > 0
        ? `${Math.min(99, 72 + Math.min(practiceCount, 12))}%`
        : '—'

    return [
      {
        icon: Clock,
        label: 'Sessions',
        value: String(total),
        subtext: 'All time',
        color: 'text-primary',
        bgColor: 'bg-primary/20',
      },
      {
        icon: Flame,
        label: 'Streak',
        value: String(streak),
        subtext: 'Active days',
        color: 'text-amber-400',
        bgColor: 'bg-amber-400/20',
      },
      {
        icon: Target,
        label: 'Accuracy',
        value: accuracy,
        subtext: 'Estimated',
        color: 'text-emerald-400',
        bgColor: 'bg-emerald-400/20',
      },
      {
        icon: Trophy,
        label: 'Exercises',
        value: String(practiceCount),
        subtext: 'Completed',
        color: 'text-blue-400',
        bgColor: 'bg-blue-400/20',
      },
    ]
  }, [checkInCount, historySessions.length, practiceCount])

  const chartSessions = useMemo(() => {
    const saved = [...historySessions]

    if (
      feedbackStatus === 'done' &&
      feedback.trim() &&
      !saved.some((session) => session.feedback?.trim() === feedback.trim())
    ) {
      saved.unshift({
        id: 'current-session',
        mode: appMode,
        is_baseline: appMode === 'baseline',
        target_sentence: activeTargetSentence || null,
        phoneme_focus: activePhonemeFocus,
        transcript,
        feedback,
        ai_feedback:
          latestCoachMetrics.length > 0
            ? JSON.stringify({ v: 1, metrics: latestCoachMetrics })
            : undefined,
        created_at: new Date().toISOString(),
      })
    }

    return saved
  }, [
    activePhonemeFocus,
    activeTargetSentence,
    appMode,
    feedback,
    feedbackStatus,
    historySessions,
    latestCoachMetrics,
    transcript,
  ])

  const headerMeta = VIEW_HEADERS[activeView]
  const isFirstVisit =
    !historyLoading && !personalizedLoading && !hasCompletedCheckIn

  const activeRecordingExercise = selectedExercise

  useEffect(() => {
    if (feedbackStatus !== 'done' || !completedSession) return
    feedbackPanelRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
    })
  }, [completedSession, feedbackStatus])

  const dashboardSubtitle =
    activeView === 'dashboard'
      ? isFirstVisit && appMode !== 'baseline'
        ? 'New here? Start with a conversational executive baseline check-in'
        : appMode === 'baseline'
          ? `Executive baseline — Step ${baselineStep} of 3 with your coach`
          : headerMeta.subtitle
      : headerMeta.subtitle

  const baselineWizardBlock = (
    <BaselineConversationalWizard
      currentStep={baselineStep}
      isRecording={isRecording}
      isProcessing={sessionStatus === 'processing'}
      isLoading={studioDataLoading}
      canRecord={canRecord}
      micStatusHint={micStatusHint}
      onToggleRecording={() => void toggleRecording()}
      levels={levels}
      stepAcknowledgment={stepAcknowledgment}
    />
  )

  const checkInRecordingBlock = baselineWizardBlock

  const practiceRecordingBlock = (
    <div ref={recordingSectionRef}>
      <RecordingSection
        exercises={practiceLibraryExercises}
        selectedExercise={activeRecordingExercise}
        targetSentence={recordingTargetSentence}
        onSelectExercise={handleSelectExercise}
        isRecording={isRecording}
        isProcessing={sessionStatus === 'processing'}
        isLoading={studioDataLoading}
        canRecord={canRecord}
        micStatusHint={micStatusHint}
        onToggleRecording={() => void toggleRecording()}
        levels={levels}
        sectionTitle={
          completedSession ? 'Next scenario' : 'Scenarios & articulation modules'
        }
        executiveMode={
          activeRecordingExercise.category !== 'clinical'
        }
      />
    </div>
  )

  const followUpBanner = (
    <FollowUpDrillBanner
      exercise={followUpExercise ?? activeRecordingExercise}
      coachingTip={completedSession?.coachingTip}
      visible={Boolean(
        completedSession &&
          followUpExercise &&
          sessionStatus === 'done' &&
          activeView === 'practice',
      )}
    />
  )

  const wrapRecordingColumn = (recordingBlock: ReactNode) => (
    <>
      {followUpBanner}
      {recordingBlock}
    </>
  )

  const feedbackBlock = (
    <div ref={feedbackPanelRef}>
      <AIFeedbackCard
        status={sessionStatus}
        mode={completedSession?.mode ?? appMode}
        targetSentence={completedSession?.targetSentence ?? activeTargetSentence}
        transcript={completedSession?.transcript ?? transcript}
        feedback={completedSession?.feedback ?? feedback}
        coachMetrics={completedSession?.metrics ?? latestCoachMetrics}
        clinicalMetrics={completedSession?.clinicalMetrics}
        coachingTip={completedSession?.coachingTip}
        errorMessage={errorMessage}
        onOpenStructuralModule={handleOpenStructuralModule}
      />
    </div>
  )

  const renderMainContent = () => {
    switch (activeView) {
      case 'dashboard':
        if (isFirstVisit && appMode !== 'baseline') {
          return (
            <FirstVisitDashboard onStartCheckIn={handleStartFirstCheckIn} />
          )
        }

        if (appMode === 'baseline') {
          return (
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
              <div
                className={
                  baselineStep === 3 && sessionStatus === 'done'
                    ? 'xl:col-span-3'
                    : 'xl:col-span-5'
                }
              >
                {wrapRecordingColumn(checkInRecordingBlock)}
              </div>
              {baselineStep === 3 && sessionStatus === 'done' && (
                <div className="xl:col-span-2">{feedbackBlock}</div>
              )}
            </div>
          )
        }

        return (
          <>
            {hasCompletedCheckIn && (
              <div className="mb-10">
                <GrowthRoadmapSection
                  dossier={storedDossier}
                  roadmap={growthRoadmap}
                  loading={dossierLoading}
                  activePhaseFocus={activePhaseFocus}
                  activatingPhase={activatingPhase}
                  onRefreshBaseline={handleOpenBaseline}
                  onActivatePhase={(phase) => void handleActivatePhaseFocus(phase)}
                  onLaunchActiveFocusDrills={handleLaunchActiveFocusDrills}
                />
              </div>
            )}
            <PreMeetingWarmUpCard
              onStartWarmUp={handleStartWarmUp}
              isActive={activeRecordingExercise.id === PRE_MEETING_WARMUP.id}
            />
            <div className="mb-8">
              <StatsRow stats={dashboardStats} />
            </div>
            <ProgressTrendChart
              sessions={chartSessions}
              loading={historyLoading}
            />
          </>
        )

      case 'practice':
        return (
          <div className="space-y-6">
            <PracticeLibrary
              activeSentence={activeTargetSentence}
              hasBaseline={hasBaseline}
              studioLoading={studioDataLoading}
              personalizedLoading={personalizedLoading}
              personalizedSentences={personalizedSentences}
              focusAreas={practiceFocus.focusAreas}
              fromProgress={practiceFocus.fromProgress}
              activePhaseFocus={activePhaseFocus}
              personalizedError={personalizedError}
              onRefreshFreshDrills={() => void refreshFreshDrills()}
              onRetryPersonalized={() => void refreshPersonalizedDrills()}
              onSelectLesson={handleSelectLesson}
              onSelectPersonalizedSentence={handleSelectPersonalizedSentence}
            />
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
              <div className="xl:col-span-3">
                {wrapRecordingColumn(practiceRecordingBlock)}
              </div>
              <div className="xl:col-span-2">{feedbackBlock}</div>
            </div>
          </div>
        )

      case 'progress':
        return (
          <>
            <ProgressTrendChart
              sessions={chartSessions}
              loading={historyLoading}
              showSummary={false}
            />
            <div className="mb-8">
              <StatsRow stats={dashboardStats} />
            </div>
            <SessionHistoryPanel
              sessions={historySessions}
              loading={historyLoading}
              error={historyError}
              practiceCount={practiceCount}
              checkInCount={checkInCount}
            />
          </>
        )

      case 'goals':
        return (
          <GoalsView
            appMode={appMode}
            hasCompletedCheckIn={hasCompletedCheckIn}
            focusAreas={personalizedFocusAreas}
            latestFeedback={feedback}
            onOpenBaseline={handleOpenBaseline}
            onStartPractice={() => navigateTo('practice')}
          />
        )

      case 'schedule':
        return (
          <ScheduleView
            exercises={practiceLibraryExercises}
            latestFeedback={feedback}
            activePhaseFocus={activePhaseFocus}
            onSelectExercise={navigateToPracticeWithExercise}
          />
        )

      case 'settings':
        return <SettingsView />

      case 'help':
        return <HelpView />

      default:
        return null
    }
  }

  return (
    <>
      <div className="min-h-screen bg-background">
        <Sidebar activeView={activeView} onNavigate={navigateTo} />

        <main className="pl-20 transition-all duration-300 lg:pl-64">
          <div className="mx-auto max-w-7xl p-6 lg:p-8">
            <Header
              title={headerMeta.title}
              subtitle={dashboardSubtitle}
              notifications={notifications}
              unreadCount={unreadCount}
              readIds={readIds}
              notificationsOpen={notificationsOpen}
              onNotificationsOpenChange={setNotificationsOpen}
              onMarkAllNotificationsRead={markAllNotificationsRead}
              onSelectNotification={handleNotificationAction}
              onSearch={() => navigateTo('practice')}
            />

            {renderMainContent()}
          </div>
        </main>

        <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-primary/3 blur-3xl" />
        </div>
      </div>

      <BaselineModal
        open={baselineModalOpen}
        hasCompletedCheckIn={hasCompletedCheckIn}
        onClose={() => setBaselineModalOpen(false)}
        onConfirm={handleConfirmBaseline}
      />
    </>
  )
}
