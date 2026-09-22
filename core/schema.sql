-- Brain Navigator — Phase 2.2 schema
-- Run this once in the Supabase SQL Editor.

create extension if not exists "pgcrypto";

create table if not exists entities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  relationship text,
  created_at timestamptz not null default now()
);

create table if not exists cognitive_state (
  id uuid primary key default gen_random_uuid(),
  state text not null check (state in ('secured', 'shelved', 'unlocked')),
  mood text,
  intensity smallint check (intensity between 1 and 10),
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists catalysts (
  id uuid primary key default gen_random_uuid(),
  cognitive_state_id uuid references cognitive_state(id) on delete cascade,
  entity_id uuid references entities(id) on delete set null,
  description text not null,
  created_at timestamptz not null default now()
);

create table if not exists resolutions (
  id uuid primary key default gen_random_uuid(),
  cognitive_state_id uuid references cognitive_state(id) on delete cascade,
  description text not null,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

alter table entities enable row level security;
alter table cognitive_state enable row level security;
alter table catalysts enable row level security;
alter table resolutions enable row level security;

-- Single-user MVP: anon key has full access to its own project.
-- Revisit with real auth (Supabase Auth) before this ever syncs
-- across devices you don't fully control.
create policy "anon full access" on entities for all using (true) with check (true);
create policy "anon full access" on cognitive_state for all using (true) with check (true);
create policy "anon full access" on catalysts for all using (true) with check (true);
create policy "anon full access" on resolutions for all using (true) with check (true);

-- Phase 5.5 — Personal Trove Drawer
alter table cognitive_state add column if not exists in_trove boolean not null default false;

-- Phase 7.1 — Daily Check-in (Wellness Expansion)
create table if not exists daily_checkins (
  id uuid primary key default gen_random_uuid(),
  checkin_date date not null unique,
  mood smallint check (mood between 1 and 5),
  sleep_hours numeric(3,1) check (sleep_hours between 0 and 24),
  sleep_quality smallint check (sleep_quality between 1 and 5),
  stress_level smallint check (stress_level between 1 and 10),
  notes text,
  created_at timestamptz not null default now()
);

alter table daily_checkins enable row level security;
create policy "anon full access" on daily_checkins for all using (true) with check (true);

-- Phase 7.3 — Habits (Wellness Expansion)
create table if not exists habits (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  frequency text not null default 'daily' check (frequency in ('daily', 'weekly')),
  target_per_week smallint,
  archived boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists habit_logs (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid not null references habits(id) on delete cascade,
  log_date date not null,
  created_at timestamptz not null default now(),
  unique (habit_id, log_date)
);

alter table habits enable row level security;
alter table habit_logs enable row level security;
create policy "anon full access" on habits for all using (true) with check (true);
create policy "anon full access" on habit_logs for all using (true) with check (true);

-- Phase 8 — Tasks & Plate Meter (Wellness Expansion continued)
create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null check (category in (
    'emotional', 'environmental', 'financial', 'intellectual',
    'occupational', 'physical', 'social', 'spiritual'
  )),
  planned_date date not null,
  completed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

-- Singleton row (id is always `true`) holding the user's self-set daily task cap.
create table if not exists plate_settings (
  id boolean primary key default true,
  daily_cap smallint not null default 6,
  updated_at timestamptz not null default now(),
  constraint plate_settings_singleton check (id)
);

alter table tasks enable row level security;
alter table plate_settings enable row level security;
create policy "anon full access" on tasks for all using (true) with check (true);
create policy "anon full access" on plate_settings for all using (true) with check (true);

-- Phase 11 — Notion push sync
-- Tracks the corresponding Notion page per row so pushes update in place
-- instead of creating a duplicate page every time.
alter table tasks add column if not exists notion_page_id text;
alter table daily_checkins add column if not exists notion_page_id text;
alter table cognitive_state add column if not exists notion_page_id text;

-- Phase 12 — Eight Dimensions of Wellness
-- Tasks' category constraint above is already the 8-dimension taxonomy.
-- Habits get the same taxonomy so both feed the Wellness Wheel's scoring.
alter table habits add column if not exists category text;
alter table habits add constraint habits_category_check check (category in (
  'emotional', 'environmental', 'financial', 'intellectual',
  'occupational', 'physical', 'social', 'spiritual'
));
alter table habits alter column category set not null;

-- Phase 13 — Nutrition & Macro Tracking
create table if not exists food_logs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  calories numeric(6,1) not null default 0,
  protein_g numeric(6,1) not null default 0,
  carbs_g numeric(6,1) not null default 0,
  fat_g numeric(6,1) not null default 0,
  logged_date date not null default current_date,
  created_at timestamptz not null default now()
);

create table if not exists macro_goals (
  id boolean primary key default true,
  calories numeric(6,1) not null default 2000,
  protein_g numeric(6,1) not null default 150,
  carbs_g numeric(6,1) not null default 200,
  fat_g numeric(6,1) not null default 65,
  updated_at timestamptz not null default now(),
  constraint macro_goals_singleton check (id)
);

alter table food_logs enable row level security;
alter table macro_goals enable row level security;
create policy "anon full access" on food_logs for all using (true) with check (true);
create policy "anon full access" on macro_goals for all using (true) with check (true);

-- Phase 14 — Parkinson's Law time-boxing
-- "Work expands to fill the time available for its completion." An optional
-- minute budget per task, surfaced as a live countdown on the task row.
alter table tasks add column if not exists time_budget_minutes smallint;

-- Phase 15 — Snapshot images on entries + a soft ambient-audio cue for
-- 'unlocked' (high-stress) entries. Storage policies target `anon`, not
-- `authenticated` — this app never creates a Supabase Auth session; every
-- request, including uploads, goes through the anon key directly, same as
-- every other table's "anon full access" policy above.
alter table cognitive_state add column if not exists image_url text;

insert into storage.buckets (id, name, public)
values ('snapshot-images', 'snapshot-images', true)
on conflict (id) do nothing;

create policy "anon insert snapshot images" on storage.objects for insert
to anon with check (bucket_id = 'snapshot-images');

create policy "anon read snapshot images" on storage.objects for select
to anon using (bucket_id = 'snapshot-images');

create policy "anon delete snapshot images" on storage.objects for delete
to anon using (bucket_id = 'snapshot-images');

-- Phase 16 — Ambient noise checks on the Health screen's Sleep Quality card.
-- A manual, on-demand mic-level check (not background/overnight monitoring —
-- this app has no such capability), logged so past checks are visible next
-- to the sleep data they were taken alongside. No user_id/auth.users FK and
-- no per-user RLS — this app has no Supabase Auth session, ever; same wide-
-- open anon policy as every other table above.
create table if not exists sleep_ambient_checks (
  id uuid primary key default gen_random_uuid(),
  sleep_score smallint,
  peak_level numeric(5,2),
  average_level numeric(5,2),
  duration_seconds smallint,
  created_at timestamptz not null default now()
);

alter table sleep_ambient_checks enable row level security;
create policy "anon full access" on sleep_ambient_checks for all using (true) with check (true);

-- Phase 17 — Realtime on the Topography graph (entities + catalysts).
-- Realtime publication is separate from RLS: a table can be fully anon-
-- readable and still emit zero postgres_changes events until it's added
-- here. `alter publication ... add table` errors on a table that's already
-- a member, so this guards each add to stay safe to re-run.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'entities'
  ) then
    alter publication supabase_realtime add table entities;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'catalysts'
  ) then
    alter publication supabase_realtime add table catalysts;
  end if;
end $$;
