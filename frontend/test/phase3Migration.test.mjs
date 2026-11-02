import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const sql = await readFile(new URL("../../supabase/migrations/202611030002_phase3_borrower_account_linking.sql", import.meta.url), "utf8");

test("tokens expire after ten minutes, are hashed, and cannot be read directly", () => {
  assert.match(sql, /interval '10 minutes'/i);
  assert.match(sql, /digest\(raw_token, 'sha256'\)/i);
  assert.match(sql, /revoke all on public\.account_link_tokens from anon, authenticated/i);
  assert.doesNotMatch(sql, /create policy[^;]+on public\.account_link_tokens/is);
});

test("redemption locks one valid unused token and consumes it atomically", () => {
  assert.match(sql, /used_at is null and expires_at > clock_timestamp\(\)[\s\S]*for update/i);
  assert.match(sql, /update public\.account_link_tokens[\s\S]*set used_at = clock_timestamp\(\)/i);
});

test("role checks and active-link uniqueness prevent unauthorized and duplicate linking", () => {
  assert.match(sql, /require_account_role\('owner'::public\.account_role\)/i);
  assert.match(sql, /require_account_role\('borrower'::public\.account_role\)/i);
  assert.match(sql, /unique index borrower_store_links_active_borrower_key/i);
  assert.match(sql, /where revoked_at is null/i);
});

test("owner and borrower select policies isolate customers and links", () => {
  assert.match(sql, /owners_select_store_customers[\s\S]*owner_user_id = \(select auth\.uid\(\)\)/i);
  assert.match(sql, /borrowers_select_linked_customer[\s\S]*borrower_user_id = \(select auth\.uid\(\)\)/i);
  assert.match(sql, /owners_select_store_links[\s\S]*owner_user_id = \(select auth\.uid\(\)\)/i);
  assert.match(sql, /borrowers_select_own_links[\s\S]*borrower_user_id = \(select auth\.uid\(\)\)/i);
});

test("revocation retains customers and ledger references", () => {
  assert.match(sql, /set revoked_at = clock_timestamp\(\)/i);
  assert.doesNotMatch(sql, /delete from public\.(customers|borrower_store_links)/i);
});
