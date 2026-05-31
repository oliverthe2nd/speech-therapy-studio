import { useState } from 'react'
import { cn } from '@/lib/utils'
import {
  BarChart3,
  Calendar,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  Home,
  Mic,
  Settings,
  Target,
  User,
} from 'lucide-react'

const navItems = [
  { icon: Home, label: 'Dashboard', active: true },
  { icon: Mic, label: 'Practice' },
  { icon: BarChart3, label: 'Progress' },
  { icon: Target, label: 'Goals' },
  { icon: Calendar, label: 'Schedule' },
]

const bottomItems = [
  { icon: Settings, label: 'Settings' },
  { icon: HelpCircle, label: 'Help' },
]

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 flex h-screen flex-col transition-all duration-300 ease-in-out',
        'border-r border-sidebar-border bg-sidebar/80 backdrop-blur-xl',
        collapsed ? 'w-20' : 'w-64',
      )}
    >
      <div className="flex items-center gap-3 border-b border-sidebar-border px-6 py-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20">
          <Mic className="h-5 w-5 text-primary" />
        </div>
        {!collapsed && (
          <span className="text-lg font-semibold text-sidebar-foreground">
            SpeakFlow
          </span>
        )}
      </div>

      <nav className="flex-1 px-3 py-6">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.label}>
              <button
                type="button"
                className={cn(
                  'flex w-full items-center gap-3 rounded-xl px-4 py-3 transition-all duration-200',
                  'hover:bg-sidebar-accent',
                  item.active
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
          {bottomItems.map((item) => (
            <li key={item.label}>
              <button
                type="button"
                className={cn(
                  'flex w-full items-center gap-3 rounded-xl px-4 py-3 transition-all duration-200',
                  'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground',
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
