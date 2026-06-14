-- Executive dossier profile + baseline step tracking for conversational onboarding

alter table public.sessions
  add column if not exists baseline_step smallint check (baseline_step between 1 and 3);

create index if not exists sessions_baseline_step_idx
  on public.sessions (baseline_step, created_at desc)
  where baseline_step is not null;

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
  baseline_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.executive_dossier enable row level security;

create policy "Allow anonymous insert for executive_dossier"
  on public.executive_dossier
  for insert
  to anon
  with check (true);

create policy "Allow anonymous update for executive_dossier"
  on public.executive_dossier
  for update
  to anon
  using (true)
  with check (true);

create policy "Allow anonymous read for executive_dossier"
  on public.executive_dossier
  for select
  to anon
  using (true);
