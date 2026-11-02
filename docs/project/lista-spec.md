# LISTA v1 Shared Interface Spec
# (single source of truth for all parallel subagents)

## Stack
- Vite + vanilla JS (ES modules), no framework. Dexie.js 4.x for IndexedDB.
- Node 20+ for build. PWA: manifest.webmanifest + custom service worker (precache app shell, network-ignoring for ledger ops).
- App is 100% functional offline; sync is additive.

## File layout (repo root = lista-app/)
- index.html
- src/main.js            (router + shell)
- src/db.js              (Dexie schema + helpers)
- src/ledger.js          (business logic: addTx, payTx, balance, history)
- src/consent.js         (capture-only composite artifact)
- src/sync.js            (queue + flush to server)
- src/customers.js       (customer list/create/view)
- src/receipt.js         (read-only statement view, tokenized)
- sw.js, manifest.webmanifest, public/icons/

## DB schema (src/db.js) — Dexie version 1
stores:
  customers: "id, name, created_at"
  transactions: "id, customer_id, created_at, synced"
    fields: id (uuid), customer_id, type ("utang"|"payment"), amount_cents (int),
            line_items (array of {label, qty, amount_cents} or null),
            balance_after_cents (int), note, artifact (blob ref key or null),
            artifact_hash (sha256 hex or null), prev_tx_hash (sha256 hex or null),
            created_at (ISO), synced (0|1), synced_at
  sync_queue: "++seq, tx_id, attempts, next_attempt_at"
  artifacts: "id" (id = tx id; value = {blob (WebP Blob), mime, sha256})
  meta: "key"  (kv: store_profile {name, code, owner_token}, last_tx_hash)

All money as integer centavos. Amounts displayed via fmtPeso(cents) from src/util.js.

## ledger.js API (consumed by UI + sync)
- addUtang({customer_id, amount_cents, line_items, note, artifact}) -> tx
    computes balance_after = prev_balance + amount; chains prev_tx_hash = sha256(prev tx canonical json); stores artifact; enqueues sync.
- addPayment({customer_id, amount_cents, note}) -> tx
    balance_after = prev_balance - amount_cents; same chaining; NO artifact required.
- getBalance(customer_id) -> cents
- getHistory(customer_id) -> tx[] newest-first
- listCustomers() -> [{...customer, balance_cents}]

## consent.js API (consumed by ledger flow)
- captureConsent({amount_cents, customer_name, balance_after_cents, tx_id})
  -> Promise<{blob, sha256}>
  Flow: fullscreen overlay:
    1) rear camera via getUserMedia({video:{facingMode:"environment"}}), live preview
    2) canvas signature pad (pointer events) overlaid at bottom half; reject empty strokes
    3) on Confirm: composite single canvas:
       - video frame (contain, max 720px)
       - signature strokes drawn over lower band
       - watermark text block: "LISTA TxID <id> | <customer> | Utang P<amount> | Balance P<bal> | <ISO ts>"
       - export canvas.toBlob("image/webp", 0.8) -> Blob
       - sha256 via crypto.subtle on the blob bytes
  HARD CONSTRAINTS (anti-forgery):
    - NO <input type="file"> anywhere in the app (CI greps for it; also no paste/drop handlers for evidence)
    - camera stream stopped (tracks.stop()) immediately after capture
    - artifact stored only in IndexedDB, never localStorage
- sigOnly mode: same overlay, camera step skipped (for micro-amounts fast path)

## sync.js API
- enqueue(tx) (called by ledger.js), flush() -> POST /api/sync {txs:[...], artifacts:[{id, blob}]}
  multipart or JSON+base64; batched; retries with backoff (next_attempt_at), marks tx.synced=1 on 2xx.
- flush() auto-triggered on: app load, "online" event, after each addTx when navigator.onLine.

## Server (CT110) — Node 20 + Express, single file server.js + /public static hosting of built dist/
- POST /api/sync  (auth: X-Owner-Token header == owner_token from store_profile)
- GET /s/:token   -> read-only statement page (token per customer, generated server-side from synced data; no auth for borrower link, token is the secret; no acknowledge button)
- GET /backup.json (auth) -> full ledger dump
- DB: SQLite (better-sqlite3) mirroring schema above; artifacts saved to disk under /data/artifacts/<txid>.webp
- Static: serves dist/ (built PWA) at /; service worker + manifest included.
- Runs as systemd service lista.service on port 8088.

## Anti-forgery CI check (scripts/check-no-file-inputs.sh, run in npm test)
grep must find ZERO matches for: <input type="file", input type="file", type="file"
in index.html, src/**, dist/**. Exit 1 on any match. (Camera capture via getUserMedia only.)

## PWA install requirement
First-run overlay: "Add to Home Screen for data durability" (installed PWAs are exempt from iOS 7-day storage purge). Dismissible, re-prompts weekly.

## Out of scope v1 (do not build)
Decimen beam, SMS receipts, WebCrypto tier-4 signing, acknowledge buttons, per-customer QR cards, loaner app.

## Demo story (verify at the end)
airplane mode ON: record utang P150 for "Aling Nena", sign on glass, artifact saved,
balance updates, app reboot persists data. WiFi back: sync queue flushes automatically.
Statement link opens read-only from another device.
