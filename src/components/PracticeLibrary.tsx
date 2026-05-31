import { BookOpen, Loader2, RefreshCw, Sparkles } from 'lucide-react'
import {
  PRACTICE_LESSONS,
  type PhonemeFocus,
  type PracticeLesson,
} from '../constants/studio'

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
    accent: 'text-rose-700',
    chip: 'bg-rose-100 text-rose-800',
    border: 'border-rose-200 hover:border-rose-300 hover:bg-rose-50/60',
  },
  S: {
    title: '"S" Sound Practice',
    accent: 'text-sky-700',
    chip: 'bg-sky-100 text-sky-800',
    border: 'border-sky-200 hover:border-sky-300 hover:bg-sky-50/60',
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
    <aside
      id="practice-library"
      className={`flex max-h-[calc(100svh-12rem)] flex-col gap-5 overflow-y-auto rounded-3xl border border-border bg-card/90 p-5 shadow-studio backdrop-blur lg:max-h-none ${className}`}
    >
      <header className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-muted text-primary">
          <BookOpen className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Practice library
          </h2>
          <p className="text-xs text-muted-foreground">Daily drill lessons</p>
        </div>
      </header>

      <section className="overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary to-[#d946ef] p-px shadow-studio">
        <div className="rounded-[15px] bg-gradient-to-br from-primary-muted via-background to-[#fdf4ff] p-4">
          <div className="mb-3 flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-[#d946ef] text-primary-foreground shadow-md">
              <Sparkles className="h-4 w-4" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-foreground">
                🎯 Your Personalized Daily Drills
              </h3>
              <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
                Brand-new sentences each visit — tuned to your weak spots from
                the Grandfather Paragraph check-in.
              </p>
            </div>
          </div>

          {hasBaseline && (
            <button
              type="button"
              onClick={onRefreshFreshDrills}
              disabled={personalizedLoading}
              className="mb-3 flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold text-primary shadow-sm transition-colors hover:bg-primary-muted disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${personalizedLoading ? 'animate-spin' : ''}`}
              />
              Fresh drill set
            </button>
          )}

          {hasBaseline && personalizedFocusAreas.length > 0 && (
            <p className="mb-3 rounded-lg bg-card/90 px-3 py-2 text-[11px] leading-snug text-primary">
              <span className="font-semibold">Today&apos;s focus: </span>
              {personalizedFocusAreas.join(' · ')}
            </p>
          )}

          {!hasBaseline && !personalizedLoading && (
            <p className="rounded-xl border border-dashed border-border bg-card/80 px-3 py-4 text-xs leading-relaxed text-muted-foreground">
              Complete your speech pattern check-in at the top of the screen to
              unlock your personalized training drills!
            </p>
          )}

          {personalizedLoading && (
            <div className="flex items-center gap-2 rounded-xl bg-card/80 px-3 py-4 text-xs text-primary">
              <Loader2 className="h-4 w-4 animate-spin shrink-0" />
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
                        onClick={() => onSelectPersonalizedSentence(sentence)}
                        className={`w-full rounded-xl border border-border bg-card p-3 text-left transition-all duration-200 hover:border-primary/40 hover:bg-primary-muted/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${
                          isActive
                            ? 'ring-2 ring-primary ring-offset-1'
                            : ''
                        }`}
                      >
                        <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-primary">
                          For you · Drill {index + 1}
                        </span>
                        <span className="text-sm leading-snug text-foreground">
                          {sentence}
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
        </div>
      </section>

      {hasPersonalizedDrills ? (
        <details className="group rounded-xl border border-border bg-muted/80">
          <summary className="cursor-pointer list-none px-4 py-3 text-center text-[10px] font-semibold uppercase tracking-widest text-muted-foreground marker:content-none [&::-webkit-details-marker]:hidden">
            Optional extra drills ▾
          </summary>
          <div className="space-y-5 border-t border-border px-1 pb-3 pt-4">
            {(['R', 'S'] as PhonemeFocus[]).map((focus) => (
              <ClassicDrillCategory
                key={focus}
                focus={focus}
                meta={CATEGORY_META[focus]}
                activeSentence={activeSentence}
                onSelectLesson={onSelectLesson}
              />
            ))}
          </div>
        </details>
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
    </aside>
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
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${meta.chip}`}
        >
          {focus}
        </span>
      </div>

      <ul className="space-y-2">
        {PRACTICE_LESSONS[focus].map((lesson, index) => {
          const isActive = activeSentence === lesson.sentence

          return (
            <li key={lesson.id}>
              <button
                type="button"
                onClick={() => onSelectLesson(lesson)}
                className={`w-full rounded-xl border p-3 text-left transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${meta.border} ${
                  isActive ? 'ring-2 ring-primary/60 ring-offset-1' : ''
                }`}
              >
                <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Drill {index + 1}
                </span>
                <span className="text-sm leading-snug text-foreground">
                  {lesson.sentence}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
