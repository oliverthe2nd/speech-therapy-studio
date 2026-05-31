import { Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  BASELINE_FOCUS_DESCRIPTION,
  BASELINE_PARAGRAPH_TITLE,
  BASELINE_PRACTICE_SENTENCE,
} from '@/constants/studio'

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
  const title = hasCompletedCheckIn
    ? `Update your ${BASELINE_PARAGRAPH_TITLE} check-in`
    : `Your ${BASELINE_PARAGRAPH_TITLE} check-in`

  const footerNote = hasCompletedCheckIn
    ? 'Your personalized daily drills will refresh when you finish this updated check-in.'
    : 'Your daily drill library will step aside while you finish this quick check-in. You can jump back to practice anytime.'

  const confirmLabel = hasCompletedCheckIn ? 'Retake check-in' : 'Start check-in'

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Sparkles className="h-6 w-6" />
          </div>
          <DialogTitle className="text-2xl">{title}</DialogTitle>
          <DialogDescription className="text-left leading-relaxed">
            {BASELINE_FOCUS_DESCRIPTION}
          </DialogDescription>
        </DialogHeader>

        <blockquote className="rounded-2xl border bg-muted/50 px-4 py-4 text-sm leading-relaxed">
          &ldquo;{BASELINE_PRACTICE_SENTENCE}&rdquo;
        </blockquote>

        <p className="text-xs text-muted-foreground">{footerNote}</p>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={onClose}>
            Not yet
          </Button>
          <Button type="button" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
