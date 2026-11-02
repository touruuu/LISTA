import { strToU8, zipSync } from "fflate";

const xmlEscape = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[char]);
const isoDay = (value) => String(value || "").slice(0, 10);
const php = (cents) => `₱${(cents / 100).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const correctionIds = (transactions) => new Set(transactions.filter((tx) => tx.voids_tx_id).map((tx) => tx.voids_tx_id));

export function defaultExportFilters() {
  return { range: "all", from: "", to: "", customerId: "all", status: "all", scope: "filtered" };
}

export function buildExportReport(state, filters = defaultExportFilters(), now = new Date()) {
  const corrections = correctionIds(state.transactions);
  const active = state.transactions.filter((tx) => !tx.voided && !tx.voids_tx_id && !corrections.has(tx.id));
  const lots = [];
  for (const customer of state.customers) {
    const customerLots = [];
    for (const tx of active.filter((row) => row.customer_id === customer.id)) {
      if (tx.type === "utang") {
        const lot = { tx, customer, paidCents: 0, outstandingCents: tx.amount_cents };
        lots.push(lot);
        customerLots.push(lot);
      } else {
        let payment = tx.amount_cents;
        for (const lot of customerLots) {
          const applied = Math.min(payment, lot.outstandingCents);
          lot.paidCents += applied;
          lot.outstandingCents -= applied;
          payment -= applied;
          if (!payment) break;
        }
      }
    }
  }
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const monthStart = `${today.slice(0, 7)}-01`;
  let rows = lots.map(({ tx, customer, paidCents, outstandingCents }) => {
    const status = outstandingCents === 0 ? "Paid" : paidCents > 0 ? "Partially Paid" : tx.due_at && tx.due_at < today ? "Overdue" : "Unpaid";
    return {
      transactionId: tx.id,
      date: isoDay(tx.created_at),
      customerId: customer.id,
      customerName: customer.name,
      items: (tx.line_items || []).map((item) => ({ name: item.label, quantity: item.quantity, unitPriceCents: item.unit_price_cents, subtotalCents: item.quantity * item.unit_price_cents })),
      totalUtangCents: tx.amount_cents,
      paymentsReceivedCents: paidCents,
      outstandingCents,
      dueDate: tx.due_at || "",
      status,
      notes: tx.note || "",
    };
  });
  if (filters.scope !== "all") {
    if (filters.customerId && filters.customerId !== "all") rows = rows.filter((row) => row.customerId === filters.customerId);
    if (filters.status && filters.status !== "all") rows = rows.filter((row) => row.status.toLowerCase().replace(" ", "-") === filters.status);
    if (filters.range === "today") rows = rows.filter((row) => row.date === today);
    if (filters.range === "month") rows = rows.filter((row) => row.date >= monthStart && row.date <= today);
    if (filters.range === "custom") {
      if (filters.from) rows = rows.filter((row) => row.date >= filters.from);
      if (filters.to) rows = rows.filter((row) => row.date <= filters.to);
    }
  }
  rows.sort((a, b) => b.date.localeCompare(a.date) || a.customerName.localeCompare(b.customerName));
  return {
    generatedAt: now.toISOString(),
    rows,
    summary: {
      totalCreditIssuedCents: rows.reduce((sum, row) => sum + row.totalUtangCents, 0),
      paymentsCollectedCents: rows.reduce((sum, row) => sum + row.paymentsReceivedCents, 0),
      outstandingCents: rows.reduce((sum, row) => sum + row.outstandingCents, 0),
    },
  };
}

function recordRows(report) {
  return report.rows.map((row) => ({
    "Transaction ID": row.transactionId,
    Date: row.date,
    Customer: row.customerName,
    Items: row.items.map((item) => item.name).join("; ") || "Cash utang",
    Quantities: row.items.map((item) => item.quantity).join("; "),
    "Unit Prices": row.items.map((item) => php(item.unitPriceCents)).join("; "),
    Subtotals: row.items.map((item) => php(item.subtotalCents)).join("; "),
    "Total Utang": row.totalUtangCents / 100,
    "Payments Received": row.paymentsReceivedCents / 100,
    "Outstanding Balance": row.outstandingCents / 100,
    "Due Date": row.dueDate,
    Status: row.status,
    Notes: row.notes,
  }));
}

const safeSpreadsheetText = (value) => /^[=+\-@\t\r]/.test(String(value)) ? `'${value}` : String(value ?? "");
const csvCell = (value) => {
  const text = typeof value === "number" ? String(value) : safeSpreadsheetText(value);
  return `"${text.replace(/"/g, '""')}"`;
};

