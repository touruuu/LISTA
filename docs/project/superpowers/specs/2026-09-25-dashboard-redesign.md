# LISTA Carbon Blue Ledger Dashboard — Design

## Scope
Redesign only the home dashboard in the existing app. Keep the current server-authoritative `/api/dashboard` metrics and customer state; do not alter API contracts, database behavior, consent, transaction history/customer detail, Settings, Verify, presenter authentication, or deploy. Existing header navigation and real routes remain; no invented profile, store identity, chart, Collections/Accounts/Audit routes, or Stitch demo data.

## Home experience
Mobile-first at 390px: compact LISTA header with existing connection status, presenter sign-in/session controls, and Settings; “Utang List” heading with Add customer only for presenters; explicitly labeled name search and A–Z/largest-balance sort; full-width customer rows with wrapping names and a right-aligned amount plus text label. Positive balances say “Owes”, zero says “Settled”, negative says “Credit”; show actual formatted store balances. No status column. Show the live filtered customer count and distinguish no customers from no search matches and disconnected state. Place four existing API metrics after the customer list: Total receivables, Collected today, With utang, Overdue.

Desktop widens into a readable customer table/list and four metric cards, without adding data visualizations or routes. Color tokens: canvas `#F4F6FA`, white, ink `#1B2A42`, brand `#243F85`, muted `#53627B`, owed `#A94725`, credit `#116977`. Color is supplemental to the balance labels.

## Data/accessibility boundaries
Rows and metric values come exclusively from `listCustomers()` and `/api/dashboard`; presenters get the existing add control while public viewers remain read-only. Existing `main.js` presenter/session routing and header are retained. Customer details/logs and all non-home screens receive no deliberate markup change; token consolidation in shared CSS must retain clear form, transaction, settings, verify, and consent affordances.

## Verification
Add focused Node tests for positive/zero/negative balance labels, viewer/presenter home controls, customer count/search empty-state markup, and route/navigation invariants where practical. Run `npm test`, `node --test test/*.mjs`, a local server health/API smoke check, and `npm run build`. No deployment or production data mutation.
