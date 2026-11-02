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
    "0565539a630a02624a2723d67b80b86739d5a9a41332550713e76373fd511517",
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
