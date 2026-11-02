# LISTA product + technical logic for Astra

Send this requirements note with the groupmate mockup PDF and `ASTRA_DESIGN_ONLY_PROMPT.md`. **Do not send Astra the existing app source or code ZIP for this clean-room prototype task.** The prototype should be built in a new standalone artifact using synthetic data only.

## User-facing feature set to preserve

| Feature | Expected behavior |
|---|---|
| Home/customer ledger | Search and sort customers; show full names, readable balances, and text status: Owes, Settled, Credit. Include dashboard totals/counts as secondary information. |
| Customer management | Presenter can add a customer or delete a customer after confirmation. |
| Customer detail/history | Show current balance plus dated transactions, type, amount, balance after, optional itemization/note/due date, overdue state, void/correction markers, and saved consent evidence where available. |
| New utang | Manual cash amount or itemized rows; add/remove rows; quantity/item/price; auto-total in integer centavos; price-book suggestions; optional due date/note. Must enter mandatory consent flow. |
| Photo/signature consent | Review customer/itemization/amount/resulting balance; explicit camera capture; retained preview with Retake/Delete; drawn meaningful signature with Clear; Confirm requires both; camera error blocks saving; no file import or signature-only fallback. One transaction-bound composite artifact. |
| Payment | Record a payment and show new balance. No photo/signature gate. |
| Correction/void | Append offsetting correction, preserve original marked voided; never silently overwrite the history. |
| Hard delete | Separate destructive presenter-only action with explicit confirmation; real server rebuilds balances/hash chain afterward. |
| Statement | Presenter creates a share link; recipient views a read-only statement without account/install. |
| Settings | Connection status, local device PIN, price-book management, presenter-only JSON/CSV exports. PIN is not account auth. |
| Verify/defense demo | Recompute/illustrate chain status; demo tamper/restore uses only synthetic data. Explain detection, not prevention. |
| Presenter access | Public read-only mode and presenter sign-in/out state. No customer accounts or email/password registration. |
| PWA guidance | Install is a shortcut; it does not make the shared ledger offline or protect server data. |

## Current production architecture (reference facts; not instructions to connect to it)

- Frontend is vanilla ES modules/Vite static PWA. Backend is Node.js/Express using `better-sqlite3`. SQLite runs with WAL and foreign-key enforcement.
- Server-hosted SQLite is the one ledger source of truth. `GET /api/state` provides the shared read view; the public viewer may read the demo ledger. Mutations, statement creation, exports, and presenter-only actions are gated server-side.
- Server endpoints include customer create/delete; transaction create; payment; transaction void/correction; hard delete; dashboard totals; price book; statement link/data; evidence retrieval; exports; and `/api/verify`. Any prototype version must use local synthetic state and must not call these production endpoints.
- Money is integer cents/centavos throughout calculations. The server calculates stored balances. `client_tx_id` is an idempotency key for transaction retries.
- The client also has a Dexie/IndexedDB database named `lista` (schema v2): `outbox`, `artifacts`, and `meta`. This is a small local cache/recovery/PIN layer—not a customer/transaction database and not the authoritative ledger. Legacy pending/rejected operations may be retained for recovery; new offline writes are not supported.

## SQLite schema concept

These are the current server database entities; prototype data may represent them with in-memory objects rather than a real database.

```text
customers(
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL
)

transactions(
  id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL REFERENCES customers(id),
  type TEXT CHECK(type IN ('utang','payment')),
  amount_cents INTEGER NOT NULL,
  line_items TEXT,                 -- JSON
  balance_after_cents INTEGER NOT NULL,
  note TEXT,
  artifact TEXT,
  artifact_hash TEXT,
  prev_tx_hash TEXT,
  tx_hash TEXT,
  due_at TEXT,
  voided INTEGER NOT NULL DEFAULT 0,
  voids_tx_id TEXT,
  created_at TEXT NOT NULL,
  synced INTEGER NOT NULL DEFAULT 1,
  synced_at TEXT
)

artifacts(
  id TEXT PRIMARY KEY,
  tx_id TEXT NOT NULL REFERENCES transactions(id),
  mime TEXT NOT NULL DEFAULT 'image/webp',
  sha256 TEXT,
  path TEXT NOT NULL               -- bytes live in filesystem, linked here
)

statements(customer_id TEXT PRIMARY KEY REFERENCES customers(id), token TEXT UNIQUE NOT NULL)
prices(label TEXT PRIMARY KEY, unit_price_cents INTEGER NOT NULL, updated_at TEXT NOT NULL)
meta(key TEXT PRIMARY KEY, value TEXT)
```

