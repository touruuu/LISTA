const text = (value, label, optional = false) => {
  const result = String(value ?? "").trim();
  if (!result && !optional) throw new Error(`${label} is missing from this QR receipt.`);
  return result;
};

const cents = (value, label) => {
  if (!Number.isSafeInteger(value) || value < 0)
    throw new Error(`${label} is invalid in this QR receipt.`);
  return value;
};

export function parseListaReceiptPayload(raw) {
  let payload;
  try {
    payload = JSON.parse(String(raw ?? ""));
  } catch {
    throw new Error("This image does not contain a supported LISTA receipt QR.");
  }
  if (!payload || payload.app !== "LISTA" || payload.v !== 1)
    throw new Error("This QR format is not supported by the LISTA borrower demo.");
  const at = text(payload.at, "Transaction date");
  if (Number.isNaN(Date.parse(at))) throw new Error("Transaction date is invalid in this QR receipt.");
  if (!["Utang", "Payment"].includes(payload.type))
    throw new Error("Transaction type is invalid in this QR receipt.");
  return {
    store: text(payload.store, "Store"),
    customer: text(payload.customer, "Customer", true),
    type: payload.type,
    amountCents: cents(payload.amount, "Amount"),
    balanceCents: cents(Math.abs(payload.balance), "Balance") * (payload.balance < 0 ? -1 : 1),
    reference: text(payload.ref, "Reference"),
    createdAt: at,
  };
}

export function addScannedReceipt(receipts, receipt) {
  if (receipts.some((entry) => entry.reference === receipt.reference))
    throw new Error("This receipt reference has already been imported.");
  return [...receipts, { ...receipt, importedAt: new Date().toISOString(), source: "scanned-demo" }];
}

export function createPaymentRequest({ method, amountCents, utangReference = "", paymentReference = "" }) {
  if (!["Cash", "GCash", "Maya", "Bank Transfer"].includes(method))
    throw new Error("Choose a supported demo payment method.");
  if (!Number.isSafeInteger(amountCents) || amountCents <= 0)
    throw new Error("Enter a valid payment amount.");
  return {
    id: `DEMO-REQ-${globalThis.crypto?.randomUUID?.() || Date.now()}`,
    method,
    amount_cents: amountCents,
    utang_reference: text(utangReference, "Selected utang"),
    payment_reference: text(paymentReference, "Payment reference", true),
    status: "Pending Confirmation",
    created_at: new Date().toISOString(),
    demo_only: true,
  };
}
