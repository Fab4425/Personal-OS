-- Geplante Trainingseinheiten (TrainingPeaks-ähnlich) + JSON-Import

create type public.planned_workout_status as enum (
  'planned',
  'completed',
  'partial',
  'skipped'
);

create table public.training_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  week_start date not null,
  week_end date not null,
  week_notes text,
  source_filename text,
  raw_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (user_id, week_start)
);

create table public.planned_workouts (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.training_plans (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  date date not null,
  discipline public.workout_discipline not null,
  title text not null,
  description text,
  duration_min integer,
  distance_m integer,
  target_tss numeric,
  intensity text,
  structure jsonb default '[]'::jsonb,
  sort_order integer not null default 0,
  status public.planned_workout_status not null default 'planned',
  completed_workout_id uuid references public.workouts (id) on delete set null,
  created_at timestamptz not null default now()
);

create index planned_workouts_user_date_idx
  on public.planned_workouts (user_id, date);
create index planned_workouts_plan_idx
  on public.planned_workouts (plan_id, sort_order);

alter table public.training_plans enable row level security;
alter table public.planned_workouts enable row level security;

create policy "training_plans_all"
  on public.training_plans
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "planned_workouts_all"
  on public.planned_workouts
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
