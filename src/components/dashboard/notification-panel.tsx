import { useEffect, useRef } from 'react'
import {
  BarChart3,
  Bell,
  CheckCheck,
  ClipboardCheck,
  Sparkles,
  Target,
} from 'lucide-react'
import type { StudioNotification } from '@/hooks/useStudioNotifications'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'

type NotificationPanelProps = {
  open: boolean
  notifications: StudioNotification[]
  unreadCount: number
  readIds: Set<string>
  onOpenChange: (open: boolean) => void
  onMarkAllRead: () => void
  onSelect: (notification: StudioNotification) => void
}

function kindIcon(kind: StudioNotification['kind']) {
  switch (kind) {
    case 'baseline':
      return ClipboardCheck
    case 'feedback':
      return Sparkles
    case 'progress':
      return BarChart3
    case 'practice':
      return Target
  }
}

export function NotificationPanel({
  open,
  notifications,
  unreadCount,
  readIds,
  onOpenChange,
  onMarkAllRead,
  onSelect,
}: NotificationPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    const handlePointerDown = (event: MouseEvent) => {
      if (!panelRef.current?.contains(event.target as Node)) {
        onOpenChange(false)
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onOpenChange(false)
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [onOpenChange, open])

  return (
    <div ref={panelRef} className="relative">
      <button
        type="button"
        onClick={() => onOpenChange(!open)}
        className={cn(
          'relative flex h-10 w-10 items-center justify-center rounded-xl',
          'border border-border/50 bg-card/60 backdrop-blur-sm',
          'text-muted-foreground transition-colors hover:bg-card hover:text-foreground',
          open && 'border-primary/40 bg-primary/10 text-primary',
        )}
        aria-label="Open notifications"
        aria-expanded={open}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-border/50 bg-card shadow-[0_16px_48px_rgba(0,0,0,0.25)]">
          <div className="flex items-center justify-between border-b border-border/40 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-foreground">Notifications</p>
              <p className="text-xs text-muted-foreground">
                {unreadCount > 0
                  ? `${unreadCount} unread`
                  : 'You are all caught up'}
              </p>
            </div>
            {notifications.length > 0 && unreadCount > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 gap-1 px-2 text-xs"
                onClick={onMarkAllRead}
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all read
              </Button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <Bell className="mx-auto mb-3 h-8 w-8 text-muted-foreground/50" />
              <p className="text-sm font-medium text-foreground">No notifications</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Check-ins, feedback, and progress updates will show up here.
              </p>
            </div>
          ) : (
            <ScrollArea className="max-h-80">
              <ul className="p-2">
                {notifications.map((notification) => {
                  const Icon = kindIcon(notification.kind)
                  const isUnread = !readIds.has(notification.id)

                  return (
                    <li key={notification.id}>
                      <button
                        type="button"
                        onClick={() => onSelect(notification)}
                        className={cn(
                          'flex w-full gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-secondary/60',
                          isUnread && 'bg-primary/5',
                        )}
                      >
                        <span
                          className={cn(
                            'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
                            isUnread
                              ? 'bg-primary/15 text-primary'
                              : 'bg-secondary text-muted-foreground',
                          )}
                        >
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-2">
                            <span className="text-sm font-medium text-foreground">
                              {notification.title}
                            </span>
                            {isUnread && (
                              <span className="h-2 w-2 rounded-full bg-primary" />
                            )}
                          </span>
                          <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
                            {notification.body}
                          </span>
                          <span className="mt-2 inline-block text-xs font-medium text-primary">
                            {notification.actionLabel} →
                          </span>
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </ScrollArea>
          )}
        </div>
      )}
    </div>
  )
}
