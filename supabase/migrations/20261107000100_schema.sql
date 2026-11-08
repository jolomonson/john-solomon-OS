-- 24 @ 24 — Personal OS for John Solomon
-- Migration 1: tables, constraints, indexes, updated_at triggers.
--
-- Conventions (every table):
--   user_id    uuid not null default auth.uid() references auth.users on delete cascade
--   created_at timestamptz not null default now()
--   updated_at timestamptz not null default now()   (maintained by trigger)
-- Dates that represent a calendar day are `date`, interpreted in settings.timezone.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Shared trigger: updated_at
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- SETTINGS (one row per user)
-- ---------------------------------------------------------------------------
create table public.settings (
  user_id uuid primary key default auth.uid() references auth.users on delete cascade,
  owner_name text default 'John Solomon',
  start_date date not null default '2026-10-16',
  end_date date not null default '2027-10-16',
  timezone text not null default 'Africa/Lagos',
  fx_ngn_per_usd numeric not null default 1450 check (fx_ngn_per_usd > 0),
  stretch_target_usd numeric default 24000000,
  base_target_usd numeric,
  countries_target int default 24,
  connections_target int default 100,
  max_active_assets int not null default 5 check (max_active_assets between 1 and 50),
  week_starts_on int not null default 0 check (week_starts_on between 0 and 6), -- 0 = Sunday (review day)
  seeded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint settings_dates_ck check (end_date > start_date)
);

-- ---------------------------------------------------------------------------
-- OPTION SETS (user-editable dropdowns)
-- ---------------------------------------------------------------------------
create table public.option_sets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  set_key text not null,   -- goal_category, asset_type, stage, capital_engine, task_status, contact_category, ...
  value text not null,
  label text not null,
  color text,              -- tailwind colour name or hex
  sort int not null default 0,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, set_key, value)
);
create index option_sets_user_key_idx on public.option_sets (user_id, set_key, sort);

-- ---------------------------------------------------------------------------
-- GOALS
-- ---------------------------------------------------------------------------
create table public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  number int not null check (number between 1 and 99),
  title text not null,
  category text not null,  -- option_sets 'goal_category'
  outcome_2027 text,
  kpi_name text,
  kpi_unit text,
  baseline numeric,
  current numeric,
  target numeric,
  target_note text,
  status text not null default 'not_started'
    check (status in ('not_started','in_progress','done','dropped')),
  q_focus text[] not null default '{}',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, number),
  constraint goals_q_focus_ck check (q_focus <@ array['Q1','Q2','Q3','Q4']::text[])
);

-- ---------------------------------------------------------------------------
-- ASSETS (the portfolio)
-- The quarterly "one thing" is NOT stored here: it lives in quarterly_objectives.
-- ---------------------------------------------------------------------------
create table public.assets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  name text not null,
  parent_id uuid references public.assets(id) on delete set null,
  type text not null,      -- option_sets 'asset_type'
  ownership text not null check (ownership in ('personal','partnership','work')),
  role text,
  sector text,
  url text,
  stage text,              -- option_sets 'stage'
  attention text not null default 'maintenance'
    check (attention in ('active','maintenance','parked','partnership','work','killed')),
  priority int,
  objective_2027 text,
  monthly_expenses_ngn numeric,
  cash_available_ngn numeric,
  notes text,
  custom jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, name),
  constraint assets_not_own_parent_ck check (parent_id is null or parent_id <> id)
);
create index assets_user_attention_idx on public.assets (user_id, attention);
create index assets_parent_idx on public.assets (parent_id);

create table public.goal_assets (
  goal_id uuid not null references public.goals on delete cascade,
  asset_id uuid not null references public.assets on delete cascade,
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (goal_id, asset_id)
);
create index goal_assets_asset_idx on public.goal_assets (asset_id);

