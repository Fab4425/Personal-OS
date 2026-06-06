-- Beliebige Kombi-Disziplinen (swim+run, swim+bike+gym, …) ohne Enum-Erweiterung
alter table public.planned_workouts
  alter column discipline type text using discipline::text;

alter table public.planned_workouts
  add constraint planned_workouts_discipline_format
  check (
    discipline ~ '^[a-z][a-z0-9_]*$'
    and length(discipline) <= 64
  );
