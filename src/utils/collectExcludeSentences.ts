import { BASELINE_PRACTICE_SENTENCE } from '../constants/studio'
import { fetchPastPracticeSentences } from '../supabaseClient'
import { getStoredDrillHistory, mergeExcludeSentences } from './drillHistory'

export async function collectExcludeSentences(
  currentSentences: string[] = [],
): Promise<string[]> {
  let fromDatabase: string[] = []

  try {
    fromDatabase = await fetchPastPracticeSentences()
  } catch {
    fromDatabase = []
  }

  return mergeExcludeSentences(
    getStoredDrillHistory(),
    fromDatabase,
    currentSentences,
    [BASELINE_PRACTICE_SENTENCE],
  )
}
