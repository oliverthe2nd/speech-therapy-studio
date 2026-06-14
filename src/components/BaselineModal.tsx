import { MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { BASELINE_FLOW_STEPS, BASELINE_WIZARD_INTRO } from '@/constants/baselineFlow'
import { BASELINE_PARAGRAPH_TITLE } from '@/constants/studio'

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
    ? `Refresh your ${BASELINE_PARAGRAPH_TITLE}`
    : `Your ${BASELINE_PARAGRAPH_TITLE}`

  const footerNote = hasCompletedCheckIn
    ? 'Your Growth Roadmap and daily drills will refresh when you complete all three steps again.'
    : 'Three quick conversational steps with your executive coach — about three minutes total.'

  const confirmLabel = hasCompletedCheckIn ? 'Retake check-in' : 'Start check-in'

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <MessageCircle className="h-6 w-6" />
          </div>
          <DialogTitle className="text-2xl">{title}</DialogTitle>
          <DialogDescription className="text-left leading-relaxed">
            {BASELINE_WIZARD_INTRO}
          </DialogDescription>
        </DialogHeader>

        <ol className="space-y-3 rounded-2xl border bg-muted/50 px-4 py-4 text-sm leading-relaxed">
          {BASELINE_FLOW_STEPS.map((step) => (
            <li key={step.step} className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
                {step.step}
              </span>
              <div>
                <p className="font-medium text-foreground">{step.title}</p>
                <p className="mt-1 text-muted-foreground">{step.coachPrompt}</p>
              </div>
            </li>
          ))}
        </ol>

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
