-- Run in Neon SQL editor or via npm run migrate
create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  transcript text not null,
  feedback text not null,
  created_at timestamptz not null default now()
);

alter table public.sessions enable row level security;

create policy "Allow anonymous insert for sessions"
  on public.sessions
  for insert
  to anon
  with check (true);

create policy "Allow anonymous read for sessions"
  on public.sessions
  for select
  to anon
  using (true);
