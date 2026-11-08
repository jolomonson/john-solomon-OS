-- Migration 4: read views. All views are security_invoker, so RLS on the
-- underlying tables applies: each user only ever sees their own rows.

-- ---------------------------------------------------------------------------
-- v_goal_progress: progress = clamp((current − baseline)/(target − baseline), 0, 1)
-- null when there is no target. A missing baseline counts as 0; a missing
-- current counts as the baseline (no progress yet).
-- ---------------------------------------------------------------------------
create view public.v_goal_progress
with (security_invoker = true)
as
select
  g.*,
  case
    when g.target is null then null
    when g.target = coalesce(g.baseline, 0) then
      case when coalesce(g.current, g.baseline, 0) >= g.target then 1::numeric else 0::numeric end
    else greatest(0::numeric, least(1::numeric,
      (coalesce(g.current, g.baseline, 0) - coalesce(g.baseline, 0))
      / (g.target - coalesce(g.baseline, 0))))
  end as progress
from public.goals g;

-- ---------------------------------------------------------------------------
-- v_kpi_latest: latest reading per KPI + progress respecting direction.
-- Effective baseline = kpis.baseline, else the first reading.
-- 'up':   progress = (value − baseline)/(target − baseline)
-- 'down': progress = (baseline − value)/(baseline − target)
-- (algebraically identical; written out for clarity) clamped to [0,1].
-- ---------------------------------------------------------------------------
create view public.v_kpi_latest
with (security_invoker = true)
as
select
  k.id as kpi_id,
  k.user_id,
  k.asset_id,
  k.goal_id,
  k.name,
  k.unit,
  k.direction,
  k.baseline,
  k.target,
  k.sort,
  coalesce(k.baseline, fr.value) as effective_baseline,
  lr.id as latest_reading_id,
  lr.reading_date as latest_date,
  lr.value as latest_value,
  lr.note as latest_note,
  (select count(*) from public.kpi_readings c where c.kpi_id = k.id) as reading_count,
  case
    when k.target is null or lr.value is null or coalesce(k.baseline, fr.value) is null then null
    when k.target = coalesce(k.baseline, fr.value) then
      case
        when k.direction = 'up'   and lr.value >= k.target then 1::numeric
        when k.direction = 'down' and lr.value <= k.target then 1::numeric
        else 0::numeric
      end
    when k.direction = 'up' then greatest(0::numeric, least(1::numeric,
      (lr.value - coalesce(k.baseline, fr.value)) / (k.target - coalesce(k.baseline, fr.value))))
    else greatest(0::numeric, least(1::numeric,
      (coalesce(k.baseline, fr.value) - lr.value) / (coalesce(k.baseline, fr.value) - k.target)))
  end as progress
from public.kpis k
left join lateral (
  select r.id, r.reading_date, r.value, r.note
  from public.kpi_readings r
  where r.kpi_id = k.id
  order by r.reading_date desc, r.created_at desc
  limit 1
) lr on true
left join lateral (
  select r.value
  from public.kpi_readings r
  where r.kpi_id = k.id
  order by r.reading_date asc, r.created_at asc
  limit 1
) fr on true;

