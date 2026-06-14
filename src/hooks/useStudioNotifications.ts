import { useCallback, useEffect, useMemo, useState } from 'react'
import type { FeedbackStatus } from '@/components/FeedbackCard'
import type { StudioView } from '@/constants/studioNav'

const READ_STORAGE_KEY = 'speakflow-notifications-read'

export type StudioNotification = {
  id: string
  title: string
  body: string
  actionLabel: string
  kind: 'baseline' | 'feedback' | 'progress' | 'practice'
  onAction: () => void
}

type UseStudioNotificationsOptions = {
  hasCompletedCheckIn: boolean
  historyLoading: boolean
  sessionStatus: FeedbackStatus
  practiceCount: number
  historyCount: number
  focusAreas: string[]
  fromProgress?: boolean
  navigateTo: (view: StudioView) => void
  onStartBaseline: () => void
  onStartFocusPractice: () => void
}

function loadReadIds(): Set<string> {
  try {
    const raw = localStorage.getItem(READ_STORAGE_KEY)
    if (!raw) return new Set()
    return new Set(JSON.parse(raw) as string[])
  } catch {
    return new Set()
  }
}

function saveReadIds(ids: Set<string>) {
  try {
    localStorage.setItem(READ_STORAGE_KEY, JSON.stringify([...ids]))
  } catch {
    /* ignore quota */
  }
}

export function useStudioNotifications({
  hasCompletedCheckIn,
  historyLoading,
  sessionStatus,
  practiceCount,
  historyCount,
  focusAreas,
  fromProgress = false,
  navigateTo,
  onStartBaseline,
  onStartFocusPractice,
}: UseStudioNotificationsOptions) {
  const [readIds, setReadIds] = useState<Set<string>>(loadReadIds)
  const [panelOpen, setPanelOpen] = useState(false)

  useEffect(() => {
    if (sessionStatus === 'done') {
      setReadIds((prev) => {
        const next = new Set(prev)
        next.delete('latest-feedback')
        saveReadIds(next)
        return next
      })
    }
  }, [sessionStatus])

  const notifications = useMemo((): StudioNotification[] => {
    const items: StudioNotification[] = []

    if (!historyLoading && !hasCompletedCheckIn) {
      items.push({
        id: 'baseline-due',
        title: 'Complete your first check-in',
        body: 'Read the Grandfather Paragraph once so we can learn your speech patterns and build your drill plan.',
        actionLabel: 'Start check-in',
        kind: 'baseline',
        onAction: () => {
          setPanelOpen(false)
          onStartBaseline()
        },
      })
    }

    if (sessionStatus === 'done') {
      items.push({
        id: 'latest-feedback',
        title: 'New coach feedback ready',
        body: 'Your latest recording has been analyzed. Review scores and tips on the dashboard.',
        actionLabel: 'View feedback',
        kind: 'feedback',
        onAction: () => {
          setPanelOpen(false)
          navigateTo('dashboard')
        },
      })
    }

    if (hasCompletedCheckIn && practiceCount >= 1) {
      items.push({
        id: 'progress-update',
        title: 'See how you are improving',
        body:
          practiceCount === 1
            ? 'Your first drill is saved. Open Progress to watch your trend grow.'
            : `You have ${practiceCount} practice drills saved. Check your improvement chart.`,
        actionLabel: 'Open progress',
        kind: 'progress',
        onAction: () => {
          setPanelOpen(false)
          navigateTo('progress')
        },
      })
    }

    if (hasCompletedCheckIn && focusAreas.length > 0) {
      items.push({
        id: 'focus-practice',
        title: `Work on ${focusAreas[0]}`,
        body: fromProgress
          ? 'Your progress chart flagged this as your target drill area today.'
          : 'Your check-in flagged this sound for extra practice today.',
        actionLabel: 'Start focus drill',
        kind: 'practice',
        onAction: () => {
          setPanelOpen(false)
          onStartFocusPractice()
        },
      })
    }

    if (hasCompletedCheckIn && historyCount > 0 && practiceCount === 0) {
      items.push({
        id: 'first-practice',
        title: 'Try your first practice drill',
        body: 'Your check-in is done. Start a short drill tailored to your focus sounds.',
        actionLabel: 'Go to practice',
        kind: 'practice',
        onAction: () => {
          setPanelOpen(false)
          navigateTo('practice')
        },
      })
    }

    return items
  }, [
    focusAreas,
    fromProgress,
    hasCompletedCheckIn,
    historyCount,
    historyLoading,
    navigateTo,
    onStartBaseline,
    onStartFocusPractice,
    practiceCount,
    sessionStatus,
  ])

  const unreadCount = notifications.filter((item) => !readIds.has(item.id)).length

  const markRead = useCallback((id: string) => {
    setReadIds((prev) => {
      const next = new Set(prev)
      next.add(id)
      saveReadIds(next)
      return next
    })
  }, [])

  const markAllRead = useCallback(() => {
    setReadIds((prev) => {
      const next = new Set(prev)
      for (const item of notifications) {
        next.add(item.id)
      }
      saveReadIds(next)
      return next
    })
  }, [notifications])

  const handleNotificationAction = useCallback(
    (notification: StudioNotification) => {
      markRead(notification.id)
      notification.onAction()
    },
    [markRead],
  )

  return {
    notifications,
    unreadCount,
    readIds,
    panelOpen,
    setPanelOpen,
    markAllRead,
    handleNotificationAction,
  }
}
