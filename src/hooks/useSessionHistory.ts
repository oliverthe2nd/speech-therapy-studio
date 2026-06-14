import { useCallback, useEffect, useState } from 'react'
import {
  fetchSessionHistory,
  type SpeechSession,
} from '../lib/database'

export function useSessionHistory() {
  const [sessions, setSessions] = useState<SpeechSession[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const rows = await fetchSessionHistory()
      setSessions(rows)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not load your practice history.',
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const practiceCount = sessions.filter(
    (s) => !(s.is_baseline ?? s.mode === 'baseline'),
  ).length
  const checkInCount = sessions.length - practiceCount

  return {
    sessions,
    loading,
    error,
    practiceCount,
    checkInCount,
    refresh,
  }
}
