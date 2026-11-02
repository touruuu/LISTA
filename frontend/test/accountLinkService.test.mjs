import test from "node:test";
import assert from "node:assert/strict";
import { createAccountLinkPayload, parseAccountLinkPayload, createAccountLinkService } from "../src/services/accountLinkService.js";

const token = "ab".repeat(32);

test("Account QR payload is compact and contains only version, kind, and opaque token", () => {
  const payload = createAccountLinkPayload(token);
  assert.deepEqual(JSON.parse(payload), { v: 1, k: "lista-account-link", t: token });
  assert.deepEqual(parseAccountLinkPayload(payload), { token });
  assert.doesNotMatch(payload, /name|email|user_id|borrower/i);
});

test("Account QR parser rejects malformed, unsupported, and non-token payloads", () => {
  assert.throws(() => parseAccountLinkPayload("not json"), /not a supported/i);
  assert.throws(() => parseAccountLinkPayload(JSON.stringify({ v: 2, k: "lista-account-link", t: token })), /not a supported/i);
  assert.throws(() => parseAccountLinkPayload(JSON.stringify({ v: 1, k: "lista-account-link", t: "short" })), /not a supported/i);
});

test("service translates expired, replayed, unauthorized, and duplicate RPC errors", async () => {
  for (const [serverMessage, expected] of [
    ["Token is invalid, expired, or already used", /expired, invalid, or has already been used/i],
    ["This operation requires a owner account", /not authorized/i],
    ["duplicate key value violates unique constraint", /already linked/i],
  ]) {
    const client = { rpc: async () => ({ data: null, error: { message: serverMessage } }) };
    await assert.rejects(() => createAccountLinkService(client).preview(token), expected);
  }
});

test("service sends explicit customer mode and local reference to redemption RPC", async () => {
  const calls = [];
  const client = { rpc: async (name, args) => { calls.push({ name, args }); return { data: [{ link_id: "l1" }], error: null }; } };
  await createAccountLinkService(client).redeem({ token, mode: "existing", customerName: "Maria", localCustomerRef: "c-local" });
  assert.deepEqual(calls[0], { name: "redeem_account_link_token", args: { p_token: token, p_mode: "existing", p_customer_name: "Maria", p_local_customer_ref: "c-local", p_customer_id: null } });
});
