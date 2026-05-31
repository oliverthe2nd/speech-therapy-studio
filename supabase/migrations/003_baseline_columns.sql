-- Baseline profile columns for personalized drill generation
alter table public.sessions
  add column if not exists is_baseline boolean not null default false;

alter table public.sessions
  add column if not exists ai_feedback text;

-- Backfill existing baseline sessions
update public.sessions
set
  is_baseline = true,
  ai_feedback = feedback
where session_mode = 'baseline'
  and (is_baseline = false or ai_feedback is null);