-- ---------------------------------------------------------------------------
-- KPIs
-- ---------------------------------------------------------------------------
create table public.kpis (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  asset_id uuid references public.assets on delete cascade,
  goal_id uuid references public.goals on delete set null,
  name text not null,
  unit text,
  baseline numeric,
  target numeric,
  direction text not null default 'up' check (direction in ('up','down')),
  sort int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index kpis_asset_idx on public.kpis (asset_id);
create index kpis_goal_idx on public.kpis (goal_id);

create table public.kpi_readings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  kpi_id uuid not null references public.kpis on delete cascade,
  reading_date date not null,
  value numeric not null,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index kpi_readings_kpi_date_idx on public.kpi_readings (kpi_id, reading_date desc, created_at desc);

-- ---------------------------------------------------------------------------
-- PROJECTS & TASKS
-- ---------------------------------------------------------------------------
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  title text not null,
  asset_id uuid references public.assets on delete set null,
  goal_id uuid references public.goals on delete set null,
  quarter text check (quarter in ('Q1','Q2','Q3','Q4')),
  status text not null default 'not_started'
    check (status in ('not_started','in_progress','blocked','done','dropped')),
  start_date date,
  due_date date,
  next_milestone text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index projects_asset_idx on public.projects (asset_id);

-- One row = one line in the Signal vs Noise sheet.
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  title text not null,
  task_date date not null default current_date, -- app always sends the Lagos-local date explicitly
  kind text not null default 'signal' check (kind in ('signal','noise')),
  kind_overridden boolean not null default false,
  asset_id uuid references public.assets on delete set null,
  project_id uuid references public.projects on delete set null,
  status text not null default 'todo',          -- option_sets 'task_status'
  status_note text,
  priority text not null default 'medium' check (priority in ('high','medium','low')),
  is_top3 boolean not null default false,
  links text[] not null default '{}',
  carried_from uuid references public.tasks(id) on delete set null,
  done_at timestamptz,
  notes text,
  source text not null default 'app',            -- 'app' | 'sheet_import' | ...
  import_key text,                               -- stable key for idempotent sheet import (Phase 2)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- NULLs are distinct in a unique constraint, so this behaves exactly like
  -- "unique (user_id, import_key) where import_key is not null" while still being
  -- usable as an ON CONFLICT / PostgREST upsert target.
  constraint tasks_user_import_key_uq unique (user_id, import_key)
);
create index tasks_user_date_idx on public.tasks (user_id, task_date);
create index tasks_asset_date_idx on public.tasks (asset_id, task_date);
create index tasks_project_idx on public.tasks (project_id);

-- ---------------------------------------------------------------------------
-- ONE THING CASCADE: quarter → month → week
-- Quarters (24 @ 24 calendar-month quarters):
--   Q1 = 16 Oct–31 Dec 2026, Q2 = Jan–Mar 2027, Q3 = Apr–Jun 2027, Q4 = 1 Jul–16 Oct 2027
-- ---------------------------------------------------------------------------
create table public.quarterly_objectives (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  quarter text not null check (quarter in ('Q1','Q2','Q3','Q4')),
  theme text,
  asset_id uuid references public.assets on delete set null,
  goal_id uuid references public.goals on delete set null,
  title text not null,     -- for an asset row, this IS the asset's one thing for the quarter
  kpi_name text,
  starting numeric,
  target numeric,
  actual numeric,
  status text not null default 'not_started',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- one objective per asset per quarter (rows with no asset are unconstrained)
  constraint quarterly_objectives_asset_uq unique (user_id, quarter, asset_id)
);

create table public.monthly_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  month date not null check (extract(day from month) = 1), -- first day of month
  asset_id uuid references public.assets on delete set null,
  area text,
  one_thing text not null,
  money_target_ngn numeric,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint monthly_plans_asset_uq unique (user_id, month, asset_id)
);

create table public.weekly_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  week_start date not null,
  one_thing text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, week_start)
);

-- One weekly priority per active asset per week.
create table public.weekly_priorities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  week_start date not null,
  asset_id uuid not null references public.assets on delete cascade,
  title text not null,
  status text not null default 'open' check (status in ('open','done','dropped')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, week_start, asset_id)
);

-- ---------------------------------------------------------------------------
-- REVIEWS
-- ---------------------------------------------------------------------------
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  type text not null check (type in ('weekly','monthly','quarterly','annual')),
  period_start date not null,
  period_end date not null,
  got_done text,
  not_done text,
  why text,
  change_next text,
  score int check (score between 1 and 10),
  snapshot jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reviews_period_ck check (period_end >= period_start),
  unique (user_id, type, period_start)
);

