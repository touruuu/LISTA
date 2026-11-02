import test from "node:test";
import assert from "node:assert/strict";
import { createBorrowerPortalDemo } from "../src/data/borrowerPortalDemo.js";
import { buildReceiptData, receiptPayload } from "../src/services/receiptService.js";

test("borrower demo data is isolated and returned as a fresh copy", () => {
  const first = createBorrowerPortalDemo();
  const second = createBorrowerPortalDemo();
  first.borrower.name = "Changed";
  first.transactions.pop();
  assert.equal(second.borrower.name, "Maria Santos");
  assert.equal(second.transactions.length, 5);
});

test("borrower demo has utang, payments, due dates, and internally consistent balances", () => {
  const demo = createBorrowerPortalDemo();
  assert.ok(demo.transactions.some((tx) => tx.type === "utang" && tx.line_items.length && tx.due_at));
  assert.ok(demo.transactions.some((tx) => tx.type === "payment"));
  const balance = demo.transactions.reduce((total, tx) => total + (tx.type === "utang" ? tx.amount_cents : -tx.amount_cents), 0);
  assert.equal(balance, demo.transactions.at(-1).balance_after_cents);
  assert.equal(balance, 30000);
});

test("borrower receipts use the shared LISTA receipt payload", () => {
  const demo = createBorrowerPortalDemo();
  const transaction = demo.transactions[0];
  const payload = JSON.parse(receiptPayload(buildReceiptData(transaction, demo.borrower, demo.store.name)));
  assert.equal(payload.app, "LISTA");
  assert.equal(payload.customer, demo.borrower.name);
  assert.equal(payload.ref, transaction.id);
  assert.equal(payload.amount, transaction.amount_cents);
});
