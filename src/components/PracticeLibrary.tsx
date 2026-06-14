import { BookOpen, Loader2, RefreshCw, Sparkles } from 'lucide-react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  PRACTICE_LESSONS,
  type PhonemeFocus,
  type PracticeLesson,
} from '@/constants/studio'
import { displayFocusArea, focusAreaSubtext } from '@/utils/focusAreaDisplay'
import { phaseFocusLabel, type PhaseFocus } from '@/utils/phaseFocus'

type PracticeLibraryProps = {
  className?: string
  activeSentence: string
  hasBaseline: boolean
  studioLoading?: boolean
  personalizedLoading: boolean
  personalizedSentences: string[]
  focusAreas: string[]
  fromProgress?: boolean
  activePhaseFocus?: PhaseFocus
  personalizedError: string | null
  onRefreshFreshDrills: () => void
  onRetryPersonalized: () => void
  onSelectLesson: (lesson: PracticeLesson) => void
  onSelectPersonalizedSentence: (sentence: string) => void
}

const CATEGORY_META: Record<
  PhonemeFocus,
  { title: string; accent: string; chip: string; border: string }
> = {
  R: {
    title: 'Vocalic R Precision',
    accent: 'text-chart-4',
    chip: 'bg-chart-4/15 text-chart-4 border border-chart-4/25',
    border:
      'border-chart-4/25 hover:border-chart-4/40 hover:bg-chart-4/5',
  },
  S: {
    title: 'S-Sound Crispness',
    accent: 'text-info',
    chip: 'bg-info/15 text-info border border-info/25',
    border: 'border-info/25 hover:border-info/40 hover:bg-info/5',
  },
}

function FocusAreaBadges({ areas }: { areas: string[] }) {
  if (areas.length === 0) return null
  const primary = areas[0]

  return (
    <div className="space-y-1">
      <Badge
        variant="outline"
        className="max-w-full truncate border-primary/30 bg-primary/10 text-primary"
      >
        {displayFocusArea(primary)}
      </Badge>
      <p className="text-[11px] leading-relaxed text-muted-foreground">
        {focusAreaSubtext(primary)}
      </p>
      {areas.length > 1 && (
        <span className="text-xs text-muted-foreground">
          +{areas.length - 1} more priority target
          {areas.length - 1 === 1 ? '' : 's'}
        </span>
      )}
    </div>
  )
}

function LibraryLoadingShell() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading practice library">
      <div className="h-36 animate-pulse rounded-xl border border-border/30 bg-secondary/20" />
      <div className="h-24 animate-pulse rounded-xl border border-border/30 bg-secondary/20" />
      <div className="h-24 animate-pulse rounded-xl border border-border/30 bg-secondary/20" />
    </div>
  )
}

