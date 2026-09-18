-- Allow dispatchers (and only dispatchers) to hard-delete deliveries.
--
-- Two layers, same as the rest of the schema:
--   1. GRANT: only the `dispatcher` Postgres role gets the DELETE privilege.
--      A request whose JWT `role` claim is "driver" runs as the `driver`
--      role, which has no DELETE privilege, so Postgres rejects it with
--      "permission denied for table deliveries" before RLS is consulted.
--   2. RLS: a DELETE policy scoped `to dispatcher`, since RLS is enabled and
--      a role with DELETE but no matching policy would delete zero rows.

grant delete on public.deliveries to dispatcher;

-- Supabase's default privileges grant DELETE on new public tables to anon
-- and authenticated. RLS already blocks them (no policy targets those
-- roles), but remove the privilege so the grant layer says the same thing.
revoke delete on public.deliveries from anon, authenticated;

drop policy if exists "dispatcher_delete_deliveries" on public.deliveries;

create policy "dispatcher_delete_deliveries"
  on public.deliveries for delete
  to dispatcher
  using (true);
