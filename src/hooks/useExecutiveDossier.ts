import { useCallback, useEffect, useState } from 'react'
import {
  fetchExecutiveDossier,
  updateActivePhaseFocus,
  type StoredExecutiveDossier,
} from '@/lib/database'
import type { GrowthRoadmap } from '@/types/analyzeSpeech'
import {
  DEFAULT_PHASE_FOCUS,
  type PhaseFocus,
} from '@/utils/phaseFocus'

export function useExecutiveDossier() {
  const [dossier, setDossier] = useState<StoredExecutiveDossier | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const profile = await fetchExecutiveDossier()
      setDossier(profile)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not load executive dossier.',
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const applyRoadmap = useCallback((roadmap: GrowthRoadmap | undefined) => {
    if (!roadmap) return
    setDossier((prev) =>
      prev
        ? {
            ...prev,
            strengths: roadmap.strengths,
            blindspots: roadmap.blindspots,
            growthPhases: roadmap.phases,
            activePhaseFocus: prev.activePhaseFocus ?? DEFAULT_PHASE_FOCUS,
            baselineCompletedAt: new Date().toISOString(),
          }
        : {
            strengths: roadmap.strengths,
            blindspots: roadmap.blindspots,
            growthPhases: roadmap.phases,
            activePhaseFocus: DEFAULT_PHASE_FOCUS,
            baselineCompletedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
    )
  }, [])

  const activatePhaseFocus = useCallback(async (phase: PhaseFocus) => {
    await updateActivePhaseFocus(phase)
    setDossier((prev) =>
      prev
        ? { ...prev, activePhaseFocus: phase, updatedAt: new Date().toISOString() }
        : {
            strengths: [],
            blindspots: [],
            growthPhases: [],
            activePhaseFocus: phase,
            baselineCompletedAt: null,
            updatedAt: new Date().toISOString(),
          },
    )
  }, [])

  return { dossier, loading, error, refresh, applyRoadmap, setDossier, activatePhaseFocus }
}
