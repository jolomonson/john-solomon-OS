-- Migration 3: business rules (triggers + functions) and the first-login seed.

-- ===========================================================================
-- DATE HELPERS (mirror src/lib/dates.ts — keep the two in sync)
-- ===========================================================================

-- "Today" for a user, in their settings.timezone (default Africa/Lagos).
create or replace function public.app_today(p_user uuid default auth.uid())
returns date
language sql
stable
set search_path = ''
as $$
  select (now() at time zone coalesce(
    (select s.timezone from public.settings s where s.user_id = p_user),
    'Africa/Lagos'))::date;
$$;

-- 24 @ 24 quarter for a date. Quarters follow calendar quarters, numbered from
-- the calendar quarter that contains start_date; anything after Q3 is Q4 up to
-- end_date. With the defaults:
--   Q1 = 16 Oct–31 Dec 2026, Q2 = Jan–Mar 2027, Q3 = Apr–Jun 2027, Q4 = 1 Jul–16 Oct 2027.
-- Returns null outside [start_date, end_date].
create or replace function public.program_quarter(p_date date, p_start date, p_end date)
returns text
language sql
immutable
set search_path = ''
as $$
  select case
    when p_date is null or p_date < p_start or p_date > p_end then null
    else 'Q' || least(4,
      (extract(year from p_date)::int * 4 + (extract(month from p_date)::int - 1) / 3)
      - (extract(year from p_start)::int * 4 + (extract(month from p_start)::int - 1) / 3)
      + 1)
  end;
$$;

create or replace function public.program_quarter(p_date date)
returns text
language sql
stable
set search_path = ''
as $$
  select public.program_quarter(p_date, s.start_date, s.end_date)
  from public.settings s
  where s.user_id = auth.uid();
$$;

-- ===========================================================================
-- ASSETS: max active (reads settings.max_active_assets)
-- ===========================================================================
create or replace function public.enforce_max_active_assets()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_max int;
  v_count int;
  v_names text;
begin
  if new.attention <> 'active' then
    return new;
  end if;
  if tg_op = 'UPDATE' and old.attention = 'active' and old.user_id = new.user_id then
    return new;
  end if;

  -- serialise concurrent activations for the same user
  perform pg_advisory_xact_lock(hashtextextended('max_active:' || new.user_id::text, 0));

  select coalesce(max_active_assets, 5) into v_max
  from public.settings where user_id = new.user_id;
  v_max := coalesce(v_max, 5);

  select count(*), string_agg(name, ', ' order by name)
    into v_count, v_names
  from public.assets
  where user_id = new.user_id and attention = 'active' and id <> new.id;

  if v_count >= v_max then
    raise exception 'MAX_ACTIVE_ASSETS'
      using errcode = 'P0001',
            detail  = format('Max %s active assets. Currently active: %s', v_max, v_names),
            hint    = 'Move another asset out of Active first';
  end if;
  return new;
end;
$$;

create trigger assets_enforce_max_active
  before insert or update of attention on public.assets
  for each row execute function public.enforce_max_active_assets();

-- ===========================================================================
-- ASSETS: killing requires a Decision Log entry → only via kill_asset()
-- ===========================================================================
create or replace function public.guard_asset_kill()
returns trigger
language plpgsql
as $$
begin
  if new.attention = 'killed'
     and (tg_op = 'INSERT' or old.attention <> 'killed')
     and coalesce(current_setting('app.kill_asset_id', true), '') <> new.id::text then
    raise exception 'KILL_REQUIRES_DECISION'
      using errcode = 'P0001',
            hint = 'Use kill_asset() so the Decision Log records what was learned';
  end if;
  return new;
end;
$$;

create trigger assets_guard_kill
  before insert or update of attention on public.assets
  for each row execute function public.guard_asset_kill();