export function PracticeLibrary({
  className = '',
  activeSentence,
  hasBaseline,
  studioLoading = false,
  personalizedLoading,
  personalizedSentences,
  focusAreas,
  fromProgress = false,
  activePhaseFocus = 1,
  personalizedError,
  onRefreshFreshDrills,
  onRetryPersonalized,
  onSelectLesson,
  onSelectPersonalizedSentence,
}: PracticeLibraryProps) {
  const hasPersonalizedDrills = personalizedSentences.length > 0
  const showPageShell = studioLoading && !hasPersonalizedDrills
  const phaseLabel = phaseFocusLabel(activePhaseFocus)

  return (
    <Card
      id="practice-library"
      className={`max-h-[calc(100svh-12rem)] gap-0 overflow-hidden py-0 shadow-studio lg:max-h-none ${className}`}
    >
      <CardHeader className="border-b pb-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <BookOpen className="h-5 w-5" />
          </span>
          <div>
            <CardTitle className="text-lg">Practice library</CardTitle>
            <CardDescription>Daily drill lessons</CardDescription>
          </div>
        </div>
      </CardHeader>

      <ScrollArea className="max-h-[calc(100svh-16rem)] lg:max-h-none">
        <CardContent className="flex flex-col gap-5 py-5">
          {showPageShell ? (
            <LibraryLoadingShell />
          ) : (
            <>
              <Card className="gap-0 overflow-hidden border-primary/30 bg-gradient-to-br from-primary/5 to-fuchsia-500/5 py-0 shadow-md">
                <CardContent className="border border-primary/20 bg-gradient-to-br from-background via-background to-primary/5 p-4">
                  <div className="mb-3 flex items-start gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md">
                      <Sparkles className="h-4 w-4" />
                    </span>
                    <div>
                      <h3 className="text-sm font-bold">
                        Your personalized business drills
                      </h3>
                      <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                        Elevator pitches and keynote lines tuned to your{' '}
                        <span className="font-medium text-primary">{phaseLabel}</span>{' '}
                        roadmap phase.
                      </p>
                    </div>
                  </div>

                  {hasBaseline && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={onRefreshFreshDrills}
                      disabled={personalizedLoading}
                      className="mb-3 w-full text-xs"
                    >
                      <RefreshCw
                        className={`h-3.5 w-3.5 ${personalizedLoading ? 'animate-spin' : ''}`}
                      />
                      Fresh drill set
                    </Button>
                  )}

                  {hasBaseline && focusAreas.length > 0 && (
                    <div className="mb-3 rounded-lg bg-background/90 px-3 py-2">
                      <p className="text-xs font-semibold text-primary">
                        {fromProgress ? 'Target drill area' : `${phaseLabel} phase focus`}
                      </p>
                      <FocusAreaBadges areas={focusAreas} />
                    </div>
                  )}

                  {!hasBaseline && !personalizedLoading && (
                    <p className="rounded-xl border border-dashed bg-muted/50 px-3 py-4 text-xs leading-relaxed text-muted-foreground">
                      Complete your speech pattern check-in to unlock personalized
                      drills.
                    </p>
                  )}

                  {personalizedLoading && (
                    <div className="flex items-center gap-2 rounded-xl bg-muted/50 px-3 py-4 text-xs text-primary">
                      <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
                      Building your drill sentences…
                    </div>
                  )}

                  {personalizedError && hasBaseline && !personalizedLoading && (
                    <div className="space-y-2 rounded-xl bg-destructive/10 px-3 py-3">
                      <p className="text-xs text-destructive">{personalizedError}</p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={onRetryPersonalized}
                        className="w-full text-xs"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        Try again
                      </Button>
                    </div>
                  )}

                  {hasBaseline &&
                    !personalizedLoading &&
                    personalizedSentences.length > 0 && (
                      <ul className="space-y-2">
                        {personalizedSentences.map((sentence, index) => {
                          const isActive = activeSentence === sentence

                          return (
                            <li key={`personalized-${index}`}>
                              <button
                                type="button"
                                onClick={() =>
                                  onSelectPersonalizedSentence(sentence)
                                }
                                className={`w-full rounded-xl border bg-card p-3 text-left transition-all hover:border-primary/40 hover:bg-primary/5 ${
                                  isActive
                                    ? 'ring-2 ring-primary ring-offset-1'
                                    : ''
                                }`}
                              >
                                <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-primary">
                                  For you ·{' '}
                                  {index === 0
                                    ? 'Elevator pitch'
                                    : 'Keynote / transition'}
                                </span>
                                <span className="text-sm leading-snug">
                                  {sentence}
                                </span>
                              </button>
                            </li>
                          )
                        })}
                      </ul>
                    )}
                </CardContent>
              </Card>

              {hasPersonalizedDrills ? (
                <Accordion type="single" collapsible className="rounded-xl border">
                  <AccordionItem value="extra-drills" className="border-none px-2">
                    <AccordionTrigger className="py-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground hover:no-underline">
                      Precision conditioning modules
                    </AccordionTrigger>
                    <AccordionContent className="space-y-5 pb-4">
                      {(['R', 'S'] as PhonemeFocus[]).map((focus) => (
                        <ClassicDrillCategory
                          key={focus}
                          focus={focus}
                          meta={CATEGORY_META[focus]}
                          activeSentence={activeSentence}
                          onSelectLesson={onSelectLesson}
                        />
                      ))}
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              ) : (
                <>
                  <p className="text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Precision conditioning
                  </p>
                  {(['R', 'S'] as PhonemeFocus[]).map((focus) => (
                    <ClassicDrillCategory
                      key={focus}
                      focus={focus}
                      meta={CATEGORY_META[focus]}
                      activeSentence={activeSentence}
                      onSelectLesson={onSelectLesson}
                    />
                  ))}
                </>
              )}
            </>
          )}
        </CardContent>
      </ScrollArea>
    </Card>
  )
}

function ClassicDrillCategory({
  focus,
  meta,
  activeSentence,
  onSelectLesson,
}: {
  focus: PhonemeFocus
  meta: (typeof CATEGORY_META)[PhonemeFocus]
  activeSentence: string
  onSelectLesson: (lesson: PracticeLesson) => void
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className={`text-sm font-semibold ${meta.accent}`}>{meta.title}</h3>
        <Badge variant="outline" className={meta.chip}>
          {focus}
        </Badge>
      </div>

      <ul className="space-y-2">
        {PRACTICE_LESSONS[focus].map((lesson, index) => {
          const isActive = activeSentence === lesson.sentence

          return (
            <li key={lesson.id}>
              <button
                type="button"
                onClick={() => onSelectLesson(lesson)}
                className={`w-full rounded-xl border p-3 text-left transition-all ${meta.border} ${
                  isActive ? 'ring-2 ring-primary/60 ring-offset-1' : ''
                }`}
              >
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Drill {index + 1}
                </span>
                <span className="text-sm leading-snug">{lesson.sentence}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
