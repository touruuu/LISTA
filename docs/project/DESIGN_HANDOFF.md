# LISTA prototype design handoff

## Visual direction

Follow the PDF’s calm, compact mobile ledger: pale mint `#f3f8f7` canvas, teal `#087f75` actions, dark green `#0d3b37` headings, white rounded cards with thin gray-green borders, outlined icons, and circular initials avatars. Use amber, red, and green status text with written labels (Owes, Overdue, Settled, Credit, Voided); never rely on color alone. Keep the Home screen as a dashboard with live peso summaries, clear quick actions, and a compact list of upcoming due dates. Keep the greeting modest and omit any owner/store identity. Put search, balance filters, and sorting on the separate People screen; display full names and clear status text there. On mobile use Home / People / Record / More, with a raised central teal **Record** action. Put Settings, integrity verification, Price Book, and the other existing tools under More. Keep touch targets about 44px, visible focus/disabled states, and readable contrast. At 390px and 360px stack cards and actions without horizontal scrolling; at desktop center a restrained app-width ledger with a wider content column. Respect reduced motion.

## PDF page mapping

| PDF p. | Screen / pattern | Supported use | Reuse | Omit or adapt |
|---:|---|---|---|---|
| 1 | Welcome / intro | App entry | Mint background, ledger preview, teal CTA | No login/account onboarding; enter public read-only synthetic ledger |
| 2 | Login | Presenter access | Simple centered form, clear hierarchy | Replace email/password with simulated presenter sign-in; no real code or account |
| 3 | Create account | None | Form spacing only | Omit registration, customer accounts, password creation |
| 4 | PIN entry | Local PIN setting | Centered lock and PIN hierarchy | Use a native four-digit input and device keyboard; local-only casual-snooping lock demo; separate from presenter auth, no claim of encryption |
| 5 | Home dashboard | Dashboard | Modest greeting, 2×2 live balance summaries, clear quick actions, compact Due Soon rows | Owed-to-you, collected-today, overdue, due-soon and separate customer-credit values come from ledger state; show actual due dates and outstanding due amounts; omit owner/store identity and unsupported scanner action |
| 6 | People directory | Customer list and selection into customer history | Search, supported balance filters, sorting, initials, full names, readable balance and due/status line, Add Person | Move all customer search/filter/sort controls here from Home; keep selected customer detail/history reachable |
| 7 | Customer detail/history | Customer detail | Balance hero, action buttons, dated timeline, status | Add running balance, itemization, notes, due state, corrections and consent artifact access |
| 8 | Add utang | Utang entry | Item rows, price suggestions, computed total, note/due date | Replace Save draft / direct record with required review-and-consent gate; cents in model |
| 9 | Customer confirmation | Utang review | Review summary, amount and due date | Adapt to explicit synthetic photo capture plus signature; no standalone consent path |
| 10 | Signature | Signature capture | Large drawing surface and Clear action | Keep as one part of composite consent; meaningful stroke required |
| 11 | Photo confirmation | Photo capture | Framed transaction context | Simulated synthetic preview only; no camera permission, real people, gallery, or import |
| 12 | Utang recorded | Success state | Amount, updated balance, next actions | Say artifact storage/server validation are simulated |
| 13 | Record payment | Payment flow | Presets, balance arithmetic, optional note | No photo/signature requirement; overpayment becomes customer credit; omit payment-method choices |
| 14 | Add person | Customer management | Simple name form, save action | Presenter-only add; omit photo, phone, account linking, and customer account |
| 15 | Activity | Per-customer transaction history | Dated rows, type icons, amounts and text status | Omit the unsupported global Activity screen; keep history within each customer |
| 16 | Transaction details | Transaction history | Itemization, dates and status | Show resulting balance, note, evidence link, and presenter-only correction actions |
| 17 | Void transaction | Void/correction | Explain original remains; explicit confirmation | Append offset entry and mark original voided; distinguish from permanent delete |
| 18 | Share statement | Share flow | Read-only statement preview | Generate a synthetic share-link snapshot; omit expiry and security claims |
| 19 | Public statement | Read-only link view | Balance summary and dated history | No login required in concept; prototype snapshot is local, synthetic, read-only |
| 20 | Reminders | Due/overdue summary | Due groupings and status hierarchy | Show summaries only; omit sending reminders/notifications |
| 21 | Unsupported connection screen | None | Reuse restrained card and profile hierarchy only | Omit account linking and store identity features |
| 22 | Unsupported scanner screen | None | None | Omit scanning and customer lookup through unsupported integrations |
| 23 | Price Book | Price settings | Searchable prices and compact edit form | Price suggestions only, not inventory; presenter-only changes |
| 24 | More/settings | Settings | Grouped settings rows and connection indication | Keep supported connection state, local PIN, price book, presenter-only exports; omit language, profile, help claims |
| 25 | Empty/status/connection | System states | Empty cards, labeled statuses, connection/error treatment | Replace misleading “keep recording offline” message: real ledger is online/server-authoritative; prototype data is in-memory simulation |

