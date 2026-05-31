import { GlassCard } from './glass-card'
import { Clock, Flame, Target, Trophy } from 'lucide-react'
import { cn } from '@/lib/utils'

type StatItem = {
  icon: typeof Clock
  label: string
  value: string
  subtext: string
  color: string
  bgColor: string
}

type StatsRowProps = {
  stats?: StatItem[]
}

const defaultStats: StatItem[] = [
  {
    icon: Clock,
    label: 'Practice Time',
    value: '2h 45m',
    subtext: 'This week',
    color: 'text-primary',
    bgColor: 'bg-primary/20',
  },
  {
    icon: Flame,
    label: 'Streak',
    value: '12',
    subtext: 'Days',
    color: 'text-amber-400',
    bgColor: 'bg-amber-400/20',
  },
  {
    icon: Target,
    label: 'Accuracy',
    value: '94%',
    subtext: 'Average',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-400/20',
  },
  {
    icon: Trophy,
    label: 'Exercises',
    value: '47',
    subtext: 'Completed',
    color: 'text-blue-400',
    bgColor: 'bg-blue-400/20',
  },
]

export function StatsRow({ stats = defaultStats }: StatsRowProps) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {stats.map((stat) => (
        <GlassCard key={stat.label} className="relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                {stat.label}
              </p>
              <p className="mt-1 text-2xl font-bold text-foreground">
                {stat.value}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {stat.subtext}
              </p>
            </div>
            <div className={cn('rounded-xl p-2.5', stat.bgColor)}>
              <stat.icon className={cn('h-5 w-5', stat.color)} />
            </div>
          </div>
          <div
            className={cn(
              'absolute -bottom-6 -right-6 h-24 w-24 rounded-full blur-3xl opacity-20',
              stat.bgColor,
            )}
          />
        </GlassCard>
      ))}
    </div>
  )
}

export type { StatItem }
