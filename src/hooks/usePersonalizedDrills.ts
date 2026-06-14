import { useCallback, useEffect, useRef, useState } from 'react'
import { generatePersonalizedDrills } from '../services/drillGenerator'
import {
  fetchCachedPersonalizedDrills,
  fetchLatestBaselineProfile,
  upsertCachedPersonalizedDrills,
} from '../lib/database'
import { collectExcludeSentences } from '../utils/collectExcludeSentences'
import { addToDrillHistory } from '../utils/drillHistory'
import { parseWeakFocusAreas } from '../utils/parseFocusAreas'
import {
  DEFAULT_PHASE_FOCUS,
  focusAreasForPhase,
  type PhaseFocus,
} from '../utils/phaseFocus'

function mergeCachedFocusAreas(
  cached: string[],
  phase: PhaseFocus,
): string[] {
  return [...focusAreasForPhase(phase), ...cached]
}

export type PersonalizedDrillsState = {
  hasBaseline: boolean
  loading: boolean
  sentences: string[]
  focusAreas: string[]
  error: string | null
  refresh: (latestFeedback?: string) => Promise<void>
  refreshFresh: (latestFeedback?: string) => Promise<void>
}

export function usePersonalizedDrills(
  activePhaseFocus: PhaseFocus = DEFAULT_PHASE_FOCUS,
): PersonalizedDrillsState {
  const [hasBaseline, setHasBaseline] = useState(false)
  const [loading, setLoading] = useState(true)
  const [sentences, setSentences] = useState<string[]>([])
  const [focusAreas, setFocusAreas] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const baselineFeedbackRef = useRef<string>('')
  const baselineSessionIdRef = useRef<string | null>(null)
  const sentencesRef = useRef<string[]>([])

  sentencesRef.current = sentences

  const runGeneration = useCallback(async (feedbackText: string) => {
    const exclude = await collectExcludeSentences(sentencesRef.current)
    const generated = await generatePersonalizedDrills(feedbackText, {
      excludeSentences: exclude,
      variationSeed: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      activePhaseFocus,
    })
    const parsedFocus = parseWeakFocusAreas(feedbackText)
    const phaseFocusAreas = focusAreasForPhase(activePhaseFocus)
    addToDrillHistory(generated)
    setSentences(generated)
    setFocusAreas([...phaseFocusAreas, ...parsedFocus])

    const baselineId = baselineSessionIdRef.current
    if (baselineId) {
      try {
        await upsertCachedPersonalizedDrills(
          baselineId,
          generated,
          parsedFocus,
        )
      } catch (cacheErr) {
        console.warn('Could not persist drill cache:', cacheErr)
      }
    }
  }, [activePhaseFocus])

  const loadFromCache = useCallback(async (baselineSessionId: string) => {
    try {
      const cached = await fetchCachedPersonalizedDrills(baselineSessionId)
      if (cached && cached.sentences.length > 0) {
        setSentences(cached.sentences)
        setFocusAreas(
          mergeCachedFocusAreas(cached.focusAreas, activePhaseFocus),
        )
        addToDrillHistory(cached.sentences)
        return true
      }
    } catch (cacheErr) {
      console.warn('Could not load drill cache:', cacheErr)
    }
    return false
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
          baselineSessionIdRef.current = profile?.id ?? null
        }

        if (!feedbackText) {
          setHasBaseline(false)
          setSentences([])
          setFocusAreas([])
          baselineFeedbackRef.current = ''
          baselineSessionIdRef.current = null
          return
        }

        baselineFeedbackRef.current = feedbackText
        setHasBaseline(true)
        setFocusAreas(focusAreasForPhase(activePhaseFocus))

        const baselineId = baselineSessionIdRef.current
        if (baselineId) {
          const loaded = await loadFromCache(baselineId)
          if (loaded) return
        }

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
    [activePhaseFocus, loadFromCache, runGeneration],
  )

  const refreshFresh = useCallback(async (latestFeedback?: string) => {
    if (latestFeedback?.trim()) {
      baselineFeedbackRef.current = latestFeedback.trim()
      setHasBaseline(true)
      const parsed = parseWeakFocusAreas(latestFeedback)
      setFocusAreas([
        ...focusAreasForPhase(activePhaseFocus),
        ...parsed,
      ])
    }

    let feedbackText = baselineFeedbackRef.current
    if (!feedbackText) {
      await refresh()
      return
    }

    if (!baselineSessionIdRef.current) {
      try {
        const profile = await fetchLatestBaselineProfile()
        baselineSessionIdRef.current = profile?.id ?? null
        if (profile?.aiFeedback) {
          baselineFeedbackRef.current = profile.aiFeedback
          feedbackText = profile.aiFeedback
        }
      } catch {
        // proceed with in-memory feedback
      }
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
  }, [activePhaseFocus, refresh, runGeneration])

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
