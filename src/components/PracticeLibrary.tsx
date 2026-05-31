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

type PracticeLibraryProps = {
  className?: string
  activeSentence: string
  hasBaseline: boolean
  personalizedLoading: boolean
  personalizedSentences: string[]
  personalizedFocusAreas: string[]
  personalizedError: string | null
  onRefreshFreshDrills: () => void
  onSelectLesson: (lesson: PracticeLesson) => void
  onSelectPersonalizedSentence: (sentence: string) => void
}

const CATEGORY_META: Record<
  PhonemeFocus,
  { title: string; accent: string; chip: string; border: string }
> = {
  R: {
    title: '"R" Sound Practice',
    accent: 'text-chart-4',
    chip: 'bg-chart-4/15 text-chart-4 border border-chart-4/25',
    border:
      'border-chart-4/25 hover:border-chart-4/40 hover:bg-chart-4/5',
  },
  S: {
    title: '"S" Sound Practice',
    accent: 'text-info',
    chip: 'bg-info/15 text-info border border-info/25',
    border: 'border-info/25 hover:border-info/40 hover:bg-info/5',
  },
}

export function PracticeLibrary({
  className = '',
  activeSentence,
  hasBaseline,
  personalizedLoading,
  personalizedSentences,
  personalizedFocusAreas,
  personalizedError,
  onRefreshFreshDrills,
  onSelectLesson,
  onSelectPersonalizedSentence,
}: PracticeLibraryProps) {
  const hasPersonalizedDrills = personalizedSentences.length > 0

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
          <Card className="gap-0 overflow-hidden border-primary/30 bg-gradient-to-br from-primary/5 to-fuchsia-500/5 py-0 shadow-md">
            <CardContent className="border border-primary/20 bg-gradient-to-br from-background via-background to-primary/5 p-4">
              <div className="mb-3 flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md">
                  <Sparkles className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="text-sm font-bold">
                    🎯 Your Personalized Daily Drills
                  </h3>
                  <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
                    Brand-new sentences each visit — tuned to your weak spots
                    from the Grandfather Paragraph check-in.
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

              {hasBaseline && personalizedFocusAreas.length > 0 && (
                <p className="mb-3 rounded-lg bg-background/90 px-3 py-2 text-[11px] leading-snug text-primary">
                  <span className="font-semibold">Today&apos;s focus: </span>
                  {personalizedFocusAreas.join(' · ')}
                </p>
              )}

              {!hasBaseline && !personalizedLoading && (
                <p className="rounded-xl border border-dashed bg-muted/50 px-3 py-4 text-xs leading-relaxed text-muted-foreground">
                  Complete your speech pattern check-in at the top of the screen
                  to unlock your personalized training drills!
                </p>
              )}

              {personalizedLoading && (
                <div className="flex items-center gap-2 rounded-xl bg-muted/50 px-3 py-4 text-xs text-primary">
                  <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
                  Cooking up brand-new drill sentences…
                </div>
              )}

              {personalizedError && hasBaseline && !personalizedLoading && (
                <p className="rounded-xl bg-destructive/10 px-3 py-3 text-xs text-destructive">
                  {personalizedError}
                </p>
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
                              isActive ? 'ring-2 ring-primary ring-offset-1' : ''
                            }`}
                          >
                            <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-primary">
                              For you · Drill {index + 1}
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
                <AccordionTrigger className="py-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground hover:no-underline">
                  Optional extra drills
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
              <p className="text-center text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                General drills
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
                <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
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
