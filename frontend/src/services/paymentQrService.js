const METHODS = new Set(["Cash", "GCash", "Maya", "Bank Transfer"]);
const MAX_PAYLOAD_LENGTH = 2048;

const required = (value, label, max = 160) => {
  const result = String(value ?? "").trim();
  if (!result) throw new Error(`${label} is required.`);
  if (result.length > max) throw new Error(`${label} is too long.`);
  return result;
};

export function outstandingForUtang(transactions, targetId) {
  const source = transactions.find((tx) => tx.id === targetId);
  if (!source || source.type !== "utang" || source.voided || source.voids_tx_id) return 0;
  const rows = transactions.filter((tx) => tx.customer_id === source.customer_id && !tx.voided && !tx.voids_tx_id);
  const lots = [];
  for (const tx of rows) {
    if (tx.type === "utang") lots.push({ id: tx.id, remaining: tx.amount_cents });
    else if (tx.type === "payment") {
      let payment = tx.amount_cents;
      for (const lot of lots) {
        const applied = Math.min(payment, lot.remaining);
        lot.remaining -= applied;
        payment -= applied;
        if (!payment) break;
      }
    }
  }
  return lots.find((lot) => lot.id === targetId)?.remaining || 0;
}

export function createPaymentQrPayload({ storeId, customerId, utangId, amountCents, method, externalReference = "", requestId, createdAt }) {
  if (!Number.isSafeInteger(amountCents) || amountCents <= 0)
    throw new Error("Payment amount must be a positive integer number of centavos.");
  if (!METHODS.has(method)) throw new Error("Payment method is unsupported.");
  const payload = {
    app: "LISTA",
    kind: "payment_request",
    v: 1,
    request: required(requestId || globalThis.crypto?.randomUUID?.(), "Payment request ID"),
    store: required(storeId, "Store identifier"),
    customer: required(customerId, "Customer identifier"),
    utang: required(utangId, "Utang transaction identifier"),
    amount: amountCents,
    method,
    externalRef: String(externalReference ?? "").trim().slice(0, 100),
    at: createdAt || new Date().toISOString(),
  };
  if (Number.isNaN(Date.parse(payload.at))) throw new Error("Creation timestamp is invalid.");
  return JSON.stringify(payload);
}

export function parsePaymentQrPayload(raw) {
  const input = String(raw ?? "");
  if (!input || input.length > MAX_PAYLOAD_LENGTH) throw new Error("Payment QR payload is empty or too large.");
  let payload;
  try { payload = JSON.parse(input); }
  catch { throw new Error("This is not a supported LISTA payment QR."); }
  if (payload?.app !== "LISTA" || payload.kind !== "payment_request" || payload.v !== 1)
    throw new Error("This LISTA payment QR type or version is unsupported.");
  if (!METHODS.has(payload.method)) throw new Error("Payment method is unsupported.");
  if (!Number.isSafeInteger(payload.amount) || payload.amount <= 0)
    throw new Error("Payment amount is invalid.");
  const at = required(payload.at, "Creation timestamp");
  if (Number.isNaN(Date.parse(at))) throw new Error("Creation timestamp is invalid.");
  return {
    requestId: required(payload.request, "Payment request ID"),
    storeId: required(payload.store, "Store identifier"),
    customerId: required(payload.customer, "Customer identifier"),
    utangId: required(payload.utang, "Utang transaction identifier"),
    amountCents: payload.amount,
    method: payload.method,
    externalReference: String(payload.externalRef ?? "").trim().slice(0, 100),
    createdAt: at,
  };
}

export function validatePaymentRequest(request, { storeId, customers, transactions, processedRequestIds }) {
  if (request.storeId !== storeId) throw new Error("This payment request belongs to a different store.");
  if (processedRequestIds.has(request.requestId)) throw new Error("This payment request was already processed.");
  const customer = customers.find((row) => row.id === request.customerId);
  if (!customer) throw new Error("The customer in this payment request was not found.");
  const transaction = transactions.find((row) => row.id === request.utangId && row.customer_id === customer.id);
  if (!transaction || transaction.type !== "utang") throw new Error("The target utang was not found for this customer.");
  const outstandingCents = outstandingForUtang(transactions, transaction.id);
  if (outstandingCents <= 0) throw new Error("The target utang is already fully paid or unavailable.");
  if (request.amountCents > outstandingCents) throw new Error("Payment amount exceeds the target utang’s current outstanding amount.");
  return { customer, transaction, outstandingCents };
}
