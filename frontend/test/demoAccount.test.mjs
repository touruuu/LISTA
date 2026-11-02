import test from "node:test";
import assert from "node:assert/strict";
import { DEMO_BORROWER, DEMO_LEDGER_KEY, DEMO_LEDGER_SEED, clearDemoSession, isDemoCredentials, readDemoSession, writeDemoSession } from "../src/data/demoAccount.js";
import { createLedgerService } from "../src/services/ledgerService.js";

function memoryStorage() {
  const values = new Map();
  return { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, String(value)), removeItem: (key) => values.delete(key) };
}

test("only the exact demo credentials bypass Supabase", () => {
  assert.equal(isDemoCredentials("demo@lista.app", "demo1234"), true);
  assert.equal(isDemoCredentials("DEMO@LISTA.APP ", "demo1234"), true);
  assert.equal(isDemoCredentials("demo@lista.app", "wrong"), false);
  assert.equal(isDemoCredentials("owner@example.com", "demo1234"), false);
});

test("demo portal choice persists and logout clears the complete session", () => {
  const storage = memoryStorage();
  assert.equal(writeDemoSession("borrower", storage).portal, "borrower");
  assert.equal(readDemoSession(storage).portal, "borrower");
  clearDemoSession(storage);
  assert.equal(readDemoSession(storage), null);
});

test("shared demo ledger persists the ₱250 utang and ₱100 payment as a ₱150 balance", async () => {
  const storage = memoryStorage();
  const first = createLedgerService({ storage, storageKey: DEMO_LEDGER_KEY, seed: DEMO_LEDGER_SEED });
  await first.ready;
  await first.addTransaction({ customerId: DEMO_BORROWER.id, type: "utang", amountCents: 25000, note: "Presentation utang", artifact: { mime: "image/png", dataBase64: "QQ==" } });
  await first.addTransaction({ customerId: DEMO_BORROWER.id, type: "payment", amountCents: 10000, note: "Presentation payment" });
  assert.equal(first.getCustomer(DEMO_BORROWER.id).balance_cents, 15000);

  const refreshed = createLedgerService({ storage, storageKey: DEMO_LEDGER_KEY, seed: DEMO_LEDGER_SEED });
  await refreshed.ready;
  assert.equal(refreshed.getCustomer(DEMO_BORROWER.id).balance_cents, 15000);
  assert.equal(refreshed.getCustomer(DEMO_BORROWER.id).transactions.length, 4);
});
