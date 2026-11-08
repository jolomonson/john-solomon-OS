-- Migration 6: the cross-user FK guard trigger must be able to call
-- assert_same_owner(), which is (deliberately) not executable by API roles.
-- Trigger functions cannot be invoked via the API, so running the guard as its
-- owner is safe and keeps the helper private.
alter function public.guard_foreign_owners() security definer;
alter function public.guard_foreign_owners() set search_path = '';
revoke execute on function public.guard_foreign_owners() from public, anon, authenticated;
