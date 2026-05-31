-- Extends sessions for Speech Therapy Studio modes
alter table public.sessions
  add column if not exists session_mode text not null default 'practice'
    check (session_mode in ('baseline', 'practice'));

alter table public.sessions
  add column if not exists target_sentence text;

alter table public.sessions
  add column if not exists phoneme_focus text
    check (phoneme_focus is null or phoneme_focus in ('R', 'S'));
