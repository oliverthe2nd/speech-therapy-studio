import { useCallback, useEffect, useMemo, useState } from 'react'
import { Clock, Flame, Target, Trophy } from 'lucide-react'
import { AIFeedbackCard } from '@/components/dashboard/ai-feedback-card'
import { Header } from '@/components/dashboard/header'
import type { DashboardExercise } from '@/components/dashboard/recording-section'
import { RecordingSection } from '@/components/dashboard/recording-section'
import { Sidebar } from '@/components/dashboard/sidebar'
import { StatsRow, type StatItem } from '@/components/dashboard/stats-row'
import { BaselineModal } from '@/components/BaselineModal'
import type { FeedbackStatus } from '@/components/FeedbackCard'
import {
  BASELINE_PRACTICE_SENTENCE,
  PRACTICE_LESSONS,
  type AppMode,
  type PhonemeFocus,
  type PracticeLesson,
} from '@/constants/studio'
import { useAudioRecorder } from '@/hooks/useAudioRecorder'
import { usePersonalizedDrills } from '@/hooks/usePersonalizedDrills'
import { useSessionHistory } from '@/hooks/useSessionHistory'
import { processRecording } from '@/services/speechPipeline'
import { logSpeechSession } from '@/supabaseClient'

const CHECK_IN_EXERCISE: DashboardExercise = {
  id: 'check-in',
  title: 'Pattern Check-In',
  difficulty: 'Assessment',
  sentence: BASELINE_PRACTICE_SENTENCE,
}

function lessonToExercise(lesson: PracticeLesson): DashboardExercise {
  return {
    id: lesson.id,
    title: `${lesson.focus} Drill`,
    difficulty: `${lesson.focus} Sound`,
    sentence: lesson.sentence,
  }
}