create or replace function public.kill_asset(
  p_asset_id   uuid,
  p_reasoning  text,              -- what was learned (required)
  p_title      text default null,
  p_options    text default null,
  p_outcome    text default null,
  p_decided_on date default null,
  p_review_on  date default null
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_asset public.assets%rowtype;
  v_decision_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated' using errcode = '42501';
  end if;
  if coalesce(btrim(p_reasoning), '') = '' then
    raise exception 'KILL_REASONING_REQUIRED'
      using errcode = '23514', hint = 'Record what was learned before killing an asset';
  end if;

  select * into v_asset from public.assets where id = p_asset_id for update;
  if not found then
    raise exception 'Asset % not found', p_asset_id using errcode = 'P0002';
  end if;
  if v_asset.attention = 'killed' then
    raise exception 'Asset is already killed' using errcode = 'P0001';
  end if;

  insert into public.decisions (user_id, decided_on, title, asset_id, options, reasoning, review_on, outcome)
  values (
    auth.uid(),
    coalesce(p_decided_on, public.app_today()),
    coalesce(nullif(btrim(p_title), ''), 'Killed: ' || v_asset.name),
    v_asset.id,
    p_options,
    p_reasoning,
    p_review_on,
    coalesce(p_outcome, 'killed')
  )
  returning id into v_decision_id;

  perform set_config('app.kill_asset_id', v_asset.id::text, true);
  update public.assets set attention = 'killed' where id = v_asset.id;
  perform set_config('app.kill_asset_id', '', true);

  return v_decision_id;
end;
$$;

-- ===========================================================================
-- TASKS: signal/noise default + done_at
-- ===========================================================================
create or replace function public.default_task_kind(p_asset_id uuid)
returns text
language sql
stable
set search_path = ''
as $$
  select case
    when p_asset_id is null then 'signal'
    when (select attention from public.assets where id = p_asset_id) = 'active' then 'signal'
    when exists (select 1 from public.assets where id = p_asset_id) then 'noise'
    else 'signal'
  end;
$$;

create or replace function public.tasks_before_write()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- Changing `kind` directly is a one-tap override.
  if tg_op = 'UPDATE'
     and new.kind is distinct from old.kind
     and new.kind_overridden = old.kind_overridden then
    new.kind_overridden := true;
  end if;

  -- Not overridden → kind always follows the asset's attention.
  if not new.kind_overridden then
    new.kind := public.default_task_kind(new.asset_id);
  end if;

  -- done_at follows status.
  if new.status = 'done' then
    if tg_op = 'INSERT' or old.status is distinct from 'done' or new.done_at is null then
      new.done_at := coalesce(new.done_at, now());
    end if;
  else
    new.done_at := null;
  end if;
  return new;
end;
$$;

create trigger tasks_before_write
  before insert or update on public.tasks
  for each row execute function public.tasks_before_write();

-- When an asset's attention changes, re-derive kind for its open, non-overridden
-- tasks from today (in the user's timezone) onwards. History is left as it was.
create or replace function public.assets_after_attention_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- A no-op write of kind_overridden=false makes tasks_before_write re-derive
  -- kind (setting kind directly would be treated as a manual override).
  update public.tasks t
     set kind_overridden = false
   where t.asset_id = new.id
     and not t.kind_overridden
     and t.status <> 'done'
     and t.task_date >= public.app_today(new.user_id);
  return null;
end;
$$;

create trigger assets_after_attention_change
  after update of attention on public.assets
  for each row
  when (old.attention is distinct from new.attention)
  execute function public.assets_after_attention_change();

-- ===========================================================================
-- MONEY: amount_ngn and fx_used
-- fx_used is NGN per 1 unit of currency. NGN → 1. USD → defaults to
-- settings.fx_ngn_per_usd at entry time. GBP/EUR → must be supplied.
-- The rate captured at entry is kept on later edits.
-- ===========================================================================
create or replace function public.money_before_write()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.currency := coalesce(new.currency, 'NGN');
  if new.currency = 'NGN' then
    new.fx_used := 1;
  elsif new.fx_used is null then
    if new.currency = 'USD' then
      select fx_ngn_per_usd into new.fx_used from public.settings where user_id = new.user_id;
    end if;
    if new.fx_used is null then
      raise exception 'fx_used is required for % amounts', new.currency using errcode = '23502';
    end if;
  end if;
  new.amount_ngn := round(new.amount * new.fx_used, 2);
  return new;
end;
$$;

create trigger income_entries_money
  before insert or update on public.income_entries
  for each row execute function public.money_before_write();

create trigger expense_entries_money
  before insert or update on public.expense_entries
  for each row execute function public.money_before_write();

create or replace function public.snapshots_before_write()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.month := date_trunc('month', new.month)::date;
  if new.fx_ngn_per_usd is null then
    select fx_ngn_per_usd into new.fx_ngn_per_usd from public.settings where user_id = new.user_id;
  end if;
  return new;
end;
$$;

create trigger monthly_snapshots_before_write
  before insert or update on public.monthly_snapshots
  for each row execute function public.snapshots_before_write();

-- ===========================================================================
-- SEED (idempotent: every insert is ON CONFLICT DO NOTHING / NOT EXISTS)
-- ===========================================================================
create or replace function public.seed_user_data()
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_max int;
  v_active int;
  v_inserted text[] := '{}';
  v_id uuid;
  r record;
  v_attention text;
  v_notes text;
begin
  if v_uid is null then
    raise exception 'Not authenticated' using errcode = '42501';
  end if;

  insert into public.settings (user_id) values (v_uid) on conflict (user_id) do nothing;

  -- ---- option sets -------------------------------------------------------
  insert into public.option_sets (user_id, set_key, value, label, color, sort)
  select v_uid, o.set_key, o.value, o.label, o.color, o.sort
  from (values
    ('goal_category','A','A. Business','red',1),
    ('goal_category','B','B. Money','emerald',2),
    ('goal_category','C','C. Career','blue',3),
    ('goal_category','D','D. Network','violet',4),
    ('goal_category','E','E. Life','amber',5),
    ('goal_category','F','F. Knowledge','cyan',6),

    ('asset_type','company','Company',null,1),
    ('asset_type','product','Product',null,2),
    ('asset_type','vertical','Vertical',null,3),
    ('asset_type','ngo','NGO',null,4),
    ('asset_type','employer','Employer',null,5),
    ('asset_type','employer_product','Employer product',null,6),

    ('stage','idea','Idea',null,1),
    ('stage','poc','PoC',null,2),
    ('stage','mvp','MVP',null,3),
    ('stage','pilot','Pilot',null,4),
    ('stage','operating','Operating',null,5),
    ('stage','scaling','Scaling',null,6),

    ('capital_engine','salary','Salary',null,1),
    ('capital_engine','consulting','Consulting',null,2),
    ('capital_engine','business_profits','Business profits',null,3),
    ('capital_engine','business_distributions','Business distributions',null,4),
    ('capital_engine','equity_liquidity','Equity liquidity',null,5),
    ('capital_engine','investment_income','Investment income',null,6),
    ('capital_engine','other','Other',null,7),

    ('task_status','todo','To do','slate',1),
    ('task_status','in_progress','In progress','blue',2),
    ('task_status','done','Done','green',3),
    ('task_status','blocked','Blocked','red',4),
    ('task_status','carried','Carried','amber',5),

    ('contact_category','investor','Investor',null,1),
    ('contact_category','founder','Founder',null,2),
    ('contact_category','mentor','Mentor / adviser',null,3),
    ('contact_category','institution','Institution',null,4),
    ('contact_category','technical','Technical',null,5),
    ('contact_category','customer','Customer',null,6),
    ('contact_category','other','Other',null,7),

    ('expense_category','living','Living',null,1),
    ('expense_category','transport','Transport',null,2),
    ('expense_category','business','Business',null,3),
    ('expense_category','learning','Learning',null,4),
    ('expense_category','travel','Travel',null,5),
    ('expense_category','other','Other',null,6),

    ('learning_type','book','Book',null,1),
    ('learning_type','course','Course',null,2),
    ('learning_type','paper','Paper',null,3),
    ('learning_type','project','Project',null,4)
  ) as o(set_key, value, label, color, sort)
  on conflict (user_id, set_key, value) do nothing;

  -- ---- goals ---------------------------------------------------------------
  insert into public.goals (user_id, number, title, category, kpi_name, kpi_unit, baseline, current, target, target_note)
  select v_uid, g.number, g.title, g.category, g.kpi_name, g.kpi_unit, g.baseline, g.baseline, g.target, g.target_note
  from (values
    (1,  'Build Mispar into a functioning biometric identity company', 'A', 'Paying organisations', 'orgs', 0::numeric, 20::numeric, null::text),
    (2,  'Build Ednitio into a paying education-management business', 'A', null, null, null, null, null),
    (3,  'Build NatureFusion agriculture + tech operation', 'A', null, null, null, null, null),
    (4,  'Establish an operating system for the rest of the portfolio', 'A', null, null, null, null, null),
    (5,  'Grow personal liquid capital', 'B', 'Liquid capital', 'USD', 18.6, 24000000, '$24M stretch. Baseline $18.6 = ₦27,000 at ₦1,450/$'),
    (6,  'Hit a defined personal income target', 'B', null, null, null, null, null),
    (7,  'Build a diversified investment base', 'B', null, null, null, null, null),
    (8,  'Increase value and cash flow of owned companies', 'B', null, null, null, null, null),
    (9,  'Become significantly stronger in AI/ML', 'C', null, null, null, null, null),
    (10, 'Build production-grade software systems', 'C', null, null, null, null, null),
    (11, 'Build a technical network', 'C', null, null, null, null, null),
    (12, 'Develop founder/operator capability', 'C', 'Weekly reviews', 'reviews', 0, 52, '52 weekly reviews'),
    (13, 'Build 100 meaningful professional relationships', 'D', 'Meaningful relationships', 'people', 0, 100, null),
    (14, 'Find mentors/advisers', 'D', null, null, null, null, null),
    (15, 'Build an investor/founder network', 'D', null, null, null, null, null),
    (16, 'Build institutional relationships', 'D', null, null, null, null, null),
    (17, 'Visit 24 countries', 'E', 'Countries visited', 'countries', 0, 24, null),
    (18, 'Document the journey', 'E', null, null, null, null, null),
    (19, 'Develop physical/mental discipline', 'E', 'Disciplined weeks', 'weeks', 0, 52, '52 weeks'),
    (20, 'Build a personal brand', 'E', null, null, null, null, null),
    (21, 'Read/study a defined number of books', 'F', 'Books', 'books', 0, 24, null),
    (22, 'Teach/share knowledge', 'F', null, null, null, null, null),
    (23, 'Build something with African impact', 'F', null, null, null, null, null),
    (24, 'Create a personal body of work', 'F', null, null, null, null, null)
  ) as g(number, title, category, kpi_name, kpi_unit, baseline, target, target_note)
  on conflict (user_id, number) do nothing;

  -- ---- assets --------------------------------------------------------------
  -- The seed list marks 6 assets Active. The max-active rule (default 5) is
  -- respected: any Active beyond the limit is seeded as maintenance with a note,
  -- so John can choose which to swap in.
  select coalesce(max_active_assets, 5) into v_max from public.settings where user_id = v_uid;
  select count(*) into v_active from public.assets where user_id = v_uid and attention = 'active';

  for r in
    select * from (values
      (1,  'Mispar Technologies', null::text, 'company', 'personal', 'active', 'mispartechnologies.com'),
      (2,  'Smart Attendance', 'Mispar Technologies', 'product', 'personal', 'active', null),
      (3,  'Mailnitio', 'Mispar Technologies', 'product', 'personal', 'active', 'mailnitio.com'),
      (4,  'Mispar School', 'Mispar Technologies', 'vertical', 'personal', 'maintenance', 'school.mispartechnologies.com'),
      (5,  'Mispar Church', 'Mispar Technologies', 'vertical', 'personal', 'maintenance', 'church.mispartechnologies.com'),
      (6,  'Mispar Corporate', 'Mispar Technologies', 'vertical', 'personal', 'maintenance', 'corporate.mispartechnologies.com'),
      (7,  'StudyBridge', 'Mispar Technologies', 'product', 'personal', 'maintenance', 'studybridge.mispartechnologies.com'),
      (8,  'Ednitio Management Technologies', null, 'company', 'personal', 'active', 'sms.ednitio.com'),
      (9,  'NatureFusion Enterprise', null, 'company', 'personal', 'active', 'naturefusione.lovable.app'),
      (10, 'NatureFusion Livestock Marketplace', 'NatureFusion Enterprise', 'product', 'personal', 'active', 'nfe-livestock-marketplace.lovable.app'),
      (11, 'OJA Technologies', null, 'company', 'personal', 'maintenance', 'oja.ignitiohub.com'),
      (12, 'OJA Payment Ledger', 'OJA Technologies', 'product', 'personal', 'maintenance', null),
      (13, 'DineroSteppers', null, 'product', 'personal', 'maintenance', 'steppers.ignitiohub.com'),
      (14, 'King''s Digital Academy', null, 'company', 'personal', 'parked', 'kings-digital-academy.lovable.app'),
      (15, 'Chessprint Coach', null, 'product', 'personal', 'parked', 'chessprint.lovable.app'),
      (16, 'RevEd Technologies', null, 'company', 'partnership', 'partnership', 'reved-technologies.vercel.app'),
      (17, 'StashwithEsther', null, 'company', 'partnership', 'partnership', 'stashwithesther.com'),
      (18, 'Eventio Management Technologies', null, 'company', 'partnership', 'partnership', 'eventio.africa'),
      (19, 'Politicalbaby', null, 'product', 'partnership', 'partnership', 'politicalbaby.ignitiohub.com'),
      (20, 'Prime Business', null, 'company', 'partnership', 'partnership', 'getprime.app'),
      (21, 'FashionVision Technologies', null, 'company', 'partnership', 'partnership', 'fashion.ignitiohub.com'),
      (22, 'Foskulture NGO', null, 'ngo', 'partnership', 'partnership', 'foskulture.com'),
      (23, 'Foskollection', 'Foskulture NGO', 'product', 'partnership', 'partnership', 'shop.foskulture.com'),
      (24, 'OptiForge Limited', null, 'employer', 'work', 'work', 'optiforge.io'),
      (25, 'ShieldVase Marketplace', 'OptiForge Limited', 'employer_product', 'work', 'work', 'shieldvase.io'),
      (26, 'RoomCraft Marketplace', 'OptiForge Limited', 'employer_product', 'work', 'work', 'roomcraft.tech')
    ) as a(sort, name, parent, type, ownership, attention, url)
    order by sort
  loop
    -- skip if it already exists (keeps John's edits; doesn't consume an active slot)
    continue when exists (select 1 from public.assets where user_id = v_uid and name = r.name);

    v_attention := r.attention;
    v_notes := null;
    if v_attention = 'active' then
      if v_active >= v_max then
        v_attention := 'maintenance';
        v_notes := format('Seed list marked this Active, but max_active_assets is %s. Seeded as maintenance. Swap it in if it should be one of the %s.', v_max, v_max);
      else
        v_active := v_active + 1;
      end if;
    end if;

    insert into public.assets (user_id, name, type, ownership, attention, url, priority, notes)
    values (v_uid, r.name, r.type, r.ownership, v_attention,
            case when r.url is null then null else 'https://' || r.url end,
            r.sort, v_notes)
    on conflict (user_id, name) do nothing
    returning id into v_id;

    if v_id is not null and r.parent is not null then
      v_inserted := v_inserted || r.name;
    end if;
    v_id := null;
  end loop;

  -- link parents, only for rows created by this run
  update public.assets c
     set parent_id = p.id
    from (values
      ('Smart Attendance','Mispar Technologies'),
      ('Mailnitio','Mispar Technologies'),
      ('Mispar School','Mispar Technologies'),
      ('Mispar Church','Mispar Technologies'),
      ('Mispar Corporate','Mispar Technologies'),
      ('StudyBridge','Mispar Technologies'),
      ('NatureFusion Livestock Marketplace','NatureFusion Enterprise'),
      ('OJA Payment Ledger','OJA Technologies'),
      ('Foskollection','Foskulture NGO'),
      ('ShieldVase Marketplace','OptiForge Limited'),
      ('RoomCraft Marketplace','OptiForge Limited')
    ) as m(child, parent)
    join public.assets p on p.user_id = v_uid and p.name = m.parent
   where c.user_id = v_uid
     and c.name = m.child
     and c.name = any(v_inserted)
     and c.parent_id is null;

  -- goal ↔ asset links for the three company goals
  insert into public.goal_assets (user_id, goal_id, asset_id)
  select v_uid, g.id, a.id
  from (values (1,'Mispar Technologies'), (2,'Ednitio Management Technologies'), (3,'NatureFusion Enterprise')) as l(num, asset_name)
  join public.goals g on g.user_id = v_uid and g.number = l.num
  join public.assets a on a.user_id = v_uid and a.name = l.asset_name
  on conflict (goal_id, asset_id) do nothing;

  -- ---- money ---------------------------------------------------------------
  insert into public.income_entries (user_id, entry_date, engine, asset_id, description, amount, currency)
  select v_uid, date '2026-10-20', 'other',
         (select id from public.assets where user_id = v_uid and name = 'DineroSteppers'),
         'DineroSteppers competition prize', 27000, 'NGN'
  where not exists (
    select 1 from public.income_entries
    where user_id = v_uid and entry_date = date '2026-10-20' and description = 'DineroSteppers competition prize'
  );

  insert into public.monthly_snapshots (user_id, month, cash_ngn, notes)
  values (v_uid, date '2026-10-01', 27000, 'Opening position: DineroSteppers prize')
  on conflict (user_id, month) do nothing;

  -- ---- countries -------------------------------------------------------------
  insert into public.countries (user_id, country, status, purpose)
  values
    (v_uid, 'Spain', 'planned', 'El Clásico trip'),
    (v_uid, 'United Kingdom', 'planned', 'Manchester derby trip')
  on conflict (user_id, country) do nothing;
end;
$$;

-- Called once after sign-in. Creates settings and seeds on first login only.
create or replace function public.bootstrap_user()
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_seeded_at timestamptz;
  v_ran boolean := false;
begin
  if v_uid is null then
    raise exception 'Not authenticated' using errcode = '42501';
  end if;

  perform pg_advisory_xact_lock(hashtextextended('bootstrap:' || v_uid::text, 0));

  insert into public.settings (user_id) values (v_uid) on conflict (user_id) do nothing;
  select seeded_at into v_seeded_at from public.settings where user_id = v_uid;

  if v_seeded_at is null then
    perform public.seed_user_data();
    update public.settings set seeded_at = now() where user_id = v_uid;
    v_ran := true;
  end if;

  return jsonb_build_object('seeded_now', v_ran);
end;
$$;

-- ---- grants ------------------------------------------------------------------
revoke execute on function public.kill_asset(uuid, text, text, text, text, date, date) from public, anon;
revoke execute on function public.seed_user_data() from public, anon;
revoke execute on function public.bootstrap_user() from public, anon;
grant execute on function public.kill_asset(uuid, text, text, text, text, date, date) to authenticated;
grant execute on function public.seed_user_data() to authenticated;
grant execute on function public.bootstrap_user() to authenticated;
revoke execute on function public.enforce_max_active_assets() from public, anon, authenticated;