-- ---------------------------------------------------------------------------
-- v_capital_monthly: one row per calendar month from start_date's month to
-- end_date's month (Oct 2026 → Oct 2027 = 13 rows).
--
-- Balances come from monthly_snapshots. If a past/current month has no
-- snapshot, the latest earlier snapshot is carried forward and
-- is_carried_forward = true (the UI marks those months as estimated).
-- Future months get no balances (nothing is projected).
--
-- liquid_capital = cash + liquid_investments   (business equity is never liquid)
-- net_worth      = cash + liquid_inv + illiquid_inv + business_equity + other − liabilities
-- USD = NGN / fx  (fx = snapshot's rate for an exact snapshot, else settings rate)
-- ---------------------------------------------------------------------------
create view public.v_capital_monthly
with (security_invoker = true)
as
with s as (
  select * from public.settings
),
months as (
  select
    s.user_id,
    gs::date as month,
    s.start_date,
    s.end_date,
    s.fx_ngn_per_usd as settings_fx,
    s.stretch_target_usd,
    s.base_target_usd,
    date_trunc('month', public.app_today(s.user_id))::date as current_month
  from s
  cross join lateral generate_series(
    date_trunc('month', s.start_date),
    date_trunc('month', s.end_date),
    interval '1 month'
  ) gs
),
inc as (
  select user_id, date_trunc('month', entry_date)::date as month, engine, sum(amount_ngn) as amount_ngn
  from public.income_entries
  group by 1, 2, 3
),
inc_m as (
  select user_id, month, sum(amount_ngn) as income_ngn,
         jsonb_object_agg(engine, amount_ngn order by engine) as income_by_engine
  from inc
  group by 1, 2
),
exp_m as (
  select user_id, date_trunc('month', entry_date)::date as month, sum(amount_ngn) as expenses_ngn
  from public.expense_entries
  group by 1, 2
),
base as (
  select
    m.user_id,
    m.month,
    public.program_quarter(greatest(m.month, m.start_date), m.start_date, m.end_date) as quarter,
    (m.month > m.current_month) as is_future,
    coalesce(i.income_by_engine, '{}'::jsonb) as income_by_engine,
    coalesce(i.income_ngn, 0) as income_ngn,
    coalesce(e.expenses_ngn, 0) as expenses_ngn,
    snap.month as snapshot_month,
    (snap.month is not null and snap.month = m.month) as has_snapshot,
    (snap.month is not null and snap.month < m.month) as is_carried_forward,
    snap.cash_ngn,
    snap.liquid_investments_ngn,
    snap.illiquid_investments_ngn,
    snap.business_equity_ngn,
    snap.other_assets_ngn,
    snap.liabilities_ngn,
    case when snap.month = m.month then coalesce(snap.fx_ngn_per_usd, m.settings_fx) else m.settings_fx end as fx_ngn_per_usd,
    m.stretch_target_usd,
    m.base_target_usd
  from months m
  left join inc_m i on i.user_id = m.user_id and i.month = m.month
  left join exp_m e on e.user_id = m.user_id and e.month = m.month
  left join lateral (
    select ms.*
    from public.monthly_snapshots ms
    where ms.user_id = m.user_id
      and ms.month <= m.month
      and m.month <= m.current_month   -- never carry into the future
    order by ms.month desc
    limit 1
  ) snap on true
),
calc as (
  select
    b.*,
    b.income_ngn - b.expenses_ngn as net_savings_ngn,
    case when b.income_ngn > 0 then (b.income_ngn - b.expenses_ngn) / b.income_ngn end as savings_rate,
    case when b.snapshot_month is not null
      then coalesce(b.cash_ngn, 0) + coalesce(b.liquid_investments_ngn, 0) end as liquid_capital_ngn,
    case when b.snapshot_month is not null
      then coalesce(b.cash_ngn, 0) + coalesce(b.liquid_investments_ngn, 0)
         + coalesce(b.illiquid_investments_ngn, 0) + coalesce(b.business_equity_ngn, 0)
         + coalesce(b.other_assets_ngn, 0) - coalesce(b.liabilities_ngn, 0) end as net_worth_ngn
  from base b
)
select
  c.user_id,
  c.month,
  c.quarter,
  c.is_future,
  c.has_snapshot,
  c.is_carried_forward,
  c.snapshot_month,
  c.income_by_engine,
  c.income_ngn,
  c.expenses_ngn,
  c.net_savings_ngn,
  c.savings_rate,
  c.cash_ngn,
  c.liquid_investments_ngn,
  c.illiquid_investments_ngn,
  c.business_equity_ngn,
  c.other_assets_ngn,
  c.liabilities_ngn,
  c.fx_ngn_per_usd,
  c.liquid_capital_ngn,
  round(c.liquid_capital_ngn / c.fx_ngn_per_usd, 2) as liquid_capital_usd,
  c.liquid_capital_ngn - lag(c.liquid_capital_ngn) over w as liquid_change_ngn,
  round(c.liquid_capital_ngn / c.fx_ngn_per_usd, 2)
    - lag(round(c.liquid_capital_ngn / c.fx_ngn_per_usd, 2)) over w as liquid_change_usd,
  (c.liquid_capital_ngn / c.fx_ngn_per_usd) / nullif(c.stretch_target_usd, 0) as pct_stretch_target,
  (c.liquid_capital_ngn / c.fx_ngn_per_usd) / nullif(c.base_target_usd, 0) as pct_base_target,
  c.net_worth_ngn,
  round(c.net_worth_ngn / c.fx_ngn_per_usd, 2) as net_worth_usd
from calc c
window w as (partition by c.user_id order by c.month);

-- ---------------------------------------------------------------------------
-- v_asset_focus: per non-killed asset, the current quarter's one thing (from
-- quarterly_objectives — the single source of truth), whether an Active asset
-- is missing it (red badge), and open tasks this week (warn if > 7).
-- "Current" quarter/week are computed in settings.timezone.
-- ---------------------------------------------------------------------------
create view public.v_asset_focus
with (security_invoker = true)
as
with s as (
  select
    st.user_id,
    public.app_today(st.user_id) as today,
    st.start_date,
    st.end_date,
    st.week_starts_on
  from public.settings st
),
ctx as (
  select
    s.user_id,
    s.today,
    public.program_quarter(s.today, s.start_date, s.end_date) as current_quarter,
    (s.today - ((extract(dow from s.today)::int - s.week_starts_on + 7) % 7))::date as week_start
  from s
)
select
  a.id as asset_id,
  a.user_id,
  a.name,
  a.attention,
  a.parent_id,
  ctx.current_quarter,
  ctx.week_start,
  qo.id as quarterly_objective_id,
  qo.title as one_thing,
  qo.status as one_thing_status,
  (a.attention = 'active' and ctx.current_quarter is not null and qo.id is null) as missing_one_thing,
  coalesce(t.open_tasks_this_week, 0) as open_tasks_this_week,
  coalesce(t.open_tasks_this_week, 0) > 7 as too_many_tasks
from public.assets a
join ctx on ctx.user_id = a.user_id
left join public.quarterly_objectives qo
  on qo.user_id = a.user_id and qo.asset_id = a.id and qo.quarter = ctx.current_quarter
left join lateral (
  select count(*) as open_tasks_this_week
  from public.tasks tk
  where tk.asset_id = a.id
    and tk.task_date >= ctx.week_start
    and tk.task_date < ctx.week_start + 7
    and tk.status not in ('done', 'carried')
) t on true
where a.attention <> 'killed';

revoke all on public.v_goal_progress, public.v_kpi_latest, public.v_capital_monthly, public.v_asset_focus from anon;
grant select on public.v_goal_progress, public.v_kpi_latest, public.v_capital_monthly, public.v_asset_focus to authenticated;