## SHA-256 chain and evidence integrity

- Server canonicalizes a defined transaction object with recursively sorted JSON keys. Fields covered include transaction ID, customer ID, type, integer amount, resulting balance, line items, artifact hash, previous hash, created time, note, void status/correction ID, and due date.
- `tx_hash = SHA-256(canonical_transaction_json)`; each new transaction sets `prev_tx_hash` to the previous transaction's `tx_hash`. The server is the single writer; chain order is database write order.
- `/api/verify` recomputes every hash and predecessor link, reporting intact or the first broken record/reason. It does not prevent an administrator with full database control from rewriting records and recalculating the chain. It is **tamper-evident, not tamper-proof**, and it does not prove who entered a transaction or provide a trusted external timestamp.
- Voids append an offsetting correction and preserve the original. Hard deletion is a different, permanent operation and triggers a balance/chain rebuild.
- A new utang's composite photo/signature bytes are validated by the server. On iOS/WebKit, client PNG may be normalized to WebP server-side. The server hashes the actual normalized stored bytes, saves the file on disk, records the artifact linkage, and includes the artifact hash in the transaction chain. A client-provided digest alone is not trusted.
- Evidence hashes only show whether bytes match a stored digest. They do not prove that a photo is genuine, that the signature is authentic, or that a particular person consented.
- The prototype may implement a real browser SHA-256 demonstration over synthetic data. Label it as a prototype demo, not a production verification or legal proof.

## Auth, PIN, transport, and encryption

- Presenter code is configured server-side and is not a customer account/password. Current server uses a timing-safe comparison, five-failure throttling within a 15-minute window, and a random session cookie with `HttpOnly`, `SameSite=Strict`, eight-hour expiry, and `Secure` when served over HTTPS. In a standalone prototype these are simulated modes only; never embed a real code.
- Current four-digit device PIN is local-only: salted SHA-256 hash stored in IndexedDB metadata; unlocked flag in session storage; five incorrect entries trigger a 30-second cooldown. It deters casual snooping only; it is not encryption or presenter authentication.
- **There is no application-level encryption at rest (no SQLCipher/AES encryption of the SQLite database identified in the current implementation).** Treat SQLite, artifact files, and browser storage as plaintext at rest, relying only on OS/deployment access controls unless a separately approved future encryption design is implemented. Do not show “encrypted database” badges or claim at-rest encryption.
- Production transport is HTTPS/TLS; the prototype must be local/standalone and must not call the live service.
- Current shared demo data is fictional. Public state access is intentional for the demo; real customer data would need explicit privacy/access-control review.

## Standalone prototype behavior

- Use local synthetic data and independent prototype state; do not use/import the production or development database.
- Implement working search/sort, customer navigation, add customer, item rows/price suggestions and totals, due date, payment, void/delete confirmation, statement view/share simulation, price book, export sample, PIN lock simulation, and verify/tamper/restore demo.
- Use a generated sample image or mock camera frame only. No real camera permission request, real photo, file import, or customer data.
- Simulated presenter mode must be clearly identified and must never be described as securing a backend.
- If local browser storage is used, explain it is demo persistence; provide a reset-to-sample-data action.
- Keep all sample totals internally consistent and label data “Sample” or “Prototype.”

## Design requirements from product logic

Use the PDF for palette/layout/components; do not carry forward an older LISTA design. Make customer lookup the primary job, totals secondary, financial statuses explicit in text, and all important flows readable at 360–390px. Include distinct no-customer, no-search-match, loading, network error, viewer-only, presenter, validation, camera-failure, valid-chain, broken-chain, void, and deletion-confirmation states. Keep touch targets near 44×44px and target WCAG AA contrast.

## Out of scope

Do not invent QR scanning/peer connection, SMS reminders, payment processing/method choice, global Activity, stock/inventory, customer contact accounts, multi-store management, offline ledger entry, or user registration. If visible in the PDF, map and omit these as unsupported functionality.
