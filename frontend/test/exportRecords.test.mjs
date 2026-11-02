import test from "node:test";
import assert from "node:assert/strict";
import { unzipSync, strFromU8 } from "fflate";
import { createLedgerModel } from "../src/services/ledgerService.js";
import { buildExportReport, createCsvBlob, createXlsxBlob, defaultExportFilters, exportFilename } from "../src/services/exportRecords.js";

test("export report allocates payments once and excludes customer credit from utang payments", async () => {
  const ledger = createLedgerModel({ now: () => new Date("2026-11-02T10:00:00+08:00") });
  await ledger.ready;
  const report = buildExportReport(ledger.getState(), defaultExportFilters(), new Date("2026-11-02T10:00:00+08:00"));
  assert.equal(report.rows.length, 4);
  assert.equal(report.summary.totalCreditIssuedCents, 915000);
  assert.equal(report.summary.paymentsCollectedCents, 70000);
  assert.equal(report.summary.outstandingCents, 845000);
  assert.equal(report.rows.find((row) => row.transactionId === "t-004").status, "Paid");
  assert.equal(report.rows.find((row) => row.transactionId === "t-004").paymentsReceivedCents, 70000);
});

test("export filters support customer, status, month, and empty result sets", async () => {
  const ledger = createLedgerModel();
  await ledger.ready;
  const now = new Date("2026-11-02T10:00:00+08:00");
  const overdue = buildExportReport(ledger.getState(), { ...defaultExportFilters(), status: "overdue" }, now);
  assert.equal(overdue.rows.length, 3);
  const customer = buildExportReport(ledger.getState(), { ...defaultExportFilters(), customerId: "c-002" }, now);
  assert.deepEqual(customer.rows.map((row) => row.transactionId), ["t-002"]);
  const month = buildExportReport(ledger.getState(), { ...defaultExportFilters(), range: "month" }, now);
  assert.equal(month.rows.length, 0);
});

test("CSV escapes spreadsheet formulas and XLSX contains structured report sheets", async () => {
  const report = {
    generatedAt: "2026-11-02T02:00:00.000Z",
    rows: [{ transactionId: "t-test", date: "2026-11-02", customerId: "c-test", customerName: "=HYPERLINK(\"bad\")", items: [{ name: "+SUM(A1)", quantity: 1, unitPriceCents: 1000, subtotalCents: 1000 }], totalUtangCents: 1000, paymentsReceivedCents: 0, outstandingCents: 1000, dueDate: "", status: "Unpaid", notes: "@unsafe" }],
    summary: { totalCreditIssuedCents: 1000, paymentsCollectedCents: 0, outstandingCents: 1000 },
  };
  const csv = await createCsvBlob(report).text();
  assert.match(csv, /'=HYPERLINK/);
  assert.match(csv, /'\+SUM/);
  assert.match(csv, /'@unsafe/);
  const archive = unzipSync(new Uint8Array(await createXlsxBlob(report).arrayBuffer()));
  assert.ok(archive["xl/worksheets/sheet1.xml"]);
  assert.ok(archive["xl/worksheets/sheet2.xml"]);
  assert.ok(archive["xl/worksheets/sheet3.xml"]);
  assert.match(strFromU8(archive["xl/workbook.xml"]), /Transactions.*Item Details.*Summary/);
});

test("export filenames use the requested local date", () => {
  assert.equal(exportFilename("xlsx", new Date(2026, 10, 2, 12)), "LISTA_Ledger_2026-11-02.xlsx");
});
