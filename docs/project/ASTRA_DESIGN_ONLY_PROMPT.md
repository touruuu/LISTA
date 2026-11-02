# Astra prompt — fresh LISTA prototype from the attached mockup

I will attach the groupmate's LISTA UI mockup PDF separately and provide a product/technical logic note. **Start from those inputs only. Do not inspect, request, import, modify, or base your work on any existing LISTA source files, repository, previous screenshots, generated code, or earlier design attempts.** Do not connect to a live LISTA service or use production data. This is a clean-room design/prototype task.

## Goal

Create a polished, mobile-first LISTA design whose visual language and screen composition are derived from the attached mockup. Then build a **working, clickable prototype from scratch** that demonstrates the design and its important user flows using synthetic sample data. The prototype should feel like the real product's features, but it must be isolated from the actual app/backend and must label simulated security, storage, network, consent, and verification behavior honestly.

This is not an implementation against the existing app files, and not just a static screen or a color-token exercise. You can choose a standalone prototype format (for example, a small self-contained HTML/CSS/JavaScript prototype or an equivalent interactive design tool). Keep the output in a new, separate artifact/folder. Do not modify or request the current LISTA project.

The attached PDF is the **visual source of truth**. The product and technical requirements below are the **behavior/source-of-truth constraints**. Use the PDF's visual design patterns, not generic dashboard conventions or any old LISTA palette. Produce one cohesive recommended direction rather than unrelated alternatives. Explain intentional adaptations or omissions.

## Required mockup analysis

Inspect all pages of the attached PDF individually, including mobile layouts, empty/loading states, navigation, dialogs, and forms. Create a concise page-mapping table with:

- PDF page number and screen/pattern shown;
- which supported LISTA screen or flow it can inform;
- the visual pattern to reuse;
- any feature/control that is not supported by LISTA and must be omitted;
- any necessary adaptation or assumption.

If a page is unclear, say so instead of guessing. Do not treat the PDF as authorization to add a product feature. It controls visual direction; the requirements here control product logic and security claims.

## Complete feature set to represent

Preserve the whole existing LISTA feature set in the design/prototype; do not drop features just because they are secondary in the PDF. The prototype may simplify backend details, but every supported feature should have an understandable screen, state, or interaction.

1. **Customer ledger/home** — searchable, sortable customer list; full customer names; text balance status (Owes / Settled / Credit) and readable currency amount; dynamic customer count; receivables/collection/utang/overdue dashboard summaries, secondary to the primary customer lookup workflow.
2. **Customer management** — presenter-only add customer and delete-customer-with-confirmation flow.
3. **Customer detail and history** — running balance; dated transactions; Utang vs Payment; amounts; resulting balance after each transaction; itemization, note, due/overdue status, void/correction state, and saved consent-record access where applicable.
4. **Record utang** — manual cash amount or item rows; add/remove item rows; item quantity and price; price-book suggestions/autofill; clear computed total; optional note/due date. Use integer centavos in the simulated model, even if the display shows pesos.
5. **Mandatory photo/signature consent for every new utang** — preserve the exact flow below.
6. **Record payment** — select customer, enter amount, show resulting balance; no photo/signature consent requirement for payments.
7. **Corrections/void and hard delete** — make the difference clear. Voiding preserves the original and adds an offsetting correction entry; permanent deletion is destructive, presenter-only, and requires clear confirmation.
8. **Share statement** — create/share a read-only customer statement link. The recipient does not need an account or LISTA installation.
9. **Settings** — connection state; local-device PIN controls; price book management; presenter-restricted JSON/CSV export controls. Do not confuse the local PIN with presenter authentication.
10. **Ledger integrity / defense demo** — Verify the SHA-256 transaction chain, display a clear success/failure state, and, if shown, provide the existing explicitly labeled demo tamper/restore interaction. The demo should alter only synthetic prototype records and then demonstrate failure/recovery.
11. **Presenter access** — read-only viewer state plus presenter sign-in/out state. No customer accounts or registration.
12. **PWA/install guidance** — if the mockup includes install screens, adapt them as a convenience/shortcut; never imply installation makes the shared ledger offline or protects server data.

## Mandatory consent interaction

For every simulated new utang:

