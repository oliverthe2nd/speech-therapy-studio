import type { LucideIcon } from 'lucide-react'
import {
  BarChart3,
  Calendar,
  HelpCircle,
  Home,
  Mic,
  Settings,
  Target,
} from 'lucide-react'

export type StudioView =
  | 'dashboard'
  | 'practice'
  | 'progress'
  | 'goals'
  | 'schedule'
  | 'settings'
  | 'help'

export type StudioNavItem = {
  id: StudioView
  label: string
  icon: LucideIcon
}

export const PRIMARY_NAV: StudioNavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: Home },
  { id: 'practice', label: 'Practice', icon: Mic },
  { id: 'progress', label: 'Progress', icon: BarChart3 },
  { id: 'goals', label: 'Goals', icon: Target },
  { id: 'schedule', label: 'Schedule', icon: Calendar },
]

export const SECONDARY_NAV: StudioNavItem[] = [
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'help', label: 'Help', icon: HelpCircle },
]

export const VIEW_HEADERS: Record<
  StudioView,
  { title: string; subtitle: string }
> = {
  dashboard: {
    title: 'Executive Communication Studio',
    subtitle:
      'Boardroom-ready delivery with Accent Clarity & Intelligibility coaching',
  },
  practice: {
    title: 'Scenario library',
    subtitle: 'Executive drills and targeted articulation modules',
  },
  progress: {
    title: 'Your progress',
    subtitle: 'Every check-in and drill saved to your Neon database',
  },
  goals: {
    title: 'Executive clarity goals',
    subtitle: 'Check-in insights and acoustic metrics you are sharpening now',
  },
  schedule: {
    title: 'Daily plan',
    subtitle: 'Coach homework and drills lined up for today',
  },
  settings: {
    title: 'Settings',
    subtitle: 'Studio preferences and account',
  },
  help: {
    title: 'Help & tips',
    subtitle: 'How SpeakFlow coaching works',
  },
}
