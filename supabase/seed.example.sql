-- Template for seeding the users allowlist. Run in the Supabase SQL editor
-- (Project -> SQL Editor) after 0001_init.sql. Replace the placeholder
-- emails/names before running — this file intentionally isn't filled in
-- with real data since the repo is public.

insert into public.users (email, name, role, whatsapp_number) values
  ('dispatcher@example.com', 'Dispatcher Name', 'dispatcher', '+15551234567'),
  ('driver@example.com', 'Driver Name', 'driver', '+15551234567');
