-- Einmal in Supabase ausführen: Dashboard → SQL → New query → Run
-- 1) Beliebige Kombi-Disziplinen in geplanten Workouts (swim+run, swim+bike+gym, …)
-- 2) Optional: Enum-Werte für abgeschlossene Garmin-Workouts

alter table public.planned_workouts
  alter column discipline type text using discipline::text;

do $$
begin
  alter table public.planned_workouts
    add constraint planned_workouts_discipline_format
    check (
      discipline ~ '^[a-z][a-z0-9_]*$'
      and length(discipline) <= 64
    );
exception
  when duplicate_object then null;
end $$;

alter type public.workout_discipline add value if not exists 'brick';
alter type public.workout_discipline add value if not exists 'rest';
alter type public.workout_discipline add value if not exists 'run_gym';
alter type public.workout_discipline add value if not exists 'swim_gym';
alter type public.workout_discipline add value if not exists 'bike_gym';
