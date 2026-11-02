import test from "node:test";
import assert from "node:assert/strict";
import {
  createLedgerModel,
  canonicalJson,
} from "../src/services/ledgerService.js";

const artifactDataUrl = "data:image/png;base64,AAECAwQ=";

function model() {
  let id = 0;
  return createLedgerModel({
    now: () => new Date("2026-09-26T12:00:00.000Z"),
    idFactory: (prefix) => `${prefix}-test-${++id}`,
  });
}

test("canonical JSON recursively sorts object keys and preserves arrays", () => {
  assert.equal(
    canonicalJson({ z: 1, a: { y: 2, x: 3 }, list: [{ b: 1, a: 2 }] }),
    '{"a":{"x":3,"y":2},"list":[{"a":2,"b":1}],"z":1}',
  );
});

test("sample dashboard derives balances and totals from ledger entries", async () => {
  const ledger = model();
  await ledger.ready;
  const dashboard = ledger.getDashboard();
  assert.equal(dashboard.customerCount, 6);
  assert.equal(dashboard.receivablesCents, 845000);
  assert.equal(dashboard.creditCents, 15000);
  assert.equal(dashboard.overdueCents, 610000);
  assert.equal(dashboard.overdueByCustomer["c-001"], 425000);
  assert.equal(dashboard.overdueByCustomer["c-002"], 0);
  assert.equal(dashboard.overdueByCustomer["c-003"], 185000);
  assert.deepEqual(
    ledger.getState().customers.map((customer) => customer.name),
    [
      "Aling Rosa",
      "Jun Reyes",
      "Ana Cruz",
      "Liza Mendoza",
      "Ben Navarro",
      "Ramon Castillo",
    ],
  );
  assert.equal(
    ledger.getCustomer("c-001").transactions[0].due_at,
    "2026-09-18",
  );
  assert.equal(
    ledger.getCustomer("c-002").transactions[0].due_at,
    "2026-10-05",
  );
  assert.equal(ledger.getCustomer("c-001").balance_cents, 425000);
  assert.equal(ledger.getCustomer("c-004").balance_cents, 0);
  assert.equal(ledger.getCustomer("c-005").balance_cents, -15000);
  assert.equal((await ledger.verifyChain()).valid, true);
});

test("customer creation and transactions work directly with integer cents and hash decoded artifact bytes", async () => {
  const ledger = model();
  await ledger.ready;
  const customer = await ledger.addCustomer("Gina Lim");
  const transaction = await ledger.addTransaction({
    customerId: customer.id,
    type: "utang",
    amountCents: 8750,
    lineItems: [{ label: "Rice", quantity: 1, unit_price_cents: 8750 }],
    artifactDataUrl,
  });
  assert.equal(transaction.balance_after_cents, 8750);
  assert.equal(
    transaction.artifact_hash,
    "08bb5e5d6eaac1049ede0893d30ed022b1a4d9b5b48db414871f51c9cb35283d",
  );
  assert.equal((await ledger.verifyChain()).valid, true);
  await assert.rejects(
    ledger.addTransaction({
      customerId: customer.id,
      type: "payment",
      amountCents: 5.5,
    }),
    /integer number/,
  );
  await assert.rejects(
    ledger.addTransaction({
      customerId: customer.id,
      type: "utang",
      amountCents: 8750,
      lineItems: [{ label: "Rice", quantity: 1, unit_price_cents: 8751 }],
      artifactDataUrl,
    }),
    /must equal/,
  );
  await assert.rejects(
    ledger.addTransaction({
      customerId: "c-001",
      type: "utang",
      amountCents: Number.MAX_SAFE_INTEGER,
      artifactDataUrl,
    }),
    /safe integer/,
  );
});

test("void appends an offset correction, preserves the source, and rebuilds a valid chain", async () => {
  const ledger = model();
  await ledger.ready;
  const result = await ledger.voidTransaction("t-001");
  const customer = ledger.getCustomer("c-001");
  assert.equal(result.original.voided, true);
  assert.equal(result.correction.voids_tx_id, "t-001");
  assert.equal(customer.balance_cents, 0);
  assert.equal(customer.transactions.length, 2);
  assert.equal((await ledger.verifyChain()).valid, true);
  await assert.rejects(
    ledger.voidTransaction(result.correction.id),
    /cannot be voided/,
  );
});

