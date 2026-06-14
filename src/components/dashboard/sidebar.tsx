import {
  PRIMARY_NAV,
  SECONDARY_NAV,
  type StudioView,
} from '@/constants/studioNav'
import { cn } from '@/lib/utils'
import { ChevronLeft, ChevronRight, Mic, User } from 'lucide-react'
import { useState } from 'react'

type SidebarProps = {
  activeView: StudioView
  onNavigate: (view: StudioView) => void
}

export function Sidebar({ activeView, onNavigate }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 flex h-screen flex-col transition-all duration-300 ease-in-out',
        'border-r border-sidebar-border bg-sidebar/80 backdrop-blur-xl',
        collapsed ? 'w-20' : 'w-64',
      )}
    >
      <button
        type="button"
        onClick={() => onNavigate('dashboard')}
        className="flex items-center gap-3 border-b border-sidebar-border px-6 py-6 text-left transition-colors hover:bg-sidebar-accent/50"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20">
          <Mic className="h-5 w-5 text-primary" />
        </div>
        {!collapsed && (
          <span className="text-lg font-semibold text-sidebar-foreground">
            SpeakFlow
          </span>
        )}
      </button>

      <nav className="flex-1 px-3 py-6">
        <ul className="space-y-2">
          {PRIMARY_NAV.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onNavigate(item.id)}
                aria-current={activeView === item.id ? 'page' : undefined}
                className={cn(
                  'flex w-full items-center gap-3 rounded-xl px-4 py-3 transition-all duration-200',
                  'hover:bg-sidebar-accent',
                  activeView === item.id
                    ? 'bg-sidebar-accent text-primary'
                    : 'text-muted-foreground hover:text-sidebar-foreground',
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {!collapsed && <span className="font-medium">{item.label}</span>}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="px-3 pb-4">
        <ul className="space-y-2">
          {SECONDARY_NAV.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onNavigate(item.id)}
                aria-current={activeView === item.id ? 'page' : undefined}
                className={cn(
                  'flex w-full items-center gap-3 rounded-xl px-4 py-3 transition-all duration-200',
                  activeView === item.id
                    ? 'bg-sidebar-accent text-primary'
                    : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground',
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {!collapsed && <span className="font-medium">{item.label}</span>}
              </button>
            </li>
          ))}
        </ul>

        <div
          className={cn(
            'mt-4 flex items-center gap-3 rounded-xl px-4 py-3',
            'bg-sidebar-accent/50',
          )}
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/20">
            <User className="h-4 w-4 text-primary" />
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-sidebar-foreground">
                Alex Chen
              </p>
              <p className="truncate text-xs text-muted-foreground">Pro Member</p>
            </div>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        className={cn(
          'absolute -right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full',
          'border border-border bg-card',
          'text-muted-foreground transition-colors hover:text-foreground',
        )}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? (
          <ChevronRight className="h-3 w-3" />
        ) : (
          <ChevronLeft className="h-3 w-3" />
        )}
      </button>
    </aside>
  )
}
