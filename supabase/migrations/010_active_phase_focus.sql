-- Active roadmap phase focus (1 = Foundation, 2 = Precision, 3 = Executive Presence)

alter table public.executive_dossier
  add column if not exists active_phase_focus smallint not null default 1
    check (active_phase_focus between 1 and 3);
