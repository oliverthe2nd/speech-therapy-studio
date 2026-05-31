-- Run this entire script in Supabase SQL Editor (safe to run more than once)

-- Step 1: Add all Studio columns if missing (before any UPDATE references them)
alter table public.sessions
  add column if not exists session_mode text;

alter table public.sessions
  add column if not exists is_baseline boolean not null default false;

alter table public.sessions
  add column if not exists target_sentence text;

alter table public.sessions
  add column if not exists phoneme_focus text;

alter table public.sessions
  add column if not exists ai_feedback text;

-- Step 2: Copy legacy "mode" column into session_mode, then drop "mode"
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'sessions'
      and column_name = 'mode'
  ) then
    update public.sessions
    set session_mode = mode::text
    where session_mode is null;

    alter table public.sessions drop column mode;
  end if;
end $$;

-- Step 3: Backfill session_mode from is_baseline where still empty
update public.sessions
set session_mode = case
  when is_baseline = true then 'baseline'
  else 'practice'
end
where session_mode is null;

-- Step 4: Defaults + not null
alter table public.sessions
  alter column session_mode set default 'practice';

update public.sessions
set session_mode = 'practice'
where session_mode is null;

alter table public.sessions
  alter column session_mode set not null;

-- Step 5: Backfill ai_feedback for older baseline rows
update public.sessions
set ai_feedback = feedback
where is_baseline = true
  and ai_feedback is null;
