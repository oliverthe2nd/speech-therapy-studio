-- "mode" is a reserved ordered-set aggregate in PostgreSQL; rename to avoid query errors.
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'sessions'
      and column_name = 'mode'
  ) then
    alter table public.sessions rename column mode to session_mode;
  end if;
end $$;
