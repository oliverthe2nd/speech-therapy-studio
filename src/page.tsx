import { useCallback, useEffect, useState } from 'react'
import { BaselineBanner } from './components/BaselineBanner'
import { BaselineModal } from './components/BaselineModal'
import type { FeedbackStatus } from './components/FeedbackCard'
import { FeedbackCard } from './components/FeedbackCard'
import { PracticeLibrary } from './components/PracticeLibrary'
import { RecordingStudio } from './components/RecordingStudio'
import { SessionHistoryPanel } from './components/SessionHistoryPanel'
import { StudioNav } from './components/StudioNav'
import {
  BASELINE_PRACTICE_SENTENCE,
  BASELINE_FOCUS_DESCRIPTION,
  type AppMode,
  type PhonemeFocus,
  type PracticeLesson,
} from './constants/studio'
import { useAudioRecorder } from './hooks/useAudioRecorder'
import { usePersonalizedDrills } from './hooks/usePersonalizedDrills'
import { useSessionHistory } from './hooks/useSessionHistory'
import { processRecording } from './services/speechPipeline'
import { logSpeechSession } from './supabaseClient'

export default function Page() {
  const [appMode, setAppMode] = useState<AppMode>('practice')
  const [activeTargetSentence, setActiveTargetSentence] = useState('')
  const [activePhonemeFocus, setActivePhonemeFocus] =
    useState<PhonemeFocus | null>(null)
  const [baselineModalOpen, setBaselineModalOpen] = useState(false)

  const {
    hasBaseline,
    loading: personalizedLoading,
    sentences: personalizedSentences,
    focusAreas: personalizedFocusAreas,
    error: personalizedError,
    refresh: refreshPersonalizedDrills,
    refreshFresh: refreshFreshDrills,
  } = usePersonalizedDrills()

  const {
    sessions: historySessions,
    loading: historyLoading,
    error: historyError,
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

  const resetFeedback = useCallback(() => {
    setTranscript('')
    setFeedback('')
    setErrorMessage('')
    setFeedbackStatus('idle')
    resetStatus()
  }, [resetStatus])

  const enterBaselineMode = useCallback(() => {
    setAppMode('baseline')
    setActiveTargetSentence(BASELINE_PRACTICE_SENTENCE)
    setActivePhonemeFocus(null)
    resetFeedback()
  }, [resetFeedback])

  const handleOpenBaseline = useCallback(() => {
    if (appMode === 'baseline') return
    setBaselineModalOpen(true)
  }, [appMode])

  const handleConfirmBaseline = useCallback(() => {
    setBaselineModalOpen(false)
    enterBaselineMode()
  }, [enterBaselineMode])

  const handleSelectLesson = useCallback(
    (lesson: PracticeLesson) => {
      setAppMode('practice')
      setActiveTargetSentence(lesson.sentence)
      setActivePhonemeFocus(lesson.focus)
      resetFeedback()
    },
    [resetFeedback],
  )

  const handleSelectPersonalizedSentence = useCallback(
    (sentence: string) => {
      setAppMode('practice')
      setActiveTargetSentence(sentence)
      setActivePhonemeFocus(null)
      resetFeedback()
    },
    [resetFeedback],
  )

  const returnToPracticeHome = useCallback(() => {
    setAppMode('practice')
    setActiveTargetSentence('')
    setActivePhonemeFocus(null)
    resetFeedback()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [resetFeedback])

  const handleExitBaseline = returnToPracticeHome

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
    setRecorderStatus,
    stopRecording,
    refreshPersonalizedDrills,
    refreshSessionHistory,
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

  const canRecord = Boolean(activeTargetSentence) && sessionStatus !== 'processing'
  const hasCompletedCheckIn = hasBaseline || checkInCount > 0

  const focusOnFeedback = ['processing', 'done', 'error'].includes(sessionStatus)

  useEffect(() => {
    if (!focusOnFeedback) return
    const frame = requestAnimationFrame(() => {
      document
        .getElementById('feedback-card')
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
    return () => cancelAnimationFrame(frame)
  }, [focusOnFeedback, sessionStatus])

  return (
    <div className="min-h-svh bg-background">
      <div className="studio-shell flex min-h-svh flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <header className="text-center">
          <p className="text-sm font-medium uppercase tracking-widest text-primary">
            Speech Therapy Studio
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Your friendly speech practice home
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            Start with a quick speech pattern check-in, unlock practice tailored
            to your voice, and get warm coach feedback after every recording.
          </p>
          <a
            href="#practice-history"
            className="mt-3 inline-block text-sm font-medium text-primary underline-offset-2 hover:text-primary/80 hover:underline"
          >
            View your practice journey ↓
          </a>
        </header>

        <BaselineBanner
          appMode={appMode}
          hasCompletedCheckIn={hasCompletedCheckIn}
          onOpenBaseline={handleOpenBaseline}
        />

        <StudioNav
          appMode={appMode}
          hasActiveDrill={Boolean(activeTargetSentence)}
          sessionStatus={sessionStatus}
          onReturnHome={returnToPracticeHome}
        />

        {appMode === 'baseline' && (
          <div className="rounded-2xl border border-checkin/30 bg-checkin-muted px-5 py-4">
            <p className="text-sm font-medium text-checkin-foreground">
              {BASELINE_FOCUS_DESCRIPTION}
            </p>
            <button
              type="button"
              onClick={handleExitBaseline}
              className="mt-3 text-sm font-medium text-checkin underline-offset-2 hover:underline"
            >
              Exit check-in and return to practice drills
            </button>
          </div>
        )}

        <div
          className={`studio-workspace grid flex-1 gap-6 lg:gap-8 ${
            focusOnFeedback ? 'studio-workspace--feedback-focus' : ''
          } ${
            appMode === 'practice'
              ? 'lg:grid-cols-[minmax(260px,300px)_1fr_1fr]'
              : 'lg:grid-cols-2'
          }`}
        >
          {appMode === 'practice' && (
            <PracticeLibrary
              className={
                focusOnFeedback ? 'studio-library max-lg:hidden' : 'studio-library'
              }
              activeSentence={activeTargetSentence}
              hasBaseline={hasBaseline}
              personalizedLoading={personalizedLoading}
              personalizedSentences={personalizedSentences}
              personalizedFocusAreas={personalizedFocusAreas}
              personalizedError={personalizedError}
              onRefreshFreshDrills={() => void refreshFreshDrills()}
              onSelectLesson={handleSelectLesson}
              onSelectPersonalizedSentence={handleSelectPersonalizedSentence}
            />
          )}

          <RecordingStudio
            className="studio-recording"
            appMode={appMode}
            activeTargetSentence={activeTargetSentence}
            feedbackStatus={sessionStatus}
            isRecording={isRecording}
            levels={levels}
            canRecord={canRecord}
            onToggleRecording={() => void toggleRecording()}
          />

          <FeedbackCard
            className="studio-feedback"
            mode={appMode}
            status={sessionStatus}
            targetSentence={activeTargetSentence}
            transcript={transcript}
            feedback={feedback}
            errorMessage={errorMessage}
            onReturnHome={returnToPracticeHome}
          />
        </div>

        <SessionHistoryPanel
          sessions={historySessions}
          loading={historyLoading}
          error={historyError}
          practiceCount={practiceCount}
          checkInCount={checkInCount}
        />
      </div>

      <BaselineModal
        open={baselineModalOpen}
        hasCompletedCheckIn={hasCompletedCheckIn}
        onClose={() => setBaselineModalOpen(false)}
        onConfirm={handleConfirmBaseline}
      />
    </div>
  )
}
