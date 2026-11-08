-- Migration 5: explicit table privileges.
-- Newer Supabase projects no longer auto-grant DML on public tables to the API
-- roles, so grant exactly what the app needs. RLS (migration 2) still limits
-- every row to its owner; `anon` gets nothing.

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
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('grant all on public.%I to service_role', t);
  end loop;
end;
$$;

grant select on public.v_goal_progress, public.v_kpi_latest, public.v_capital_monthly, public.v_asset_focus to service_role;

-- helper functions used by views/triggers, callable by signed-in users
grant execute on function public.app_today(uuid) to authenticated;
grant execute on function public.program_quarter(date, date, date) to authenticated;
grant execute on function public.program_quarter(date) to authenticated;
grant execute on function public.default_task_kind(uuid) to authenticated;