export function createCsvBlob(report) {
  const records = recordRows(report);
  const headers = records.length ? Object.keys(records[0]) : ["Transaction ID", "Date", "Customer", "Items", "Quantities", "Unit Prices", "Subtotals", "Total Utang", "Payments Received", "Outstanding Balance", "Due Date", "Status", "Notes"];
  const lines = [headers.map(csvCell).join(","), ...records.map((row) => headers.map((header) => csvCell(row[header])).join(",")), "", csvCell("Summary"), `${csvCell("Total Credit Issued")},${csvCell(report.summary.totalCreditIssuedCents / 100)}`, `${csvCell("Payments Collected")},${csvCell(report.summary.paymentsCollectedCents / 100)}`, `${csvCell("Remaining Outstanding")},${csvCell(report.summary.outstandingCents / 100)}`];
  return new Blob(["\uFEFF" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
}

const columnName = (index) => {
  let name = "";
  for (let value = index + 1; value; value = Math.floor((value - 1) / 26)) name = String.fromCharCode(65 + ((value - 1) % 26)) + name;
  return name;
};
function worksheetXml(rows, moneyColumns = []) {
  const body = rows.map((row, rowIndex) => `<row r="${rowIndex + 1}">${row.map((value, columnIndex) => {
    const ref = `${columnName(columnIndex)}${rowIndex + 1}`;
    if (typeof value === "number" && Number.isFinite(value)) return `<c r="${ref}"${moneyColumns.includes(columnIndex) ? ' s="1"' : ""}><v>${value}</v></c>`;
    return `<c r="${ref}" t="inlineStr"${rowIndex === 0 ? ' s="2"' : ""}><is><t xml:space="preserve">${xmlEscape(safeSpreadsheetText(value))}</t></is></c>`;
  }).join("")}</row>`).join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"/></sheetViews><sheetFormatPr defaultRowHeight="15"/><sheetData>${body}</sheetData><autoFilter ref="A1:${columnName(Math.max(0, (rows[0]?.length || 1) - 1))}${Math.max(1, rows.length)}"/></worksheet>`;
}
export function createXlsxBlob(report) {
  const records = recordRows(report), headers = records.length ? Object.keys(records[0]) : ["Transaction ID", "Date", "Customer", "Items", "Quantities", "Unit Prices", "Subtotals", "Total Utang", "Payments Received", "Outstanding Balance", "Due Date", "Status", "Notes"];
  const recordSheet = [headers, ...records.map((row) => headers.map((header) => row[header]))];
  const itemSheet = [["Transaction ID", "Customer", "Item", "Quantity", "Unit Price", "Subtotal"], ...report.rows.flatMap((row) => row.items.map((item) => [row.transactionId, row.customerName, item.name, item.quantity, item.unitPriceCents / 100, item.subtotalCents / 100]))];
  const summarySheet = [["LISTA Ledger Summary", "Value"], ["Records", report.rows.length], ["Total Credit Issued", report.summary.totalCreditIssuedCents / 100], ["Payments Collected", report.summary.paymentsCollectedCents / 100], ["Remaining Outstanding", report.summary.outstandingCents / 100], ["Generated", report.generatedAt]];
  const files = {
    "[Content_Types].xml": `<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/worksheets/sheet3.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>`,
    "_rels/.rels": `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
    "xl/workbook.xml": `<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Transactions" sheetId="1" r:id="rId1"/><sheet name="Item Details" sheetId="2" r:id="rId2"/><sheet name="Summary" sheetId="3" r:id="rId3"/></sheets></workbook>`,
    "xl/_rels/workbook.xml.rels": `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet3.xml"/><Relationship Id="rId4" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`,
    "xl/styles.xml": `<?xml version="1.0" encoding="UTF-8"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><numFmts count="1"><numFmt numFmtId="164" formatCode="&quot;₱&quot;#,##0.00"/></numFmts><fonts count="2"><font><sz val="11"/><name val="Aptos"/></font><font><b/><color rgb="FFFFFFFF"/><sz val="11"/><name val="Aptos"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF087F75"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="3"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/></cellXfs></styleSheet>`,
    "xl/worksheets/sheet1.xml": worksheetXml(recordSheet, [7, 8, 9]),
    "xl/worksheets/sheet2.xml": worksheetXml(itemSheet, [4, 5]),
    "xl/worksheets/sheet3.xml": worksheetXml(summarySheet, [1]),
  };
  const zipped = zipSync(Object.fromEntries(Object.entries(files).map(([name, contents]) => [name, strToU8(contents)])), { level: 6 });
  return new Blob([zipped], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}

export async function createPdfBlob(report) {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  doc.setTextColor(8, 127, 117); doc.setFontSize(20); doc.text("LISTA Ledger Report", 14, 16);
  doc.setTextColor(93, 116, 113); doc.setFontSize(9); doc.text(`Generated ${new Date(report.generatedAt).toLocaleString("en-PH")}`, 14, 22);
  doc.setTextColor(25, 49, 47); doc.setFontSize(10); doc.text(`Credit issued: PHP ${(report.summary.totalCreditIssuedCents / 100).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`, 14, 30); doc.text(`Payments collected: PHP ${(report.summary.paymentsCollectedCents / 100).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`, 90, 30); doc.text(`Outstanding: PHP ${(report.summary.outstandingCents / 100).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`, 178, 30);
  autoTable(doc, { startY: 36, head: [["ID", "Date", "Customer", "Items", "Utang", "Paid", "Outstanding", "Due", "Status", "Notes"]], body: report.rows.map((row) => [row.transactionId, row.date, row.customerName, row.items.map((item) => `${item.name} x${item.quantity} @ PHP ${(item.unitPriceCents / 100).toFixed(2)}`).join("\n") || "Cash utang", `PHP ${(row.totalUtangCents / 100).toFixed(2)}`, `PHP ${(row.paymentsReceivedCents / 100).toFixed(2)}`, `PHP ${(row.outstandingCents / 100).toFixed(2)}`, row.dueDate || "—", row.status, row.notes]), theme: "grid", styles: { fontSize: 7, cellPadding: 2, overflow: "linebreak" }, headStyles: { fillColor: [8, 127, 117], textColor: 255 }, alternateRowStyles: { fillColor: [244, 248, 247] }, columnStyles: { 3: { cellWidth: 58 }, 9: { cellWidth: 42 } }, margin: { top: 14, right: 10, bottom: 14, left: 10 } });
  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page++) { doc.setPage(page); doc.setTextColor(93, 116, 113); doc.setFontSize(8); doc.text(`LISTA • Page ${page} of ${pages}`, 287, 202, { align: "right" }); }
  return doc.output("blob");
}

export function exportFilename(extension, now = new Date()) {
  const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  return `LISTA_Ledger_${date}.${extension}`;
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob), anchor = document.createElement("a");
  anchor.href = url; anchor.download = filename; document.body.append(anchor); anchor.click(); anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
