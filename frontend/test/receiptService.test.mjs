import test from "node:test";
import assert from "node:assert/strict";
import { buildReceiptData, receiptPayload } from "../src/services/receiptService.js";

const customer = { id: "c-9", name: "Maria Santos" };

test("utang receipt payload contains the actual saved transaction values", () => {
  const transaction = {
    id: "tx-utang-123",
    customer_id: customer.id,
    type: "utang",
    amount_cents: 12550,
    balance_after_cents: 42550,
    created_at: "2026-11-03T09:10:11.000Z",
  };
  const receipt = buildReceiptData(transaction, customer, "Tindahan ni Rosa");
  const payload = JSON.parse(receiptPayload(receipt));
  assert.deepEqual(payload, {
    app: "LISTA",
    v: 1,
    store: "Tindahan ni Rosa",
    customer: "Maria Santos",
    type: "Utang",
    amount: 12550,
    balance: 42550,
    ref: "tx-utang-123",
    at: "2026-11-03T09:10:11.000Z",
  });
});

test("payment receipt preserves credit balances and the saved reference", () => {
  const transaction = {
    id: "tx-payment-456",
    customer_id: customer.id,
    type: "payment",
    amount_cents: 50000,
    balance_after_cents: -7500,
    created_at: "2026-11-03T10:20:30.000Z",
  };
  const payload = JSON.parse(receiptPayload(buildReceiptData(transaction, customer, "LISTA Store")));
  assert.equal(payload.type, "Payment");
  assert.equal(payload.amount, 50000);
  assert.equal(payload.balance, -7500);
  assert.equal(payload.ref, "tx-payment-456");
});

test("missing and invalid receipt data fails with a readable error", () => {
  assert.throws(() => buildReceiptData(null, customer, "Store"), /Transaction data is unavailable/);
  assert.throws(() => buildReceiptData({ type: "refund" }, customer, "Store"), /type is invalid/);
  assert.throws(() => buildReceiptData({ type: "utang", amount_cents: 100, balance_after_cents: 100, id: "x", created_at: "bad" }, customer, "Store"), /date is invalid/);
});
