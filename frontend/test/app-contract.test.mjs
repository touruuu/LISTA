import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

const app = readFileSync(
  new URL("../src/listaApp.js", import.meta.url),
  "utf8",
);
const reactApp = readFileSync(
  new URL("../src/App.jsx", import.meta.url),
  "utf8",
);
const reactEntry = readFileSync(
  new URL("../src/main.jsx", import.meta.url),
  "utf8",
);
const service = readFileSync(
  new URL("../src/services/ledgerService.js", import.meta.url),
  "utf8",
);
const index = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const css = readFileSync(new URL("../src/styles.css", import.meta.url));

const sha256 = (value) => createHash("sha256").update(value).digest("hex");

test("UI uses the isolated frontend ledger service with no API dependency", () => {
  assert.match(app, /createLedgerService/);
  assert.match(app, /\.\/services\/ledgerService\.js/);
  assert.doesNotMatch(app, /\/api\//);
  assert.doesNotMatch(service, /fetch\(['"]\/api\//);
});

test("React owns the application root and loads the behavior-compatible ledger module", () => {
  assert.match(index, /id=["']root["']/);
  assert.match(index, /src=["']\/src\/main\.jsx["']/);
  assert.match(reactEntry, /createRoot/);
  assert.match(reactEntry, /<App\s*\/>/);
  assert.match(reactApp, /import\(['"]\.\/listaApp\.js['"]\)/);
});

test("real camera helpers replace all generated and simulated camera paths", () => {
  assert.match(app, /\.\/lib\/camera\.js/);
  assert.match(app, /openCamera/);
  assert.match(app, /captureFrame/);
  assert.match(app, /stopCamera/);
  assert.doesNotMatch(
    app,
    /mockPhoto|SYNTHETIC CAMERA CAPTURE|Generated frame/,
  );
  assert.doesNotMatch(index, /type=["']file["']/i);
  assert.match(index, /src=["']\/src\/main\.jsx["']/);
});

test("developer-only reset and tamper actions are not exposed in the UI", () => {
  assert.doesNotMatch(
    app,
    /setPresenterMode|tamperTransaction|restoreSampleData|resetSamples|resetEmpty/,
  );
  assert.doesNotMatch(
    app,
    /Demo tamper|Restore records|Reset sample data|Enter demo mode/,
  );
  assert.doesNotMatch(app, /statementSnapshot|sample_only/);
});

test("editing actions have no temporary presenter or access-phrase gate", () => {
  assert.doesNotMatch(
    app + service,
    /presenter|enable editing|access phrase|loginPresenter|logoutPresenter|setPresenterMode/i,
  );
  assert.match(app, /case "new-utang"/);
  assert.match(app, /case "new-payment"/);
  assert.match(app, /case "add-customer"/);
  assert.match(app, /case "void"/);
});

test("signature canvas keeps its pointer, keyboard, and meaningful-stroke behavior", () => {
  assert.match(app, /canvas\.onpointerdown/);
  assert.match(app, /canvas\.onpointermove/);
  assert.match(app, /canvas\.onkeydown/);
  assert.match(app, /signatureDistance >= 90/);
  assert.match(app, /signatureBounds\.maxX - signatureBounds\.minX >= 35/);
  assert.match(app, /signatureBounds\.maxY - signatureBounds\.minY >= 12/);
});

test("consent signature canvas receives the responsive, touch-safe signature pad styling", () => {
  assert.match(
    app,
    /<canvas id="signature" class="signature" width="900" height="360"/,
  );
  assert.match(
    css.toString(),
    /\.signature\{[^}]*width:100%;[^}]*height:180px;[^}]*touch-action:none;/,
  );
});

test("Astra visual stylesheet matches the approved LISTA enhancement baseline", () => {
  assert.equal(
    sha256(css),
    "38ff8f7d1ead0d64668434d6e26be76baaf92dd84ed89876fa7ede144316b9ca",
  );
});

test("payments require a customer-facing review before the ledger write", () => {
  assert.match(app, /Half Balance/);
  assert.match(app, /Full Balance/);
  assert.match(app, /data-action="confirm-payment"/);
  assert.match(app, /Remaining balance/);
});

test("Settings groups lightweight account and app preferences without ledger changes", () => {
  for (const heading of ["Account", "Security", "Data & Reports", "App Preferences"])
    assert.match(app, new RegExp(heading.replace("&", "&amp;|&")));
  assert.match(app, /lista-account-name/);
  assert.match(app, /LISTA quick guide/);
  assert.match(app, /Android · Chrome/);
  assert.match(app, /iPhone or iPad · Safari/);
});

test("real ledger metadata does not identify the page as a sample ledger", () => {
  assert.doesNotMatch(index, /Sample ledger|synthetic sample/i);
});

test("live screen copy does not promise fake sample/demo behavior", () => {
  assert.doesNotMatch(
    app,
    /sample ledger|fictional|simulated presenter|synthetic photo|prototype simulation/i,
  );
  assert.match(app, /preview uses separate sample data/i);
  assert.match(app, /standalone preview uses separate sample data/i);
  assert.match(app, /functional local QR handoff/i);
});

test("More provides a logout action that returns to the welcome screen", () => {
  assert.match(app, /settingsRow\("logout", "Log out"/);
  assert.match(app, /case "logout"/);
  assert.match(app, /CustomEvent\("lista:logout"\)/);
  assert.match(reactApp, /await authService\.logout\(\)/);
  assert.match(reactApp, /sessionStorage\.removeItem\('lista-authenticated'\)/);
  assert.match(reactApp, /window\.location\.replace\(window\.location\.pathname \+ window\.location\.search\)/);
});

test("Settings subpages return to the current Settings screen with logout", () => {
  assert.match(app, /function settings\(\)[\s\S]*settingsRow\("logout", "Log out"/);
  assert.match(app, /back\("Price Book", "settings"\)/);
  assert.match(app, /\["prices", "verify"\]\.includes\(route\) \? "settings" : "home"/);
  assert.match(reactApp, /authService\.current\(\)/);
  assert.match(reactApp, /onContinue=\{login\}/);
  assert.match(reactApp, /authService\.onChange/);
});

test("Borrower experience is isolated with borrower-only navigation", () => {
  assert.doesNotMatch(app, /settingsRow\("people", "Preview Borrower Experience"/);
  assert.match(app, /function borrowerPortal\(\)/);
  assert.match(app, /function borrowerShell\(content\)/);
  assert.match(app, /Home[\s\S]*My Utang[\s\S]*Payments[\s\S]*Receipts/);
  assert.match(app, /createBorrowerPortalDemo/);
  const borrowerShell = app.match(/function borrowerShell\(content\)[\s\S]*?\n}/)?.[0] || "";
  assert.doesNotMatch(borrowerShell, /Record utang|Price Book|Settings|delete-tx|edit-record/);
  assert.match(app, /sessionStorage\.getItem\("lista-role"\) === "owner" && \(borrowerRoutes\.has\(next\) \|\| next === "borrower-portal"\)/);
});

test("Add Person consolidates manual creation and borrower QR linking", () => {
  const quickActions = app.match(/<div class="quick-actions">[\s\S]*?<\/div><\/section>/)?.[0] || "";
  assert.match(quickActions, /Add Utang/);
  assert.match(quickActions, /Record Payment/);
  assert.match(quickActions, /Add Person/);
  assert.doesNotMatch(quickActions, /Link Borrower/);
  assert.match(app, /function chooseAddCustomer\(\)/);
  assert.match(app, /Add Manually/);
  assert.match(app, /Scan Borrower QR/);
  assert.match(app, /case "add-customer-manual"/);
  assert.match(app, /case "owner-scan-account-qr"/);
  assert.match(app, /add-person-options/);
  assert.match(app, /Add a customer without a LISTA account\./);
  assert.match(app, /Link a borrower using their LISTA Account QR\./);
  assert.match(css.toString(), /dialog\.add-person-dialog\{width:min\(460px,calc\(100% - 32px\)\)/);
  assert.match(css.toString(), /\.add-person-option\{display:flex;width:100%;min-height:92px/);
  assert.match(css.toString(), /\.add-person-option:hover/);
  assert.match(css.toString(), /\.add-person-option:active/);
});

test("welcome offers first-class owner and borrower roles without fake borrower authentication", () => {
  assert.match(reactApp, /Continue as Store Owner/);
  assert.match(reactApp, /Continue as Borrower/);
  assert.match(reactApp, /An easy way for sari-sari stores to manage utang and for customers to keep track of what they owe/);
  assert.match(reactApp, /sessionStorage\.setItem\('lista-role', profile\.role\)/);
  assert.match(reactApp, /profile\.role === 'owner' \? 'home' : 'borrower-home'/);
  assert.match(reactApp, /authService\.login/);
  assert.match(reactApp, /authService\.register/);
  assert.match(app, /sessionStorage\.getItem\("lista-role"\) === "borrower" && !borrowerRoutes\.has\(next\)/);
  assert.match(app, /<b>Log Out<\/b>/);
  assert.match(app, /case "confirm-borrower-logout"/);
  assert.doesNotMatch(reactApp, /borrower-password|verifyBorrower|authenticateBorrower/);
});

test("demo portal selection happens only at login and no authenticated switcher remains", () => {
  assert.match(reactApp, /isDemoCredentials\(credentials\.email, credentials\.password\)[\s\S]*enterDemo\(selectedRole\)/);
  assert.doesNotMatch(app, /switch-demo-portal|demoPortalSwitcher|Portal · Switch/);
  assert.doesNotMatch(reactApp, /switch-demo-portal|demoPortalSwitcher|Portal · Switch/);
});

test("borrower has five tabs, receipt scanning, and owner-confirmed payment QR handoff", () => {
  assert.match(app, /Home[\s\S]*My Utang[\s\S]*borrower-scan[\s\S]*Scan QR[\s\S]*Payments[\s\S]*Receipts/);
  assert.match(app, /borrower-scan-circle/);
  assert.match(app, /Use camera/);
  assert.match(app, /Choose image/);
  assert.match(app, /parseListaReceiptPayload/);
  assert.match(app, /addScannedReceipt/);
  assert.match(app, /Review & Generate QR/);
  assert.match(app, /GCash[\s\S]*Maya[\s\S]*Bank Transfer/);
  assert.match(app, /createPaymentQrPayload/);
  assert.match(app, /Scan Payment QR/);
  assert.match(app, /owner-confirm-payment-qr/);
  assert.match(app, /validatePaymentRequest/);
  assert.match(app, /model\.addTransaction\(\{ customerId: request\.customerId, type: "payment"/);
  assert.doesNotMatch(app, /payment gateway connected|money was transferred|verified payment/i);
});

test("Smart Import appends reviewed mock items without bypassing consent", () => {
  assert.match(app, /data-action="smart-import"/);
  assert.match(app, /simulateSmartExtraction/);
  assert.match(app, /draft\.items\.push\(\.\.\.smartImport\.items/);
  assert.match(app, /Add Items to Utang/);
  assert.match(app, /Review & collect consent/);
  assert.doesNotMatch(app, /smart-add-to-utang[\s\S]{0,800}addTransaction\(/);
});

test("Smart Import exposes spreadsheet, handwriting, and receipt methods", () => {
  assert.match(app, /SMART_IMPORT_METHODS/);
  assert.match(app, /smart-import-file/);
  assert.match(app, /capture="environment"/);
  assert.match(css.toString(), /\.smart-import-dialog/);
  assert.match(css.toString(), /@media\(max-width:700px\)/);
});

test("active utang records expose an auditable edit workflow", () => {
  assert.match(app, /Edit Record/);
  assert.match(app, /id="edit-utang-form"/);
  assert.match(app, /Review Changes/);
  assert.match(app, /Save Changes/);
  assert.match(app, /Edit History/);
  assert.match(app, /model\.editTransaction/);
  assert.match(service, /editTransaction\(transactionId/);
  assert.match(service, /edit_history/);
});

test("Activity and More expose local ledger exports without mutating records", () => {
  assert.match(app, /Export Records/);
  assert.match(app, /buildExportReport/);
  assert.match(app, /createXlsxBlob/);
  assert.match(app, /createCsvBlob/);
  assert.match(app, /createPdfBlob/);
  assert.match(app, /export-download/);
  assert.match(css.toString(), /\.export-report-dialog/);
});

test("password visibility controls are centered and cannot overlap input text", () => {
  assert.match(reactApp, /className="password-field"/);
  assert.match(css.toString(), /\.password-field input\{padding-right:72px\}/);
  assert.match(css.toString(), /\.password-field button\{top:50%;bottom:auto;transform:translateY\(-50%\);display:flex;align-items:center;justify-content:center\}/);
});