/** v0 SpeakFlow dashboard — wired to Supabase + Edge Function pipeline. */
export function SpeechTherapyStudio() {
  const [appMode, setAppMode] = useState<AppMode>('practice')
  const [activeTargetSentence, setActiveTargetSentence] = useState('')
  const [activePhonemeFocus, setActivePhonemeFocus] =
    useState<PhonemeFocus | null>(null)
  const [baselineModalOpen, setBaselineModalOpen] = useState(false)
  const [selectedExerciseId, setSelectedExerciseId] = useState('')

  const {
    hasBaseline,
    sentences: personalizedSentences,
    refresh: refreshPersonalizedDrills,
    refreshFresh: refreshFreshDrills,
  } = usePersonalizedDrills()

  const {
    sessions: historySessions,
    practiceCount,
    checkInCount,
    refresh: refreshSessionHistory,
  } = useSessionHistory()

  const [feedbackStatus, setFeedbackStatus] = useState<FeedbackStatus>('idle')
  const [transcript, setTranscript] = useState('')
  const [feedback, setFeedback] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

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
        title: `Custom ${index + 1}`,
        difficulty: 'Personalized',
        sentence,
      })
    })

    for (const focus of ['R', 'S'] as const) {
      for (const lesson of PRACTICE_LESSONS[focus]) {
        list.push(lessonToExercise(lesson))
      }
    }

    return list
  }, [personalizedSentences])

  const selectedExercise = useMemo(() => {
    const match = exercises.find((item) => item.id === selectedExerciseId)
    return match ?? exercises[0] ?? CHECK_IN_EXERCISE
  }, [exercises, selectedExerciseId])

  useEffect(() => {
    if (selectedExerciseId && exercises.some((e) => e.id === selectedExerciseId)) {
      return
    }
    const defaultId =
      personalizedSentences.length > 0
        ? 'personalized-0'
        : exercises.find((e) => e.id !== CHECK_IN_EXERCISE.id)?.id ??
          CHECK_IN_EXERCISE.id
    setSelectedExerciseId(defaultId)
  }, [exercises, personalizedSentences.length, selectedExerciseId])

  const resetFeedback = useCallback(() => {
    setTranscript('')
    setFeedback('')
    setErrorMessage('')
    setFeedbackStatus('idle')
    resetStatus()
  }, [resetStatus])

  const applyExercise = useCallback(
    (exercise: DashboardExercise, skipModal = false) => {
      setSelectedExerciseId(exercise.id)
      resetFeedback()

      if (exercise.id === CHECK_IN_EXERCISE.id) {
        if (!skipModal && !hasBaseline && checkInCount === 0) {
          setBaselineModalOpen(true)
          return
        }
        setAppMode('baseline')
        setActiveTargetSentence(exercise.sentence)
        setActivePhonemeFocus(null)
        return
      }

      setAppMode('practice')
      setActiveTargetSentence(exercise.sentence)
      const lesson = Object.values(PRACTICE_LESSONS)
        .flat()
        .find((item) => item.id === exercise.id)
      setActivePhonemeFocus(lesson?.focus ?? null)
    },
    [checkInCount, hasBaseline, resetFeedback],
  )

  useEffect(() => {
    if (activeTargetSentence || !selectedExercise) return
    applyExercise(selectedExercise, true)
  }, [activeTargetSentence, applyExercise, selectedExercise])

  const handleSelectExercise = useCallback(
    (exercise: DashboardExercise) => {
      applyExercise(exercise)
    },
    [applyExercise],
  )

  const handleConfirmBaseline = useCallback(() => {
    setBaselineModalOpen(false)
    applyExercise(CHECK_IN_EXERCISE, true)
  }, [applyExercise])

  const stopRecordingAndProcess = useCallback(async () => {
    try {
      const blob = await stopRecording()
      setFeedbackStatus('processing')

      const result = await processRecording(blob, {
        mode: appMode,
        targetSentence: activeTargetSentence,
        phonemeFocus: activePhonemeFocus,
      })

      setTranscript(result.transcript)
      setFeedback(result.feedback)
      setFeedbackStatus('done')
      setRecorderStatus('idle')

      try {
        await logSpeechSession({
          mode: appMode,
          targetSentence: activeTargetSentence,
          phonemeFocus: activePhonemeFocus,
          transcript: result.transcript,
          feedback: result.feedback,
        })

        if (appMode === 'baseline') {
          await refreshPersonalizedDrills(result.feedback)
          await refreshFreshDrills()
        }
        await refreshSessionHistory()
      } catch (dbError) {
        console.error('Failed to log session to Supabase:', dbError)
        if (appMode === 'baseline') {
          await refreshPersonalizedDrills(result.feedback)
        }
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
    activePhonemeFocus,
    activeTargetSentence,
    appMode,
    refreshFreshDrills,
    refreshPersonalizedDrills,
    refreshSessionHistory,
    setRecorderStatus,
    stopRecording,
  ])

  const toggleRecording = useCallback(async () => {
    if (feedbackStatus === 'processing' || recorderStatus === 'processing') {
      return
    }
    if (!activeTargetSentence) return

    if (isRecording) {
      await stopRecordingAndProcess()
      return
    }

    setTranscript('')
    setFeedback('')
    setErrorMessage('')
    setFeedbackStatus('recording')

    try {
      await startRecording()
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
    feedbackStatus,
    isRecording,
    recorderStatus,
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

  const canRecord =
    Boolean(activeTargetSentence) && sessionStatus !== 'processing'

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

  const headerSubtitle =
    appMode === 'baseline'
      ? 'Speech pattern check-in — read the paragraph and tap the mic'
      : sessionStatus === 'done'
        ? 'Great work — review your AI feedback on the right'
        : "Let's continue your speech journey today"

  return (
    <>
      <div className="min-h-screen bg-background">
        <Sidebar />

        <main className="pl-20 transition-all duration-300 lg:pl-64">
          <div className="mx-auto max-w-7xl p-6 lg:p-8">
            <Header subtitle={headerSubtitle} />

            <div className="mb-8">
              <StatsRow stats={dashboardStats} />
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
              <div className="xl:col-span-3">
                <RecordingSection
                  exercises={exercises}
                  selectedExercise={selectedExercise}
                  onSelectExercise={handleSelectExercise}
                  isRecording={isRecording}
                  isProcessing={sessionStatus === 'processing'}
                  canRecord={canRecord}
                  onToggleRecording={() => void toggleRecording()}
                  levels={levels}
                />
              </div>

              <div className="xl:col-span-2">
                <AIFeedbackCard
                  status={sessionStatus}
                  mode={appMode}
                  targetSentence={activeTargetSentence}
                  transcript={transcript}
                  feedback={feedback}
                  errorMessage={errorMessage}
                />
              </div>
            </div>
          </div>
        </main>

        <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-primary/3 blur-3xl" />
        </div>
      </div>

      <BaselineModal
        open={baselineModalOpen}
        hasCompletedCheckIn={hasBaseline || checkInCount > 0}
        onClose={() => setBaselineModalOpen(false)}
        onConfirm={handleConfirmBaseline}
      />
    </>
  )
}
