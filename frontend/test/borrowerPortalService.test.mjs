import test from "node:test";
import assert from "node:assert/strict";
import { addScannedReceipt, createPaymentRequest, parseListaReceiptPayload } from "../src/services/borrowerPortalService.js";

const validPayload = JSON.stringify({
  app: "LISTA", v: 1, store: "Demo Store", customer: "Maria Santos",
  type: "Utang", amount: 12500, balance: 30000, ref: "TX-QR-1",
  at: "2026-11-03T10:00:00+08:00",
});

test("valid LISTA receipt payload is parsed without treating it as verification", () => {
  const receipt = parseListaReceiptPayload(validPayload);
  assert.equal(receipt.store, "Demo Store");
  assert.equal(receipt.reference, "TX-QR-1");
  assert.equal(receipt.amountCents, 12500);
  assert.equal(receipt.customer, "Maria Santos");
  assert.equal("verified" in receipt, false);
});

test("invalid and unsupported QR payloads fail gracefully", () => {
  assert.throws(() => parseListaReceiptPayload("not json"), /supported LISTA receipt/i);
  assert.throws(() => parseListaReceiptPayload(JSON.stringify({ app: "LISTA", v: 2 })), /not supported/i);
  assert.throws(() => parseListaReceiptPayload(JSON.stringify({ app: "OTHER", v: 1 })), /not supported/i);
});

test("duplicate scanned receipt references are rejected", () => {
  const receipt = parseListaReceiptPayload(validPayload);
  const imported = addScannedReceipt([], receipt);
  assert.equal(imported.length, 1);
  assert.throws(() => addScannedReceipt(imported, receipt), /already been imported/i);
});

test("cash and online submissions create pending demo-only requests", () => {
  for (const method of ["Cash", "GCash", "Maya", "Bank Transfer"]) {
    const request = createPaymentRequest({ method, amountCents: 5000, utangReference: "DEMO-U-1001", paymentReference: "OPTIONAL" });
    assert.equal(request.status, "Pending Confirmation");
    assert.equal(request.demo_only, true);
    assert.equal(request.amount_cents, 5000);
  }
  assert.throws(() => createPaymentRequest({ method: "Real Gateway", amountCents: 5000, utangReference: "x" }), /supported demo payment method/i);
});
