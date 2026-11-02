import { requireSupabase, supabase } from "./supabaseClient.js";

export const ACCOUNT_LINK_KIND = "lista-account-link";
export const ACCOUNT_LINK_VERSION = 1;

export function createAccountLinkPayload(token) {
  const clean = String(token || "").trim();
  if (!/^[a-f0-9]{64}$/i.test(clean)) throw new Error("Account link token is invalid.");
  return JSON.stringify({ v: ACCOUNT_LINK_VERSION, k: ACCOUNT_LINK_KIND, t: clean.toLowerCase() });
}

export function parseAccountLinkPayload(value) {
  let parsed;
  try { parsed = JSON.parse(String(value || "")); }
  catch { throw new Error("This is not a supported LISTA Account QR."); }
  if (parsed?.v !== ACCOUNT_LINK_VERSION || parsed?.k !== ACCOUNT_LINK_KIND || !/^[a-f0-9]{64}$/i.test(parsed?.t || ""))
    throw new Error("This is not a supported LISTA Account QR.");
  return { token: parsed.t.toLowerCase() };
}

function message(error) {
  const text = error?.message || "Account linking failed.";
  if (/invalid, expired, or already used/i.test(text)) return "This Account QR is expired, invalid, or has already been used.";
  if (/already linked|duplicate key/i.test(text)) return "This borrower is already linked to this store.";
  if (/requires a .* account|permission denied|not authorized/i.test(text)) return "Your account is not authorized for this action.";
  return text;
}

export function createAccountLinkService(client = supabase) {
  const api = () => client || requireSupabase();
  async function rpc(name, args = {}) {
    const { data, error } = await api().rpc(name, args);
    if (error) throw new Error(message(error));
    return Array.isArray(data) ? data[0] : data;
  }
  return {
    async issue() {
      const row = await rpc("issue_account_link_token");
      return { token: row.token, expiresAt: row.expires_at, payload: createAccountLinkPayload(row.token) };
    },
    preview(token) { return rpc("preview_account_link_token", { p_token: token }); },
    redeem({ token, mode, customerName, localCustomerRef = null, customerId = null }) {
      return rpc("redeem_account_link_token", { p_token: token, p_mode: mode, p_customer_name: customerName, p_local_customer_ref: localCustomerRef, p_customer_id: customerId });
    },
    revoke(linkId) { return rpc("revoke_borrower_store_link", { p_link_id: linkId }); },
  };
}

export const accountLinkService = createAccountLinkService();
