import { Compass, Map, Play, RefreshCw, Shield, Target } from 'lucide-react'
import { GlassCard } from '@/components/dashboard/glass-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { StoredExecutiveDossier } from '@/lib/database'
import type { GrowthRoadmap } from '@/types/analyzeSpeech'
import {
  DEFAULT_PHASE_FOCUS,
  phaseFocusLabel,
  type PhaseFocus,
} from '@/utils/phaseFocus'

type GrowthRoadmapProps = {
  dossier: StoredExecutiveDossier | null
  roadmap?: GrowthRoadmap | null
  loading?: boolean
  activePhaseFocus?: PhaseFocus
  activatingPhase?: PhaseFocus | null
  onRefreshBaseline?: () => void
  onActivatePhase?: (phase: PhaseFocus) => void
  onLaunchActiveFocusDrills?: () => void
}

const DEFAULT_STRENGTHS = [
  'Natural vocal authority in conversational delivery',
  'Clear intent when introducing yourself and your focus',
]

const DEFAULT_BLINDSPOTS = [
  'Pace acceleration when delivering metric-heavy passages',
  'Final consonant landing under simulated boardroom pressure',
]

const DEFAULT_PHASES: GrowthRoadmap['phases'] = [
  {
    phase: 'Phase 1',
    title: 'Foundation',
    focus: 'Stabilize executive pace and eliminate filler words in structured passages.',
    duration: 'Week 1-2',
  },
  {
    phase: 'Phase 2',
    title: 'Precision',
    focus: 'Sharpen S-Sound Crispness and Vocalic R Precision in strategic vocabulary.',
    duration: 'Week 3-4',
  },
  {
    phase: 'Phase 3',
    title: 'Executive Presence',
    focus: 'Apply calibrated delivery to live stakeholder updates and team presentations.',
    duration: 'Week 5-8',
  },
]

function phaseIndexFromLabel(label: string, index: number): PhaseFocus {
  const match = label.match(/(\d)/)
  if (match) {
    const parsed = Number.parseInt(match[1], 10)
    if (parsed >= 1 && parsed <= 3) return parsed as PhaseFocus
  }
  return (index + 1) as PhaseFocus
}

