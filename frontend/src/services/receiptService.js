import QRCode from "qrcode";

const requiredText = (value, label) => {
  const text = String(value ?? "").trim();
  if (!text) throw new Error(`${label} is unavailable for this receipt.`);
  return text;
};

const requiredCents = (value, label) => {
  if (!Number.isSafeInteger(value))
    throw new Error(`${label} is invalid for this receipt.`);
  return value;
};

export function buildReceiptData(transaction, customer, storeName) {
  if (!transaction || typeof transaction !== "object")
    throw new Error("Transaction data is unavailable for this receipt.");
  if (!customer || typeof customer !== "object")
    throw new Error("Customer data is unavailable for this receipt.");
  if (!['utang', 'payment'].includes(transaction.type))
    throw new Error("Transaction type is invalid for this receipt.");
  const createdAt = requiredText(transaction.created_at, "Transaction date");
  if (Number.isNaN(Date.parse(createdAt)))
    throw new Error("Transaction date is invalid for this receipt.");

  return {
    store: requiredText(storeName, "Store name"),
    customer: requiredText(customer.name, "Customer name"),
    type: transaction.type,
    amountCents: requiredCents(transaction.amount_cents, "Transaction amount"),
    balanceCents: requiredCents(transaction.balance_after_cents, "Remaining balance"),
    reference: requiredText(transaction.id, "Transaction reference"),
    createdAt,
  };
}

export function receiptPayload(receipt) {
  return JSON.stringify({
    app: "LISTA",
    v: 1,
    store: receipt.store,
    customer: receipt.customer,
    type: receipt.type === "utang" ? "Utang" : "Payment",
    amount: receipt.amountCents,
    balance: receipt.balanceCents,
    ref: receipt.reference,
    at: receipt.createdAt,
  });
}

export async function drawReceiptQr(canvas, receipt) {
  if (!(canvas instanceof HTMLCanvasElement))
    throw new Error("The receipt QR could not be displayed.");
  await QRCode.toCanvas(canvas, receiptPayload(receipt), {
    errorCorrectionLevel: "M",
    margin: 2,
    width: 232,
    color: { dark: "#0d3b37", light: "#ffffff" },
  });
}

export async function drawQrPayload(canvas, payload, width = 280) {
  if (!(canvas instanceof HTMLCanvasElement)) throw new Error("The QR code could not be displayed.");
  await QRCode.toCanvas(canvas, payload, {
    errorCorrectionLevel: "M",
    margin: 2,
    width,
    color: { dark: "#0d3b37", light: "#ffffff" },
  });
}

const wrap = (context, text, maxWidth) => {
  const words = String(text).split(/\s+/);
  const lines = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (line && context.measureText(next).width > maxWidth) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines;
};

export function drawReceiptImage(canvas, qrCanvas, receipt, formatMoney, formatDateTime) {
  const width = 720, height = 1100, context = canvas.getContext("2d");
  canvas.width = width;
  canvas.height = height;
  context.fillStyle = "#f3f8f7";
  context.fillRect(0, 0, width, height);
  context.fillStyle = "#ffffff";
  context.fillRect(38, 38, width - 76, height - 76);
  context.fillStyle = "#087f75";
  context.fillRect(38, 38, width - 76, 132);
  context.fillStyle = "#ffffff";
  context.font = "700 38px sans-serif";
  context.fillText("LISTA RECEIPT", 74, 100);
  context.font = "22px sans-serif";
  wrap(context, receipt.store, 560).slice(0, 2).forEach((line, index) => context.fillText(line, 74, 136 + index * 25));

  context.fillStyle = "#19312f";
  context.textAlign = "center";
  context.font = "700 50px sans-serif";
  context.fillText(formatMoney(receipt.amountCents), width / 2, 245);
  context.font = "700 22px sans-serif";
  context.fillStyle = "#087f75";
  context.fillText(receipt.type === "utang" ? "UTANG" : "PAYMENT", width / 2, 282);
  context.drawImage(qrCanvas, (width - 276) / 2, 315, 276, 276);

  context.textAlign = "left";
  const rows = [
    ["Customer", receipt.customer],
    ["Remaining balance", formatMoney(receipt.balanceCents, true)],
    ["Reference", receipt.reference],
    ["Date and time", formatDateTime(receipt.createdAt)],
  ];
  let y = 650;
  rows.forEach(([label, value]) => {
    context.fillStyle = "#5d7471";
    context.font = "18px sans-serif";
    context.fillText(label, 74, y);
    context.fillStyle = "#19312f";
    context.font = "700 21px sans-serif";
    const lines = wrap(context, value, 520).slice(0, 2);
    lines.forEach((line, index) => context.fillText(line, 74, y + 31 + index * 26));
    y += 92 + Math.max(0, lines.length - 1) * 26;
  });
  context.fillStyle = "#5d7471";
  context.font = "17px sans-serif";
  context.fillText("QR contains receipt details only. No online verification is provided.", 74, 1010);
}
