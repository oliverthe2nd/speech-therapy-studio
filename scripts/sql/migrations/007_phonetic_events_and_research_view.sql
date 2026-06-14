-- B2B research hardening: token-level phonetics + refreshed anonymous projection.
-- Safe to re-run (idempotent column add + view replace).

alter table public.speech_analytics
  add column if not exists phonetic_events jsonb not null default '[]'::jsonb;

comment on column public.speech_analytics.phonetic_events is
  'De-identified phonetic tokens only: JSON array of {expected, heard} word pairs. '
  'No session FK, no transcript, no user identifiers. '
  'professional_metrics in this table must omit filler detected[] and clarity summary (app-enforced).';

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
  'B2B research export surface — anonymous performance + phonetic token pairs. '
  'Never join to public.sessions or auth tables. Query with service_role only.';