test("hard deletion removes the row and rebuilds balances and the chain", async () => {
  const ledger = model();
  await ledger.ready;
  await ledger.hardDeleteTransaction("t-002");
  assert.equal(ledger.getCustomer("c-002").balance_cents, 0);
  assert.equal((await ledger.verifyChain()).valid, true);
});

test("tamper is detected and restoring the saved row preserves session state", async () => {
  const ledger = model();
  await ledger.ready;
  await ledger.tamperTransaction("t-001", {
    note: "changed without rehashing",
  });
  const failed = await ledger.verifyChain();
  assert.equal(failed.valid, false);
  assert.equal(failed.brokenId, "t-001");
  await assert.rejects(
    ledger.addCustomer("Gina Lim"),
    /Restore the demo chain/,
  );
  await ledger.restoreSampleData();
  assert.equal(ledger.getCustomer("c-001").transactions.length, 1);
  assert.equal((await ledger.verifyChain()).valid, true);
});

test("FIFO payments reduce the oldest overdue balance", async () => {
  const ledger = model();
  await ledger.ready;
  await ledger.addTransaction({
    customerId: "c-006",
    type: "utang",
    amountCents: 20000,
    dueAt: "2026-09-01",
    artifactDataUrl,
  });
  await ledger.addTransaction({
    customerId: "c-006",
    type: "utang",
    amountCents: 30000,
    dueAt: "2026-10-01",
    artifactDataUrl,
  });
  await ledger.addTransaction({
    customerId: "c-006",
    type: "payment",
    amountCents: 15000,
  });
  const dashboard = ledger.getDashboard();
  assert.equal(dashboard.overdueByCustomer["c-006"], 5000);
  assert.equal(dashboard.overdueCents, 615000);
});

test("voided payment and correction do not count as collection today or overdue allocation", async () => {
  const ledger = model();
  await ledger.ready;
  const payment = await ledger.addTransaction({
    customerId: "c-001",
    type: "payment",
    amountCents: 10000,
  });
  await ledger.voidTransaction(payment.id);
  const dashboard = ledger.getDashboard();
  assert.equal(dashboard.collectionTodayCents, 0);
  assert.equal(dashboard.overdueByCustomer["c-001"], 425000);
  assert.equal((await ledger.verifyChain()).valid, true);
});

test("editing an utang preserves payments, updates balances, and records revision history", async () => {
  const ledger = model();
  await ledger.ready;
  const customer = await ledger.addCustomer("Edit Test");
  const utang = await ledger.addTransaction({
    customerId: customer.id,
    type: "utang",
    amountCents: 10000,
    lineItems: [{ label: "Rice", quantity: 2, unit_price_cents: 5000 }],
    dueAt: "2026-10-01",
    note: "Original",
    artifactDataUrl,
  });
  const payment = await ledger.addTransaction({
    customerId: customer.id,
    type: "payment",
    amountCents: 4000,
  });
  const updated = await ledger.editTransaction(utang.id, {
    amountCents: 12000,
    lineItems: [{ label: "Rice", quantity: 2, unit_price_cents: 6000 }],
    dueAt: "2026-10-08",
    note: "Corrected price",
    reason: "Receipt showed a different unit price",
  });
  assert.equal(updated.id, utang.id);
  assert.equal(ledger.getCustomer(customer.id).balance_cents, 8000);
  assert.equal(ledger.getCustomer(customer.id).transactions.length, 2);
  assert.equal(ledger.getState().transactions.find((tx) => tx.id === payment.id).amount_cents, 4000);
  assert.equal(updated.edit_history.length, 1);
  assert.equal(updated.edit_history[0].previous.amount_cents, 10000);
  assert.equal(updated.edit_history[0].updated.amount_cents, 12000);
  assert.equal((await ledger.verifyChain()).valid, true);
  await assert.rejects(
    ledger.editTransaction(utang.id, {
      amountCents: 3000,
      note: "Too low",
      reason: "Invalid reduction",
    }),
    /already has 4000 centavos applied/,
  );
});

test("resetSamples restores the sample fixture from a broken chain", async () => {
  const ledger = model();
  await ledger.ready;
  await ledger.tamperTransaction("t-001", { amount_cents: 10 });
  await ledger.resetSamples();
  assert.equal(ledger.getCustomer("c-001").balance_cents, 425000);
  assert.equal((await ledger.verifyChain()).valid, true);
});