1. Show a review step with customer, itemization when supplied, amount, and resulting balance.
2. Require an explicit **Take photo** action.
3. In the prototype, simulate a successful camera capture with a clearly identified synthetic preview (or use a mock camera view). Do not request real camera access, include real people, or provide a gallery/file-picker/import path.
4. Show the retained preview with **Retake** and **Delete photo** actions.
5. Provide a signature canvas that accepts pointer/touch drawing, detects that a meaningful stroke exists, and offers **Clear signature**.
6. Keep **Confirm** disabled until both synthetic retained-photo state and meaningful signature strokes exist.
7. Show camera failure/retry/cancel state and block confirmation on failure.
8. On confirm, show one new transaction with one composite consent artifact in the synthetic ledger. Clearly label that persistence and server validation are simulated.

There is no signature-only fallback and no image import. In the actual product, the evidence is not proof of identity or legal authenticity.

## Product truth and access model

- The shared ledger is **online and server-authoritative**. Internet is required to view/change the real shared ledger. Do not design or claim new offline writes, offline balances, automatic offline sync, or local-browser authority. Legacy pending/rejected items may be held for recovery, but they do not mean new offline entries can be made.
- A public viewer can read the shared demo ledger. Mutations and presenter-only actions require a server-checked presenter session/code. Hiding controls in a prototype is not equivalent to production authorization.
- The app is not multi-tenant account software: no email/password registration, customer logins, customer contact profiles, or account onboarding.
- The current public demo uses fictional records. Use only synthetic records in your prototype; do not connect to production, request a live presenter code, or reproduce real customer data.
- Keep all values live within the prototype state; do not hard-code disconnected dashboard numbers. If static example values are used, label them as sample data and make totals/arithmetic consistent.

## Technical architecture and security facts (for truthful design, not a request to connect to or recreate production)

The prototype must be visually faithful and interaction-complete, but its data/security layer is a simulation. Do not use the real backend or claim the prototype implements production security.

### Current production data architecture

- Frontend: vanilla JavaScript ES modules, Vite-built static PWA.
- Backend: Node.js/Express; `better-sqlite3` provides one server-authoritative SQLite database. SQLite runs in WAL mode with foreign-key enforcement enabled.
- Public read path: `GET /api/state` returns the current customer/transaction/price view. The public viewer is read-only.
- Writes: presenter-gated server endpoints handle customer/transaction/price changes, exports, and statement-link creation. The server—not the browser—calculates persisted balances and transaction-chain hashes.
- Consent artifact bytes are stored as files on the server filesystem, with artifact metadata and transaction links in SQLite.
- Client IndexedDB (Dexie database `lista`, v2) contains only local metadata/PIN state, cached evidence artifacts, and a legacy/recovery outbox; it is **not** the ledger's source of truth. Do not imply that it enables new offline writes.

### SQLite data model

Represent these entities in your technical handoff and use a simplified synthetic equivalent in the prototype. Do not invent encryption or real persistence for the prototype.

- `customers`: text ID (primary key), name, created timestamp.
- `transactions`: text ID (primary key), customer ID (foreign key), type constrained to `utang` or `payment`, integer `amount_cents`, optional `line_items` JSON text, server-calculated integer `balance_after_cents`, optional note, artifact reference/hash, `prev_tx_hash`, `tx_hash`, optional `due_at`, `voided` flag, `voids_tx_id`, created timestamp, and legacy sync metadata.
- `artifacts`: artifact ID (primary key), transaction ID (foreign key), MIME type, SHA-256, and server file path.
- `statements`: customer ID (primary/foreign key) and unique share token.
- `prices`: item label (primary key), integer `unit_price_cents`, update timestamp.
- `meta`: key/value metadata.

Money is integer centavos in the model. Display formatting is separate. The real server database is not sent with this task and must not be accessed.

### SHA-256 integrity model — tamper-evident, not tamper-proof

- The server is the single writer. It serializes the defined transaction fields into deterministic canonical JSON (object keys recursively sorted) and computes SHA-256.
- A new transaction includes the previous transaction's hash (`prev_tx_hash`); its own `tx_hash` covers fields including ID, customer, type, amount, resulting balance, itemization, artifact hash, previous hash, created time, note, void/correction fields, and due date. Chain order is server write order.
- `/api/verify` recomputes every transaction hash and link and reports whether the chain is intact or the first broken point. This helps detect edits that do not correctly rebuild the chain.
- A void is an appended offset/correction entry; the original remains marked voided. A hard delete triggers a full balance/chain rebuild.
- A sufficiently privileged operator can alter records and recompute the entire chain. SHA-256 chaining does not prevent that, prove who entered a record, provide an independent trusted timestamp, or establish legal non-repudiation. Never call this “tamper-proof.”
- The prototype may compute SHA-256 over synthetic transactions in-browser to demonstrate the concept, but label it as a local demonstration—not the real server's verification.

