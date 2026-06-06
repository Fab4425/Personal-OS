-- KRITISCH für Garmin-Sync: Deduplizierung über activityId
-- Supabase Dashboard → SQL → Run

alter table public.workouts
  add column if not exists external_id text;

create unique index if not exists workouts_user_source_external_uidx
  on public.workouts (user_id, source, external_id)
  where external_id is not null;

alter table public.connected_accounts
  add column if not exists last_sync_at timestamptz,
  add column if not exists metadata jsonb not null default '{}'::jsonb;
