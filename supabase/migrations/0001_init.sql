-- Delivery Run Sheet — initial schema
--
-- This migration:
--   1. Creates the `users` (allowlist) and `deliveries` tables.
--   2. Creates two custom Postgres roles, `dispatcher` and `driver`, and grants
--      them to `authenticator` (the role PostgREST/Supabase connects as).
--   3. Grants table/column privileges per role so that, at the database level,
--      a driver can only ever SELECT their own deliveries and UPDATE the
--      status/delivered_at columns — nothing else, regardless of what the
--      application code does.
--   4. Enables Row Level Security and writes policies scoped `to dispatcher`
--      / `to driver`.
--
-- How role switching works: our own login route mints a JWT (signed with the
-- project's Supabase JWT secret) whose `role` claim is literally "dispatcher"
-- or "driver". PostgREST verifies that JWT and executes `SET LOCAL ROLE
-- <role>` for the request, so from Postgres's point of view the request IS
-- running as that role — this is Supabase's documented Custom Claims / RBAC
-- pattern, just fed by our own JWT minting instead of Supabase Auth.

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
create extension if not exists "pgcrypto"; -- gen_random_uuid()

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.user_role as enum ('dispatcher', 'driver');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.delivery_status as enum ('pending', 'delivered');
exception
  when duplicate_object then null;
end $$;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  name text,
  role public.user_role not null,
  whatsapp_number text,
  created_at timestamptz not null default now()
);

create table if not exists public.deliveries (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  address text not null,
  notes text,
  status public.delivery_status not null default 'pending',
  assigned_driver_id uuid references public.users (id),
  created_by uuid references public.users (id),
  created_at timestamptz not null default now(),
  delivered_at timestamptz
);

create index if not exists deliveries_assigned_driver_id_idx
  on public.deliveries (assigned_driver_id);

-- ---------------------------------------------------------------------------
-- Custom Postgres roles for RLS-enforced access (this is the "real" part of
-- "roles real at the database level" — not just an app-layer if/else).
-- ---------------------------------------------------------------------------
do $$ begin
  create role dispatcher nologin;
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create role driver nologin;
exception
  when duplicate_object then null;
end $$;

grant dispatcher to authenticator;
grant driver to authenticator;

grant usage on schema public to dispatcher, driver;

-- ---------------------------------------------------------------------------
-- Table + column grants (row filtering happens in RLS policies below; these
-- GRANTs are what stop a driver's UPDATE from ever touching a column other
-- than status/delivered_at, even if application code tried to send one).
-- ---------------------------------------------------------------------------

-- deliveries
grant select, insert, update on public.deliveries to dispatcher;
grant select on public.deliveries to driver;
grant update (status, delivered_at) on public.deliveries to driver;

-- users (needed so dispatchers can list drivers to assign to, and so both
-- roles can read/update their own profile from /settings)
grant select on public.users to dispatcher, driver;
grant update (name, whatsapp_number) on public.users to dispatcher, driver;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.users enable row level security;
alter table public.deliveries enable row level security;

-- users policies
create policy "dispatcher_select_all_users"
  on public.users for select
  to dispatcher
  using (true);

-- A driver may see their own row, plus the row of any dispatcher who
-- created a delivery currently assigned to them (needed so the driver's
-- WhatsApp button can message that dispatcher). Nothing broader than that.
create policy "driver_select_self_and_relevant_dispatchers"
  on public.users for select
  to driver
  using (
    id = auth.uid()
    or exists (
      select 1 from public.deliveries d
      where d.created_by = users.id
        and d.assigned_driver_id = auth.uid()
    )
  );

create policy "self_update_profile"
  on public.users for update
  to dispatcher, driver
  using (id = auth.uid())
  with check (id = auth.uid());

-- deliveries policies
create policy "dispatcher_select_all_deliveries"
  on public.deliveries for select
  to dispatcher
  using (true);

create policy "dispatcher_insert_deliveries"
  on public.deliveries for insert
  to dispatcher
  with check (created_by = auth.uid());

create policy "dispatcher_update_all_deliveries"
  on public.deliveries for update
  to dispatcher
  using (true)
  with check (true);

create policy "driver_select_own_deliveries"
  on public.deliveries for select
  to driver
  using (assigned_driver_id = auth.uid());

create policy "driver_update_own_deliveries"
  on public.deliveries for update
  to driver
  using (assigned_driver_id = auth.uid())
  with check (assigned_driver_id = auth.uid());
