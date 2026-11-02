# Plan: mandatory captured-photo utang consent

1. Add isolated consent-flow regression tests first (camera failure blocks, empty/one-point signature blocks, photo required, delete/retake, no upload input); run and observe expected failures.
2. Implement explicit review/capture/preview/sign/clear controls and composite artifact; ensure all cancel/error paths tear down camera and reject without saving.
3. Make ledger fail closed on missing/failed consent; ensure UI enables save only for valid transaction review and submits once after confirmation.
4. Add browser-level isolated flow coverage where feasible; run npm test, node test/e2e.mjs, npm run build, npm --prefix server run check; inspect source diff and capture-only check.
5. No production deployment or data access/mutation.
