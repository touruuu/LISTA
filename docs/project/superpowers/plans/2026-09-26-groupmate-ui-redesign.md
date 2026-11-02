# Groupmate UI Redesign Implementation Plan

> **For agentic workers:** Follow the task checkboxes in order and preserve all global constraints.

**Goal:** Replace the Carbon Blue presentation with the supplied PDF's pale gray-green, deep teal, warm-card visual language while preserving the existing online shared-ledger workflow.

**Architecture:** Keep existing routes, render functions, permissions, APIs, database, transaction/consent semantics, and state behavior. Update the shared CSS visual system and browser theme metadata; add focused static regression assertions that reject Carbon Blue tokens and guard against unsupported UI feature claims. Validate existing tests/build and inspect local mobile and desktop renders.

**Tech Stack:** Vanilla JavaScript, CSS, Vite, Node.js built-in test runner.

## Global Constraints

- The app remains an online, server-authoritative shared ledger; internet is required to view it.
- Preserve existing customer list/detail/history, Settings, Verify, permissions, and presenter-gated writes.
- New utang requires both camera-captured photo and meaningful drawn signature, with explicit consent; visual changes cannot bypass either.
- Do not add unsupported account flows, QR/scanner, reminders, payment methods, global Activity, inventory, offline access/writes, or customer photos/phone fields.
- Do not change APIs, server/database, routes, or record semantics; do not deploy or modify production.
- Work locally only, no Git commit (directory is not a repository).

---

### Task 1: Capture current state and plan the visual adaptation

**Files:**
- Create: `docs/superpowers/plans/2026-09-26-groupmate-ui-redesign.md`
- Backup: all files before edits under a timestamped scratch directory.

- [x] Interpret mockup constraints against the supported app behavior and record the plan.
- [x] Copy files selected for edits to `/home/hermes/.hermes/cache/scratch/lista-groupmate-ui-20260926-082950/`.

### Task 2: Add visual/product-truth regression assertions (RED)

**Files:**
- Modify: `test/ui-presenter.mjs`
- Test: `test/ui-presenter.mjs`

- [x] Add a test asserting the active stylesheet uses the groupmate green/teal + pale gray-green direction and contains no Carbon Blue colors/branding.
- [x] Add assertions that unsupported mobile mockup features (QR scanner, SMS reminders, payment-method selector, global activity) are not exposed in current customer/home markup.
- [x] Run `node --test test/ui-presenter.mjs`; confirm the palette test fails against current CSS.

### Task 3: Apply palette and responsive polish (GREEN)

**Files:**
- Modify: `src/styles.css`
- Modify: `index.html`

- [x] Replace the appended Carbon Blue override block with a coherent green/teal palette adapted from the reference: pale gray-green page, dark green/teal actions/header, warm light surfaces, distinct truthful status colors.
- [x] Preserve existing page structure and interaction affordances; improve customer-ledger scan hierarchy, forms, transaction cards, focus/hover/disabled states, and responsive layout without introducing unsupported content or controls.
- [x] Update browser theme metadata to match the new deep green surface and accurately describe the online ledger in the app manifest.
- [x] Run `node --test test/ui-presenter.mjs`; confirm all assertions pass.

### Task 4: Full local verification and bounded visual inspection

**Files:**
- No additional source changes unless a concrete defect is found.

- [x] Run `npm test && node --test test/*.mjs && npm --prefix server run check && npm run build`.
- [ ] Run the app locally, capture mobile and desktop views, inspect once, fix obvious defects, then confirm final screenshots. (Local server responded; captures were blocked by unavailable browser tooling and the installed Chromium CPU instruction-set failure.)
- [x] Run Impeccable detector once on changed UI targets and resolve its mechanical finding (neutralized colored shadow).
- [x] Report exact test/build results, changed files, backup path, screenshot paths, and any limitations. Do not deploy.
