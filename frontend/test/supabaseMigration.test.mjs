import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const migration = await readFile(new URL("../../supabase/migrations/202611030001_phase2_auth_foundation.sql", import.meta.url), "utf8");

test("Phase 2 migration enables RLS and scopes reads to the signed-in user", () => {
  assert.match(migration, /alter table public\.profiles enable row level security/i);
  assert.match(migration, /alter table public\.stores enable row level security/i);
  assert.match(migration, /profiles_select_self[\s\S]*auth\.uid\(\)[\s\S]*user_id/i);
  assert.match(migration, /owners_select_own_store[\s\S]*auth\.uid\(\)[\s\S]*owner_user_id/i);
});

test("clients cannot insert profiles, stores, or change protected role/ownership columns", () => {
  assert.match(migration, /revoke insert, delete on public\.profiles from anon, authenticated/i);
  assert.match(migration, /grant update \(display_name, mobile_number\) on public\.profiles to authenticated/i);
  assert.match(migration, /revoke insert, delete on public\.stores from anon, authenticated/i);
  assert.match(migration, /grant update \(display_name\) on public\.stores to authenticated/i);
});

test("auth trigger creates a profile and an owner-only initial store", () => {
  assert.match(migration, /security definer\s+set search_path = ''/i);
  assert.match(migration, /insert into public\.profiles/i);
  assert.match(migration, /if requested_role = 'owner'[\s\S]*insert into public\.stores/i);
  assert.match(migration, /after insert on auth\.users/i);
});