## PDF features intentionally omitted

The product note does not support account registration or customer logins; account/store profiles or contact-photo collection; the unsupported scanner and connection/linking journey; a global Activity feed; sending reminders or notifications; payment processing or payment-method selection; inventory/stock; multi-store management; new offline ledger entry; or a synthetic customer liability labelled “You Owe.” These screens and actions from the PDF are omitted. Due Soon is only a read-only summary of existing due dates and balances. Customer history remains available from People.

## Product and technical truth

The actual product uses a vanilla-JS ES-module frontend built with Vite as a static PWA. Node.js/Express serves a single server-authoritative SQLite database (`better-sqlite3`, WAL, foreign keys). Public `GET /api/state` is read-only; presenter-gated server endpoints handle mutations, exports, and statement creation. The server computes balances and transaction hashes. Consent files live on the server filesystem, with metadata and transaction links in SQLite. Client IndexedDB (Dexie `lista`, v2) holds local metadata/PIN state, cached evidence, and a legacy recovery outbox; it is not the ledger and does not enable new offline writes. Production transport uses HTTPS/TLS.

The simplified production entities are `customers` (text ID, name, created timestamp); `transactions` (text ID, customer FK, `utang`/`payment`, integer `amount_cents`, optional item JSON, server-calculated `balance_after_cents`, note, artifact reference/hash, previous/current transaction hashes, optional due date, void flag and voided transaction ID, created timestamp, legacy sync metadata); `artifacts` (ID, transaction FK, MIME type, SHA-256, server path); `statements` (customer FK and unique share token); `prices` (item label and integer unit price cents, update timestamp); and key/value `meta`. The prototype may use a simplified in-memory equivalent; money remains integer centavos and is formatted as pesos only for display.

The production SHA-256 chain is tamper-evident, not tamper-proof: a privileged operator can rewrite records and rebuild it, and it does not prove identity or legal authenticity. Evidence hashes detect byte mismatch, not genuine photography or signature identity. Actual evidence composes photo, signature, and transaction context; the server validates and normalizes image bytes, stores them, and links the digest into the transaction chain. Presenter access is a server-side code/session, distinct from the four-digit local PIN. There is no application-level encryption at rest. Do not imply otherwise.

## Prototype boundary and launch

This deliverable is a standalone vanilla HTML/CSS/JavaScript prototype with no runtime packages, data backend, or production connection. All records and security/network/consent outcomes are synthetic and held in memory; a reload resets them. Any in-browser hash check is only a local demonstration. Statement links represent synthetic read-only snapshots and are not publicly hosted. Never request real customer data, camera access, a presenter code, or file imports. Do not call the prototype secure, persistent, offline-capable, or production-validated.

Local launch: from `lista-prototype`, run `npm start` (or `node server.mjs`), then open `http://localhost:5173`. The static server binds only to `127.0.0.1`. Tailscale Funnel is a later, separate step and is not configured.


## Implemented interaction details

