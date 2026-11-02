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

test("Astra visual stylesheet is byte-identical to the approved prototype", () => {
  assert.equal(
    sha256(css),
    "1eba7ad7bfc960a6013e8b2fa1ef4d78519da18750c97505d13044f43fbbdd2a",
  );
});

test("real ledger metadata does not identify the page as a sample ledger", () => {
  assert.doesNotMatch(index, /Sample ledger|synthetic sample/i);
});

test("live screen copy does not promise fake sample/demo behavior", () => {
  assert.doesNotMatch(
    app,
    /sample ledger|sample data|fictional|simulated presenter|synthetic photo|prototype simulation/i,
  );
});

test("More provides a logout action that returns to the welcome screen", () => {
  assert.match(app, /settingsRow\("logout", "Log out"/);
  assert.match(app, /case "logout"/);
  assert.match(app, /sessionStorage\.removeItem\("lista-authenticated"\)/);
  assert.match(app, /location\.replace\(location\.pathname \+ location\.search\)/);
});

test("Settings subpages return to the current Settings screen with logout", () => {
  assert.match(app, /function settings\(\)[\s\S]*settingsRow\("logout", "Log out"/);
  assert.match(app, /back\("Price Book", "settings"\)/);
  assert.match(app, /\["prices", "verify"\]\.includes\(route\) \? "settings" : "home"/);
  assert.match(reactApp, /sessionStorage\.getItem\('lista-authenticated'\)/);
  assert.match(reactApp, /onContinue=\{authenticate\}/);
  assert.match(reactApp, /pageshow/);
  assert.match(reactApp, /popstate/);
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
