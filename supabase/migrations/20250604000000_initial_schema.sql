-- Personal OS — Initial Schema
-- Run in Supabase SQL Editor or via: supabase db push

-- Profiles (extends auth.users)
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

-- Connected OAuth accounts (Garmin, Strava, Google Calendar)
create type public.oauth_provider as enum ('garmin', 'strava', 'google');

create table public.connected_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  provider public.oauth_provider not null,
  access_token text,
  refresh_token text,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, provider)
);

create type public.workout_source as enum ('garmin', 'strava', 'manual');
create type public.workout_discipline as enum ('swim', 'bike', 'run', 'gym', 'race');

create table public.workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  source public.workout_source not null,
  discipline public.workout_discipline not null,
  date date not null,
  duration_sec integer,
  distance_m integer,
  avg_hr integer,
  max_hr integer,
  calories integer,
  tss numeric,
  normalized_power numeric,
  avg_pace numeric,
  hrv numeric,
  raw_data jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index workouts_user_date_idx on public.workouts (user_id, date desc);

create table public.daily_health (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  date date not null,
  resting_hr integer,
  hrv_score numeric,
  sleep_hours numeric,
  sleep_quality smallint check (sleep_quality between 1 and 5),
  body_battery integer,
  steps integer,
  stress_score integer,
  created_at timestamptz not null default now(),
  unique (user_id, date)
);

create table public.readiness_scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  date date not null,
  overall_score smallint check (overall_score between 0 and 100),
  swim_score smallint,
  bike_score smallint,
  run_score smallint,
  fatigue_score smallint,
  sleep_score smallint,
  hrv_score smallint,
  recommendation text,
  created_at timestamptz not null default now(),
  unique (user_id, date)
);

create table public.weekly_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  week_start date not null,
  total_swim_km numeric default 0,
  total_bike_km numeric default 0,
  total_run_km numeric default 0,
  total_training_hours numeric default 0,
  avg_readiness numeric,
  ai_summary text,
  ai_tips text,
  goals_met boolean[] default '{}',
  created_at timestamptz not null default now(),
  unique (user_id, week_start)
);

create type public.calendar_event_type as enum (
  'training',
  'academic',
  'personal',
  'project'
);

create table public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  google_event_id text,
  title text not null,
  description text,
  start_at timestamptz not null,
  end_at timestamptz not null,
  type public.calendar_event_type not null default 'personal',
  synced_at timestamptz,
  local_changes jsonb default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create type public.dev_project_status as enum ('idea', 'active', 'paused', 'done');

create table public.dev_projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  description text,
  status public.dev_project_status not null default 'idea',
  stack text[] default '{}',
  progress_percent smallint default 0 check (progress_percent between 0 and 100),
  github_url text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create type public.academic_record_type as enum ('exam', 'assignment', 'course');

create table public.academic_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  subject text not null,
  type public.academic_record_type not null,
  grade numeric,
  max_grade numeric default 100,
  date date,
  notes text,
  semester text,
  institution text,
  created_at timestamptz not null default now()
);

create table public.daily_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  date date not null,
  time_blocks jsonb default '[]'::jsonb,
  top_3_goals text[] default '{}',
  notes text,
  mood_score smallint check (mood_score between 1 and 5),
  created_at timestamptz not null default now(),
  unique (user_id, date)
);

create type public.habit_frequency as enum ('daily', 'weekly');

create table public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  icon text,
  frequency public.habit_frequency not null default 'daily',
  target_count integer default 1,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.habit_logs (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid not null references public.habits (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  date date not null,
  completed boolean not null default false,
  unique (habit_id, date)
);

create type public.ai_chat_role as enum ('user', 'assistant');

create table public.ai_chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  role public.ai_chat_role not null,
  content text not null,
  context_snapshot jsonb,
  created_at timestamptz not null default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email, name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- RLS
alter table public.profiles enable row level security;
alter table public.connected_accounts enable row level security;
alter table public.workouts enable row level security;
alter table public.daily_health enable row level security;
alter table public.readiness_scores enable row level security;
alter table public.weekly_reviews enable row level security;
alter table public.calendar_events enable row level security;
alter table public.dev_projects enable row level security;
alter table public.academic_records enable row level security;
alter table public.daily_plans enable row level security;
alter table public.habits enable row level security;
alter table public.habit_logs enable row level security;
alter table public.ai_chat_messages enable row level security;

-- Profiles policies
create policy "Users can view own profile"
  on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- Generic user-owned tables
create policy "connected_accounts_select" on public.connected_accounts for select using (auth.uid() = user_id);
create policy "connected_accounts_insert" on public.connected_accounts for insert with check (auth.uid() = user_id);
create policy "connected_accounts_update" on public.connected_accounts for update using (auth.uid() = user_id);
create policy "connected_accounts_delete" on public.connected_accounts for delete using (auth.uid() = user_id);

create policy "workouts_all" on public.workouts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "daily_health_all" on public.daily_health for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "readiness_scores_all" on public.readiness_scores for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "weekly_reviews_all" on public.weekly_reviews for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "calendar_events_all" on public.calendar_events for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "dev_projects_all" on public.dev_projects for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "academic_records_all" on public.academic_records for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "daily_plans_all" on public.daily_plans for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "habits_all" on public.habits for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "habit_logs_all" on public.habit_logs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "ai_chat_messages_all" on public.ai_chat_messages for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
