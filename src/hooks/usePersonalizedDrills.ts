import { useCallback, useEffect, useRef, useState } from 'react'
import { generatePersonalizedDrills } from '../services/drillGenerator'
import { fetchLatestBaselineProfile } from '../supabaseClient'
import { collectExcludeSentences } from '../utils/collectExcludeSentences'
import { addToDrillHistory } from '../utils/drillHistory'
import { parseWeakFocusAreas } from '../utils/parseFocusAreas'

export type PersonalizedDrillsState = {
  hasBaseline: boolean
  loading: boolean
  sentences: string[]
  focusAreas: string[]
  error: string | null
  refresh: (latestFeedback?: string) => Promise<void>
  refreshFresh: () => Promise<void>
}

export function usePersonalizedDrills(): PersonalizedDrillsState {
  const [hasBaseline, setHasBaseline] = useState(false)
  const [loading, setLoading] = useState(true)
  const [sentences, setSentences] = useState<string[]>([])
  const [focusAreas, setFocusAreas] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const baselineFeedbackRef = useRef<string>('')
  const sentencesRef = useRef<string[]>([])

  sentencesRef.current = sentences

  const runGeneration = useCallback(async (feedbackText: string) => {
    const exclude = await collectExcludeSentences(sentencesRef.current)
    const generated = await generatePersonalizedDrills(feedbackText, {
      excludeSentences: exclude,
      variationSeed: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    })
    addToDrillHistory(generated)
    setSentences(generated)
    setFocusAreas(parseWeakFocusAreas(feedbackText))
  }, [])

  const refresh = useCallback(
    async (latestFeedback?: string) => {
      setLoading(true)
      setError(null)

      try {
        let feedbackText = latestFeedback?.trim() ?? ''

        if (!feedbackText) {
          const profile = await fetchLatestBaselineProfile()
          feedbackText = profile?.aiFeedback ?? ''
        }

        if (!feedbackText) {
          setHasBaseline(false)
          setSentences([])
          setFocusAreas([])
          baselineFeedbackRef.current = ''
          return
        }

        baselineFeedbackRef.current = feedbackText
        setHasBaseline(true)

        try {
          await runGeneration(feedbackText)
        } catch (genErr) {
          setSentences([])
          setError(
            genErr instanceof Error
              ? genErr.message
              : 'Could not generate personalized drills.',
          )
        }
      } catch (err) {
        setHasBaseline(false)
        setSentences([])
        setFocusAreas([])
        setError(
          err instanceof Error
            ? err.message
            : 'Could not load your check-in profile.',
        )
      } finally {
        setLoading(false)
      }
    },
    [runGeneration],
  )

  const refreshFresh = useCallback(async () => {
    const feedbackText = baselineFeedbackRef.current
    if (!feedbackText) {
      await refresh()
      return
    }

    setLoading(true)
    setError(null)

    try {
      await runGeneration(feedbackText)
    } catch (genErr) {
      setError(
        genErr instanceof Error
          ? genErr.message
          : 'Could not generate fresh drills.',
      )
    } finally {
      setLoading(false)
    }
  }, [refresh, runGeneration])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return {
    hasBaseline,
    loading,
    sentences,
    focusAreas,
    error,
    refresh,
    refreshFresh,
  }
}
