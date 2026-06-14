import { Search } from 'lucide-react'
import { NotificationPanel } from '@/components/dashboard/notification-panel'
import type { StudioNotification } from '@/hooks/useStudioNotifications'
import { cn } from '@/lib/utils'

type HeaderProps = {
  title: string
  subtitle: string
  notifications: StudioNotification[]
  unreadCount: number
  readIds: Set<string>
  notificationsOpen: boolean
  onNotificationsOpenChange: (open: boolean) => void
  onMarkAllNotificationsRead: () => void
  onSelectNotification: (notification: StudioNotification) => void
  onSearch?: () => void
}

export function Header({
  title,
  subtitle,
  notifications,
  unreadCount,
  readIds,
  notificationsOpen,
  onNotificationsOpenChange,
  onMarkAllNotificationsRead,
  onSelectNotification,
  onSearch,
}: HeaderProps) {
  return (
    <header className="mb-8 flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        <p className="mt-1 text-muted-foreground">{subtitle}</p>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onSearch}
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-xl',
            'border border-border/50 bg-card/60 backdrop-blur-sm',
            'text-muted-foreground transition-colors hover:bg-card hover:text-foreground',
          )}
          aria-label="Jump to practice drills"
        >
          <Search className="h-5 w-5" />
        </button>

        <NotificationPanel
          open={notificationsOpen}
          notifications={notifications}
          unreadCount={unreadCount}
          readIds={readIds}
          onOpenChange={onNotificationsOpenChange}
          onMarkAllRead={onMarkAllNotificationsRead}
          onSelect={onSelectNotification}
        />
      </div>
    </header>
  )
}
