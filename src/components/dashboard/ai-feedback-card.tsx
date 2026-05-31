import { useMemo, useState } from 'react'
import { GlassCard } from './glass-card'
import { cn } from '@/lib/utils'
import {
  AlertCircle,
  Brain,
  CheckCircle2,
  Lightbulb,
  Loader2,
  TrendingUp,
} from 'lucide-react'
import type { FeedbackStatus } from '@/components/FeedbackCard'
import type { AppMode } from '@/constants/studio'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { SpeechFeedbackDashboard } from '@/components/SpeechFeedbackDashboard'
import { parseCoachFeedback } from '@/utils/parseCoachFeedback'
import { sanitizeCoachMarkdown } from '@/utils/sanitizeCoachMarkdown'

interface FeedbackItem {
  type: 'success' | 'warning' | 'tip'
  text: string
}

const placeholderItems: FeedbackItem[] = [
  { type: 'success', text: 'Clear articulation of consonant clusters' },
  { type: 'warning', text: 'Slight hesitation on multisyllabic words' },
  { type: 'tip', text: 'Try slowing down on complex phrases' },
]

const getIcon = (type: FeedbackItem['type']) => {
  switch (type) {
    case 'success':
      return CheckCircle2
    case 'warning':
      return AlertCircle
    case 'tip':
      return Lightbulb
  }
}

const getColor = (type: FeedbackItem['type']) => {
  switch (type) {
    case 'success':
      return 'text-emerald-400'
    case 'warning':
      return 'text-amber-400'
    case 'tip':
      return 'text-primary'
  }
}

type AIFeedbackCardProps = {
  status: FeedbackStatus
  mode: AppMode
  targetSentence: string
  transcript: string
  feedback: string
  errorMessage?: string
}

export function AIFeedbackCard({
  status,
  mode,
  targetSentence,
  transcript,
  feedback,
  errorMessage,
}: AIFeedbackCardProps) {
  const [reportOpen, setReportOpen] = useState(false)

  const parsed = useMemo(
    () =>
      feedback
        ? parseCoachFeedback(sanitizeCoachMarkdown(feedback))
        : null,
    [feedback],
  )

  const sessionScore = useMemo(() => {
    if (!parsed?.metrics.length) return null
    const total = parsed.metrics.reduce(
      (sum, metric) => sum + (metric.score / metric.maxScore) * 100,
      0,
    )
    return Math.round(total / parsed.metrics.length)
  }, [parsed])

  const feedbackItems = useMemo((): FeedbackItem[] => {
    if (!parsed || status !== 'done') return placeholderItems

    const items: FeedbackItem[] = []

    for (const metric of parsed.metrics.slice(0, 2)) {
      items.push({
        type:
          metric.status === 'excellent'
            ? 'success'
            : metric.status === 'needs-practice'
              ? 'warning'
              : 'tip',
        text: `${metric.title}: ${metric.statusLabel}`,
      })
    }

    for (const item of parsed.mispronunciations.slice(0, 1)) {
      items.push({
        type: 'warning',
        text: `Expected "${item.expected}" but heard "${item.heard}"`,
      })
    }

    if (parsed.coachingTip) {
      items.push({ type: 'tip', text: parsed.coachingTip })
    }

    return items.length > 0 ? items.slice(0, 3) : placeholderItems
  }, [parsed, status])

  const scoreDisplay = sessionScore ?? 87
  const hasLiveFeedback = status === 'done' && Boolean(parsed?.parseComplete)

  return (
    <>
      <GlassCard className="h-full">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20">
            <Brain className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">
              AI Pathologist Feedback
            </h3>
            <p className="text-xs text-muted-foreground">
              {status === 'processing'
                ? 'Analyzing your recording…'
                : status === 'done'
                  ? 'Session analysis complete'
                  : 'Real-time analysis'}
            </p>
          </div>
        </div>

        <div className="mb-6 rounded-xl border border-border/50 bg-secondary/50 p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Session Score</span>
            {hasLiveFeedback && (
              <div className="flex items-center gap-1">
                <TrendingUp className="h-4 w-4 text-emerald-400" />
                <span className="text-xs text-emerald-400">Live</span>
              </div>
            )}
          </div>

          {status === 'processing' ? (
            <div className="flex items-center gap-3 py-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                Whisper + coach analysis via Supabase…
              </p>
            </div>
          ) : status === 'error' ? (
            <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {errorMessage ?? 'Something went wrong.'}
            </p>
          ) : (
            <>
              <div className="flex items-end gap-2">
                <span className="text-4xl font-bold text-primary">
                  {status === 'done' && sessionScore !== null
                    ? sessionScore
                    : '—'}
                </span>
                {status === 'done' && sessionScore !== null && (
                  <span className="pb-1 text-sm text-muted-foreground">
                    /100
                  </span>
                )}
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-emerald-400 transition-all duration-1000"
                  style={{
                    width:
                      status === 'done' && sessionScore !== null
                        ? `${sessionScore}%`
                        : `${scoreDisplay}%`,
                    opacity: status === 'done' && sessionScore !== null ? 1 : 0.35,
                  }}
                />
              </div>
            </>
          )}
        </div>

        <div className="space-y-3">
          <h4 className="mb-3 text-sm font-medium text-muted-foreground">
            Latest Observations
          </h4>
          {status === 'idle' || status === 'recording' ? (
            <p className="rounded-xl border border-border/30 bg-secondary/30 p-3 text-sm text-muted-foreground">
              Record a drill to see AI pathologist feedback here.
            </p>
          ) : (
            feedbackItems.map((item, index) => {
              const Icon = getIcon(item.type)
              return (
                <div
                  key={index}
                  className={cn(
                    'flex items-start gap-3 rounded-xl p-3',
                    'border border-border/30 bg-secondary/30',
                    'transition-colors hover:bg-secondary/50',
                  )}
                >
                  <Icon
                    className={cn(
                      'mt-0.5 h-5 w-5 shrink-0',
                      getColor(item.type),
                    )}
                  />
                  <p className="text-sm text-foreground/90">{item.text}</p>
                </div>
              )
            })
          )}
        </div>

        <button
          type="button"
          onClick={() => setReportOpen(true)}
          disabled={status !== 'done' || !feedback}
          className={cn(
            'mt-6 w-full rounded-xl py-3',
            'border border-primary/20 bg-primary/10 font-medium text-primary',
            'transition-colors hover:bg-primary/20',
            'disabled:cursor-not-allowed disabled:opacity-40',
          )}
        >
          View Full Report
        </button>
      </GlassCard>

      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto border-border/50 bg-card">
          <DialogHeader>
            <DialogTitle>Speech Therapy Feedback</DialogTitle>
          </DialogHeader>
          <SpeechFeedbackDashboard
            mode={mode}
            targetSentence={targetSentence}
            transcript={transcript}
            feedback={feedback}
            onReturnHome={() => setReportOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}
