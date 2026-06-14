import { useState } from 'react'
import { ArrowRight, Briefcase, Microscope } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ScoreMetric } from '@/types/analyzeSpeech'
import type { AppMode } from '@/constants/studio'
import type { DashboardExercise } from '@/components/dashboard/recording-section'
import {
  buildStructuralPracticeRecommendation,
  clinicalAreasBelowThreshold,
  displayExecutiveMetric,
} from '@/utils/metricCategories'
import {
  clinicalMetricSubtext,
  displayClinicalMetricTitle,
} from '@/utils/focusAreaDisplay'
import { articulationModuleForWeakClinical } from '@/utils/recommendedExercise'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

type AssessmentTab = 'executive' | 'clinical'

type ScoreStatus = ScoreMetric['status']

function StarRating({ score, maxScore }: { score: number; maxScore: number }) {
  return (
    <div
      className="flex items-center gap-0.5"
      aria-label={`${score} of ${maxScore} stars`}
    >
      {Array.from({ length: maxScore }).map((_, index) => (
        <span
          key={index}
          className={cn(
            'text-sm',
            index < score ? 'text-warning' : 'text-muted-foreground/35',
          )}
        >
          ★
        </span>
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
    'needs-practice':
      'bg-warning/15 text-warning-foreground border-warning/30',
  }

  return (
    <Badge variant="outline" className={`${variants[status]} text-xs font-medium`}>
      {label}
    </Badge>
  )
}

function MetricScoreCard({
  metric,
  subtext,
}: {
  metric: ScoreMetric
  subtext?: string
}) {
  const progressValue = (metric.score / metric.maxScore) * 100

  return (
    <Card className="gap-0 border-border/50 py-0 shadow-sm transition-shadow hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold leading-snug text-foreground">
                {metric.title}
              </h3>
              {subtext && (
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                  {subtext}
                </p>
              )}
            </div>
            <StatusBadge status={metric.status} label={metric.statusLabel} />
          </div>
          <div className="space-y-2">
            <StarRating score={metric.score} maxScore={metric.maxScore} />
            <Progress value={progressValue} className="h-2" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function StructuralPracticeBanner({
  message,
  moduleTitle,
  onOpenModule,
}: {
  message: string
  moduleTitle?: string
  onOpenModule?: () => void
}) {
  return (
    <div className="rounded-xl border border-amber-400/30 bg-gradient-to-r from-amber-400/10 via-amber-400/5 to-transparent px-4 py-3.5">
      <p className="text-sm leading-relaxed text-foreground/90">{message}</p>
      {onOpenModule && moduleTitle && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onOpenModule}
          className="mt-3 border-amber-400/40 bg-background/60 text-foreground hover:bg-amber-400/10"
        >
          Open {moduleTitle}
          <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  )
}

type AssessmentResultsTabsProps = {
  mode: AppMode
  executiveMetrics: ScoreMetric[]
  clinicalMetrics: ScoreMetric[]
  onOpenStructuralModule?: (exercise: DashboardExercise) => void
}

export function AssessmentResultsTabs({
  mode,
  executiveMetrics,
  clinicalMetrics,
  onOpenStructuralModule,
}: AssessmentResultsTabsProps) {
  const [activeTab, setActiveTab] = useState<AssessmentTab>('executive')

  const executiveDisplay = executiveMetrics.map(displayExecutiveMetric)
  const weakClinical = clinicalAreasBelowThreshold(clinicalMetrics)
  const structuralRecommendation =
    mode === 'practice'
      ? buildStructuralPracticeRecommendation(weakClinical)
      : null
  const structuralModule =
    mode === 'practice'
      ? articulationModuleForWeakClinical(weakClinical)
      : null

  const tabs: {
    id: AssessmentTab
    label: string
    subtitle: string
    icon: typeof Briefcase
  }[] = [
    {
      id: 'executive',
      label: 'Executive Score',
      subtitle: 'Pacing · Filler Words · Briefness',
      icon: Briefcase,
    },
    {
      id: 'clinical',
      label: 'Acoustic Precision',
      subtitle: 'Vocalic R · S-Sound Crispness · V & W Flow',
      icon: Microscope,
    },
  ]

  const activeMetrics =
    activeTab === 'executive' ? executiveDisplay : clinicalMetrics

  if (executiveDisplay.length === 0 && clinicalMetrics.length === 0) {
    return null
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          const count =
            tab.id === 'executive'
              ? executiveDisplay.length
              : clinicalMetrics.length

          if (count === 0) return null

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'group flex flex-1 flex-col rounded-xl border px-4 py-3 text-left transition-all',
                isActive
                  ? 'border-primary/40 bg-primary/10 shadow-sm ring-1 ring-primary/20'
                  : 'border-border/50 bg-muted/20 hover:border-border hover:bg-muted/40',
              )}
            >
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-lg transition-colors',
                    isActive
                      ? 'bg-primary/20 text-primary'
                      : 'bg-muted text-muted-foreground group-hover:text-foreground',
                  )}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <span
                  className={cn(
                    'text-sm font-semibold',
                    isActive ? 'text-foreground' : 'text-muted-foreground',
                  )}
                >
                  {tab.label}
                </span>
              </div>
              <span className="mt-1 pl-10 text-xs text-muted-foreground">
                {tab.subtitle}
              </span>
            </button>
          )
        })}
      </div>

      {activeTab === 'clinical' && clinicalMetrics.length > 0 && (
        <div className="rounded-xl border border-primary/25 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent px-4 py-3.5">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            Acoustic Precision Index
          </p>
          <p className="mt-1 text-sm leading-relaxed text-foreground/90">
            We celebrate your accent and coach articulatory crispness so
            international stakeholders understand you on the first listen — never
            accent elimination.
          </p>
        </div>
      )}

      {activeMetrics.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {activeMetrics.map((metric, index) => {
            const displayMetric =
              activeTab === 'clinical'
                ? {
                    ...metric,
                    title: displayClinicalMetricTitle(metric.title),
                  }
                : metric

            return (
              <MetricScoreCard
                key={`${metric.title}-${index}`}
                metric={displayMetric}
                subtext={
                  activeTab === 'clinical'
                    ? clinicalMetricSubtext(metric.title)
                    : undefined
                }
              />
            )
          })}
        </div>
      )}

      {structuralRecommendation && activeTab === 'executive' && (
        <StructuralPracticeBanner
          message={structuralRecommendation}
          moduleTitle={structuralModule?.title}
          onOpenModule={
            structuralModule && onOpenStructuralModule
              ? () => onOpenStructuralModule(structuralModule)
              : undefined
          }
        />
      )}

      {activeTab === 'clinical' && clinicalMetrics.length === 0 && (
        <p className="rounded-xl border border-dashed border-border/60 bg-muted/20 p-4 text-sm text-muted-foreground">
          Acoustic precision metrics will appear after your next analyzed
          recording.
        </p>
      )}
    </section>
  )
}
