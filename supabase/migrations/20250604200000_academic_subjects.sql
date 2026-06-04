-- Fächer mit mündlicher/schriftlicher Note + Schnitt-Verlauf

create table public.academic_subjects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  sort_order int not null default 0,
  oral_grade numeric(4, 2) check (
    oral_grade is null
    or (oral_grade >= 1 and oral_grade <= 6)
  ),
  written_grade numeric(4, 2) check (
    written_grade is null
    or (written_grade >= 1 and written_grade <= 6)
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, name)
);

create table public.academic_grade_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  date date not null default current_date,
  average_grade numeric(4, 2) not null,
  subjects_count int not null default 0,
  created_at timestamptz not null default now(),
  unique (user_id, date)
);

alter table public.academic_subjects enable row level security;
alter table public.academic_grade_history enable row level security;

create policy "academic_subjects_all"
  on public.academic_subjects
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "academic_grade_history_all"
  on public.academic_grade_history
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index academic_subjects_user_idx on public.academic_subjects (user_id, sort_order);
create index academic_grade_history_user_date_idx
  on public.academic_grade_history (user_id, date);
