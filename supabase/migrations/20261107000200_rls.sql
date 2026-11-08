-- Migration 2: Row Level Security on every table.
-- Rule: a signed-in user can only see and change rows where user_id = auth.uid().
-- The anon role gets no policy, so it can read or write nothing.

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
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon', t);

    execute format($p$
      create policy %I on public.%I
        for select to authenticated
        using (user_id = (select auth.uid()))
    $p$, t || '_select_own', t);

    execute format($p$
      create policy %I on public.%I
        for insert to authenticated
        with check (user_id = (select auth.uid()))
    $p$, t || '_insert_own', t);

    execute format($p$
      create policy %I on public.%I
        for update to authenticated
        using (user_id = (select auth.uid()))
        with check (user_id = (select auth.uid()))
    $p$, t || '_update_own', t);

    execute format($p$
      create policy %I on public.%I
        for delete to authenticated
        using (user_id = (select auth.uid()))
    $p$, t || '_delete_own', t);
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- Cross-user reference guard.
-- Foreign-key checks bypass RLS, so without this a user could point a row at
-- another user's asset/goal/etc. This trigger rejects any FK that names a row
-- owned by someone else.
-- ---------------------------------------------------------------------------
create or replace function public.assert_same_owner(p_table regclass, p_id uuid, p_user uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_owner uuid;
begin
  if p_id is null then
    return;
  end if;
  execute format('select user_id from %s where id = $1', p_table) into v_owner using p_id;
  if v_owner is null or v_owner <> p_user then
    raise exception 'Referenced % row % does not exist', p_table, p_id
      using errcode = '23503';
  end if;
end;
$$;
revoke all on function public.assert_same_owner(regclass, uuid, uuid) from public, anon, authenticated;

create or replace function public.guard_foreign_owners()
returns trigger
language plpgsql
as $$
declare
  rec jsonb := to_jsonb(new);
  col text;
  ref text;
  pairs text[][] := case tg_table_name
    when 'assets'               then array[['parent_id','public.assets']]
    when 'goal_assets'          then array[['goal_id','public.goals'],['asset_id','public.assets']]
    when 'kpis'                 then array[['asset_id','public.assets'],['goal_id','public.goals']]
    when 'kpi_readings'         then array[['kpi_id','public.kpis']]
    when 'projects'             then array[['asset_id','public.assets'],['goal_id','public.goals']]
    when 'tasks'                then array[['asset_id','public.assets'],['project_id','public.projects'],['carried_from','public.tasks']]
    when 'quarterly_objectives' then array[['asset_id','public.assets'],['goal_id','public.goals']]
    when 'monthly_plans'        then array[['asset_id','public.assets']]
    when 'weekly_priorities'    then array[['asset_id','public.assets']]
    when 'income_entries'       then array[['asset_id','public.assets']]
    when 'equity_stakes'        then array[['asset_id','public.assets']]
    when 'contacts'             then array[['asset_id','public.assets']]
    when 'journal_entries'      then array[['country_id','public.countries']]
    when 'decisions'            then array[['asset_id','public.assets']]
    when 'ideas'                then array[['promoted_asset_id','public.assets']]
  end;
  i int;
begin
  if pairs is null then
    return new;
  end if;
  for i in 1 .. array_length(pairs, 1) loop
    col := pairs[i][1];
    ref := pairs[i][2];
    if tg_op = 'INSERT'
       or (rec ->> col) is distinct from (to_jsonb(old) ->> col)
       or new.user_id is distinct from old.user_id then
      perform public.assert_same_owner(ref::regclass, (rec ->> col)::uuid, new.user_id);
    end if;
  end loop;
  return new;
end;
$$;

do $$
declare
  t text;
begin
  foreach t in array array[
    'assets','goal_assets','kpis','kpi_readings','projects','tasks',
    'quarterly_objectives','monthly_plans','weekly_priorities','income_entries',
    'equity_stakes','contacts','journal_entries','decisions','ideas'
  ]
  loop
    execute format(
      'create trigger %I before insert or update on public.%I for each row execute function public.guard_foreign_owners()',
      t || '_guard_owners', t
    );
  end loop;
end;
$$;
