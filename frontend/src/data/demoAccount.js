export const DEMO_EMAIL = "demo@lista.app";
export const DEMO_PASSWORD = "demo1234";
export const DEMO_STORE_NAME = "Aling Maria's Sari-Sari Store";
export const DEMO_BORROWER = { id: "c-demo-juan", name: "Juan Dela Cruz" };
export const DEMO_SESSION_KEY = "lista-demo-session";
export const DEMO_LEDGER_KEY = "lista-demo-ledger-v1";

export const DEMO_LEDGER_SEED = {
  customers: [{ ...DEMO_BORROWER, created_at: "2026-10-01T08:00:00.000Z" }],
  prices: [
    { label: "Rice (1 kg)", unit_price_cents: 6500, updated_at: "2026-10-01T08:00:00.000Z" },
    { label: "Canned sardines", unit_price_cents: 2800, updated_at: "2026-10-01T08:00:00.000Z" },
  ],
  transactions: [
    { id: "t-demo-opening", customer_id: DEMO_BORROWER.id, type: "utang", amount_cents: 50000, balance_after_cents: 0, line_items: null, note: "Opening demo groceries", artifact: null, artifact_hash: null, prev_tx_hash: null, tx_hash: null, due_at: "2026-10-20", voided: false, voids_tx_id: null, edit_history: [], created_at: "2026-10-01T08:30:00.000Z" },
    { id: "t-demo-settled", customer_id: DEMO_BORROWER.id, type: "payment", amount_cents: 50000, balance_after_cents: 0, line_items: null, note: "Opening balance settled", artifact: null, artifact_hash: null, prev_tx_hash: null, tx_hash: null, due_at: null, voided: false, voids_tx_id: null, edit_history: [], created_at: "2026-10-02T09:00:00.000Z" },
  ],
  statements: {},
};

export function isDemoCredentials(email, password) {
  return String(email || "").trim().toLowerCase() === DEMO_EMAIL && password === DEMO_PASSWORD;
}

export function readDemoSession(storage = globalThis.localStorage) {
  try {
    const value = JSON.parse(storage?.getItem(DEMO_SESSION_KEY) || "null");
    return value?.active === true && ["owner", "borrower"].includes(value.portal) ? value : null;
  } catch { return null; }
}

export function writeDemoSession(portal = "owner", storage = globalThis.localStorage) {
  const session = { active: true, portal: portal === "borrower" ? "borrower" : "owner" };
  storage?.setItem(DEMO_SESSION_KEY, JSON.stringify(session));
  return session;
}

export function clearDemoSession(storage = globalThis.localStorage) {
  storage?.removeItem(DEMO_SESSION_KEY);
}
