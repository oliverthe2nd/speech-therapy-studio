import { useMemo, useState } from 'react'
import { GlassCard } from './glass-card'
import { cn } from '@/lib/utils'
import {
  AlertCircle,
  ArrowRight,
  Brain,
  CheckCircle2,
  Lightbulb,
  Loader2,
  TrendingUp,
} from 'lucide-react'
import type { FeedbackStatus } from '@/components/FeedbackCard'
import type { AppMode } from '@/constants/studio'
import type { ScoreMetric } from '@/types/analyzeSpeech'
import type { DashboardExercise } from '@/components/dashboard/recording-section'
import { normalizeCoachTextInline } from '@/utils/normalizeCoachText'
import { parseCoachFeedback } from '@/utils/parseCoachFeedback'
import {
  mergeClinicalMetrics,
  mergeExecutiveMetrics,
  splitAssessmentMetrics,
  buildStructuralPracticeRecommendation,
  clinicalAreasBelowThreshold,
} from '@/utils/metricCategories'
import { articulationModuleForWeakClinical } from '@/utils/recommendedExercise'
import { sanitizeMispronunciations } from '@/utils/mispronunciationValidation'
import { sanitizeCoachMarkdown } from '@/utils/sanitizeCoachMarkdown'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { SpeechFeedbackDashboard } from '@/components/SpeechFeedbackDashboard'

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
  coachMetrics?: ScoreMetric[]
  clinicalMetrics?: ScoreMetric[]
  coachingTip?: string
  errorMessage?: string
  onOpenStructuralModule?: (exercise: DashboardExercise) => void
}

export function AIFeedbackCard({
  status,
  mode,
  targetSentence,
  transcript,
  feedback,
  coachMetrics = [],
  clinicalMetrics: clinicalMetricsProp = [],
  coachingTip,
  errorMessage,
  onOpenStructuralModule,
}: AIFeedbackCardProps) {
  const [reportOpen, setReportOpen] = useState(false)

  const parsed = useMemo(() => {
    if (!feedback) return null
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

  const metrics = useMemo(() => {
    const combined = [...(parsed?.metrics ?? []), ...coachMetrics]
    const split = splitAssessmentMetrics(combined)
    return mergeExecutiveMetrics(split.executive, combined, coachMetrics)
  }, [coachMetrics, parsed?.metrics])

  const clinicalMetrics = useMemo(() => {
    const combined = [...(parsed?.metrics ?? []), ...coachMetrics]
    return mergeClinicalMetrics(
      clinicalMetricsProp.length > 0
        ? clinicalMetricsProp
        : (parsed?.clinicalMetrics ?? []),
      combined,
    )
  }, [clinicalMetricsProp, coachMetrics, parsed?.clinicalMetrics, parsed?.metrics])

  const structuralEdge = useMemo(() => {
    if (mode !== 'practice' || status !== 'done') return null
    const weakClinical = clinicalAreasBelowThreshold(clinicalMetrics)
    const message = buildStructuralPracticeRecommendation(weakClinical)
    const module = articulationModuleForWeakClinical(weakClinical)
    if (!message || !module) return null
    return { message, module }
  }, [clinicalMetrics, mode, status])

  const sessionScore = useMemo(() => {
    if (metrics.length === 0) return null
    const total = metrics.reduce(
      (sum, metric) => sum + (metric.score / metric.maxScore) * 100,
      0,
    )
    return Math.round(total / metrics.length)
  }, [metrics])

  const feedbackItems = useMemo((): FeedbackItem[] => {
    if (status !== 'done' || !feedback) return placeholderItems

    const items: FeedbackItem[] = []

    for (const metric of metrics.slice(0, 2)) {
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

    for (const item of (parsed?.mispronunciations ?? []).slice(0, 1)) {
      items.push({
        type: 'warning',
        text: `Expected "${item.expected}" but heard "${item.heard}"`,
      })
    }

    const tip = coachingTip || parsed?.coachingTip
    if (tip) {
      items.push({ type: 'tip', text: normalizeCoachTextInline(tip) })
    }

    return items.length > 0 ? items.slice(0, 3) : placeholderItems
  }, [coachingTip, feedback, metrics, parsed, status])

  const hasLiveFeedback = status === 'done' && metrics.length > 0

  return (
    <>
      <GlassCard className="h-full">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20">
            <Brain className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Executive Score</h3>
            <p className="text-xs text-muted-foreground">
              {status === 'processing'
                ? 'Analyzing pacing, fillers, and phonetic precision…'
                : status === 'done'
                  ? 'Dual-layer session analysis complete'
                  : 'Pacing · filler words · briefness + phonetic tracking'}
            </p>
          </div>
        </div>

        <div className="mb-6 rounded-xl border border-border/50 bg-secondary/50 p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Executive Score</span>
            {hasLiveFeedback && (
              <div className="flex items-center gap-1">
                <TrendingUp className="h-4 w-4 text-emerald-400" />
                <span className="text-xs text-emerald-400">Live</span>
              </div>
            )}
          </div>

          {status === 'processing' ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">
                  Whisper + coach analysis via Supabase…
                </p>
              </div>
              {feedback && sessionScore !== null && (
                <p className="text-xs text-muted-foreground">
                  Previous score: {sessionScore}/100 — updating after your
                  follow-up…
                </p>
              )}
            </div>
          ) : status === 'error' ? (
            <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {errorMessage ?? 'Something went wrong.'}
            </p>
          ) : status === 'done' && !feedback ? (
            <p className="py-4 text-sm text-muted-foreground">
              Waiting for coach feedback…
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
                        : '0%',
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
          {status === 'processing' ? (
            <div className="flex items-center gap-3 rounded-xl border border-border/30 bg-secondary/30 p-3">
              <Loader2 className="h-5 w-5 shrink-0 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                Analyzing your recording — observations will appear here shortly.
              </p>
            </div>
          ) : status === 'idle' || (status === 'recording' && !feedback) ? (
            <p className="rounded-xl border border-border/30 bg-secondary/30 p-3 text-sm text-muted-foreground">
              Record a corporate scenario to see your executive score and
              phonetic precision breakdown here.
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

        {structuralEdge && onOpenStructuralModule && (
          <div className="mt-4 rounded-xl border border-amber-400/30 bg-gradient-to-r from-amber-400/10 via-amber-400/5 to-transparent px-4 py-3.5">
            <p className="text-sm leading-relaxed text-foreground/90">
              {structuralEdge.message}
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenStructuralModule(structuralEdge.module)}
              className="mt-3 w-full border-amber-400/40 bg-background/60 text-foreground hover:bg-amber-400/10"
            >
              Open {structuralEdge.module.title}
              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          </div>
        )}

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
            <DialogTitle>Session Analysis</DialogTitle>
          </DialogHeader>
          <SpeechFeedbackDashboard
            mode={mode}
            targetSentence={targetSentence}
            transcript={transcript}
            feedback={feedback}
            coachMetrics={coachMetrics}
            clinicalMetrics={clinicalMetrics}
            onReturnHome={() => setReportOpen(false)}
            onOpenStructuralModule={
              onOpenStructuralModule
                ? (exercise) => {
                    setReportOpen(false)
                    onOpenStructuralModule(exercise)
                  }
                : undefined
            }
          />
        </DialogContent>
      </Dialog>
    </>
  )
}
