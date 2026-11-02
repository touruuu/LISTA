import test from "node:test";
import assert from "node:assert/strict";
import { createAuthService } from "../src/services/authService.js";

function fakeClient({ profileRole = "owner", signupSession = true } = {}) {
  const calls = { signups: [], logins: [], signouts: 0 };
  const profile = { user_id: "user-1", role: profileRole, display_name: "Rosa Reyes", mobile_number: null };
  const client = {
    calls,
    from(table) {
      assert.equal(table, "profiles");
      return { select: () => ({ eq: () => ({ single: async () => ({ data: profile, error: null }) }) }) };
    },
    auth: {
      async signUp(input) {
        calls.signups.push(input);
        return { data: { user: { id: "user-1" }, session: signupSession ? { user: { id: "user-1" } } : null }, error: null };
      },
      async signInWithPassword(input) {
        calls.logins.push(input);
        return { data: { user: { id: "user-1" }, session: { user: { id: "user-1" } } }, error: null };
      },
      async getSession() { return { data: { session: { user: { id: "user-1" } } }, error: null }; },
      async signOut() { calls.signouts += 1; return { error: null }; },
      onAuthStateChange() { return { data: { subscription: { unsubscribe() {} } } }; },
    },
  };
  return client;
}

test("registration sends role metadata used by the database trigger", async () => {
  const client = fakeClient();
  const result = await createAuthService(client).register({ email: " OWNER@EXAMPLE.COM ", password: "password123", displayName: " Rosa Reyes ", role: "owner" });
  assert.equal(client.calls.signups[0].email, "owner@example.com");
  assert.deepEqual(client.calls.signups[0].options.data, { lista_role: "owner", display_name: "Rosa Reyes", mobile_number: null });
  assert.equal(result.profile.role, "owner");
});

test("email-confirmation registration does not assume a session or profile", async () => {
  const result = await createAuthService(fakeClient({ signupSession: false })).register({ email: "borrower@example.com", password: "password123", displayName: "Ben Cruz", role: "borrower" });
  assert.equal(result.requiresEmailConfirmation, true);
  assert.equal(result.profile, null);
});

test("login rejects a mismatched role and securely signs out", async () => {
  const client = fakeClient({ profileRole: "borrower" });
  await assert.rejects(() => createAuthService(client).login({ email: "b@example.com", password: "password123", expectedRole: "owner" }), /registered as a Borrower/);
  assert.equal(client.calls.signouts, 1);
});

test("current session loads the server profile and logout revokes it", async () => {
  const client = fakeClient({ profileRole: "borrower" });
  const service = createAuthService(client);
  assert.equal((await service.current()).profile.role, "borrower");
  await service.logout();
  assert.equal(client.calls.signouts, 1);
});
