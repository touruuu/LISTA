# Astra UI + Original LISTA Integration Plan

> **For agentic workers:** Execute this plan task-by-task with TDD; do not alter the visual design.

**Goal:** Keep Astra’s current visual design while replacing its simulated state/actions with the original LISTA server, persistent SQLite ledger, presenter authentication, and real camera capture.

**Architecture:** Leave `styles.css` and the screen layout in `index.html` unchanged. Add an API-backed client model for the existing Astra `app.js` view model and a camera helper; update existing actions/copy to use the original same-origin API. The original CT110 server and SQLite database remain authoritative; no prototype seed data is sent to production.

**Tech Stack:** Vanilla ES modules, browser MediaDevices/Canvas, Node `node:test`, existing Express + SQLite server and API.

## Global constraints

- Keep the Astra color system, CSS, screen layout, navigation, and signature-pad drawing/meaningfulness behavior unchanged.
- Use only same-origin LISTA APIs with `credentials: 'same-origin'`; original auth endpoints are `GET/POST/DELETE /api/session`.
- Do not put the presenter credential in source, URL, local/session storage, build assets, or logs. Configure it server-side only.
- Use the existing CT110 SQLite database and artifact store; do not seed, reset, or run test mutations against production.
- Camera evidence comes only from `getUserMedia`; no file input/import fallback. Failure, denial, missing camera, empty frame, or encoding error blocks utang confirmation and server write.
- Keep the existing Astra signature pad implementation untouched. Require its current meaningful-stroke gate plus a retained camera photo before confirming.
- Keep user-visible claims truthful: remove prototype/sample/synthetic/demo-only assertions where the view is now live; preserve the same visual hierarchy and layout.
- Keep demo-only tamper/restore, local sample reset, and fake connection toggles away from production APIs. Integrity becomes read-only `GET /api/verify`; refresh uses `GET /api/state`.
- Before any production change, create a fresh paired SQLite Online Backup API snapshot, artifact archive, app/service/config backup, checksums, integrity/FK verification, and timestamped static `dist` rollback.
- Do not restore the production database as an automatic code rollback; preserve writes made after release unless the user explicitly authorizes a data restore.

---

### Task 1: Baseline and safe working copy

**Files:** No product source edits.

- [ ] Confirm both source directories are not Git repositories and record this fact; use archives and file hashes for rollback/review.
- [ ] Archive `/home/hermes/Misc/Lista-Mockup/lista-prototype` and the relevant original source/tests before editing, excluding `node_modules`, local environment files, and any database files.
- [ ] Record SHA-256 for prototype `index.html` and `styles.css`; `styles.css` must remain byte-identical, while `index.html` may change only the document title, initial loading copy, and a cache-busting query on the module script (no layout/element changes).
- [ ] Inspect current service-worker cache behavior; determine whether a cache-version bump is needed so phone clients fetch new JavaScript without changing layout.

**Verify:** Archives list and test successfully; current public service and `/api/verify` are read-only healthy before any production work.

### Task 2: TDD API-backed view model

**Files:**
- Create `/home/hermes/Misc/Lista-Mockup/lista-prototype/api-model.js`
- Create `/home/hermes/Misc/Lista-Mockup/lista-prototype/api-model.test.mjs`

- [ ] Write tests first for `GET /api/state` mapping (`customers`, server `txs`, `prices`, balance and artifact metadata) into the synchronous read shape that Astra views already consume.
- [ ] Test original line-item mapping (`qty`, `amount_cents`) to Astra’s display/edit shape (`quantity`, computed unit price) without changing stored totals.
- [ ] Test `GET /api/session` status, `POST /api/session` login, and `DELETE /api/session` logout; assert cookies are same-origin and the credential never enters browser storage.
- [ ] Test customer create/delete, payment and utang payloads, price-book GET/PUT/DELETE, transaction void/hard-delete, statement-link creation, artifact fetch, and server-chain verification. Mutations must refresh `/api/state`; server errors must remain visible and never be treated as success.
- [ ] Run `node --test api-model.test.mjs` and confirm failures are caused by missing adapter behavior.
- [ ] Implement a minimal adapter with injectable `fetch`, no local seed records, no local presenter switch, and no offline mutation queue.
- [ ] Re-run the focused tests, then the existing nine prototype model tests.

**Acceptance:** An unavailable server renders a clear connection error/empty state, never synthetic records; a successful server state renders only server-supplied records.

### Task 3: TDD real camera capture while preserving signature

**Files:**
- Create `/home/hermes/Misc/Lista-Mockup/lista-prototype/camera.js`
- Create `/home/hermes/Misc/Lista-Mockup/lista-prototype/camera.test.mjs`

- [ ] Write tests first for `getUserMedia` request (`facingMode: environment`, no audio), live-video readiness timeout, frame capture, track cleanup after capture/cancel/error, and failure-closed behavior.
- [ ] Run focused camera tests and confirm expected failures.
- [ ] Implement small camera helpers with dependency injection for `mediaDevices`, video, canvas and timers, so lifecycle tests do not require a physical device.
- [ ] Keep `bindCanvas`, `addStroke`, `meaningful`, `clear-signature`, the existing `<canvas id="signature">`, and its touch/pointer behavior byte-for-byte unchanged; verify with a diff against the baseline archive.
- [ ] Composite the retained photo and existing signature into one Blob using WebP when available and PNG fallback only when WebP encoding is unavailable; attach MIME and base64 consistently to the transaction payload. Include the same review fields already shown (customer, items/amount, resulting balance, due date) and the pre-generated transaction ID.
- [ ] Test denied permission, no camera, no frame, encoding failure, delete, and retake. None may submit a transaction; stop every media track on every exit.

