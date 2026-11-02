# LISTA web-first presentation design

## Product decision
LISTA's current release is a shared, online, server-authoritative ledger. The offline-first product premise remains a future milestone. Installing the site or packaging it as an IPA/APK does not make the ledger work offline. The existing public Funnel URL remains the release URL; no Funnel reconfiguration is planned.

## Audiences and access
- Anyone with the URL may view fictional/sample ledger data in the shared demo without installing an app or entering a code. Real customer data must not be entered into the public demo until privacy controls are separately designed.
- Presenters enter a shared secret to create, edit, correct, delete, export, or generate customer statement links. The secret is verified by the server, not by a client-side PIN. Do not put it in a URL, build artifact, response body, source file, or browser localStorage.
- Use an HttpOnly, Secure, SameSite session cookie on HTTPS; a same-origin login/logout/status API. Mutations must check both session and request origin. Rate-limit failed code entry. The legacy sync endpoint and developer endpoints cannot bypass authorization. In production, developer tamper/restore/restamp routes are absent. Preserve read-only verification without claiming an unchecked result is OK.
- A fresh viewer browser should not be blocked by the current device-local PIN setup. Presenter authentication replaces it as the web-demo editing gate; the old local PIN is not represented as server security.

## Primary workflow and visual direction
- Operate mode: warm modern counter notebook. Restrained paper surface, ink-dark typography, one distinctive accent, prominent peso amounts, ledger-like row rhythm, no decorative fintech charts or needless animations. Keep adequate contrast and 44px touch targets.
- Home prioritizes search/select customer, then record utang/payment. Secondary aggregate metrics move below the core task.
- Customer page presents a plain-language balance (owes/settled/credit), dated ledger, and prominent presenter actions; viewers get the same readable information with no edit controls.
- Utang/payment flow preserves itemization, price suggestions, optional due date, capture-only photo/signature, and a review/confirmation step. Reject incomplete item rows rather than silently dropping them. Explain evidence and fallback before capture; do not claim irrefutable proof.
- Show explicit network and save states. When disconnected, the shared ledger cannot be read reliably: say internet is required rather than claiming fully offline operation. Preserve any old queued entries; failed entries must remain recoverable and visibly marked. Do not enqueue new entries as if they were confirmed if the read context is unavailable.

## Data correctness and delivery
- No ledger row is silently lost after a 4xx sync response. Duplicate client operation IDs are idempotent. Expose a visible failed/pending count and recovery path.
- `/api/dashboard` must not assert chain integrity without verifying. Polling should notice existing price changes. Customer history must not silently truncate at 500 rows; use complete per-customer history or pagination. Ledger and statement order must follow server write order.
- Keep databases and artifact files outside the replaceable application bundle, take a verified SQLite backup plus artifact archive before deployment, and preserve both on rollback. Do not copy a live SQLite file directly.
- Run fresh API auth/ledger regression tests and a browser-level viewer/presenter/mobile smoke test before and after deployment. Read back the public URL after release; distinguish source deployed from feature behavior verified. Groupmates can refresh the same URL once verified.

## Exclusions
No full local-first migration, native IPA/APK, SMS nudges, customer accounts, per-customer QR cards, or Cloudflare reconfiguration in this release. Shared code is a presentation access boundary, not a multi-user account system.