- Entry is read-only. **Viewer · Sign in → Enter demo mode** enables synthetic mutations. No credential is collected. Actions also check the model’s simulated presenter flag; neither layer is production authorization.
- Utang accepts cash or item rows. Quantity is a positive integer; prices and amounts are parsed into centavos. Price Book suggestions fill the unit price. An explicit review precedes synthetic capture and a meaningful pointer/touch signature. Keyboard drawing is available using Shift + arrow keys.
- Confirm stays disabled without both a retained photo and a meaningful signature. Clear, delete, camera failure and cancellation remove their relevant prerequisite. Save creates one transaction with one PNG composite of the synthetic frame, signature and context; actual composite bytes are SHA-256 hashed locally. Image validation/normalization by a server is simulated.
- Payments update the running balance immediately and allow customer credit. Overdue totals apply payments to older debt first and cap unpaid overdue amounts by the current positive balance. This FIFO allocation is a prototype assumption; the supplied product note did not define debt allocation.
- Voiding retains the original and appends an offset. The local chain is rebuilt because the original’s hashed void flag changes. Hard deletion removes the selected transaction and its linked correction when present; deleting a correction unmarks its original. Customer deletion removes its linked sample transactions. All destructive actions have explicit confirmation.
- Integrity verification really recomputes SHA-256 and predecessor links. Tampering changes a synthetic note without updating its hash; restore reinstates the original. Normal mutations are blocked while the demo chain is tampered.
- Statement links embed a synthetic snapshot in the URL fragment. They are read-only views without evidence bytes, authentication, expiration, or automatic updates. They work where the local server is reachable; they are not public hosted links. The simulated statement token is separate from this snapshot transport.
- Price Book edits, JSON/CSV downloads, PIN setup/lock/unlock/removal, simulated connection failure/retry, loading, empty-ledger preview, and reset are interactive. PIN state exists only in memory; five failed unlock attempts trigger a 30-second demo cooldown. Reload clears it. No production PIN storage is implemented.
- Historical seed transactions have no supplied consent artifact and say so when opened. All newly recorded utang requires the complete consent flow.
- Desktop uses a left navigation rail. Home is the dashboard; People owns customer search, filters, and balance sorting. Mobile uses Home / People / Record / More, with Settings, Integrity, Price Book, and About under More. The fixed mobile bar includes safe-area padding and matching page-bottom space; focused entry/consent screens omit that navigation, following the form pages in the PDF.

## Limits and assumptions

No production source, credentials, database, network service, real people, or camera access were used. Original input files remain unchanged. The prototype has no service worker; installation guidance explains a browser shortcut and the real ledger’s internet requirement. Browser memory and downloaded sample exports have no application-level encryption. Numeric PIN state is deliberately a disposable simulation, not the production salted-hash implementation. No production authorization, persistence, evidence validation, or deployment was tested.

## Validation completed

- `npm test`: **9/9 passing**. Covers canonical JSON, derived balances, overdue FIFO, presenter gating, integer-centavo validation, actual artifact-byte hashing, void/correction, deletion/rebuild, tamper detection/restore, and reset.
- `npm run test:browser`: **2/2 scenarios passing** in headless Chromium. The end-to-end scenario covers viewer/presenter access; currency formatting; People search/sort; add customer; payment; cash utang; photo/signature/failure/delete/clear/retake gating; one saved composite; void and hard deletion; verification/tamper/recovery; Price Book; a statement popup; and a sample JSON download. It observed no external-service requests. The responsive scenario checks Home / People / Record / More, action links, long-name wrapping, and maximum scroll at 360px and 390px; Home, People, and More content remains clear of the fixed navigation, with no horizontal overflow.
- Additional live browser checks: PIN setup/lock/unlock works; connection failure blocks the ledger and retry restores it; no JavaScript page errors were observed. Viewport checks at 360px, 390px, and 1440px had no horizontal overflow.
- Visual inspection: actual running app at 360px, 390px and 1440px. This is prototype QA, not a full WCAG audit or cross-browser/device certification.

### Genuine screenshots

Captured from the running localhost app with Playwright, not design renders.

**Desktop Home**

![Desktop Home](screenshots/home-desktop.png)

**Desktop People**

![Desktop People](screenshots/people-desktop.png)

**390px Home and People**

![Home at 390px](screenshots/home-390.png)

![People at 390px](screenshots/people-390.png)

**360px Home and People**

![Home at 360px](screenshots/home-360.png)

![People at 360px](screenshots/people-360.png)

**Maximum-scroll checks, including the fixed navigation clearance**

![Home maximum scroll at 360px](screenshots/home-360-bottom.png)

![People maximum scroll at 360px](screenshots/people-360-bottom.png)

![More maximum scroll at 360px](screenshots/more-360-bottom.png)

The corresponding 390px maximum-scroll captures are `home-390-bottom.png`, `people-390-bottom.png`, and `more-390-bottom.png` in `screenshots/`.

**Mandatory consent, with generated capture and drawn signature**

![Consent screen](screenshots/consent-390.png)

Additional consent-flow captures: `customer-390.png`, `utang-390.png`, `consent-390.png`, `success-390.png`, and `integrity-390.png` in `screenshots/`.
