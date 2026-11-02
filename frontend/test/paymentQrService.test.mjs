import test from "node:test";
import assert from "node:assert/strict";
import { createLedgerModel } from "../src/services/ledgerService.js";
import { createPaymentQrPayload, outstandingForUtang, parsePaymentQrPayload, validatePaymentRequest } from "../src/services/paymentQrService.js";

const request = (overrides = {}) => parsePaymentQrPayload(createPaymentQrPayload({
  storeId: "STORE-1", customerId: "C-1", utangId: "U-1", amountCents: 4000,
  method: "Cash", requestId: "REQ-1", createdAt: "2026-11-03T10:00:00+08:00", ...overrides,
}));

const rows = [
  { id: "U-1", customer_id: "C-1", type: "utang", amount_cents: 10000 },
  { id: "P-1", customer_id: "C-1", type: "payment", amount_cents: 3000 },
  { id: "U-2", customer_id: "C-1", type: "utang", amount_cents: 5000 },
];

test("cash and online payment QR payloads round-trip without private details", () => {
  for (const method of ["Cash", "GCash", "Maya", "Bank Transfer"]) {
    const raw = createPaymentQrPayload({ storeId: "STORE-1", customerId: "C-1", utangId: "U-1", amountCents: 1250, method, externalReference: "EXT-9", requestId: `REQ-${method}`, createdAt: "2026-11-03T10:00:00Z" });
    const parsed = parsePaymentQrPayload(raw);
    assert.equal(parsed.method, method);
    assert.equal(parsed.amountCents, 1250);
    assert.doesNotMatch(raw, /password|pin|otp/i);
  }
});

test("outstanding amount uses FIFO partial-payment allocation", () => {
  assert.equal(outstandingForUtang(rows, "U-1"), 7000);
  assert.equal(outstandingForUtang(rows, "U-2"), 5000);
});

test("validation rejects tampering, wrong stores, unknown customers, duplicates, excess, and paid targets", () => {
  const context = { storeId: "STORE-1", customers: [{ id: "C-1", name: "Customer" }], transactions: rows, processedRequestIds: new Set() };
  assert.equal(validatePaymentRequest(request(), context).outstandingCents, 7000);
  assert.throws(() => parsePaymentQrPayload('{"app":"LISTA","kind":"payment_request","v":1,"amount":1}'), /method|unsupported/i);
  assert.throws(() => validatePaymentRequest(request({ storeId: "OTHER" }), context), /different store/i);
  assert.throws(() => validatePaymentRequest(request({ customerId: "UNKNOWN" }), context), /customer.*not found/i);
  assert.throws(() => validatePaymentRequest(request({ amountCents: 8000 }), context), /exceeds/i);
  assert.throws(() => validatePaymentRequest(request(), { ...context, processedRequestIds: new Set(["REQ-1"]) }), /already processed/i);
  const paidRows = [...rows, { id: "P-2", customer_id: "C-1", type: "payment", amount_cents: 7000 }];
  assert.throws(() => validatePaymentRequest(request(), { ...context, transactions: paidRows }), /fully paid/i);
});

test("owner confirmation can record through the existing ledger payment operation", async () => {
  let id = 0;
  const ledger = createLedgerModel({ now: () => new Date("2026-11-03T02:00:00Z"), idFactory: (prefix) => `${prefix}-${++id}` });
  await ledger.ready;
  const customer = await ledger.addCustomer("QR Customer");
  const utang = await ledger.addTransaction({ customerId: customer.id, type: "utang", amountCents: 10000, artifactDataUrl: "data:image/png;base64,AA==" });
  const raw = createPaymentQrPayload({ storeId: "STORE-X", customerId: customer.id, utangId: utang.id, amountCents: 4000, method: "Cash", requestId: "REQ-X", createdAt: "2026-11-03T10:00:00+08:00" });
  const parsed = parsePaymentQrPayload(raw);
  validatePaymentRequest(parsed, { storeId: "STORE-X", customers: ledger.getState().customers, transactions: ledger.getState().transactions, processedRequestIds: new Set() });
  await ledger.addTransaction({ customerId: customer.id, type: "payment", amountCents: parsed.amountCents, note: "QR Cash" });
  assert.equal(ledger.getCustomer(customer.id).balance_cents, 6000);
  assert.equal(ledger.getCustomer(customer.id).transactions.at(-1).type, "payment");
});
