import { Sparkles, X } from 'lucide-react'
import {
  BASELINE_FOCUS_DESCRIPTION,
  BASELINE_PARAGRAPH_TITLE,
  BASELINE_PRACTICE_SENTENCE,
} from '../constants/studio'

type BaselineModalProps = {
  open: boolean
  hasCompletedCheckIn: boolean
  onClose: () => void
  onConfirm: () => void
}

export function BaselineModal({
  open,
  hasCompletedCheckIn,
  onClose,
  onConfirm,
}: BaselineModalProps) {
  if (!open) return null

  const title = hasCompletedCheckIn
    ? `Update your ${BASELINE_PARAGRAPH_TITLE} check-in`
    : `Your ${BASELINE_PARAGRAPH_TITLE} check-in`

  const footerNote = hasCompletedCheckIn
    ? 'Your personalized daily drills will refresh when you finish this updated check-in.'
    : 'Your daily drill library will step aside while you finish this quick check-in. You can jump back to practice anytime.'

  const confirmLabel = hasCompletedCheckIn ? 'Retake check-in' : 'Start check-in'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="baseline-modal-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-foreground/50 backdrop-blur-sm"
        aria-label="Close dialog"
        onClick={onClose}
      />
      <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-border bg-card p-6 shadow-studio">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-muted text-primary">
          <Sparkles className="h-6 w-6" />
        </div>

        <h2
          id="baseline-modal-title"
          className="text-2xl font-semibold text-foreground"
        >
          {title}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {BASELINE_FOCUS_DESCRIPTION}
        </p>

        <blockquote className="mt-5 rounded-2xl border border-border bg-primary-muted px-4 py-4 text-sm leading-relaxed text-foreground">
          “{BASELINE_PRACTICE_SENTENCE}”
        </blockquote>

        <p className="mt-4 text-xs text-muted-foreground">{footerNote}</p>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-border px-5 py-2.5 text-sm font-medium text-foreground hover:bg-muted"
          >
            Not yet
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-studio hover:bg-primary/90"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
