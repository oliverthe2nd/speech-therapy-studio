import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface GlassCardProps {
  children: ReactNode
  className?: string
  noPadding?: boolean
}

export function GlassCard({
  children,
  className,
  noPadding = false,
}: GlassCardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-border/50',
        'bg-card/40 backdrop-blur-xl',
        'shadow-[0_8px_32px_rgba(0,0,0,0.12)]',
        !noPadding && 'p-6',
        className,
      )}
    >
      {children}
    </div>
  )
}
