-- SpeakFlow / Speech Therapy Studio — consolidated Neon schema
-- Run once in Neon SQL Editor (or: psql "$DATABASE_URL" -f migration.sql)
--
-- Prerequisites:
--   • Neon Auth enabled (creates neon_auth schema automatically)
--   • Neon Data API enabled with JWT auth integration

-- ---------------------------------------------------------------------------
-- Sessions — user-facing speech history
-- ---------------------------------------------------------------------------

create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  session_mode text not null default 'practice'
    check (session_mode in ('baseline', 'practice')),
  is_baseline boolean not null default false,
  baseline_step smallint check (baseline_step between 1 and 3),
  target_sentence text,
  phoneme_focus text check (phoneme_focus is null or phoneme_focus in ('R', 'S')),
  transcript text not null,
  feedback text not null,
  ai_feedback text,
  created_at timestamptz not null default now()
);

create index if not exists sessions_created_at_idx
  on public.sessions (created_at desc);

create index if not exists sessions_baseline_step_idx
  on public.sessions (baseline_step, created_at desc)
  where baseline_step is not null;

comment on table public.sessions is
  'User-facing session history (transcript + coach feedback).';

-- ---------------------------------------------------------------------------
-- Executive dossier — onboarding profile + growth roadmap
-- ---------------------------------------------------------------------------

create table if not exists public.executive_dossier (
  id uuid primary key default gen_random_uuid(),
  client_key text not null unique,
  name text,
  title text,
  industry text,
  professional_focus text,
  audience_context text,
  strengths jsonb not null default '[]'::jsonb,
  blindspots jsonb not null default '[]'::jsonb,
  growth_phases jsonb not null default '[]'::jsonb,
  active_phase_focus smallint not null default 1
    check (active_phase_focus between 1 and 3),
  baseline_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.executive_dossier is
  'Executive onboarding profile keyed by browser client_key.';

-- ---------------------------------------------------------------------------
-- Personalized drill cache
-- ---------------------------------------------------------------------------

create table if not exists public.personalized_drill_cache (
  id uuid primary key default gen_random_uuid(),
  baseline_session_id uuid not null references public.sessions (id) on delete cascade,
  sentences jsonb not null default '[]'::jsonb,
  focus_areas jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists personalized_drill_cache_baseline_idx
  on public.personalized_drill_cache (baseline_session_id);

comment on table public.personalized_drill_cache is
  'Cached personalized business drill sentences keyed to the latest baseline check-in.';

-- ---------------------------------------------------------------------------
-- Anonymous B2B research store (no user identifiers, no session FK)
-- ---------------------------------------------------------------------------

create table if not exists public.speech_analytics (
  id uuid primary key default gen_random_uuid(),
  recorded_at timestamptz not null default now(),
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
  executive_metrics jsonb not null default '[]'::jsonb,
  clinical_metrics jsonb not null default '[]'::jsonb,
  professional_metrics jsonb,
  phonetic_events jsonb not null default '[]'::jsonb,
  executive_score_avg numeric(5, 2),
  clinical_score_avg numeric(5, 2),
  pace_wpm numeric(6, 1),
  filler_word_count integer,
  recording_duration_ms integer,
  transcript_word_count integer,
  target_sentence_word_count integer,
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
  'No user identifiers, no session FK, no transcript.';

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
  phonetic_events,
  executive_score_avg,
  clinical_score_avg,
  pace_wpm,
  filler_word_count,
  recording_duration_ms,
  transcript_word_count,
  target_sentence_word_count
from public.speech_analytics;

comment on view public.anonymous_speech_metrics is
  'B2B research export surface — anonymous performance + phonetic token pairs.';

-- ---------------------------------------------------------------------------
-- Row Level Security (Neon Auth JWT → authenticated role)
-- ---------------------------------------------------------------------------

alter table public.sessions enable row level security;
alter table public.executive_dossier enable row level security;
alter table public.personalized_drill_cache enable row level security;
alter table public.speech_analytics enable row level security;

-- Authenticated app users can read/write their studio data
drop policy if exists "Authenticated users manage sessions" on public.sessions;
create policy "Authenticated users manage sessions"
  on public.sessions
  for all
  to authenticated
  using (true)
  with check (true);

drop policy if exists "Authenticated users manage executive_dossier" on public.executive_dossier;
create policy "Authenticated users manage executive_dossier"
  on public.executive_dossier
  for all
  to authenticated
  using (true)
  with check (true);

drop policy if exists "Authenticated users manage personalized_drill_cache" on public.personalized_drill_cache;
create policy "Authenticated users manage personalized_drill_cache"
  on public.personalized_drill_cache
  for all
  to authenticated
  using (true)
  with check (true);

-- Clients append anonymous research facts; reads reserved for service exports
drop policy if exists "Authenticated insert speech_analytics" on public.speech_analytics;
create policy "Authenticated insert speech_analytics"
  on public.speech_analytics
  for insert
  to authenticated
  with check (true);

-- Grant Data API access (Neon sets up authenticated role via JWT)
grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant select on public.anonymous_speech_metrics to authenticated;
grant usage, select on all sequences in schema public to authenticated;
