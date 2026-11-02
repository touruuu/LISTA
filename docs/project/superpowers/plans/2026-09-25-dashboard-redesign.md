# Carbon Blue Ledger Dashboard Implementation Plan

> **For agentic workers:** Use the steps below task-by-task; work in place (this directory has no Git repository).

**Goal:** Refresh only the LISTA home dashboard to the approved Carbon Blue Ledger design, using live app/API data and preserving existing security and non-home behavior.

**Architecture:** Keep routing, customer operations, auth/session, API and backend contracts intact. Add small pure markup helpers in `src/customers.js` for labeled customer rows and home-state markup, then restyle shared CSS with a home-only responsive layout while retaining non-home component semantics.

**Tech Stack:** Existing browser ES modules, Vite, Node built-in test runner, existing server/API.

## Global Constraints

- No deployment, no commit, and no Git assumptions; work in `/home/hermes/Misc/lista-app`.
- Before editing source files, copy each touched source file to a `.bak` and record its path.
- Do not alter customer detail/transaction logs, Settings, Verify, consent, backend/API behavior, presenter auth, or real routes.
- Use `listCustomers()` and `/api/dashboard`; never use generated mock data or invent profile/store/routes.
- Presenter-only writes stay presenter-only; viewer remains read-only.
- Mobile-first at 390px; full customer name wrapping and explicit Owes/Settled/Credit labels.

---

### Task 1: Characterize dashboard markup (TDD)

**Files:**
- Create: `test/dashboard.mjs`
- Modify: `src/customers.js`

- [ ] Add tests for balance labels/values, viewer vs presenter Add customer control, filtered count and distinct empty states; exercise pure markup helpers with the real `node:test` runner.
- [ ] Run `node --test test/dashboard.mjs` and confirm expected missing-export/behavior failures.
- [ ] Implement minimal exported row/home-markup helpers and route `renderHome()` through those helpers without changing its data source or actions.
- [ ] Re-run focused tests and confirm green.

### Task 2: Carbon Blue responsive home styling

**Files:**
- Modify: `src/styles.css`
- Modify: `index.html` only if needed for theme color

- [ ] Back up source files before editing: `/home/hermes/.hermes/cache/scratch/lista-dashboard-backups/` with paths recorded in the completion report.
- [ ] Replace conflicting green/beige global token overrides with Carbon Blue tokens; implement compact mobile dashboard, wrapping name/balance row, count, four API-stat cards, and desktop table/list adaptation.
- [ ] Keep non-home forms, transactions, settings, verify, consent, presenter/login, and lock screens legible and functional; no new navigation.
- [ ] Run dashboard tests, `npm test`, and `node --test test/*.mjs`.

### Task 3: Server/API and build verification

**Files:**
- No source changes expected.

- [ ] Start an isolated local server with temporary data directories and a test-only presenter code; check `/`, `/api/state`, `/api/dashboard`, and `/api/verify`, then stop it.
- [ ] Run `npm run build` and inspect the output/exit status.
- [ ] Confirm no deploy occurred and report exact tests, server results, changed files, and backup paths.
