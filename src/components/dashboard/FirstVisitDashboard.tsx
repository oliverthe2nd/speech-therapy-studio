import { MessageCircle, Mic, Sparkles, TrendingUp } from 'lucide-react'
import { GlassCard } from '@/components/dashboard/glass-card'
import { Button } from '@/components/ui/button'
import { BASELINE_WIZARD_INTRO } from '@/constants/baselineFlow'
import { BASELINE_PARAGRAPH_TITLE } from '@/constants/studio'

type FirstVisitDashboardProps = {
  onStartCheckIn: () => void
}

const STEPS = [
  {
    icon: MessageCircle,
    title: 'Meet your coach',
    body: 'Introduce yourself and share your professional focus — just like a 1-on-1 executive intake.',
  },
  {
    icon: Mic,
    title: 'Set your context',
    body: 'Tell us your title and the audiences you present to so drills match your world.',
  },
  {
    icon: TrendingUp,
    title: 'Stress-test delivery',
    body: 'Read a strategic operational address under simulated boardroom pressure.',
  },
]

export function FirstVisitDashboard({ onStartCheckIn }: FirstVisitDashboardProps) {
  return (
    <div className="space-y-8">
      <GlassCard className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/10 via-card/40 to-card/40">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">
              Welcome to SpeakFlow
            </p>
            <h2 className="mt-2 text-3xl font-bold text-foreground">
              Your executive coach is ready when you are
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Before daily drills, we run a conversational{' '}
              <span className="font-medium text-foreground">
                {BASELINE_PARAGRAPH_TITLE}
              </span>{' '}
              check-in. {BASELINE_WIZARD_INTRO}
            </p>
            <Button
              type="button"
              size="lg"
              className="mt-6 gap-2"
              onClick={onStartCheckIn}
            >
              <Sparkles className="h-5 w-5" />
              Begin conversational check-in
            </Button>
          </div>

          <div className="flex h-28 w-28 shrink-0 items-center justify-center self-start rounded-3xl bg-primary/15 lg:self-center">
            <MessageCircle className="h-14 w-14 text-primary" />
          </div>
        </div>
      </GlassCard>

      <div className="grid gap-4 md:grid-cols-3">
        {STEPS.map((step, index) => (
          <GlassCard key={step.title} className="h-full">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15">
              <step.icon className="h-5 w-5 text-primary" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Step {index + 1}
            </p>
            <h3 className="mt-1 font-semibold text-foreground">{step.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {step.body}
            </p>
          </GlassCard>
        ))}
      </div>

      <GlassCard>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          What to expect
        </p>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Three short voice responses with your executive coach — no scripts until the
          final benchmark read. When you finish, your dashboard unlocks a personalized{' '}
          <span className="font-medium text-foreground">Growth Roadmap</span> with
          strengths, blindspots, and a phased plan forward.
        </p>
        <Button type="button" variant="outline" className="mt-4" onClick={onStartCheckIn}>
          Start Step 1 — Introduction
        </Button>
      </GlassCard>
    </div>
  )
}