-- ---------------------------------------------------------------------------
-- MONEY
-- fx_used = NGN per 1 unit of `currency`. amount_ngn = amount * fx_used (trigger-maintained).
-- ---------------------------------------------------------------------------
create table public.income_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  entry_date date not null,
  engine text not null,    -- option_sets 'capital_engine'
  asset_id uuid references public.assets on delete set null,
  description text,
  amount numeric not null,
  currency text not null default 'NGN' check (currency in ('NGN','USD','GBP','EUR')),
  fx_used numeric check (fx_used > 0),
  amount_ngn numeric not null default 0, -- always recomputed by money_before_write()
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index income_entries_user_date_idx on public.income_entries (user_id, entry_date);

create table public.expense_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  entry_date date not null,
  category text,           -- option_sets 'expense_category'
  description text,
  amount numeric not null,
  currency text not null default 'NGN' check (currency in ('NGN','USD','GBP','EUR')),
  fx_used numeric check (fx_used > 0),
  amount_ngn numeric not null default 0, -- always recomputed by money_before_write()
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index expense_entries_user_date_idx on public.expense_entries (user_id, entry_date);

create table public.monthly_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  month date not null check (extract(day from month) = 1),
  cash_ngn numeric,
  liquid_investments_ngn numeric,
  illiquid_investments_ngn numeric,
  business_equity_ngn numeric,
  other_assets_ngn numeric,
  liabilities_ngn numeric,
  fx_ngn_per_usd numeric check (fx_ngn_per_usd > 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, month)
);

create table public.investments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  name text not null,
  type text,
  platform text,
  is_liquid boolean not null default true,
  cost_basis_ngn numeric,
  current_value_ngn numeric,
  last_updated date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.equity_stakes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  asset_id uuid references public.assets on delete cascade,
  ownership_pct numeric check (ownership_pct between 0 and 100),
  valuation_basis text,
  company_value_ngn numeric,
  annual_revenue_ngn numeric,
  last_updated date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index equity_stakes_asset_idx on public.equity_stakes (asset_id);

-- ---------------------------------------------------------------------------
-- LIFE / NETWORK / KNOWLEDGE
-- ---------------------------------------------------------------------------
create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  name text not null,
  category text,           -- option_sets 'contact_category'
  organisation text,
  how_met text,
  strength text check (strength in ('cold','warm','strong')),
  last_contact date,
  next_step text,
  asset_id uuid references public.assets on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.learning_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  title text not null,
  type text,               -- option_sets 'learning_type'
  area text,
  status text not null default 'to_start',
  started date,
  finished date,
  takeaway text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.countries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  country text not null,
  status text not null default 'wishlist'
    check (status in ('wishlist','planned','booked','visited')),
  planned_date date,
  visited_date date,
  purpose text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, country)
);

create table public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  entry_date date not null,
  country_id uuid references public.countries on delete set null,
  title text,
  body text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index journal_entries_user_date_idx on public.journal_entries (user_id, entry_date);

create table public.decisions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  decided_on date not null,
  title text not null,
  asset_id uuid references public.assets on delete set null,
  options text,
  reasoning text,
  review_on date,
  outcome text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index decisions_asset_idx on public.decisions (asset_id);

create table public.ideas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  title text not null,
  area text,
  why_parked text,
  revisit_on date,
  promoted_asset_id uuid references public.assets on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- updated_at triggers on every table
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array[
    'settings','option_sets','goals','assets','goal_assets','kpis','kpi_readings',
    'projects','tasks','quarterly_objectives','monthly_plans','weekly_plans',
    'weekly_priorities','reviews','income_entries','expense_entries',
    'monthly_snapshots','investments','equity_stakes','contacts','learning_items',
    'countries','journal_entries','decisions','ideas'
  ]
  loop
    execute format(
      'create trigger %I before update on public.%I for each row execute function public.set_updated_at()',
      t || '_set_updated_at', t
    );
  end loop;
end;
$$;
