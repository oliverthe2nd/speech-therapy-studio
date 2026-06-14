-- Cached AI-generated executive drill sentences (avoids repeat Claude calls on every page load)
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

alter table public.personalized_drill_cache enable row level security;

create policy "Allow anonymous read personalized_drill_cache"
  on public.personalized_drill_cache for select using (true);

create policy "Allow anonymous insert personalized_drill_cache"
  on public.personalized_drill_cache for insert with check (true);

create policy "Allow anonymous update personalized_drill_cache"
  on public.personalized_drill_cache for update using (true) with check (true);
