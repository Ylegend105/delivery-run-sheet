// Verifies Postgres RLS is actually enforcing access — not just the UI
// hiding things. Run with: node scripts/verify-rls.mjs
//
// It signs its own throwaway JWTs (using SUPABASE_JWT_SECRET) for two fake
// driver ids, inserts a test delivery assigned to "driver A" via the
// service-role client, then checks:
//   1. driver A can SELECT the delivery.
//   2. driver B CANNOT SELECT it (RLS blocks cross-driver reads).
//   3. driver A CAN update status/delivered_at on their own row.
//   4. driver A CANNOT update customer_name (column-level grant blocks it).
// Cleans up the test row at the end.

import { createClient } from "@supabase/supabase-js";
import { SignJWT } from "jose";
import { randomUUID } from "node:crypto";

const {
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY,
  SUPABASE_JWT_SECRET,
} = process.env;

for (const [name, val] of Object.entries({
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY,
  SUPABASE_JWT_SECRET,
})) {
  if (!val) {
    console.error(`Missing env var ${name}. Load .env.local first, e.g.:`);
    console.error(
      `  powershell -c "Get-Content .env.local | %{ if($_ -match '^(\\w+)=(.*)$'){ [Environment]::SetEnvironmentVariable($matches[1],$matches[2]) } }; node scripts/verify-rls.mjs"`,
    );
    process.exit(1);
  }
}

const secret = new TextEncoder().encode(SUPABASE_JWT_SECRET);

async function signDriverJWT(sub) {
  return new SignJWT({ email: `${sub}@example.com`, role: "driver", aud: "authenticated" })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(sub)
    .setIssuedAt()
    .setExpirationTime("10m")
    .sign(secret);
}

function clientFor(jwt) {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
    global: { headers: { Authorization: `Bearer ${jwt}` } },
  });
}

const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

let pass = true;
function check(label, ok) {
  console.log(`${ok ? "PASS" : "FAIL"} - ${label}`);
  if (!ok) pass = false;
}

const { data: testUsers, error: usersError } = await admin
  .from("users")
  .insert([
    { email: `rls-test-a-${randomUUID()}@example.com`, name: "RLS Test Driver A", role: "driver" },
    { email: `rls-test-b-${randomUUID()}@example.com`, name: "RLS Test Driver B", role: "driver" },
  ])
  .select();

if (usersError) {
  console.error("Setup failed inserting test users:", usersError.message);
  process.exit(1);
}

const driverA = testUsers[0].id;
const driverB = testUsers[1].id;

const { data: delivery, error: insertError } = await admin
  .from("deliveries")
  .insert({
    customer_name: "RLS Test Customer",
    address: "1 Test St, Testville",
    assigned_driver_id: driverA,
  })
  .select()
  .single();

if (insertError) {
  console.error("Setup failed inserting test delivery:", insertError.message);
  await admin.from("users").delete().in("id", [driverA, driverB]);
  process.exit(1);
}

try {
  const jwtA = await signDriverJWT(driverA);
  const jwtB = await signDriverJWT(driverB);
  const asDriverA = clientFor(jwtA);
  const asDriverB = clientFor(jwtB);

  const { data: aRows } = await asDriverA
    .from("deliveries")
    .select("*")
    .eq("id", delivery.id);
  check("driver A can see their own delivery", aRows?.length === 1);

  const { data: bRows } = await asDriverB
    .from("deliveries")
    .select("*")
    .eq("id", delivery.id);
  check("driver B CANNOT see driver A's delivery", (bRows?.length ?? 0) === 0);

  const { error: statusUpdateError } = await asDriverA
    .from("deliveries")
    .update({ status: "delivered", delivered_at: new Date().toISOString() })
    .eq("id", delivery.id);
  check(
    "driver A can update status/delivered_at on their own row",
    !statusUpdateError,
  );

  const { error: nameUpdateError } = await asDriverA
    .from("deliveries")
    .update({ customer_name: "Hacked" })
    .eq("id", delivery.id);
  check(
    "driver A CANNOT update customer_name (column grant blocks it)",
    !!nameUpdateError,
  );

  const { data: bUpdateRows, error: bUpdateError } = await asDriverB
    .from("deliveries")
    .update({ status: "delivered" })
    .eq("id", delivery.id)
    .select();
  check(
    "driver B CANNOT update driver A's delivery at all",
    !!bUpdateError || (bUpdateRows?.length ?? 0) === 0,
  );
} finally {
  await admin.from("deliveries").delete().eq("id", delivery.id);
  await admin.from("users").delete().in("id", [driverA, driverB]);
}

console.log(pass ? "\nAll RLS checks passed." : "\nSome RLS checks FAILED.");
process.exit(pass ? 0 : 1);