### Evidence-integrity model

- The actual client composes the captured photo, drawn signature, and transaction context into one evidence image. The client has an iOS/WebKit PNG fallback when WebP encoding is unavailable.
- The server validates image structure, normalizes valid PNG composites to WebP where needed, hashes the actual normalized bytes, stores the artifact, and includes the artifact hash in the transaction hash chain. A client-supplied hash is not trusted as the sole source of truth.
- The checksum detects mismatch against the stored digest; it does not prove the photo is genuine, the signature is authentic, or a specific person consented.
- The prototype must not accept user file imports or use real camera images. Use a synthetic image and label the flow as simulated.

### Authentication, PIN, and encryption caveats

- Presenter auth uses a configured server-side code; it is not a user password/account. The server compares code values using a timing-safe comparison, limits failed attempts (five failures within a 15-minute window), and issues a random session cookie with `HttpOnly`, `SameSite=Strict`, an eight-hour lifetime, and `Secure` when served over HTTPS. Prototype state may simulate signed-in/signed-out modes, but must never contain a real code or claim production auth.
- The four-digit device PIN is local-only. The current implementation stores a salted SHA-256 PIN hash in IndexedDB metadata and an unlocked flag in session storage; it is a casual-snooping deterrent, not encryption or a replacement for server authentication.
- **No application-level encryption at rest (such as SQLCipher/AES encryption of the SQLite file) is present in the current implementation.** Treat database, artifacts, and browser storage as plaintext at rest, subject to operating-system/deployment protections. Do not claim the database is encrypted. If you recommend encryption-at-rest, label it as a future security project requiring key management, migration, backup/recovery, and operational design—not as an existing capability.
- The deployed service uses HTTPS/TLS for transport. Do not connect the prototype to that service. A static prototype's local state is not production protection.

## Visual and responsive quality bar

- Make the attached PDF—not a previous LISTA design or generic template—the basis for visual identity, page composition, and component language.
- Phone first: at 390px, full customer names and balances remain legible; check 360px and a desktop adaptation. Avoid horizontal scrolling, clipped content, crowded controls, and tiny touch targets.
- Target WCAG AA text contrast, text labels in addition to color, visible focus/pressed/disabled states, keyboard usability, reduced-motion preferences, and interactive targets around 44×44 CSS px or larger.
- Provide distinct loading, connection failure, empty ledger, no search matches, read-only viewer, presenter state, validation failure, camera failure, chain-valid and chain-invalid, and destructive-confirmation states.
- Keep customer lookup and ledger actions prominent; aggregate analytics are secondary. The visual mood should follow the PDF while still feeling trustworthy for handling balances and consent evidence.
- Use concise English/Filipino wording consistent with the mockup. Do not invent a language toggle.

## Prototype acceptance checklist

- The prototype launches from a standalone artifact/folder and can be explored without the existing app source, real server, production network, credentials, or real customer data.
- Navigation works among home, customer detail/history, add customer, utang/itemization, consent, payment, settings, verification, and read-only statement screens.
- Search and sort change the synthetic customer list; forms validate; item totals and running balances update using integer-centavo arithmetic; add/payment/void actions update the prototype's local synthetic state; statement sharing and exports show clearly simulated outcomes or generate sample-only output.
- Consent gating is interactive and prevents confirm until photo state and a meaningful drawn signature exist; delete/retake/clear/camera-failure states behave as specified.
- The integrity demo uses synthetic records, can visibly show valid and intentionally broken/recovered states, and explains that it is tamper-evident rather than tamper-proof.
- Screens and components visibly follow the attached mockup. Capture genuine screenshots of the running prototype at mobile and desktop sizes and include them in the handoff.
- Handoff clearly separates actual product architecture from simulated prototype behavior. No claim is made that this task changed or tested the production app.

## Hard boundaries

- Do not inspect or ask for the existing repository/source files. The intent is a clean-room design/prototype because current-file work has not followed the mockup closely enough.
- Do not modify an existing project, connect to the production backend/database, deploy, request secrets, or use actual customer/camera data.
- Do not label SHA-256 chaining or any evidence workflow tamper-proof, encrypted, legally conclusive, or proof of identity.
- If the PDF conflicts with a behavior or security requirement above, preserve the product requirement and explain the design adaptation.

Start by auditing the PDF page by page and mapping its patterns to the supported LISTA feature set. Then create the design system and standalone working prototype. Finish with the technical/interaction handoff, prototype screenshots, assumptions, omissions, and a clear list of what is simulated versus what describes the existing product.