export function GrowthRoadmapSection({
  dossier,
  roadmap,
  loading = false,
  activePhaseFocus = DEFAULT_PHASE_FOCUS,
  activatingPhase = null,
  onRefreshBaseline,
  onActivatePhase,
  onLaunchActiveFocusDrills,
}: GrowthRoadmapProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-64 animate-pulse rounded-lg bg-secondary/40" />
        <div className="grid gap-4 lg:grid-cols-3">
          {[0, 1, 2].map((key) => (
            <div
              key={key}
              className="h-56 animate-pulse rounded-xl border border-border/30 bg-secondary/20"
            />
          ))}
        </div>
      </div>
    )
  }

  const strengths =
    roadmap?.strengths?.length ? roadmap.strengths : dossier?.strengths?.length
      ? dossier.strengths
      : DEFAULT_STRENGTHS

  const blindspots =
    roadmap?.blindspots?.length
      ? roadmap.blindspots
      : dossier?.blindspots?.length
        ? dossier.blindspots
        : DEFAULT_BLINDSPOTS

  const phases =
    roadmap?.phases?.length
      ? roadmap.phases
      : dossier?.growthPhases?.length
        ? dossier.growthPhases
        : DEFAULT_PHASES

  const greetingName = dossier?.name?.split(/\s+/)[0]
  const activeLabel = phaseFocusLabel(activePhaseFocus)

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">
            My Growth Roadmap
          </p>
          <h2 className="mt-1 text-2xl font-bold text-foreground">
            {greetingName
              ? `${greetingName}, your executive development plan`
              : 'Your executive development plan'}
          </h2>
          {(dossier?.title || dossier?.industry) && (
            <p className="mt-2 text-sm text-muted-foreground">
              {[dossier.title, dossier.industry].filter(Boolean).join(' · ')}
              {dossier.audienceContext
                ? ` · Presenting to ${dossier.audienceContext}`
                : ''}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {onLaunchActiveFocusDrills && (
            <Button
              type="button"
              size="sm"
              className="gap-2 bg-primary shadow-[0_0_24px_rgba(45,212,191,0.25)] hover:bg-primary/90"
              onClick={onLaunchActiveFocusDrills}
            >
              <Play className="h-4 w-4" />
              Launch Active Focus Drills
            </Button>
          )}
          {onRefreshBaseline && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={onRefreshBaseline}
            >
              <RefreshCw className="h-4 w-4" />
              Refresh baseline
            </Button>
          )}
          <Badge variant="secondary" className="text-xs">
            {activeLabel} · Active Focus
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <GlassCard className="border-emerald-400/20 bg-emerald-400/5">
          <div className="mb-4 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400/15 text-emerald-400">
              <Shield className="h-5 w-5" />
            </span>
            <h3 className="font-semibold text-foreground">Professional Strengths</h3>
          </div>
          <ul className="space-y-3">
            {strengths.map((item) => (
              <li
                key={item}
                className="rounded-xl border border-emerald-400/20 bg-background/40 px-4 py-3 text-sm leading-relaxed text-foreground"
              >
                {item}
              </li>
            ))}
          </ul>
        </GlassCard>

        <GlassCard className="border-amber-400/20 bg-amber-400/5">
          <div className="mb-4 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400/15 text-amber-400">
              <Target className="h-5 w-5" />
            </span>
            <h3 className="font-semibold text-foreground">Strategic Blindspots</h3>
          </div>
          <ul className="space-y-3">
            {blindspots.map((item) => (
              <li
                key={item}
                className="rounded-xl border border-amber-400/20 bg-background/40 px-4 py-3 text-sm leading-relaxed text-foreground"
              >
                {item}
              </li>
            ))}
          </ul>
        </GlassCard>

        <GlassCard className="border-primary/20 bg-primary/5 lg:col-span-1">
          <div className="mb-4 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <Compass className="h-5 w-5" />
            </span>
            <h3 className="font-semibold text-foreground">The Way Forward</h3>
          </div>
          <ol className="relative space-y-4 before:absolute before:bottom-2 before:left-[11px] before:top-2 before:w-px before:bg-primary/20">
            {phases.map((phase, index) => {
              const phaseNumber = phaseIndexFromLabel(phase.phase, index)
              const isActive = phaseNumber === activePhaseFocus
              const isActivating = activatingPhase === phaseNumber

              return (
                <li key={`${phase.phase}-${index}`} className="relative pl-8">
                  <span
                    className={`absolute left-0 top-1 flex h-6 w-6 items-center justify-center rounded-full border text-[10px] font-bold ${
                      isActive
                        ? 'border-primary bg-primary/20 text-primary shadow-[0_0_12px_rgba(45,212,191,0.45)]'
                        : 'border-primary/30 bg-background text-primary'
                    }`}
                  >
                    {index + 1}
                  </span>
                  <div
                    className={`rounded-xl border bg-background/40 px-4 py-3 transition-all ${
                      isActive
                        ? 'border-primary/60 shadow-[0_0_20px_rgba(45,212,191,0.18)] ring-1 ring-primary/30'
                        : 'border-border/30'
                    }`}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-foreground">
                        {phase.title}
                      </p>
                      <Badge variant="outline" className="text-[10px]">
                        {phase.duration}
                      </Badge>
                      {isActive && (
                        <Badge className="border-primary/40 bg-primary/15 text-[10px] text-primary">
                          Active Focus
                        </Badge>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{phase.phase}</p>
                    <p className="mt-2 text-sm leading-relaxed text-foreground">
                      {phase.focus}
                    </p>
                    {onActivatePhase && !isActive && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isActivating}
                        className="mt-3 w-full border-primary/30 text-xs hover:border-primary/50 hover:bg-primary/5"
                        onClick={() => onActivatePhase(phaseNumber)}
                      >
                        {isActivating ? 'Activating…' : 'Activate Phase Focus'}
                      </Button>
                    )}
                  </div>
                </li>
              )
            })}
          </ol>
        </GlassCard>
      </div>

      {dossier?.professionalFocus && (
        <GlassCard className="border-dashed border-border/50">
          <div className="flex items-start gap-3">
            <Map className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <p className="text-sm leading-relaxed text-muted-foreground">
              <span className="font-medium text-foreground">Core focus:</span>{' '}
              {dossier.professionalFocus}
            </p>
          </div>
        </GlassCard>
      )}
    </section>
  )
}
