import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Ear,
  Lightbulb,
  Star,
} from 'lucide-react'
import type { AppMode } from '../constants/studio'
import {
  homeworkStorageKey,
  parseCoachFeedback,
  type HomeworkItem,
  type MispronunciationItem,
  type ScoreMetric,
  type ScoreStatus,
} from '../utils/parseCoachFeedback'
import { sanitizeCoachMarkdown } from '../utils/sanitizeCoachMarkdown'
import ReactMarkdown from 'react-markdown'

type SpeechFeedbackDashboardProps = {
  mode: AppMode
  targetSentence: string
  transcript: string
  feedback: string
  onReturnHome?: () => void
}

function StarRating({ score, maxScore }: { score: number; maxScore: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${score} of ${maxScore} stars`}>
      {Array.from({ length: maxScore }).map((_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${
            i < score ? 'fill-warning text-warning' : 'fill-muted text-muted'
          }`}
        />
      ))}
    </div>
  )
}

function StatusBadge({
  status,
  label,
}: {
  status: ScoreStatus
  label: string
}) {
  const variants: Record<ScoreStatus, string> = {
    excellent: 'bg-success/15 text-success border-success/30',
    good: 'bg-primary/15 text-primary border-primary/30',
    'needs-practice': 'bg-warning/15 text-warning-foreground border-warning/30',
  }

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${variants[status]}`}
    >
      {label}
    </span>
  )
}

function ScoreCard({ metric }: { metric: ScoreMetric }) {
  const progressValue = (metric.score / metric.maxScore) * 100

  return (
    <div className="rounded-xl border border-border/50 bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold text-foreground">{metric.title}</h3>
          <StatusBadge status={metric.status} label={metric.statusLabel} />
        </div>
        <div className="space-y-2">
          <StarRating score={metric.score} maxScore={metric.maxScore} />
          <div
            className="h-2 w-full overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-valuenow={progressValue}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${progressValue}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function TargetSentenceCard({ sentence }: { sentence: string }) {
  return (
    <div className="rounded-xl border border-border bg-muted/30">
      <div className="p-6">
        <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Target Sentence
        </p>
        <p className="font-serif text-xl italic leading-relaxed text-foreground">
          &ldquo;{sentence}&rdquo;
        </p>
      </div>
    </div>
  )
}

function CoachHeardCard({
  items,
  prose,
}: {
  items: MispronunciationItem[]
  prose: string
}) {
  return (
    <div className="rounded-xl border border-border/50 bg-card shadow-sm">
      <div className="border-b border-border/50 px-5 py-4">
        <h3 className="flex items-center gap-2 text-base font-semibold text-foreground">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-info/15">
            <Ear className="h-4 w-4 text-info" />
          </span>
          What the Coach Heard
        </h3>
      </div>
      <div className="p-5 pt-3">
        {items.length > 0 ? (
          <div className="space-y-3">
            {items.map((item, index) => (
              <div
                key={index}
                className="flex items-center gap-3 rounded-lg bg-muted/50 p-3"
              >
                <div className="flex-1">
                  <p className="text-sm">
                    <span className="text-muted-foreground">Expected: </span>
                    <span className="font-medium text-foreground">
                      {item.expected}
                    </span>
                  </p>
                  <p className="text-sm">
                    <span className="text-muted-foreground">Heard: </span>
                    <span className="font-medium text-destructive">
                      {item.heard}
                    </span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : prose ? (
          <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">
            {prose}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            Your coach is still listening back — check the full notes below.
          </p>
        )}
      </div>
    </div>
  )
}

function CoachingTipCard({ tip }: { tip: string }) {
  if (!tip) return null

  return (
    <div className="rounded-xl border border-primary/20 bg-primary/5 shadow-sm">
      <div className="border-b border-primary/10 px-5 py-4">
        <h3 className="flex items-center gap-2 text-base font-semibold text-foreground">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15">
            <Lightbulb className="h-4 w-4 text-primary" />
          </span>
          Try This Mouth Move!
        </h3>
      </div>
      <div className="p-5 pt-3">
        <p className="text-sm leading-relaxed text-foreground/90">{tip}</p>
      </div>
    </div>
  )
}

function HomeworkChecklist({
  items,
  onToggle,
}: {
  items: HomeworkItem[]
  onToggle: (id: string) => void
}) {
  if (items.length === 0) return null

  const completedCount = items.filter((item) => item.completed).length

  return (
    <div className="rounded-xl border border-border/50 bg-card shadow-sm">
      <div className="border-b border-border/50 px-5 py-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="flex items-center gap-2 text-base font-semibold text-foreground">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-success/15">
              <CheckCircle2 className="h-4 w-4 text-success" />
            </span>
            My Next Steps
          </h3>
          <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
            {completedCount}/{items.length}
          </span>
        </div>
      </div>
      <div className="p-5 pt-3">
        <div className="space-y-2">
          {items.map((item) => (
            <label
              key={item.id}
              className="flex cursor-pointer items-center gap-3 rounded-lg border border-transparent p-3 transition-colors hover:bg-muted/50"
            >
              <input
                type="checkbox"
                checked={item.completed}
                onChange={() => onToggle(item.id)}
                className="h-5 w-5 shrink-0 rounded border-border text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              />
              <span
                className={`flex-1 text-sm ${
                  item.completed
                    ? 'text-muted-foreground line-through'
                    : 'text-foreground'
                }`}
              >
                {item.label}
              </span>
              {item.completed ? (
                <CheckCircle2 className="h-4 w-4 text-success" aria-hidden />
              ) : (
                <Circle
                  className="h-4 w-4 text-muted-foreground/50"
                  aria-hidden
                />
              )}
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}

export function SpeechFeedbackDashboard({
  mode,
  targetSentence,
  transcript,
  feedback,
  onReturnHome,
}: SpeechFeedbackDashboardProps) {
  const parsed = useMemo(
    () => parseCoachFeedback(sanitizeCoachMarkdown(feedback)),
    [feedback],
  )

  const displaySentence =
    targetSentence.trim() ||
    (transcript ? transcript.slice(0, 120) + (transcript.length > 120 ? '…' : '') : '')

  const [homework, setHomework] = useState<HomeworkItem[]>(parsed.homework)

  useEffect(() => {
    const base = parsed.homework
    if (base.length === 0) {
      setHomework([])
      return
    }

    const key = homeworkStorageKey(displaySentence, base.map((h) => h.label))
    try {
      const saved = localStorage.getItem(key)
      if (saved) {
        const completedIds = new Set(JSON.parse(saved) as string[])
        setHomework(
          base.map((item) => ({
            ...item,
            completed: completedIds.has(item.id),
          })),
        )
        return
      }
    } catch {
      /* ignore corrupt storage */
    }
    setHomework(base)
  }, [parsed.homework, displaySentence])

  const persistHomework = useCallback(
    (next: HomeworkItem[]) => {
      setHomework(next)
      const key = homeworkStorageKey(
        displaySentence,
        next.map((h) => h.label),
      )
      const completedIds = next.filter((h) => h.completed).map((h) => h.id)
      try {
        localStorage.setItem(key, JSON.stringify(completedIds))
      } catch {
        /* quota */
      }
    },
    [displaySentence],
  )

  const handleToggleHomework = (id: string) => {
    persistHomework(
      homework.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item,
      ),
    )
  }

  const title =
    mode === 'baseline' ? 'Speech Therapy Feedback' : 'Speech Therapy Feedback'
  const subtitle =
    mode === 'baseline'
      ? 'Your speech pattern check-in results'
      : 'Your personalized practice analysis'

  const returnLabel =
    mode === 'baseline' ? 'Back to practice drills' : 'Choose another drill'

  return (
    <div className="w-full">
      <header className="mb-6 text-center">
        <h2 className="mb-1 text-2xl font-bold text-foreground">{title}</h2>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </header>

      <div className="mx-auto max-w-2xl space-y-6">
        {displaySentence && <TargetSentenceCard sentence={displaySentence} />}

        {parsed.metrics.length > 0 && (
          <section>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Performance Scores
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {parsed.metrics.map((metric, index) => (
                <ScoreCard key={`${metric.title}-${index}`} metric={metric} />
              ))}
            </div>
          </section>
        )}

        <CoachHeardCard
          items={parsed.mispronunciations}
          prose={parsed.coachHeardText}
        />

        <CoachingTipCard tip={parsed.coachingTip} />

        <HomeworkChecklist items={homework} onToggle={handleToggleHomework} />

        {!parsed.parseComplete && (
          <div className="rounded-xl border border-border bg-muted/40 p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Full coach notes
            </p>
            <div className="prose prose-sm max-w-none prose-p:text-muted-foreground prose-strong:text-primary [&_hr]:hidden">
              <ReactMarkdown>{sanitizeCoachMarkdown(feedback)}</ReactMarkdown>
            </div>
          </div>
        )}

        {onReturnHome && (
          <div className="pt-2">
            <button
              type="button"
              onClick={onReturnHome}
              className="group flex h-12 w-full items-center justify-center rounded-xl border border-border bg-card text-base font-medium text-foreground transition-all hover:border-primary hover:bg-primary hover:text-primary-foreground"
            >
              <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
              {returnLabel}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