**Acceptance:** Production uses only an explicit retained camera photo and existing meaningful signature; no upload/file picker or generated photo path remains in the production page.

### Task 4: Wire Astra screens and actions to original LISTA

**Files:**
- Modify `/home/hermes/Misc/Lista-Mockup/lista-prototype/app.js`
- Modify `/home/hermes/Misc/Lista-Mockup/lista-prototype/index.html` title/loading text and module-script cache key only; no visual markup or layout restyling.
- Modify `/home/hermes/Misc/lista-app/server/server.js` to add presenter-protected same-origin `POST /api/customer/:id/statement`; retain legacy GET.
- Keep `/home/hermes/Misc/Lista-Mockup/lista-prototype/styles.css` unchanged.
- Add `/home/hermes/Misc/Lista-Mockup/lista-prototype/sw.js` cache-version update for installed phone clients.

- [ ] Replace the demo model import with the tested API adapter; await session/state initialization before rendering and refresh server state after writes, on visibility return, and at the original refresh cadence.
- [ ] Implement real server presenter login/logout through `/api/session`, displaying errors and keeping viewer actions read-only. The server remains the only authority; do not use a client-side presenter boolean as authorization.
- [ ] Map existing Home, People, customer detail, utang/payment, price book, transaction history, void/delete, verify, and success views to original API contracts.
- [ ] Pre-generate `client_tx_id` before consent; POST utang with `customer_id`, `type`, integer `amount_cents`, mapped `line_items`, `note`, `due_at`, and `{artifact:{mime,dataBase64}}`. POST payments without consent artifacts. Refresh state only after success.
- [ ] Fetch existing consent records from `/api/artifact/:txid`; never embed artifact bytes or live customer transactions in URLs.
- [ ] Create share links through presenter-protected same-origin `POST /api/customer/:id/statement`, then use the server’s `/s/:token` URL; never create Astra’s base64 statement snapshot.
- [ ] Route verify to read-only `/api/verify`; remove live tamper/restore actions. Replace fake connection toggle with safe API refresh/status and replace sample reset with no-op removal or safe refresh.
- [ ] Use original presenter-protected `/backup.json` and `/backup.csv` only as authenticated downloads; ensure export never occurs in viewer mode.
- [ ] Preserve supported original controls, confirmations, and server errors. Do not connect destructive sample-only actions to live endpoints.
- [ ] Replace only inaccurate sample/demo copy while keeping the same component placement, classes, colors, and layout. Keep the user’s fixed visual design.

**Verify:** Static checks assert no fake presenter switch, mock-photo generator, sample reset, tamper/restore request, client-generated statement snapshot, or credential persistence remains reachable from the live app. `index.html` and `styles.css` hashes remain equal to Task 1.

### Task 5: Isolated end-to-end and mobile regression

**Files:**
- Create/update tests under `/home/hermes/Misc/Lista-Mockup/lista-prototype/`
- Reuse original server tests without modifying production data.

- [ ] Start original LISTA server against a disposable temporary SQLite file and artifact directory with a test-only presenter code and isolated origin/port.
- [ ] Run end-to-end viewer/login/logout, customer create, itemized utang with mocked camera plus unchanged signature, payment, price-book edit, void/correction, hard-delete confirmation, statement link, and verify-only flows.
- [ ] Assert viewer writes/exports are denied, camera failure creates no row, utang without artifact is rejected, item totals/balances are server-authoritative, artifact bytes round-trip, and chain verification remains valid.
- [ ] If browser tooling is available, run at 360px and 390px; verify no horizontal overflow and compare DOM geometry to baseline. Independently assert unchanged `styles.css` SHA-256, permitted `index.html` copy-only delta, and signature-canvas hash; report unavailable visual testing honestly.
- [ ] Run prototype unit tests, adapter/camera tests, original server check, original e2e tests, production build, and static safety checks; record exact exit codes and counts.

**Acceptance:** All integrations test only against a disposable server/database; no CT110 API mutation is used in automated QA.

### Task 6: Production release and verification

**Files:** CT110 release assets/config only after all prior tasks pass.

- [ ] Confirm public origin and `getUserMedia` secure HTTPS context; confirm service active and production state/chain healthy read-only.
- [ ] Create a fresh paired backup using SQLite Online Backup API, artifacts archive, app/dist/server/service and protected service environment config; verify SHA-256 manifest, SQLite `integrity_check`, zero foreign-key violations, artifact member count, and service state.
- [ ] Copy current live `dist` to a timestamped rollback directory. Do not deploy from the prototype test server.
- [ ] Deploy only the approved prototype runtime/modules to `/opt/lista/dist`; preserve unrelated server/static support files and set server-side presenter code in protected configuration only. Do not put the credential in any deploy payload or output.
- [ ] Restart `lista.service` only after backup validation; verify active service, public title/assets and hashes, `/api/state`, `/api/session` viewer status, `/api/verify`, and denied unauthenticated writes/exports. Do not perform production create/update/delete/consent actions as a smoke test.
- [ ] Report exact production URL, backup/rollback paths, tests, and honest browser/iPhone camera limitations. The user’s phone must grant camera permission and test the real capture flow; no physical device success claim without that test.

---
