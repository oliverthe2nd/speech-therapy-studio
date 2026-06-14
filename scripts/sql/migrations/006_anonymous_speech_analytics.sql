-- Anonymous B2B research store — structurally decoupled from auth and user-facing sessions.
--
-- Design guarantees:
--   • NO user_id, NO profile FK, NO FK to public.sessions
--   • NO transcript, NO coach feedback markdown, NO target sentence text
--   • Structured metrics + derived numerics only (safe for aggregation/export)
--
-- User-facing PII and history remain in public.sessions (and future session_ownership).
-- B2B queries should use public.anonymous_speech_metrics only.

create table if not exists public.speech_analytics (
  id uuid primary key default gen_random_uuid(),
  recorded_at timestamptz not null default now(),

  -- Session context (non-identifying)
  session_mode text not null
    check (session_mode in ('baseline', 'practice')),
  phoneme_focus text
    check (phoneme_focus is null or phoneme_focus in ('R', 'S')),
  scenario_category text
    check (
      scenario_category is null
      or scenario_category in (
        'executive',
        'warmup',
        'clinical',
        'personalized',
        'check-in'
      )
    ),

  -- Structured scoring payloads (JSON arrays/objects — no free-text coach notes)
  executive_metrics jsonb not null default '[]'::jsonb,
  clinical_metrics jsonb not null default '[]'::jsonb,
  professional_metrics jsonb,

  -- Pre-computed aggregates for fast B2B rollups
  executive_score_avg numeric(5, 2),
  clinical_score_avg numeric(5, 2),
  pace_wpm numeric(6, 1),
  filler_word_count integer,

  -- Duration / length signals (no raw speech content)
  recording_duration_ms integer,
  transcript_word_count integer,
  target_sentence_word_count integer,

  -- Non-reversible dedup fingerprint (sha256 of metrics + counts — NOT linkable to users)
  content_fingerprint text
);

create index if not exists speech_analytics_recorded_at_idx
  on public.speech_analytics (recorded_at desc);

create index if not exists speech_analytics_session_mode_idx
  on public.speech_analytics (session_mode);

create index if not exists speech_analytics_scenario_category_idx
  on public.speech_analytics (scenario_category);

comment on table public.speech_analytics is
  'Append-only anonymous speech performance facts for B2B research. '
  'No user identifiers, no session FK, no transcript. '
  'Query via anonymous_speech_metrics view or this table with service_role.';

comment on table public.sessions is
  'User-facing session history (transcript + coach feedback). '
  'May gain auth linkage in future via a separate ownership table. '
  'NOT the source of truth for anonymous B2B research — use speech_analytics.';

-- B2B-safe projection: explicit column list, no join required
create or replace view public.anonymous_speech_metrics as
select
  id,
  recorded_at,
  session_mode,
  phoneme_focus,
  scenario_category,
  executive_metrics,
  clinical_metrics,
  professional_metrics,
  executive_score_avg,
  clinical_score_avg,
  pace_wpm,
  filler_word_count,
  recording_duration_ms,
  transcript_word_count,
  target_sentence_word_count
from public.speech_analytics;

-- phonetic_events + view refresh: run 007_phonetic_events_and_research_view.sql

comment on view public.anonymous_speech_metrics is
  'B2B research view — pure anonymous performance metrics with zero user account columns.';

alter table public.speech_analytics enable row level security;

-- Clients may append anonymous facts; they must never read the research corpus back
create policy "Allow anon insert for speech_analytics"
  on public.speech_analytics
  for insert
  to anon
  with check (true);

-- Service role (Edge Functions, batch ETL) has full access for exports
create policy "Service role full access on speech_analytics"
  on public.speech_analytics
  for all
  to service_role
  using (true)
  with check (true);

-- Future auth pattern (comment-only scaffold — enable when Neon Auth RLS policies are finalized):
--
--   create table public.session_ownership (
--     session_id uuid primary key references public.sessions(id) on delete cascade,
--     user_id uuid not null references auth.users(id) on delete cascade,
--     created_at timestamptz not null default now()
--   );
--
--   Never add user_id or session_id to speech_analytics.
--   Never join speech_analytics → sessions → session_ownership in B2B pipelines.
