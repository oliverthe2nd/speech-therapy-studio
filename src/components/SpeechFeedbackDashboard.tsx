import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Ear,
  Lightbulb,
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import type { AppMode } from '@/constants/studio'
import type { ScoreMetric } from '@/types/analyzeSpeech'
import {
  homeworkStorageKey,
  parseCoachFeedback,
  type HomeworkItem,
  type MispronunciationItem,
} from '@/utils/parseCoachFeedback'
import { sanitizeMispronunciations } from '@/utils/mispronunciationValidation'
import { sanitizeCoachMarkdown } from '@/utils/sanitizeCoachMarkdown'
import type { DashboardExercise } from '@/components/dashboard/recording-section'
import {
  mergeClinicalMetrics,
  mergeExecutiveMetrics,
  splitAssessmentMetrics,
} from '@/utils/metricCategories'
import { normalizeCoachText } from '@/utils/normalizeCoachText'
import { AssessmentResultsTabs } from '@/components/AssessmentResultsTabs'

type SpeechFeedbackDashboardProps = {
  mode: AppMode
  targetSentence: string
  transcript: string
  feedback: string
  coachMetrics?: ScoreMetric[]
  clinicalMetrics?: ScoreMetric[]
  onReturnHome?: () => void
  onOpenStructuralModule?: (exercise: DashboardExercise) => void
}

function TargetSentenceCard({ sentence }: { sentence: string }) {
  return (
    <Card className="gap-0 border-muted bg-muted/30 py-0">
      <CardContent className="p-6">
        <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Target Sentence
        </p>
        <p className="font-serif text-xl italic leading-relaxed text-foreground">
          &ldquo;{sentence}&rdquo;
        </p>
      </CardContent>
    </Card>
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
    <Card className="gap-0 border-border/50 py-0 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-info/15">
            <Ear className="h-4 w-4 text-info" />
          </div>
          What the Coach Heard
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
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
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
            {prose}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            Your coach is still listening back — expand full notes below if
            needed.
          </p>
        )}
      </CardContent>
    </Card>
  )
}

function CoachingTipCard({ tip }: { tip: string }) {
  if (!tip) return null

  return (
    <Card className="gap-0 border-primary/20 bg-primary/5 py-0 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15">
            <Lightbulb className="h-4 w-4 text-primary" />
          </div>
          Executive Delivery Tip
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/90">
          {normalizeCoachText(tip)}
        </p>
      </CardContent>
    </Card>
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
    <Card className="gap-0 border-border/50 py-0 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-success/15">
              <CheckCircle2 className="h-4 w-4 text-success" />
            </div>
            My Next Steps
          </CardTitle>
          <Badge variant="secondary" className="font-medium">
            {completedCount}/{items.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          {items.map((item) => (
            <label
              key={item.id}
              className="flex cursor-pointer items-center gap-3 rounded-lg border border-transparent p-3 transition-colors hover:bg-muted/50"
            >
              <Checkbox
                checked={item.completed}
                onCheckedChange={() => onToggle(item.id)}
                className="h-5 w-5"
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
      </CardContent>
    </Card>
  )
}

export function SpeechFeedbackDashboard({
  mode,
  targetSentence,
  transcript,
  feedback,
  coachMetrics = [],
  clinicalMetrics: clinicalMetricsProp = [],
  onReturnHome,
  onOpenStructuralModule,
}: SpeechFeedbackDashboardProps) {
  const parsed = useMemo(() => {
    const base = parseCoachFeedback(sanitizeCoachMarkdown(feedback))
    const sentence = targetSentence.trim()
    if (!sentence && !transcript.trim()) return base

    return {
      ...base,
      mispronunciations: sanitizeMispronunciations(
        base.mispronunciations,
        sentence,
        transcript,
      ),
    }
  }, [feedback, targetSentence, transcript])

  const { executive, clinical } = useMemo(() => {
    const combined = [...coachMetrics, ...parsed.metrics]
    const split = splitAssessmentMetrics(combined)
    return {
      executive: mergeExecutiveMetrics(split.executive, combined),
      clinical: mergeClinicalMetrics(
        clinicalMetricsProp.length > 0
          ? clinicalMetricsProp
          : parsed.clinicalMetrics,
        combined,
      ),
    }
  }, [coachMetrics, clinicalMetricsProp, parsed.clinicalMetrics, parsed.metrics])

  const displaySentence =
    targetSentence.trim() ||
    (transcript
      ? `${transcript.slice(0, 120)}${transcript.length > 120 ? '…' : ''}`
      : '')

  const [homework, setHomework] = useState<HomeworkItem[]>(parsed.homework)

  useEffect(() => {
    const base = parsed.homework
    if (base.length === 0) {
      setHomework([])
      return
    }

    const key = homeworkStorageKey(
      displaySentence || feedback.slice(0, 40),
      base.map((h) => h.label),
    )
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
  }, [parsed.homework, displaySentence, feedback])

  const persistHomework = useCallback(
    (next: HomeworkItem[]) => {
      setHomework(next)
      const key = homeworkStorageKey(
        displaySentence || feedback.slice(0, 40),
        next.map((h) => h.label),
      )
      const completedIds = next.filter((h) => h.completed).map((h) => h.id)
      try {
        localStorage.setItem(key, JSON.stringify(completedIds))
      } catch {
        /* quota */
      }
    },
    [displaySentence, feedback],
  )

  const handleToggleHomework = (id: string) => {
    persistHomework(
      homework.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item,
      ),
    )
  }

  const subtitle =
    mode === 'baseline'
      ? 'Executive presence with Accent Clarity & Intelligibility analysis'
      : 'Presentation delivery with phonetic precision and global intelligibility tracking'

  const returnLabel =
    mode === 'baseline'
      ? 'Back to executive scenarios'
      : 'Choose another scenario'

  return (
    <div className="min-h-full bg-background">
      <div className="mx-auto max-w-2xl px-0 py-0">
        <header className="mb-8 text-center">
          <h2 className="mb-1 text-2xl font-bold text-foreground">
            Session Analysis
          </h2>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </header>

        <div className="space-y-6">
          {displaySentence && (
            <TargetSentenceCard sentence={displaySentence} />
          )}

          {(executive.length > 0 || clinical.length > 0) && (
            <AssessmentResultsTabs
              mode={mode}
              executiveMetrics={executive}
              clinicalMetrics={clinical}
              onOpenStructuralModule={onOpenStructuralModule}
            />
          )}

          <CoachHeardCard
            items={parsed.mispronunciations}
            prose={parsed.coachHeardText}
          />

          <CoachingTipCard tip={parsed.coachingTip} />

          <HomeworkChecklist items={homework} onToggle={handleToggleHomework} />

          {!parsed.parseComplete && (
            <Accordion type="single" collapsible className="rounded-xl border">
              <AccordionItem value="full-notes" className="border-none px-4">
                <AccordionTrigger className="text-sm font-semibold uppercase tracking-wider text-muted-foreground hover:no-underline">
                  Full coach notes
                </AccordionTrigger>
                <AccordionContent>
                  <div className="prose prose-sm max-w-none prose-p:text-muted-foreground prose-strong:text-primary [&_hr]:hidden">
                    <ReactMarkdown>
                      {sanitizeCoachMarkdown(feedback)}
                    </ReactMarkdown>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}

          {onReturnHome && (
            <div className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onReturnHome}
                className="group h-12 w-full text-base font-medium transition-all hover:border-primary hover:bg-primary hover:text-primary-foreground"
              >
                <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
                {returnLabel}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
