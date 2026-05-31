type SoundwavePlaceholderProps = {
  isRecording: boolean
  levels: number[]
}

export function SoundwavePlaceholder({
  isRecording,
  levels,
}: SoundwavePlaceholderProps) {
  return (
    <div
      className={`flex h-20 w-full items-end justify-center gap-1.5 rounded-2xl bg-primary-muted px-6 py-4 ${
        isRecording ? 'soundwave-live ring-2 ring-primary/30' : ''
      }`}
      aria-hidden
    >
      {Array.from({ length: 7 }, (_, index) => {
        const level = levels[index] ?? 0.35
        const height = isRecording
          ? `${Math.max(18, level * 100)}%`
          : undefined

        return (
          <span
            key={index}
            className="soundwave-bar w-2 rounded-full"
            style={{
              height: isRecording ? height : '2.5rem',
            }}
          />
        )
      })}
    </div>
  )
}
