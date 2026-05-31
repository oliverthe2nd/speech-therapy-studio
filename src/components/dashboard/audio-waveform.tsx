import { useEffect, useMemo, useState } from 'react'
import { cn } from '@/lib/utils'

interface AudioWaveformProps {
  isRecording?: boolean
  levels?: number[]
}

function expandLevels(levels: number[], barCount: number): number[] {
  if (levels.length === 0) {
    return Array(barCount).fill(0.2)
  }

  return Array.from({ length: barCount }, (_, index) => {
    const position = (index / (barCount - 1)) * (levels.length - 1)
    const left = Math.floor(position)
    const right = Math.min(levels.length - 1, left + 1)
    const weight = position - left
    const value = levels[left] * (1 - weight) + levels[right] * weight
    return Math.max(0.12, Math.min(1, value))
  })
}

export function AudioWaveform({
  isRecording = false,
  levels,
}: AudioWaveformProps) {
  const [bars, setBars] = useState<number[]>(Array(40).fill(0.2))
  const liveLevels = useMemo(
    () => (levels ? expandLevels(levels, 40) : null),
    [levels],
  )

  useEffect(() => {
    if (isRecording && liveLevels) {
      setBars(liveLevels)
      return
    }

    if (isRecording) {
      const interval = setInterval(() => {
        setBars((prevBars) =>
          prevBars.map(() => Math.random() * 0.8 + 0.2),
        )
      }, 100)
      return () => clearInterval(interval)
    }

    const interval = setInterval(() => {
      setBars((prevBars) =>
        prevBars.map((_, i) => {
          const base = 0.15
          const wave = Math.sin(Date.now() / 500 + i * 0.3) * 0.1
          return base + wave
        }),
      )
    }, 50)
    return () => clearInterval(interval)
  }, [isRecording, liveLevels])

  return (
    <div className="w-full">
      <div className="flex h-24 items-center justify-center gap-[3px]">
        {bars.map((height, i) => (
          <div
            key={i}
            className={cn(
              'w-1.5 rounded-full transition-all',
              isRecording ? 'bg-primary' : 'bg-muted-foreground/30',
            )}
            style={{
              height: `${height * 100}%`,
              transitionDuration: isRecording ? '100ms' : '300ms',
              opacity: isRecording ? 1 : 0.6,
            }}
          />
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between px-2">
        <span className="text-xs text-muted-foreground">0:00</span>
        <span className="text-xs text-muted-foreground">
          {isRecording ? 'Recording' : 'Ready'}
        </span>
        <span className="text-xs text-muted-foreground">3:00</span>
      </div>
    </div>
  )
}
