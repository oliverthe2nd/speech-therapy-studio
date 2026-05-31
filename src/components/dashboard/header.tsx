import { Bell, Search } from 'lucide-react'
import { cn } from '@/lib/utils'

type HeaderProps = {
  title?: string
  subtitle?: string
}

export function Header({
  title = 'Welcome back, Alex',
  subtitle = "Let's continue your speech journey today",
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
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-xl',
            'border border-border/50 bg-card/60 backdrop-blur-sm',
            'text-muted-foreground transition-colors hover:bg-card hover:text-foreground',
          )}
          aria-label="Search"
        >
          <Search className="h-5 w-5" />
        </button>

        <button
          type="button"
          className={cn(
            'relative flex h-10 w-10 items-center justify-center rounded-xl',
            'border border-border/50 bg-card/60 backdrop-blur-sm',
            'text-muted-foreground transition-colors hover:bg-card hover:text-foreground',
          )}
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary" />
        </button>
      </div>
    </header>
  )
}
