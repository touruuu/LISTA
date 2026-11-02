import { createLedgerService } from "./services/ledgerService.js";
import { openCamera, stopCamera, captureFrame } from "./lib/camera.js";
import { SMART_IMPORT_METHODS, simulateSmartExtraction } from "./services/smartItemImport.js";
import { buildExportReport, createCsvBlob, createPdfBlob, createXlsxBlob, defaultExportFilters, downloadBlob, exportFilename } from "./services/exportRecords.js";
let model = createLedgerService();
const $ = (s) => document.querySelector(s),
  esc = (v) =>
    String(v ?? "").replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
const money = (c) =>
  new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: c % 100 ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(Math.abs(c) / 100);
const peopleCount = (n) => `${n} ${n === 1 ? "customer" : "customers"}`;
const date = (d) =>
  d
    ? new Date(d.length === 10 ? d + "T12:00:00" : d).toLocaleDateString(
        "en-PH",
        { month: "short", day: "numeric", year: "numeric" },
      )
    : "No due date";
const today = () => new Date().toISOString().slice(0, 10);
const initials = (n) =>
  n
    .split(/\s+/)
    .slice(0, 2)
    .map((x) => x[0])
    .join("");
const icons = {
  home: "M3 10 12 3l9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z",
  people:
    "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M17 4a4 4 0 0 1 0 8M22 21v-2a4 4 0 0 0-3-3.87M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0",
  plus: "M12 5v14M5 12h14",
  search: "M21 21l-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0",
  arrow: "M9 5l7 7-7 7",
  back: "M19 12H5m7-7-7 7 7 7",
  shield: "M12 3 3 7v5c0 5 9 9 9 9s9-4 9-9V7ZM8 12l3 3 5-6",
  settings: "M4 6h16M4 12h16M4 18h16M8 3v6M16 9v6M10 15v6",
  more: "M4 12h.01M12 12h.01M20 12h.01",
  pay: "M3 6h18v12H3ZM7 6a4 4 0 0 1-4 4M21 10a4 4 0 0 1-4-4M3 14a4 4 0 0 1 4 4M17 18a4 4 0 0 1 4-4M14 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0",
  bag: "M5 7h14l1 14H4ZM8 7V5a4 4 0 0 1 8 0v2M8 11a4 4 0 0 0 8 0",
  clock: "M12 8v5l3 2M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0",
  check: "m5 12 4 4L19 6",
  close: "m6 6 12 12M6 18 18 6",
  share: "M12 16V2M7 7l5-5 5 5M5 12H3v9h18v-9h-2",
  lock: "M5 10h14v11H5ZM8 10V6a4 4 0 0 1 8 0v4",
  tag: "M3 3h8l10 10-8 8L3 11ZM7 7h.01",
  download: "M12 3v12m-5-5 5 5 5-5M3 16v5h18v-5",
  camera: "M3 6h5l2-3h4l2 3h5v15H3ZM16 13a4 4 0 1 1-8 0 4 4 0 0 1 8 0",
  edit: "m15 3 6 6-12 12H3v-6ZM12 6l6 6",
  alert: "M12 3 1 21h22ZM12 9v5M12 18h.01",
  eye: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12ZM15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0",
  wifi: "M2 8a16 16 0 0 1 20 0M5 12a11 11 0 0 1 14 0M8 16a6 6 0 0 1 8 0M12 20h.01",
  trash: "M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7",
  logout: "M9 3H3v18h6M9 12h12m-5-5 5 5-5 5",
  book: "M4 3h16v18H4ZM8 3v18M12 8h4M12 12h4",
};
const icon = (n) =>
  `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="${icons[n] || icons.book}"/></svg>`;
const btn = (label, action, cls = "", extra = "") =>
  `<button class="btn ${cls}" data-action="${action}" ${extra}>${label}</button>`;
const back = (title, to = ["prices", "verify"].includes(route) ? "settings" : "home") =>
  `<div class="back-title"><a class="btn icon-only" href="#${to}" aria-label="Back">${icon("back")}</a><h1 tabindex="-1">${title}</h1></div>`;
const note = (text, kind = "") =>
  `<div class="view-note ${kind}">${icon(kind === "error" ? "alert" : "shield")}<span>${text}</span></div>`;
let route = "home",
  cid = null,
  editId = null,
  editReturnRoute = "activity",
  editPending = null,
  returnRoute = "home",
  search = "",
  filter = "All",
  sort = "balance",
  activityFilter = "All",
  loading = true,
  verifyResult = null,
  lastSaved = null,
  draft = null,
  photo = null,
  signatureDistance = 0,
  signatureBounds = null,
  cameraError = false,
  busy = false,
  priceSearch = "",
  pin = null,
  locked = false,
  pinFailures = 0,
  pinUntil = 0,
  cameraStream = null,
  cameraActive = false,
  evidenceUrl = null,
  smartImport = null,
  exportState = null;
const customer = (id) => model.getCustomer(id);
const current = () => customer(cid);
const txs = (id) =>
  model.getState().transactions.filter((t) => t.customer_id === id);
const balance = (id) => customer(id)?.balance_cents ?? 0;
const owed = (id) => model.getDashboard().overdueByCustomer?.[id] ?? 0;
const status = (id) =>
  balance(id) < 0 ? "Credit" : balance(id) === 0 ? "Settled" : "Owes";
const txLabel = (t) =>
  t.voided
    ? "Voided"
    : t.voids_tx_id
      ? "Correction"
      : t.type === "payment"
        ? "Payment"
        : t.due_at && t.due_at < today()
          ? "Past due date"
          : "Utang";
function toast(text) {
  $("#toast").textContent = text;
  $("#toast").classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => $("#toast").classList.remove("show"), 4200);
}
function go(r, id) {
  const next = r + (id ? "/" + encodeURIComponent(id) : "");
  if (location.hash === "#" + next) {
    route = r;
    cid = id || cid;
    render();
  } else location.hash = next;
}
function navLink(r, label, i) {
  return `<a class="nav-link ${route === r || (r === "people" && route === "detail") ? "active" : ""}" href="#${r}">${icon(i)}${label}</a>`;
}
function shell(content) {
  const moreActive = [
      "more",
      "settings",
      "verify",
      "prices",
      "reminders",
    ].includes(route),
    activityActive = route === "activity";
  return `<div class="shell"><aside class="sidebar"><a class="brand" href="#home"><span class="brand-mark">L</span>LISTA</a><p class="brand-sub">Malinaw ang bawat tala.</p><nav class="side-nav" aria-label="Main navigation">${navLink("home", "Home", "home")}${navLink("people", "People", "people")}${navLink("record", "Record utang", "plus")}${navLink("activity", "Activity", "clock")}${navLink("more", "More", "more")}</nav><div class="side-bottom"><div class="view-note">${icon("book")}<span>Simple, malinaw,<br>laging updated.</span></div><p class="side-note">Frontend preview<br>Temporary local data</p></div></aside><header class="topbar"><div class="mobile-brand"><span class="brand-mark">L</span>LISTA</div><div class="topbar-left"><span><i class="dot"></i>Frontend preview</span><span> / &nbsp; Local session</span></div></header><main class="main" id="main">${content}</main><nav class="bottom-nav ${["record", "edit", "payment", "consent", "success"].includes(route) ? "hide-on-form" : ""}" aria-label="Mobile navigation"><a href="#home" class="${route === "home" ? "active" : ""}">${icon("home")}<span>Home</span></a><a href="#people" class="${route === "people" || route === "detail" ? "active" : ""}">${icon("people")}<span>People</span></a><a href="#record" class="record-nav"><span class="record-circle">${icon("plus")}</span><span>Record</span></a><a href="#activity" class="${activityActive ? "active" : ""}">${icon("clock")}<span>Activity</span></a><a href="#more" class="${moreActive ? "active" : ""}">${icon("more")}<span>More</span></a></nav></div>`;
}
function empty(title, text, button = "") {
  return `<div class="empty"><div class="stat-icon">${icon("people")}</div><h3>${title}</h3><p>${text}</p>${button}</div>`;
}
function render() {
  if (locked) {
    $("#app").innerHTML = shell(pinScreen());
    bind();
    return;
  }
  let content;
  if (loading)
    content = `<div class="empty"><div class="spinner"></div><h2>Loading LISTA</h2><p>Preparing the temporary frontend data…</p></div>`;
  else {
    const screens = {
      home: home,
      people: people,
      detail: detail,
      record: record,
      edit: editRecord,
      payment: payment,
      consent: consent,
      success: success,
      activity: activity,
      reminders: reminders,
      more: more,
      settings: settings,
      verify: verify,
      prices: prices,
    };
    content = (screens[route] || home)();
  }
  $("#app").innerHTML = shell(content);
  bind();
  if (route === "consent") {
    bindCanvas();
    bindCamera();
  }
}
function home() {
  const d = model.getDashboard(),
    upcoming = dueSoonRows(),
    soonCents = upcoming.reduce((sum, row) => sum + row.amount_cents, 0);
  const cards = [
    {
      label: "Owed to you · Pautang",
      value: money(d.receivablesCents),
      detail: peopleCount(
        d.balances.filter((row) => row.balanceCents > 0).length,
      ),
      ico: "people",
    },
    {
      label: "Collected today",
      value: money(d.collectionTodayCents),
      detail: "Payments recorded today",
      ico: "pay",
    },
    {
      label: "Overdue",
      value: money(d.overdueCents),
      detail: peopleCount(
        Object.values(d.overdueByCustomer).filter((v) => v > 0).length,
      ),
      ico: "alert",
    },
    {
      label: "Due soon",
      value: money(soonCents),
      detail: peopleCount(upcoming.length) + " · next 14 days",
      ico: "clock",
    },
  ];
  const summary = cards
    .map(
      (c) =>
        '<article class="summary-card"><div class="summary-label"><span class="stat-icon ' +
        (c.ico === "alert" ? "red" : c.ico === "clock" ? "amber" : "") +
        '">' +
        icon(c.ico) +
        "</span><span>" +
        c.label +
        '</span></div><p class="summary-value">' +
        c.value +
        '</p><p class="summary-detail">' +
        c.detail +
        "</p></article>",
    )
    .join("");
  const due = upcoming
    .map(
      (row, i) =>
        '<button class="due-row" data-action="customer" data-id="' +
        esc(row.customer.id) +
        '"><span class="avatar ' +
        (i % 3 === 1 ? "amber" : i % 3 === 2 ? "blue" : "") +
        '">' +
        esc(initials(row.customer.name)) +
        '</span><span class="due-customer"><strong>' +
        esc(row.customer.name) +
        "</strong><span>" +
        date(row.due_at) +
        " · " +
        dueDayText(row.due_at) +
        '</span></span><span class="due-amount"><strong>' +
        money(row.amount_cents) +
        "</strong><span>Due soon</span></span>" +
        icon("arrow") +
        "</button>",
    )
    .join("");
  const recent = model
    .getState()
    .transactions.slice()
    .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))
    .slice(0, 3);
  return (
    '<div class="home-heading"><p class="greeting">' +
    new Date().toLocaleDateString("en-PH", {
      weekday: "long",
      month: "long",
      day: "numeric",
    }) +
    '</p><h1>Magandang araw!</h1><p class="muted">Your shared ledger, at a glance.</p></div><section class="summary-grid" aria-label="Ledger totals">' +
    summary +
    '</section><div class="credit-strip"><span>' +
    icon("shield") +
    " Customer credit stays separate</span><strong>" +
    money(d.creditCents) +
    '</strong></div><section class="quick-section" aria-labelledby="quick-title"><div class="section-head"><h2 id="quick-title">Quick actions</h2></div><div class="quick-actions">' +
    btn(
      icon("plus") + "<span>Add Utang</span>",
      "new-utang",
      "primary quick-action",
    ) +
    btn(
      icon("pay") + "<span>Record Payment</span>",
      "new-payment",
      "quick-action",
    ) +
    btn(
      icon("people") + "<span>Add Person</span>",
      "add-customer",
      "quick-action",
    ) +
    '</div></section><section class="due-section" aria-labelledby="due-title"><div class="section-head"><div><h2 id="due-title">Due soon</h2><p class="small muted">Due in the next 14 days</p></div><a class="quiet-link" href="#reminders">See all</a></div>' +
    (upcoming.length
      ? '<div class="due-list">' + due + "</div>"
      : empty(
          "No upcoming due dates",
          "No open balance is due in the next 14 days.",
        )) +
    '</section><section class="recent-section"><div class="section-head"><h2>Recent activity</h2><a class="quiet-link" href="#activity">View all</a></div><div class="card">' +
    (recent.length
      ? transactionRows(recent)
      : empty("No transactions", "Recorded activity will appear here.")) +
    "</div></section>"
  );
}
function dueSoonRows(days = 14) {
  const state = model.getState(),
    todayISO = today(),
    cutoff = new Date(todayISO + "T00:00:00.000Z");
  cutoff.setUTCDate(cutoff.getUTCDate() + days);
  const cutoffISO = cutoff.toISOString().slice(0, 10);
  const correctionIds = new Set(
    state.transactions
      .filter((tx) => tx.voids_tx_id)
      .map((tx) => tx.voids_tx_id),
  );
  return state.customers
    .map((raw) => {
      const customer = model.getCustomer(raw.id),
        lots = [];
      for (const tx of state.transactions.filter(
        (row) => row.customer_id === raw.id,
      )) {
        if (tx.voided || tx.voids_tx_id || correctionIds.has(tx.id)) continue;
        if (tx.type === "utang")
          lots.push({ due_at: tx.due_at, remaining: tx.amount_cents });
        else {
          let payment = tx.amount_cents;
          for (const lot of lots) {
            const paid = Math.min(payment, lot.remaining);
            lot.remaining -= paid;
            payment -= paid;
            if (!payment) break;
          }
        }
      }
      const due = lots.filter(
        (lot) =>
          lot.remaining > 0 &&
          lot.due_at &&
          lot.due_at >= todayISO &&
          lot.due_at <= cutoffISO,
      );
      if (!due.length) return null;
      return {
        customer,
        amount_cents: due.reduce((sum, lot) => sum + lot.remaining, 0),
        due_at: due.map((lot) => lot.due_at).sort()[0],
      };
    })
    .filter(Boolean)
    .sort(
      (a, b) =>
        a.due_at.localeCompare(b.due_at) ||
        a.customer.name.localeCompare(b.customer.name),
    );
}
function dueDayText(d) {
  const days = Math.round(
    (new Date(d + "T00:00:00Z") - new Date(today() + "T00:00:00Z")) / 86400000,
  );
  return days === 0
    ? "Today"
    : days === 1
      ? "Tomorrow"
      : "In " + days + " days";
}
function people() {
  let rows = model.getState().customers.map((c) => customer(c.id));
  rows = rows.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) &&
      (filter === "All" ||
        (filter === "Overdue" && owed(c.id) > 0) ||
        status(c.id) === filter),
  );
  rows.sort((a, b) =>
    sort === "name"
      ? a.name.localeCompare(b.name)
      : sort === "recent"
        ? b.created_at.localeCompare(a.created_at)
        : b.balance_cents - a.balance_cents,
  );
  const all = model.getState().customers;
  const cards = rows
    .map(
      (c, i) =>
        '<button class="customer-row" data-action="customer" data-id="' +
        esc(c.id) +
        '"><span class="avatar ' +
        (i % 3 === 1 ? "amber" : i % 3 === 2 ? "blue" : "") +
        '">' +
        esc(initials(c.name)) +
        '</span><span class="customer-info"><span class="customer-name">' +
        esc(c.name) +
        '</span><span class="muted customer-due">' +
        (owed(c.id) > 0
          ? "Past due · " + nextDue(c.id)
          : c.balance_cents === 0
            ? "Paid in full"
            : c.balance_cents < 0
              ? "Customer credit"
              : nextDue(c.id)) +
        '</span></span><span class="customer-balance"><span class="money" style="display:block">' +
        money(c.balance_cents) +
        '</span><span class="status ' +
        (owed(c.id) > 0 ? "overdue" : status(c.id).toLowerCase()) +
        '">' +
        status(c.id) +
        (owed(c.id) > 0 ? " · Overdue" : "") +
        "</span></span>" +
        icon("arrow").replace('class="icon"', 'class="icon chevron"') +
        "</button>",
    )
    .join("");
  return (
    '<div class="page-heading people-heading"><div><h1>People</h1><p class="muted">Your customers and their current balances.</p></div>' +
    btn(
      icon("plus") + '<span class="people-add-label">Add Person</span>',
      "add-customer",
      "primary",
    ) +
    '</div><section class="people-directory" aria-label="People directory"><div class="ledger-tools"><div class="search">' +
    icon("search") +
    '<input id="search" type="search" aria-label="Search customers" placeholder="Search name" value="' +
    esc(search) +
    '"></div></div><div class="filter-row" aria-label="Balance filters">' +
    ["All", "Owes", "Overdue", "Settled", "Credit"]
      .map(
        (f) =>
          '<button class="chip ' +
          (filter === f ? "active" : "") +
          '" data-action="filter" data-value="' +
          f +
          '" aria-pressed="' +
          (filter === f) +
          '">' +
          (f === "Owes" ? "Owes You" : f) +
          "</button>",
      )
      .join("") +
    '</div><div class="list-meta"><span><b>' +
    rows.length +
    "</b> " +
    (search || filter !== "All" ? "matching" : "people") +
    (search || filter !== "All" ? " of " + all.length : "") +
    ' · Shared ledger</span><label class="sort-label" for="sort">Sort</label><select id="sort" aria-label="Sort customers"><option value="balance" ' +
    (sort === "balance" ? "selected" : "") +
    '>Balance: high first</option><option value="name" ' +
    (sort === "name" ? "selected" : "") +
    '>Name: A to Z</option><option value="recent" ' +
    (sort === "recent" ? "selected" : "") +
    '>Newest first</option></select></div><div class="customer-list">' +
    (cards ||
      empty(
        all.length ? "No matching people" : "No people yet",
        all.length
          ? "Try another name or clear the filters."
          : "Add a customer to start the shared ledger.",
        btn(
          all.length ? "Clear filters" : "Add Person",
          all.length ? "clear-search" : "add-customer",
          "primary",
        ),
      )) +
    "</div></section>"
  );
}
function nextDue(id) {
  const t = txs(id)
    .filter(
      (t) => t.type === "utang" && !t.voided && !t.voids_tx_id && t.due_at,
    )
    .sort((a, b) => a.due_at.localeCompare(b.due_at))[0];
  return t ? "Due " + date(t.due_at) : "No due date set";
}
function transactionRows(items, interactive = true) {
  return items
    .slice()
    .reverse()
    .map(
      (t) =>
        `<${interactive ? "button" : "div"} class="transaction" ${interactive ? `data-action="transaction" data-id="${t.id}"` : ""}><span class="stat-icon ${t.type === "utang" ? "amber" : ""}">${icon(t.voided ? "close" : t.type === "utang" ? "bag" : "pay")}</span><span class="tx-main"><h3>${esc(t.note || (t.type === "utang" ? "Utang" : "Payment"))}</h3><span class="small muted" style="display:block">${date(t.created_at)}${t.due_at ? " · Due " + date(t.due_at) : ""}</span><span class="small muted" style="display:block">Balance after: ${t.balance_after_cents < 0 ? "Credit " : ""}${money(t.balance_after_cents)}</span></span><span class="tx-end"><span class="money" style="color:var(--${t.type === "utang" ? "red" : "green"})">${t.type === "utang" ? "+" : "−"}${money(t.amount_cents)}</span><span class="status ${t.voided ? "overdue" : t.type === "payment" ? "settled" : "owes"}" style="display:block">${txLabel(t)}</span></span></${interactive ? "button" : "div"}>`,
    )
    .join("");
}
function activity() {
  const state = model.getState();
  let rows = state.transactions.slice();
  if (activityFilter === "Utang")
    rows = rows.filter((t) => t.type === "utang" && !t.voided);
  if (activityFilter === "Payments")
    rows = rows.filter((t) => t.type === "payment");
  if (activityFilter === "Overdue")
    rows = rows.filter(
      (t) => t.type === "utang" && !t.voided && t.due_at && t.due_at < today(),
    );
  if (activityFilter === "Voided")
    rows = rows.filter((t) => t.voided || t.voids_tx_id);
  rows.sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
  const list = rows
    .map((t) => {
      const c = customer(t.customer_id);
      return `<button class="activity-row" data-action="transaction" data-id="${esc(t.id)}"><span class="stat-icon ${t.type === "utang" ? "amber" : ""}">${icon(t.voided ? "close" : t.type === "utang" ? "bag" : "pay")}</span><span class="activity-main"><strong>${esc(c?.name || "Unknown customer")} · ${esc(t.note || (t.type === "utang" ? "Utang" : "Payment"))}</strong><span>${date(t.created_at)}${t.due_at ? " · Due " + date(t.due_at) : ""}</span></span><span class="activity-end"><b class="${t.type === "payment" ? "positive" : "negative"}">${t.type === "payment" ? "−" : "+"}${money(t.amount_cents)}</b><span class="status ${t.voided ? "overdue" : t.type === "payment" ? "settled" : "owes"}">${txLabel(t)}</span></span></button>`;
    })
    .join("");
  return `<div class="page-heading"><div><h1>Activity</h1><p class="muted">Every transaction in your shared ledger.</p></div>${btn(icon("download") + "Export Records", "export-records", "primary")}</div><div class="filter-row activity-filters" aria-label="Activity filters">${["All", "Utang", "Payments", "Overdue", "Voided"].map((value) => `<button class="chip ${activityFilter === value ? "active" : ""}" data-action="activity-filter" data-value="${value}">${value}</button>`).join("")}</div><section class="activity-list card">${list || empty("No matching transactions", "Transactions will appear here as they are recorded.")}</section>`;
}
function reminders() {
  const d = model.getDashboard(),
    upcoming = dueSoonRows(30),
    overdue = model
      .getState()
      .customers.map((raw) => ({
        customer: customer(raw.id),
        amount_cents: d.overdueByCustomer[raw.id] || 0,
      }))
      .filter((row) => row.amount_cents > 0)
      .sort((a, b) => b.amount_cents - a.amount_cents);
  const row = (item, isOverdue) =>
    `<article class="reminder-row ${isOverdue ? "is-overdue" : ""}"><span class="avatar">${esc(initials(item.customer.name))}</span><span class="reminder-main"><strong>${esc(item.customer.name)}</strong><span>${isOverdue ? "Past due" : date(item.due_at) + " · " + dueDayText(item.due_at)}</span></span><strong>${money(item.amount_cents)}</strong><button class="btn" data-action="new-payment" data-id="${esc(item.customer.id)}">Record payment</button></article>`;
  return `<div class="narrow">${back("Reminders", "more")}<div class="reminder-summary"><div><b>${upcoming.length + overdue.length}</b><span>To review</span></div><div><b>${money(upcoming.reduce((n, r) => n + r.amount_cents, 0) + d.overdueCents)}</b><span>Total due</span></div><div><b>${overdue.length}</b><span>Overdue</span></div></div><div class="section-head"><h2>Due soon</h2></div><div class="reminder-list">${upcoming.map((item) => row(item, false)).join("") || empty("Nothing due soon", "No open balance is due in the next 30 days.")}</div><div class="section-head"><h2>Overdue</h2></div><div class="reminder-list">${overdue.map((item) => row(item, true)).join("") || empty("No overdue balances", "You’re all caught up.")}</div></div>`;
}
function detail() {
  const c = current();
  if (!c)
    return empty(
      "Customer not found",
      "This customer may have been deleted.",
      `<a href="#people" class="btn">Back to People</a>`,
    );
  return `${back(esc(c.name), returnRoute)}<div class="detail-grid"><section><div class="balance-card"><div class="between"><span class="muted small">Current balance</span><span class="badge">${status(c.id)}</span></div><p class="amount">${money(c.balance_cents)}</p><p class="small">${esc(c.name)} ${c.balance_cents > 0 ? "owes you" : c.balance_cents < 0 ? "has customer credit" : "is all settled"}</p><p class="muted small" style="margin-top:13px">${c.balance_cents > 0 ? nextDue(c.id) : "Shared ledger"}</p></div><div class="actions" style="margin-top:15px">${btn(icon("plus") + "Add utang", "new-utang", "primary")}${btn(icon("pay") + "Record payment", "new-payment")}</div>${btn(icon("share") + "Share statement", "share", "ghost wide", `style="margin-top:7px"`)}${note("Changes are stored in temporary frontend data for this session.")}${btn(icon("trash") + "Delete customer", "delete-customer", "ghost red wide", `style="margin-top:16px"`)}</section><section class="card"><div class="between" style="margin-bottom:5px"><h2>Transaction history</h2><span class="badge">${c.transactions.length} ${c.transactions.length === 1 ? "entry" : "entries"}</span></div>${c.transactions.length ? transactionRows(c.transactions) : empty("No transactions yet", "Record an utang or payment to start this ledger.", btn("Record utang", "new-utang", "primary"))}</section></div>`;
}
function customerSelect(selected) {
  return `<div class="field-group"><label for="customer-select">Customer</label><select id="customer-select" required><option value="">Choose a customer</option>${model
    .getState()
    .customers.map(
      (c) =>
        `<option value="${c.id}" ${selected === c.id ? "selected" : ""}>${esc(c.name)}</option>`,
    )
    .join("")}</select></div>`;
}
function record() {
  if (!draft || draft.type !== "utang")
    draft = {
      type: "utang",
      customerId: cid || "",
      mode: "items",
      items: [{ label: "", quantity: 1, price: "" }],
      cash: "",
      note: "",
      dueAt: "",
    };
  return `<div class="narrow">${back("Add utang", cid ? "detail/" + cid : "home")}<div class="stepper"><span class="active">01 · Record</span><span>02 · Review & consent</span><span>03 · Saved</span></div><form id="utang-form">${customerSelect(draft.customerId)}<div class="filter-row"><button type="button" class="chip ${draft.mode === "items" ? "active" : ""}" data-action="mode" data-value="items">Itemized utang</button><button type="button" class="chip ${draft.mode === "cash" ? "active" : ""}" data-action="mode" data-value="cash">Cash amount</button></div>${
    draft.mode === "items"
      ? `<div id="items">${draft.items.map((item, i) => `<div class="item-row" data-index="${i}"><div class="item-top"><input aria-label="Item ${i + 1} name" list="price-suggestions" class="item-label" placeholder="Item name" value="${esc(item.label)}" required maxlength="100"><button type="button" class="btn icon-only ghost" data-action="remove-item" data-index="${i}" aria-label="Remove item ${i + 1}">${icon("close")}</button></div><div class="item-fields"><div><label for="qty-${i}">Quantity</label><input id="qty-${i}" class="item-qty" type="number" min="1" max="9999" step="1" value="${item.quantity}" required></div><div><label for="price-${i}">Unit price · ₱</label><input id="price-${i}" class="item-price" type="number" min="0.01" max="9999999" step="0.01" value="${esc(item.price)}" placeholder="0.00" required></div><div><label>Subtotal</label><div class="subtotal" id="subtotal-${i}">${money(itemCents(item))}</div></div></div></div>`).join("")}</div><datalist id="price-suggestions">${model
          .getPriceBook()
          .map(
            (p) =>
              `<option value="${esc(p.label)}">${money(p.unit_price_cents)}</option>`,
          )
          .join(
            "",
          )}</datalist><div class="item-actions"><button type="button" class="btn" data-action="add-item">${icon("plus")}Add item</button><button type="button" class="btn smart-import-trigger" data-action="smart-import">${icon("download")}Smart Import</button></div><p class="small muted" style="margin:15px 0 8px">Suggested from Price Book</p><div class="filter-row">${model
          .getPriceBook()
          .slice(0, 3)
          .map(
            (p, i) =>
              `<button type="button" class="chip" data-action="suggestion" data-index="${i}">${esc(p.label)} · ${money(p.unit_price_cents)}</button>`,
          )
          .join("")}</div>`
      : `<div class="field-group"><label for="cash">Amount · ₱</label><input class="amount-input" id="cash" type="number" min="0.01" max="9999999" step="0.01" placeholder="0.00" value="${esc(draft.cash)}" required></div>`
  }<div class="balance-card between" style="padding:17px 20px;margin:19px 0"><span>Total utang</span><strong id="utang-total" style="font-size:25px">${money(draftTotal())}</strong></div><div class="field-group"><label for="due">Due date <span class="muted">(optional)</span></label><input id="due" type="date" value="${esc(draft.dueAt)}"></div><div class="field-group"><label for="note">Note <span class="muted">(optional)</span></label><textarea id="note" placeholder="e.g. Weekly groceries" maxlength="300">${esc(draft.note)}</textarea></div>${note("Every new utang needs a camera photo and a drawn signature. Review the details before confirming.")}<p id="form-error" class="error-text" role="alert"></p><button class="btn primary wide" type="submit">Review & collect consent ${icon("arrow")}</button></form></div>`;
}
function editRecord() {
  const transaction = model.getState().transactions.find((tx) => tx.id === editId);
  if (!transaction || transaction.type !== "utang" || transaction.voided || transaction.voids_tx_id)
    return empty("Record cannot be edited", "Only active utang records are available for editing.", `<a class="btn" href="#activity">Back to Activity</a>`);
  if (!draft || draft.type !== "edit" || draft.editingId !== transaction.id) {
    const hasItems = Boolean(transaction.line_items?.length);
    draft = {
      type: "edit",
      editingId: transaction.id,
      customerId: transaction.customer_id,
      mode: hasItems ? "items" : "cash",
      items: hasItems ? transaction.line_items.map((item) => ({ label: item.label, quantity: item.quantity, price: String(item.unit_price_cents / 100) })) : [{ label: "", quantity: 1, price: "" }],
      cash: String(transaction.amount_cents / 100),
      note: transaction.note || "",
      dueAt: transaction.due_at || "",
      reason: "",
    };
  }
  const itemEditor = `<div id="items">${draft.items.map((item, index) => `<div class="item-row" data-index="${index}"><div class="item-top"><input aria-label="Item ${index + 1} name" class="item-label" placeholder="Item name" value="${esc(item.label)}" required maxlength="100"><button type="button" class="btn icon-only ghost" data-action="remove-item" data-index="${index}" aria-label="Remove item ${index + 1}">${icon("close")}</button></div><div class="item-fields"><div><label for="qty-${index}">Quantity</label><input id="qty-${index}" class="item-qty" type="number" min="1" max="9999" step="1" value="${item.quantity}" required></div><div><label for="price-${index}">Unit price · ₱</label><input id="price-${index}" class="item-price" type="number" min="0.01" max="9999999" step="0.01" value="${esc(item.price)}" required></div><div><label>Subtotal</label><div class="subtotal" id="subtotal-${index}">${money(itemCents(item))}</div></div></div></div>`).join("")}</div><button type="button" class="btn" data-action="add-item">${icon("plus")}Add item</button>`;
  return `<div class="narrow">${back("Edit record", editReturnRoute)}<div class="edit-record-banner">${icon("edit")}<span><b>Editing ${esc(customer(transaction.customer_id)?.name || "customer")}’s utang</b><small>Saved payments and consent evidence will remain unchanged.</small></span></div><form id="edit-utang-form"><div class="field-group"><label>Customer</label><div class="readonly-field">${esc(customer(transaction.customer_id)?.name || "Unknown customer")}</div></div><div class="filter-row"><button type="button" class="chip ${draft.mode === "items" ? "active" : ""}" data-action="mode" data-value="items">Itemized utang</button><button type="button" class="chip ${draft.mode === "cash" ? "active" : ""}" data-action="mode" data-value="cash">Cash amount</button></div>${draft.mode === "items" ? itemEditor : `<div class="field-group"><label for="cash">Amount · ₱</label><input class="amount-input" id="cash" type="number" min="0.01" max="9999999" step="0.01" value="${esc(draft.cash)}" required></div>`}<div class="balance-card between edit-total"><span>Updated total</span><strong id="utang-total">${money(draftTotal())}</strong></div><div class="field-group"><label for="due">Due date <span class="muted">(optional)</span></label><input id="due" type="date" value="${esc(draft.dueAt)}"></div><div class="field-group"><label for="note">Note <span class="muted">(optional)</span></label><textarea id="note" maxlength="300">${esc(draft.note)}</textarea></div><div class="field-group"><label for="edit-reason">Reason for editing</label><textarea id="edit-reason" required maxlength="300" placeholder="e.g. Corrected quantity after checking the receipt">${esc(draft.reason)}</textarea></div>${note("The original values and your reason will be preserved in Edit History. Payments are never changed by this edit.")}<p id="form-error" class="error-text" role="alert"></p><div class="edit-form-actions"><a class="btn" href="#${editReturnRoute}">Cancel</a><button class="btn primary" type="submit">Review Changes ${icon("arrow")}</button></div></form></div>`;
}
function parseCents(value) {
  const s = String(value).trim();
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return NaN;
  const [a, b = ""] = s.split(".");
  const c = Number(a) * 100 + Number(b.padEnd(2, "0"));
  return Number.isSafeInteger(c) ? c : NaN;
}
function itemCents(i) {
  const c = parseCents(i.price);
  return Number.isFinite(c) && Number.isInteger(Number(i.quantity))
    ? c * Number(i.quantity)
    : 0;
}
function draftTotal() {
  return draft.mode === "cash"
    ? parseCents(draft.cash) || 0
    : draft.items.reduce((n, i) => n + itemCents(i), 0);
}
function syncDraft() {
  if (!draft) return;
  draft.customerId = $("#customer-select")?.value || draft.customerId;
  draft.note = $("#note")?.value ?? draft.note;
  draft.dueAt = $("#due")?.value ?? draft.dueAt;
  draft.reason = $("#edit-reason")?.value ?? draft.reason;
  if (draft.type === "utang" || draft.type === "edit") {
    draft.cash = $("#cash")?.value ?? draft.cash;
    document.querySelectorAll(".item-row").forEach((row) => {
      const i = Number(row.dataset.index);
      draft.items[i] = {
        label: row.querySelector(".item-label").value,
        quantity: Number(row.querySelector(".item-qty").value),
        price: row.querySelector(".item-price").value,
      };
    });
  } else draft.amount = $("#payment-amount")?.value ?? draft.amount;
}
function payment() {
  if (!draft || draft.type !== "payment")
    draft = { type: "payment", customerId: cid || "", amount: "", note: "" };
  const bal = balance(draft.customerId),
    amount = parseCents(draft.amount) || 0;
  return `<div class="narrow">${back("Record payment", cid ? "detail/" + cid : "home")}<form id="payment-form">${customerSelect(draft.customerId)}<div class="field-group"><label for="payment-amount">Payment amount · ₱</label><input id="payment-amount" class="amount-input" type="number" min="0.01" step="0.01" max="9999999" value="${esc(draft.amount)}" placeholder="0.00" required></div><div class="filter-row">${[50000, 100000, Math.max(0, Math.round(bal / 2)), Math.max(0, bal)].map((v, i) => `<button type="button" class="chip" data-action="payment-quick" data-value="${v}" ${!v ? "disabled" : ""}>${i === 2 ? "Half" : i === 3 ? "Full balance" : money(v)}</button>`).join("")}</div><div class="field-group"><label for="note">Note <span class="muted">(optional)</span></label><textarea id="note" placeholder="e.g. Paid at the store" maxlength="300">${esc(draft.note)}</textarea></div><div class="totals"><div class="between"><span class="muted">Current balance</span><span>${bal < 0 ? "Credit " : ""}${money(bal)}</span></div><div class="between"><span class="muted">Payment</span><span id="payment-preview">−${money(amount)}</span></div><div class="between total"><span>New balance</span><strong id="payment-result">${bal - amount < 0 ? "Credit " : ""}${money(bal - amount)}</strong></div></div><p class="small muted" style="margin-top:13px">Payments do not require photo or signature consent.</p><p id="form-error" class="error-text" role="alert"></p><button class="btn primary wide form-footer" type="submit">${icon("check")}Confirm payment</button></form></div>`;
}
function consent() {
  if (!draft || !draft.total)
    return empty(
      "Start with an utang",
      "Add the transaction details before collecting consent.",
      `<a class="btn primary" href="#record">Record utang</a>`,
    );
  const c = customer(draft.customerId);
  if (!c)
    return empty(
      "Customer unavailable",
      "Choose an existing customer before recording this transaction.",
    );
  const photoPanel = photo
    ? `<img class="photo-preview" src="${photo}" alt="Captured camera photo for this transaction"><div class="actions" style="margin-top:10px">${btn(icon("camera") + "Retake", "retake")}${btn(icon("trash") + "Delete photo", "delete-photo", "red")}</div>`
    : `<div class="photo-placeholder"><video id="camera-video" class="photo-preview" playsinline muted style="${cameraActive ? "" : "display:none"}"></video>${cameraActive ? "<strong>Camera ready · frame preview</strong>" : `<strong>${cameraError ? "Camera unavailable" : "Take a photo for this transaction"}</strong><span class="small">${cameraError ? "Allow camera access and retry. Confirmation stays blocked." : "Use the camera, then review or retake the retained photo."}</span>`}${btn(cameraError ? "Retry camera" : cameraActive ? "Capture photo" : "Take photo", cameraError ? "retry-camera" : cameraActive ? "capture-photo" : "take-photo", "primary")}${cameraActive ? btn("Cancel camera", "cancel-camera") : ""}</div>`;
  return `<div class="narrow">${back("Customer confirmation", "record")}<div class="stepper"><span class="active">01 · Record</span><span class="active">02 · Review & consent</span><span>03 · Saved</span></div><p class="muted" style="margin-bottom:19px"><b>${esc(c.name)}</b>, please review before confirming.</p><div class="card"><h2 style="font-size:17px;margin-bottom:15px">Utang summary</h2>${draft.mode === "items" ? draft.items.map((i) => `<div class="between small" style="margin-bottom:10px"><span>${esc(i.label)} × ${i.quantity}</span><b>${money(itemCents(i))}</b></div>`).join("") : ""}<div class="between"><span>Total utang</span><strong style="font-size:24px">${money(draft.total)}</strong></div><div class="between small" style="margin-top:10px"><span class="muted">Resulting balance</span><b>${balance(c.id) + draft.total < 0 ? "Credit " : ""}${money(balance(c.id) + draft.total)}</b></div><div class="between small" style="margin-top:10px"><span class="muted">Due date</span><span>${date(draft.dueAt)}</span></div>${draft.note ? `<p class="small muted" style="margin-top:10px">${esc(draft.note)}</p>` : ""}</div><div class="section-head"><h2>1. Take a photo</h2><span class="badge">Required</span></div><div id="photo-area">${photoPanel}</div><div class="section-head"><h2>2. Customer signature</h2><span class="badge">Required</span></div><p class="small muted">Ask the customer to sign below. The existing signature pad is unchanged.</p><canvas id="signature" class="signature" width="900" height="360" aria-label="Draw customer signature" tabindex="0"></canvas><div class="actions" style="margin-top:10px">${btn("Clear signature", "clear-signature", "ghost")}</div><p id="consent-state" class="small muted" role="status" style="margin-top:13px"></p><p id="form-error" class="error-text" role="alert"></p>${btn(icon("check") + "Confirm utang", "confirm-utang", "primary wide form-footer", `id="confirm-utang" disabled`)}</div>`;
}
let strokes = [],
  drawing = false,
  lastPoint = null,
  keyPoint = { x: 100, y: 180 };
function bindCanvas() {
  const canvas = $("#signature");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  ctx.strokeStyle = "#19312f";
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  strokes.forEach(([a, b]) => drawSegment(ctx, a, b));
  const point = (e) => {
    const r = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) * canvas.width) / r.width,
      y: ((e.clientY - r.top) * canvas.height) / r.height,
    };
  };
  canvas.onpointerdown = (e) => {
    drawing = true;
    lastPoint = point(e);
    canvas.setPointerCapture(e.pointerId);
  };
  canvas.onpointermove = (e) => {
    if (!drawing) return;
    const p = point(e);
    addStroke(ctx, lastPoint, p);
    lastPoint = p;
  };
  canvas.onpointerup = canvas.onpointercancel = () => {
    drawing = false;
    lastPoint = null;
  };
  canvas.onkeydown = (e) => {
    const deltas = {
      ArrowLeft: [-15, 0],
      ArrowRight: [15, 0],
      ArrowUp: [0, -15],
      ArrowDown: [0, 15],
    };
    if (!deltas[e.key]) return;
    e.preventDefault();
    const [dx, dy] = deltas[e.key],
      next = {
        x: Math.max(5, Math.min(895, keyPoint.x + dx)),
        y: Math.max(5, Math.min(355, keyPoint.y + dy)),
      };
    if (e.shiftKey) addStroke(ctx, keyPoint, next);
    keyPoint = next;
  };
  updateConsent();
}
function drawSegment(ctx, a, b) {
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.stroke();
}
function addStroke(ctx, a, b) {
  const d = Math.hypot(b.x - a.x, b.y - a.y);
  if (d < 1) return;
  drawSegment(ctx, a, b);
  strokes.push([a, b]);
  signatureDistance += d;
  const points = [a, b];
  points.forEach((p) => {
    if (!signatureBounds)
      signatureBounds = { minX: p.x, maxX: p.x, minY: p.y, maxY: p.y };
    else {
      signatureBounds.minX = Math.min(signatureBounds.minX, p.x);
      signatureBounds.maxX = Math.max(signatureBounds.maxX, p.x);
      signatureBounds.minY = Math.min(signatureBounds.minY, p.y);
      signatureBounds.maxY = Math.max(signatureBounds.maxY, p.y);
    }
  });
  updateConsent();
}
function meaningful() {
  return (
    signatureDistance >= 90 &&
    signatureBounds &&
    signatureBounds.maxX - signatureBounds.minX >= 35 &&
    signatureBounds.maxY - signatureBounds.minY >= 12
  );
}
function updateConsent() {
  const valid = photo && !cameraError && meaningful() && !busy;
  if ($("#confirm-utang")) $("#confirm-utang").disabled = !valid;
  if ($("#consent-state"))
    $("#consent-state").textContent = valid
      ? "Photo retained and signature ready. You can confirm this utang."
      : cameraError
        ? "Camera failed. Allow access and retry before confirming."
        : !photo
          ? cameraActive
            ? "Camera ready. Capture the photo to continue."
            : "Take a camera photo to continue."
          : "Add a meaningful signature to continue.";
}
function clearConsent() {
  if (cameraStream) stopCamera(cameraStream, $("#camera-video"));
  cameraStream = null;
  cameraActive = false;
  photo = null;
  strokes = [];
  signatureDistance = 0;
  signatureBounds = null;
  cameraError = false;
}
function bindCamera() {
  const video = $("#camera-video");
  if (!video || !cameraStream) return;
  video.muted = true;
  video.playsInline = true;
  if (video.srcObject !== cameraStream) video.srcObject = cameraStream;
  video.play().catch((error) => {
    cameraError = true;
    cameraActive = false;
    stopCamera(cameraStream, video);
    cameraStream = null;
    render();
    toast(error.message || "Camera playback failed. Retry capture.");
  });
}
async function startCamera() {
  if (cameraStream && cameraActive) return;
  cameraError = false;
  cameraActive = true;
  render();
  try {
    cameraStream = await openCamera({ video: $("#camera-video") });
    updateConsent();
  } catch (error) {
    cameraStream = null;
    cameraActive = false;
    cameraError = true;
    render();
    toast(error.message || "Camera unavailable. No utang was saved.");
  }
}
function capturePhoto() {
  try {
    const video = $("#camera-video"),
      canvas = document.createElement("canvas");
    photo = captureFrame(video, canvas, { width: 900, height: 440 }).toDataURL(
      "image/png",
    );
    stopCamera(cameraStream, video);
    cameraStream = null;
    cameraActive = false;
    cameraError = false;
    render();
  } catch (error) {
    if (cameraStream) stopCamera(cameraStream, $("#camera-video"));
    cameraStream = null;
    cameraActive = false;
    photo = null;
    cameraError = true;
    render();
    toast(error.message || "Photo capture failed. Retry the camera.");
  }
}
function canvasBlob(canvas, type, quality) {
  return new Promise((resolve, reject) => {
    if (typeof canvas.toBlob !== "function")
      return reject(new Error("This browser cannot encode consent evidence."));
    canvas.toBlob(
      (blob) =>
        blob
          ? resolve(blob)
          : reject(new Error("Consent evidence could not be encoded.")),
      type,
      quality,
    );
  });
}
async function blobToBase64(blob) {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000)
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary);
}
async function composite() {
  const canvas = document.createElement("canvas");
  canvas.width = 900;
  canvas.height = 1060;
  const x = canvas.getContext("2d");
  if (!x) throw new Error("Consent evidence could not be composed.");
  x.fillStyle = "white";
  x.fillRect(0, 0, 900, 1060);
  const img = new Image();
  img.src = photo;
  await img.decode();
  x.drawImage(img, 0, 0, 900, 440);
  x.fillStyle = "#19312f";
  x.font = "bold 25px sans-serif";
  x.fillText("Customer signature", 30, 490);
  x.drawImage($("#signature"), 0, 510, 900, 360);
  x.font = "20px sans-serif";
  x.fillText(
    customer(draft.customerId).name.slice(0, 55) + " · " + money(draft.total),
    30,
    925,
  );
  x.fillText(
    "Due: " + date(draft.dueAt) + " · " + new Date().toISOString(),
    30,
    966,
  );
  x.font = "17px sans-serif";
  x.fillText("Transaction ID: " + draft.clientTxId, 30, 1015);
  let blob = await canvasBlob(canvas, "image/webp", 0.85);
  if (!["image/webp", "image/png"].includes(blob.type))
    blob = await canvasBlob(canvas, "image/png");
  if (!["image/webp", "image/png"].includes(blob.type) || !blob.size)
    throw new Error("Consent evidence encoding failed.");
  return { mime: blob.type, dataBase64: await blobToBase64(blob) };
}
function success() {
  if (!lastSaved) return home();
  const c = customer(lastSaved.customer_id);
  return `<div class="narrow center"><div class="success-icon">${icon("check")}</div><h1 class="success-title">${lastSaved.type === "utang" ? "Utang recorded!" : "Payment recorded!"}</h1><p class="muted">${lastSaved.type === "utang" ? "Photo and signature attached to this utang." : "One less thing to keep in mind. Salamat!"}</p><div class="card" style="margin:27px 0;text-align:left"><p class="money center" style="font-size:35px;margin-bottom:20px">${money(lastSaved.amount_cents)}</p><div class="between"><span class="muted">Customer</span><b>${esc(c?.name)}</b></div><div class="between" style="margin-top:15px"><span class="muted">Updated balance</span><strong>${balance(c?.id) < 0 ? "Credit " : ""}${money(balance(c?.id))}</strong></div>${lastSaved.type === "utang" ? note("One composite photo and signature is kept for this local session.") : ""}</div><a class="btn primary wide" href="#detail/${lastSaved.customer_id}">View updated ledger ${icon("arrow")}</a><p class="small muted" style="margin:17px">Temporary changes reset when the page reloads.</p></div>`;
}
const settingsRow = (i, title, sub, action) =>
  `<button class="settings-row" data-action="${action}"><span class="stat-icon">${icon(i)}</span><span class="grow"><b>${title}</b><span class="muted" style="display:block">${sub}</span></span>${icon("arrow")}</button>`;
function more() {
  return `<div class="narrow"><div class="page-heading"><div><h1>More</h1><p class="muted">Settings and ledger tools.</p></div></div><div class="more-profile"><span class="avatar big">${icon("shield")}</span><div><h2>Frontend prototype</h2><p>Temporary data for frontend development</p></div></div><div class="card more-links">${settingsRow("clock", "Reminders", "Review upcoming and overdue balances", "reminders")}${settingsRow("download", "Export Records", "Download Excel, CSV, or PDF reports", "export-records")}${settingsRow("lock", "PIN lock", pin ? "PIN is set for this tab" : "Protect this screen on this device", "pin")}${settingsRow("tag", "Price Book", "Item and price suggestions", "prices")}</div><div class="card more-links">${settingsRow("settings", "Settings", "Local preview preferences", "open-settings")}${settingsRow("shield", "Ledger integrity", "Verify the local transaction chain", "verify")}${settingsRow("book", "About LISTA", "How this frontend preview works", "about")}</div><div class="card more-links">${settingsRow("logout", "Log out", "Return to the LISTA welcome screen", "logout")}</div><p class="sync-status"><i class="dot"></i>Temporary local session</p></div>`;
}
function settings() {
  return `<div class="narrow"><div class="page-heading"><div><h1>Settings</h1><p class="muted">Frontend preview preferences and tools.</p></div></div><div class="balance-card between" style="margin-bottom:20px"><div><h2>Frontend prototype</h2><p class="muted small" style="margin-top:6px">Data resets when the page reloads</p></div><span class="avatar">${icon("shield")}</span></div><div class="card">${settingsRow("lock", "Local device PIN", pin ? "PIN set for this tab · Lock or remove" : "Set a four-digit device PIN", "pin")}${settingsRow("tag", "Price Book", "Saved item prices for quicker itemized utang", "prices")}${settingsRow("shield", "Ledger integrity", "Verify the local transaction chain", "verify")}</div><div class="section-head"><h2>About LISTA</h2></div><div class="card">${settingsRow("home", "Add a home-screen shortcut", "Use the browser menu to add LISTA to your home screen", "install")}${settingsRow("book", "How LISTA works", "Frontend-only preview with temporary data", "about")}</div><div class="card more-links" style="margin-top:14px">${settingsRow("logout", "Log out", "Return to the LISTA welcome screen", "logout")}</div>${note("The backend is intentionally not implemented. Temporary data is isolated in the frontend service layer.")}</div>`;
}
function verify() {
  const s = model.getState(),
    r = verifyResult;
  return `<div class="narrow">${back("Ledger integrity")}<p class="muted" style="margin-bottom:22px">Verify the temporary local transaction chain.</p><div class="card center"><div class="success-icon" style="${r && !r.valid ? "color:var(--red);background:var(--rose)" : ""}">${icon(r && !r.valid ? "alert" : "shield")}</div><h2>${!r ? "Ready to verify" : r.valid ? "Chain intact" : "Chain check failed"}</h2><p class="muted small" style="margin:12px 0 22px">${!r ? `${s.transactions.length} local records · SHA-256` : r.valid ? `${r.count} records checked. Every hash and predecessor link matches.` : esc(r.reason || "The local chain check failed.") + (r.brokenId ? " Record: " + esc(r.brokenId) : "")}</p>${btn(icon("shield") + "Verify local chain", "run-verify", "primary wide")}</div><div class="section-head"><h2>Latest transaction hash</h2></div><div class="card">${s.transactions.length ? `<div class="hash">${esc(s.transactions.at(-1).tx_hash || "Not available")}</div>` : empty("No transactions", "The ledger has no transactions yet.")}</div>${note("This frontend-only check is for UI development and does not replace future backend validation.")}</div>`;
}
function prices() {
  const rows = model
    .getPriceBook()
    .filter((p) => p.label.toLowerCase().includes(priceSearch.toLowerCase()));
  return `<div class="narrow">${back("Price Book", "settings")}<p class="muted" style="margin-bottom:18px">Suggestions for itemized utang. This is not inventory.</p><div class="ledger-tools"><div class="search">${icon("search")}<input id="price-search" type="search" aria-label="Search saved products" value="${esc(priceSearch)}" placeholder="Search saved products"></div>${btn(icon("plus"), "add-price", "primary", 'aria-label="Add price"')}</div><div class="card">${rows.map((p) => `<button class="settings-row" data-action="edit-price" data-label="${esc(p.label)}"><span class="stat-icon">${icon("tag")}</span><span class="grow"><b>${esc(p.label)}</b><span class="muted" style="display:block">Saved unit price</span></span><b>${money(p.unit_price_cents)}</b>${icon("edit")}</button>`).join("") || empty("No saved products", "Add an item or try another search.")}</div></div>`;
}
function pinScreen() {
  return `<div class="narrow center" style="padding-top:30px"><div class="success-icon">${icon("lock")}</div><h1 style="font-size:27px">Enter your device PIN</h1><p class="muted" style="margin:12px 0 26px">Local screen lock · Device only</p><form id="unlock-form"><label for="unlock-pin">Four-digit PIN</label><input class="pin-input" id="unlock-pin" inputmode="numeric" type="password" pattern="[0-9]{4}" minlength="4" maxlength="4" required autocomplete="off"><p id="form-error" class="error-text" role="alert"></p><button class="btn primary wide" type="submit">Unlock this tab</button></form><p class="small muted" style="margin-top:22px">This local screen lock resets when the page reloads. It does not encrypt or persist data.</p></div>`;
}
function modal(html) {
  const d = $("#dialog");
  d.innerHTML =
    btn(
      icon("close"),
      "close-dialog",
      "icon-only ghost dialog-close",
      'aria-label="Close dialog"',
    ) + html;
  if (!d.open) d.showModal();
  bindDialog();
}
function closeModal() {
  const dialog = $("#dialog");
  dialog.close();
  dialog.classList.remove("smart-import-dialog");
  dialog.classList.remove("export-report-dialog");
  if (evidenceUrl) {
    URL.revokeObjectURL(evidenceUrl);
    evidenceUrl = null;
  }
}

function clearSmartImportPreview() {
  if (smartImport?.previewUrl) URL.revokeObjectURL(smartImport.previewUrl);
  if (smartImport) smartImport.previewUrl = null;
}
function smartImportTotal() {
  return (smartImport?.items || []).reduce((total, item) => total + itemCents(item), 0);
}
function syncSmartImportItems() {
  if (!smartImport) return;
  document.querySelectorAll("#smart-review .smart-import-row").forEach((row) => {
    const index = Number(row.dataset.index);
    smartImport.items[index] = {
      label: row.querySelector(".smart-item-label").value,
      quantity: Number(row.querySelector(".smart-item-qty").value),
      price: row.querySelector(".smart-item-price").value,
    };
  });
}
function smartImportMethodPicker() {
  const cards = Object.entries(SMART_IMPORT_METHODS).map(([key, method]) => {
    const methodIcon = key === "spreadsheet" ? "download" : key === "handwritten" ? "edit" : "camera";
    return `<button class="import-method" type="button" data-action="smart-method" data-method="${key}"><span class="stat-icon">${icon(methodIcon)}</span><span><b>${method.title}</b><small>${method.description}</small></span>${icon("arrow")}</button>`;
  }).join("");
  return `<div class="smart-import-heading"><span class="eyebrow">Choose a source</span><h2>How would you like to import?</h2><p>Select a method. Extraction is simulated for this presentation.</p></div><div class="import-methods">${cards}</div>`;
}
function smartImportUpload() {
  const method = SMART_IMPORT_METHODS[smartImport.method], isImage = smartImport.method !== "spreadsheet";
  return `<button class="import-back" type="button" data-action="smart-import-back">${icon("back")} All methods</button><div class="smart-import-heading"><span class="eyebrow">${method.title}</span><h2>Choose a ${isImage ? "photo" : "file"}</h2><p>${method.description} Mock items will be used regardless of file contents.</p></div><label class="import-dropzone" for="smart-import-file">${smartImport.previewUrl ? `<img src="${esc(smartImport.previewUrl)}" alt="Selected ${smartImport.method === "receipt" ? "receipt" : "handwritten list"} preview">` : `<span class="stat-icon">${icon(isImage ? "camera" : "download")}</span><b>${isImage ? "Upload or capture an image" : "Upload Excel or CSV"}</b><small>${isImage ? "JPG, PNG, HEIC, or a camera capture" : ".xlsx, .xls, or .csv"}</small>`}<input id="smart-import-file" type="file" accept="${method.accept}" ${isImage ? 'capture="environment"' : ""} aria-label="${method.inputLabel}"></label>${smartImport.fileName ? `<div class="selected-file">${icon("check")}<span><b>${esc(smartImport.fileName)}</b><small>Ready for simulated extraction</small></span></div>` : ""}<p id="smart-import-error" class="error-text" role="alert">${esc(smartImport.error || "")}</p><button class="btn primary wide" type="button" data-action="smart-extract" ${smartImport.fileName ? "" : "disabled"}>${icon("search")}Extract Items</button>`;
}
function smartImportProcessing() {
  return `<div class="smart-processing"><div class="smart-progress-ring"><div class="spinner"></div></div><span class="eyebrow">Smart Import</span><h2>Extracting your items</h2><p>${esc(smartImport.progress || "Preparing your file…")}</p><div class="progress-track"><span></span></div><small>Your original utang draft is safe.</small></div>`;
}
function smartImportReview() {
  const rows = smartImport.items.map((item, index) => `<div class="smart-import-row" data-index="${index}"><div class="smart-item-name"><label for="smart-label-${index}">Item</label><input id="smart-label-${index}" class="smart-item-label" value="${esc(item.label)}" maxlength="100" placeholder="Item name"></div><div><label for="smart-qty-${index}">Qty</label><input id="smart-qty-${index}" class="smart-item-qty" type="number" min="1" max="9999" step="1" value="${item.quantity}"></div><div><label for="smart-price-${index}">Price · ₱</label><input id="smart-price-${index}" class="smart-item-price" type="number" min="0.01" max="9999999" step="0.01" value="${esc(item.price)}"></div><div class="smart-subtotal"><label>Subtotal</label><b id="smart-subtotal-${index}">${money(itemCents(item))}</b></div><button class="btn icon-only ghost red" type="button" data-action="smart-remove-item" data-index="${index}" aria-label="Remove ${esc(item.label || `item ${index + 1}`)}">${icon("trash")}</button></div>`).join("");
  const list = rows || `<div class="import-empty"><span class="stat-icon">${icon("bag")}</span><h3>No items to add</h3><p>Add an item to continue reviewing this import.</p></div>`;
  return `<div class="import-success-banner">${icon("check")}<span><b>${smartImport.items.length} items extracted</b><small>Simulated results are ready to review.</small></span></div><div class="smart-import-heading review"><span class="eyebrow">Review & edit</span><h2>Check extracted items</h2><p>Correct names, quantities, or prices before adding them to this utang.</p></div><div id="smart-review" class="smart-review-list">${list}</div><button class="btn ghost smart-add-row" type="button" data-action="smart-add-item">${icon("plus")}Add another item</button><div class="smart-import-total"><span>Import total</span><strong id="smart-import-total">${money(smartImportTotal())}</strong></div><p id="smart-import-error" class="error-text" role="alert">${esc(smartImport.error || "")}</p><div class="smart-import-footer"><button class="btn" type="button" data-action="smart-import-restart">Start over</button><button class="btn primary" type="button" data-action="smart-add-to-utang" ${smartImport.items.length ? "" : "disabled"}>${icon("plus")}Add Items to Utang</button></div>`;
}
function renderSmartImport() {
  const content = !smartImport?.method ? smartImportMethodPicker() : smartImport.phase === "processing" ? smartImportProcessing() : smartImport.phase === "review" ? smartImportReview() : smartImportUpload();
  modal(`<div class="smart-import-shell">${content}</div>`);
  $("#dialog").classList.add("smart-import-dialog");
  const fileInput = $("#smart-import-file");
  if (fileInput) fileInput.onchange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    clearSmartImportPreview();
    smartImport.fileName = file.name;
    smartImport.error = "";
    if (smartImport.method !== "spreadsheet" && file.type.startsWith("image/")) smartImport.previewUrl = URL.createObjectURL(file);
    renderSmartImport();
  };
  const review = $("#smart-review");
  if (review) review.oninput = () => {
    syncSmartImportItems();
    smartImport.items.forEach((item, index) => {
      const subtotal = $("#smart-subtotal-" + index);
      if (subtotal) subtotal.textContent = money(itemCents(item));
    });
    $("#smart-import-total").textContent = money(smartImportTotal());
  };
}

function renderExportModal() {
  const report = buildExportReport(model.getState(), exportState.filters), loading = exportState.phase === "loading";
  const formats = [
    ["xlsx", "Excel", ".xlsx", "Structured workbook with Transactions, Item Details, and Summary sheets"],
    ["csv", "CSV", ".csv", "Formula-safe text file for Excel and Google Sheets"],
    ["pdf", "PDF", ".pdf", "Printable landscape report with totals and page numbers"],
  ].map(([value, title, extension, description]) => `<button class="export-format ${exportState.format === value ? "active" : ""}" type="button" data-action="export-format" data-value="${value}"><span class="export-file-icon">${icon(value === "pdf" ? "book" : "download")}</span><span><b>${title} <small>${extension}</small></b><small>${description}</small></span>${exportState.format === value ? icon("check") : ""}</button>`).join("");
  const customers = model.getState().customers.map((person) => `<option value="${esc(person.id)}" ${exportState.filters.customerId === person.id ? "selected" : ""}>${esc(person.name)}</option>`).join("");
  const customDates = exportState.filters.range === "custom" ? `<div class="export-date-grid"><div><label for="export-from">From</label><input id="export-from" type="date" value="${esc(exportState.filters.from)}"></div><div><label for="export-to">To</label><input id="export-to" type="date" value="${esc(exportState.filters.to)}"></div></div>` : "";
  const statusOptions = [["all", "All statuses"], ["unpaid", "Unpaid"], ["partially-paid", "Partially Paid"], ["paid", "Paid"], ["overdue", "Overdue"]].map(([value, label]) => `<option value="${value}" ${exportState.filters.status === value ? "selected" : ""}>${label}</option>`).join("");
  const statusArea = exportState.success ? `<div class="export-success">${icon("check")}<span><b>Export ready</b><small>${esc(exportState.success)}</small></span></div>` : exportState.error ? `<div class="view-note error">${icon("alert")}<span>${esc(exportState.error)}</span></div>` : "";
  const body = loading ? `<div class="export-loading"><div class="spinner"></div><h2>Preparing your ${exportState.format.toUpperCase()} report</h2><p>Formatting ${report.rows.length} ledger record${report.rows.length === 1 ? "" : "s"} locally…</p></div>` : `<div class="export-heading"><span class="eyebrow">Ledger reporting</span><h2>Export Records</h2><p>Create a local backup or presentation-ready report. Exporting never changes ledger data.</p></div><section class="export-section"><h3>1. Choose format</h3><div class="export-formats">${formats}</div></section><section class="export-section"><div class="between"><h3>2. Choose records</h3><span class="small muted">${exportState.filters.scope === "all" ? "Filters ignored" : "Filters applied"}</span></div><div class="export-scope"><button class="chip ${exportState.filters.scope === "filtered" ? "active" : ""}" data-action="export-scope" data-value="filtered">Use selected filters</button><button class="chip ${exportState.filters.scope === "all" ? "active" : ""}" data-action="export-scope" data-value="all">Export all records</button></div><div class="export-filter-grid ${exportState.filters.scope === "all" ? "is-disabled" : ""}"><div><label for="export-range">Date range</label><select id="export-range" ${exportState.filters.scope === "all" ? "disabled" : ""}><option value="all" ${exportState.filters.range === "all" ? "selected" : ""}>All Time</option><option value="today" ${exportState.filters.range === "today" ? "selected" : ""}>Today</option><option value="month" ${exportState.filters.range === "month" ? "selected" : ""}>This Month</option><option value="custom" ${exportState.filters.range === "custom" ? "selected" : ""}>Custom</option></select></div><div><label for="export-customer">Customer</label><select id="export-customer" ${exportState.filters.scope === "all" ? "disabled" : ""}><option value="all">All customers</option>${customers}</select></div><div><label for="export-status">Status</label><select id="export-status" ${exportState.filters.scope === "all" ? "disabled" : ""}>${statusOptions}</select></div></div>${exportState.filters.scope !== "all" ? customDates : ""}</section><section class="export-preview"><div><span class="eyebrow">Export preview</span><strong>${report.rows.length}</strong><small>record${report.rows.length === 1 ? "" : "s"}</small></div><dl><div><dt>Credit issued</dt><dd>${money(report.summary.totalCreditIssuedCents)}</dd></div><div><dt>Payments collected</dt><dd>${money(report.summary.paymentsCollectedCents)}</dd></div><div><dt>Outstanding</dt><dd>${money(report.summary.outstandingCents)}</dd></div></dl></section>${report.rows.length ? "" : `<div class="export-empty">${icon("alert")}<span><b>No records match these filters</b><small>Adjust the date, customer, or status before exporting.</small></span></div>`}${statusArea}<div class="export-footer"><button class="btn" data-action="close-dialog">Cancel</button><button class="btn primary" data-action="export-download" ${report.rows.length ? "" : "disabled"}>${icon("download")}Export ${exportState.format.toUpperCase()}</button></div>`;
  modal(`<div class="export-shell">${body}</div>`);
  $("#dialog").classList.add("export-report-dialog");
  const bindFilter = (selector, key) => {
    const field = $(selector);
    if (field) field.onchange = () => { exportState.filters[key] = field.value; exportState.success = ""; exportState.error = ""; renderExportModal(); };
  };
  bindFilter("#export-range", "range"); bindFilter("#export-customer", "customerId"); bindFilter("#export-status", "status"); bindFilter("#export-from", "from"); bindFilter("#export-to", "to");
}
function dialogError(e) {
  let el = $("#dialog-error");
  if (!el) {
    el = document.createElement("p");
    el.id = "dialog-error";
    el.className = "error-text";
    el.setAttribute("role", "alert");
    $("#dialog").append(el);
  }
  el.textContent = e.message || String(e);
}
function confirmDialog({ title, text, label, work }) {
  modal(
    `<h2>${title}</h2><p>${text}</p><div class="actions">${btn("Cancel", "close-dialog")}${btn(label, "confirm-danger", "danger")}</div>`,
  );
  $('#dialog [data-action="confirm-danger"]').onclick = async (e) => {
    const button = e.currentTarget;
    button.disabled = true;
    try {
      await work();
      closeModal();
      render();
    } catch (error) {
      dialogError(error);
      button.disabled = false;
    }
  };
}
function addCustomer() {
  const origin = route === "people" ? "people" : "home";
  modal(
    `<h2>Add a customer</h2><p>A name is all you need to start their ledger.</p><form id="customer-form"><label for="customer-name">Full name</label><input id="customer-name" required maxlength="90" placeholder="e.g. Rosa Dela Cruz" autocomplete="off"><p id="dialog-error" class="error-text" role="alert"></p><button class="btn primary wide" type="submit" style="margin-top:22px">Save customer</button></form>`,
  );
  $("#customer-form").onsubmit = async (event) => {
    event.preventDefault();
    try {
      const customer = await model.addCustomer($("#customer-name").value);
      returnRoute = origin;
      closeModal();
      go("detail", customer.id);
      toast("Customer added.");
    } catch (error) {
      dialogError(error);
    }
  };
}
function showTransaction(id) {
  const tx = model.getState().transactions.find((row) => row.id === id);
  if (!tx) return;
  const history = (tx.edit_history || []).slice().reverse().map((entry, index) => `<details class="edit-history-entry"><summary><span>Revision ${(tx.edit_history || []).length - index}</span><time>${date(entry.edited_at)}</time></summary><p><b>Reason:</b> ${esc(entry.reason)}</p><div class="history-change"><span>Amount</span><b>${money(entry.previous.amount_cents)} → ${money(entry.updated.amount_cents)}</b></div><div class="history-change"><span>Due date</span><b>${date(entry.previous.due_at)} → ${date(entry.updated.due_at)}</b></div><div class="history-change"><span>Note</span><b>${esc(entry.previous.note || "None")} → ${esc(entry.updated.note || "None")}</b></div><div class="history-change"><span>Items</span><b>${entry.previous.line_items?.length || 0} → ${entry.updated.line_items?.length || 0}</b></div></details>`).join("");
  modal(
    `<h2>Transaction details</h2><p>${esc(customer(tx.customer_id)?.name)} · ${date(tx.created_at)}</p><div class="totals"><div class="between"><span class="badge">${txLabel(tx)}</span><strong style="font-size:25px">${money(tx.amount_cents)}</strong></div><div class="between small"><span>Balance after</span><b>${tx.balance_after_cents < 0 ? "Credit " : ""}${money(tx.balance_after_cents)}</b></div></div>${tx.line_items?.length ? `<h3 style="margin:20px 0 10px">Items</h3>${tx.line_items.map((item) => `<div class="between small" style="margin-bottom:10px"><span>${esc(item.label)} × ${item.quantity}</span><b>${money(item.quantity * item.unit_price_cents)}</b></div>`).join("")}` : ""}<p style="margin:16px 0">${esc(tx.note || "No note")}<br><small>Due: ${date(tx.due_at)}</small></p>${tx.has_artifact ? btn(icon("eye") + "View saved consent", "evidence", "wide", `data-id="${tx.id}"`) : tx.type === "utang" ? '<p class="small muted">No consent photo is attached to this historical transaction.</p>' : ""}${tx.voided ? note("Original retained. An offsetting correction was appended to the ledger.") : tx.voids_tx_id ? note("This entry offsets the original transaction.") : ""}${tx.type === "utang" ? `<section class="edit-history"><div class="between"><h3>Edit History</h3><span class="badge">${(tx.edit_history || []).length}</span></div>${history || '<p class="small muted">No edits have been made to this record.</p>'}</section>` : ""}<div class="actions" style="margin-top:20px">${tx.type === "utang" && !tx.voided && !tx.voids_tx_id ? btn(icon("edit") + "Edit Record", "edit-record", "primary", `data-id="${tx.id}"`) : ""}${!tx.voided && !tx.voids_tx_id ? btn("Void / correct", "void", "", `data-id="${tx.id}"`) : ""}${btn("Permanently delete", "delete-tx", "red", `data-id="${tx.id}"`)}</div><div class="hash">Local SHA-256<br>${esc(tx.tx_hash || "Not available")}</div>`,
  );
}
function priceModal(label) {
  const p = model.getPriceBook().find((p) => p.label === label);
  modal(
    `<h2>${p ? "Edit product" : "Add product"}</h2><form id="price-form"><div class="field-group"><label for="product-label">Product</label><input id="product-label" required maxlength="100" value="${esc(p?.label)}" ${p ? "readonly" : ""}></div><div class="field-group"><label for="product-price">Unit price · ₱</label><input id="product-price" type="number" min="0.01" max="9999999" step="0.01" required value="${p ? p.unit_price_cents / 100 : ""}"></div><p id="dialog-error" class="error-text" role="alert"></p><button class="btn primary wide" type="submit">Save price</button>${p ? btn("Delete saved price", "delete-price", "ghost red wide", `data-label="${esc(p.label)}"`) : ""}</form>`,
  );
  $("#price-form").onsubmit = async (e) => {
    e.preventDefault();
    try {
      await model.setPrice(
        $("#product-label").value,
        parseCents($("#product-price").value),
      );
      closeModal();
      render();
      toast("Price saved.");
    } catch (e) {
      dialogError(e);
    }
  };
}
async function share() {
  const c = current();
  if (!c) return;
  try {
    const statement = await model.createStatement(c.id),
      link = new URL(statement.url, location.origin).href;
    modal(
      `<h2>Share statement</h2><p>A local preview link for <b>${esc(c.name)}</b>.</p><div class="totals"><div class="between"><span>Remaining balance</span><strong>${c.balance_cents < 0 ? "Credit " : ""}${money(c.balance_cents)}</strong></div><div class="between small"><span>Transactions</span><span>${c.transactions.length}</span></div></div>${note("This link points to the current frontend view. Persistent public statements will be implemented with the future backend.")}<label for="share-link" style="margin-top:18px">Preview link</label><input id="share-link" readonly value="${esc(link)}"><div class="actions">${btn(icon("share") + "Copy link", "copy-statement", "primary")}<a class="btn" href="${esc(link)}">Open preview</a></div>`,
    );
    $("#share-link").onclick = (event) => event.target.select();
  } catch (error) {
    toast(error.message || "Could not create statement link.");
  }
}
async function action(name, el) {
  if (busy) return;
  switch (name) {
    case "close-dialog":
      closeModal();
      break;
    case "filter":
      filter = el.dataset.value;
      render();
      break;
    case "activity-filter":
      activityFilter = el.dataset.value;
      render();
      break;
    case "export-records":
      exportState = { format: "xlsx", filters: defaultExportFilters(), phase: "ready", success: "", error: "" };
      renderExportModal();
      break;
    case "export-format":
      exportState.format = el.dataset.value;
      exportState.success = "";
      exportState.error = "";
      renderExportModal();
      break;
    case "export-scope":
      exportState.filters.scope = el.dataset.value;
      exportState.success = "";
      exportState.error = "";
      renderExportModal();
      break;
    case "export-download": {
      if (exportState.filters.range === "custom" && exportState.filters.from && exportState.filters.to && exportState.filters.from > exportState.filters.to) {
        exportState.error = "The start date must be before the end date.";
        renderExportModal();
        break;
      }
      const report = buildExportReport(model.getState(), exportState.filters);
      if (!report.rows.length) {
        exportState.error = "No records match the selected filters.";
        renderExportModal();
        break;
      }
      exportState.phase = "loading";
      exportState.error = "";
      renderExportModal();
      try {
        const blob = exportState.format === "csv" ? createCsvBlob(report) : exportState.format === "pdf" ? await createPdfBlob(report) : createXlsxBlob(report);
        const filename = exportFilename(exportState.format);
        downloadBlob(blob, filename);
        exportState.phase = "ready";
        exportState.success = `${filename} was generated locally.`;
        renderExportModal();
      } catch (error) {
        exportState.phase = "ready";
        exportState.error = error.message || "The report could not be generated.";
        renderExportModal();
      }
      break;
    }
    case "clear-search":
      search = "";
      filter = "All";
      render();
      break;
    case "customer":
      returnRoute = route === "people" ? "people" : "home";
      draft = null;
      go("detail", el.dataset.id);
      break;
    case "open-settings":
      go("settings");
      break;
    case "add-customer":
      addCustomer();
      break;
    case "new-utang":
      draft = null;
      clearConsent();
      go("record", cid);
      break;
    case "new-payment":
      if (el.dataset.id) cid = el.dataset.id;
      draft = null;
      go("payment", cid);
      break;
    case "mode":
      syncDraft();
      draft.mode = el.dataset.value;
      render();
      break;
    case "add-item":
      syncDraft();
      draft.items.push({ label: "", quantity: 1, price: "" });
      render();
      break;
    case "smart-import":
      syncDraft();
      clearSmartImportPreview();
      smartImport = { method: null, phase: "upload", fileName: "", previewUrl: null, progress: "", items: [], error: "" };
      renderSmartImport();
      break;
    case "smart-method":
      smartImport.method = el.dataset.method;
      smartImport.phase = "upload";
      smartImport.fileName = "";
      smartImport.error = "";
      clearSmartImportPreview();
      renderSmartImport();
      break;
    case "smart-import-back":
      clearSmartImportPreview();
      smartImport.method = null;
      smartImport.fileName = "";
      smartImport.error = "";
      renderSmartImport();
      break;
    case "smart-extract":
      if (!smartImport.fileName) {
        smartImport.error = "Choose a file or image before extracting items.";
        renderSmartImport();
        break;
      }
      smartImport.phase = "processing";
      smartImport.progress = "Preparing your file…";
      renderSmartImport();
      try {
        smartImport.items = await simulateSmartExtraction({ onProgress(message) {
          smartImport.progress = message;
          const progress = $(".smart-processing p");
          if (progress) progress.textContent = message;
        } });
        smartImport.phase = "review";
        smartImport.error = "";
        renderSmartImport();
      } catch (error) {
        smartImport.phase = "upload";
        smartImport.error = error.message || "Could not extract items. Try another file.";
        renderSmartImport();
      }
      break;
    case "smart-add-item":
      syncSmartImportItems();
      smartImport.items.push({ label: "", quantity: 1, price: "" });
      renderSmartImport();
      break;
    case "smart-remove-item":
      syncSmartImportItems();
      smartImport.items.splice(Number(el.dataset.index), 1);
      renderSmartImport();
      break;
    case "smart-import-restart":
      clearSmartImportPreview();
      smartImport = { method: null, phase: "upload", fileName: "", previewUrl: null, progress: "", items: [], error: "" };
      renderSmartImport();
      break;
    case "smart-add-to-utang": {
      syncSmartImportItems();
      const invalid = smartImport.items.some((item) => !item.label.trim() || !Number.isSafeInteger(item.quantity) || item.quantity < 1 || !(parseCents(item.price) > 0));
      if (!smartImport.items.length || invalid) {
        smartImport.error = "Each item needs a name, quantity, and valid price.";
        renderSmartImport();
        break;
      }
      const pristinePlaceholder = draft.items.length === 1 && !draft.items[0].label.trim() && !draft.items[0].price && draft.items[0].quantity === 1;
      if (pristinePlaceholder) draft.items = [];
      draft.items.push(...smartImport.items.map((item) => ({ ...item })));
      const importedCount = smartImport.items.length;
      clearSmartImportPreview();
      closeModal();
      smartImport = null;
      render();
      toast(`${importedCount} imported items added to this utang.`);
      break;
    }
    case "remove-item":
      syncDraft();
      draft.items.splice(Number(el.dataset.index), 1);
      render();
      break;
    case "suggestion": {
      syncDraft();
      const price = model.getPriceBook()[Number(el.dataset.index)],
        row = {
          label: price.label,
          quantity: 1,
          price: String(price.unit_price_cents / 100),
        };
      const emptyItem = draft.items.findIndex(
        (item) => !item.label && !item.price,
      );
      if (emptyItem >= 0) draft.items[emptyItem] = row;
      else draft.items.push(row);
      render();
      break;
    }
    case "payment-quick":
      syncDraft();
      draft.amount = String(Number(el.dataset.value) / 100);
      render();
      break;
    case "take-photo":
    case "retry-camera":
      await startCamera();
      break;
    case "retake":
      photo = null;
      cameraError = false;
      await startCamera();
      break;
    case "capture-photo":
      capturePhoto();
      break;
    case "delete-photo":
      if (cameraStream) stopCamera(cameraStream, $("#camera-video"));
      cameraStream = null;
      cameraActive = false;
      photo = null;
      cameraError = false;
      render();
      break;
    case "cancel-camera":
      if (cameraStream) stopCamera(cameraStream, $("#camera-video"));
      cameraStream = null;
      cameraActive = false;
      cameraError = false;
      render();
      break;
    case "clear-signature":
      strokes = [];
      signatureDistance = 0;
      signatureBounds = null;
      render();
      break;
    case "confirm-utang": {
      if (!photo || cameraError || !meaningful()) return;
      busy = true;
      updateConsent();
      try {
        if (!draft.clientTxId)
          draft.clientTxId = globalThis.crypto.randomUUID();
        const artifact = await composite();
        lastSaved = await model.addTransaction({
          customerId: draft.customerId,
          type: "utang",
          amountCents: draft.total,
          lineItems:
            draft.mode === "items"
              ? draft.items.map((item) => ({
                  label: item.label,
                  quantity: item.quantity,
                  unit_price_cents: parseCents(item.price),
                }))
              : null,
          note: draft.note,
          dueAt: draft.dueAt || null,
          clientTxId: draft.clientTxId,
          artifact,
        });
        cid = draft.customerId;
        draft = null;
        clearConsent();
        go("success");
      } catch (error) {
        $("#form-error").textContent =
          error.message || "Could not save this utang.";
      } finally {
        busy = false;
        updateConsent();
      }
      break;
    }
    case "transaction":
      showTransaction(el.dataset.id);
      break;
    case "edit-record": {
      const transaction = model.getState().transactions.find((row) => row.id === el.dataset.id);
      if (!transaction) break;
      editReturnRoute = route === "detail" ? `detail/${transaction.customer_id}` : "activity";
      editId = transaction.id;
      draft = null;
      closeModal();
      go("edit", transaction.id);
      break;
    }
    case "confirm-edit": {
      if (!editPending || busy) break;
      busy = true;
      try {
        const updated = await model.editTransaction(editPending.id, editPending.changes);
        cid = updated.customer_id;
        editId = null;
        editPending = null;
        draft = null;
        closeModal();
        go("detail", cid);
        toast("Record updated. The previous values were saved in Edit History.");
      } catch (error) {
        dialogError(error);
      } finally {
        busy = false;
      }
      break;
    }
    case "evidence": {
      const id = el.dataset.id,
        tx = model.getState().transactions.find((row) => row.id === id);
      if (!tx?.has_artifact) return;
      try {
        closeModal();
        const blob = await model.getArtifact(id);
        evidenceUrl = URL.createObjectURL(blob);
        modal(
          `<h2>Saved consent record</h2><p>One composite photo and signature is attached to this transaction.</p><img class="evidence" src="${evidenceUrl}" alt="Saved photo and customer signature"><div class="hash">Artifact SHA-256<br>${esc(tx.artifact_hash || "Not available")}</div>`,
        );
      } catch (error) {
        toast(error.message || "Could not load consent evidence.");
      }
      break;
    }
    case "void": {
      const id = el.dataset.id,
        tx = model.getState().transactions.find((row) => row.id === id);
      if (!tx) return;
      confirmDialog({
        title: "Void this transaction?",
        text: `The original ${money(tx.amount_cents)} stays visible and is marked Voided. A separate offsetting correction is added to the ledger.`,
        label: "Confirm void",
        work: async () => {
          await model.voidTransaction(id);
          toast("Original preserved; correction appended.");
        },
      });
      break;
    }
    case "delete-tx": {
      const id = el.dataset.id;
      confirmDialog({
        title: "Permanently delete transaction?",
        text: "This removes the selected transaction and its consent artifact. This cannot be undone.",
        label: "Delete permanently",
        work: async () => {
          await model.hardDeleteTransaction(id);
          toast("Transaction permanently deleted.");
        },
      });
      break;
    }
    case "delete-customer": {
      const c = current();
      if (!c) return;
      confirmDialog({
        title: "Delete " + esc(c.name) + "?",
        text: `This permanently removes the customer and all ${c.transactions.length} transactions and consent artifacts. This cannot be undone.`,
        label: "Delete customer",
        work: async () => {
          await model.deleteCustomer(c.id);
          go("home");
          toast("Customer deleted.");
        },
      });
      break;
    }
    case "share":
      await share();
      break;
    case "copy-statement":
      try {
        await navigator.clipboard.writeText($("#share-link").value);
        toast("Statement link copied.");
      } catch {
        $("#share-link").select();
        toast("Select and copy the statement link.");
      }
      break;
    case "prices":
      go("prices");
      break;
    case "reminders":
      go("reminders");
      break;
    case "add-price":
      priceModal();
      break;
    case "edit-price":
      priceModal(el.dataset.label);
      break;
    case "delete-price": {
      const label = el.dataset.label;
      confirmDialog({
        title: "Delete saved price?",
        text: `Remove ${esc(label)} from the Price Book? Existing transactions stay unchanged.`,
        label: "Delete price",
        work: () => model.deletePrice(label),
      });
      break;
    }
    case "verify":
      go("verify");
      break;
    case "run-verify":
      verifyResult = await model.verifyChain();
      render();
      break;
    case "install":
      modal(
        `<h2>Keep LISTA close</h2><p>Use your browser menu to choose Add to Home Screen. This frontend currently uses temporary in-memory data.</p>`,
      );
      break;
    case "about":
      modal(
        `<h2>Made for clear records</h2><p>This is the frontend-first LISTA experience. Customer, transaction, price, consent, and integrity interactions currently use isolated temporary state.</p><p>The future backend will replace the service implementation without changing these screens.</p>`,
      );
      break;
    case "logout":
      sessionStorage.removeItem("lista-authenticated");
      location.replace(location.pathname + location.search);
      break;
    case "pin":
      pinModal();
      break;
    case "lock":
      closeModal();
      locked = true;
      render();
      break;
    case "remove-pin":
      pin = null;
      pinFailures = 0;
      pinUntil = 0;
      closeModal();
      render();
      toast("Device PIN removed.");
      break;
  }
}
function pinModal() {
  if (pin) {
    modal(
      `<h2>Device PIN</h2><p>The device PIN only locks this browser screen; it is not encryption or authentication.</p><div class="actions">${btn("Lock this tab", "lock", "primary")}${btn("Remove PIN", "remove-pin", "red")}</div>`,
    );
    return;
  }
  modal(
    `<h2>Set a device PIN</h2><p>Set a four-digit PIN that only protects this browser screen.</p><form id="pin-form"><label for="new-pin">Four-digit device PIN</label><input id="new-pin" type="password" inputmode="numeric" pattern="[0-9]{4}" minlength="4" maxlength="4" required autocomplete="off"><button class="btn primary wide" type="submit" style="margin-top:20px">Set device PIN</button></form>`,
  );
  $("#pin-form").onsubmit = (e) => {
    e.preventDefault();
    pin = $("#new-pin").value;
    closeModal();
    render();
    toast("Device PIN set for this tab.");
  };
}
function bindDialog() {
  $("#dialog")
    .querySelectorAll("[data-action]")
    .forEach(
      (el) =>
        (el.onclick = () =>
          Promise.resolve(action(el.dataset.action, el)).catch(dialogError)),
    );
  $("#dialog")
    .querySelectorAll("button")
    .forEach((b) => {
      if (!b.hasAttribute("type")) b.type = "button";
    });
}
function bind() {
  document
    .querySelectorAll("#app [data-action]")
    .forEach(
      (el) =>
        (el.onclick = () =>
          Promise.resolve(action(el.dataset.action, el)).catch((e) =>
            toast(e.message),
          )),
    );
  if ($("#search"))
    $("#search").oninput = (e) => {
      const pos = e.target.selectionStart;
      search = e.target.value;
      render();
      $("#search").focus();
      try {
        $("#search").setSelectionRange(pos, pos);
      } catch {}
    };
  if ($("#sort"))
    $("#sort").onchange = (e) => {
      sort = e.target.value;
      render();
    };
  if ($("#price-search"))
    $("#price-search").oninput = (e) => {
      priceSearch = e.target.value;
      render();
      $("#price-search").focus();
    };
  if ($("#utang-form")) {
    const f = $("#utang-form");
    f.oninput = (e) => {
      if (e.target.classList.contains("item-label")) {
        const p = model
          .getPriceBook()
          .find((p) => p.label.toLowerCase() === e.target.value.toLowerCase());
        if (p)
          e.target.closest(".item-row").querySelector(".item-price").value =
            p.unit_price_cents / 100;
      }
      syncDraft();
      draft.items.forEach((i, n) => {
        if ($("#subtotal-" + n))
          $("#subtotal-" + n).textContent = money(itemCents(i));
      });
      $("#utang-total").textContent = money(draftTotal());
    };
    f.onsubmit = (e) => {
      e.preventDefault();
      syncDraft();
      try {
        if (!draft.customerId) throw Error("Choose a customer.");
        if (
          draft.mode === "items" &&
          (!draft.items.length ||
            draft.items.some(
              (i) =>
                !i.label.trim() ||
                !Number.isSafeInteger(i.quantity) ||
                i.quantity < 1 ||
                !(parseCents(i.price) > 0),
            ))
        )
          throw Error(
            "Add at least one item with a name, quantity and valid price.",
          );
        const total = draftTotal();
        if (!Number.isSafeInteger(total) || total <= 0)
          throw Error(
            "Enter an amount greater than zero using at most two decimal places.",
          );
        draft.total = total;
        clearConsent();
        go("consent");
      } catch (e) {
        $("#form-error").textContent = e.message;
      }
    };
  }
  if ($("#edit-utang-form")) {
    const form = $("#edit-utang-form");
    form.oninput = () => {
      syncDraft();
      draft.items.forEach((item, index) => {
        const subtotal = $("#subtotal-" + index);
        if (subtotal) subtotal.textContent = money(itemCents(item));
      });
      $("#utang-total").textContent = money(draftTotal());
    };
    form.onsubmit = (event) => {
      event.preventDefault();
      syncDraft();
      try {
        if (!draft.reason?.trim()) throw Error("Enter a reason for editing this record.");
        if (draft.mode === "items" && (!draft.items.length || draft.items.some((item) => !item.label.trim() || !Number.isSafeInteger(item.quantity) || item.quantity < 1 || !(parseCents(item.price) > 0))))
          throw Error("Add at least one item with a name, quantity and valid price.");
        const total = draftTotal();
        if (!Number.isSafeInteger(total) || total <= 0)
          throw Error("Enter an amount greater than zero using at most two decimal places.");
        const original = model.getState().transactions.find((tx) => tx.id === draft.editingId);
        if (!original) throw Error("The original transaction was not found.");
        editPending = {
          id: original.id,
          changes: {
            amountCents: total,
            lineItems: draft.mode === "items" ? draft.items.map((item) => ({ label: item.label.trim(), quantity: item.quantity, unit_price_cents: parseCents(item.price) })) : null,
            dueAt: draft.dueAt || null,
            note: draft.note,
            reason: draft.reason.trim(),
          },
        };
        const amountChanged = original.amount_cents !== total;
        const dueChanged = (original.due_at || "") !== (draft.dueAt || "");
        const noteChanged = (original.note || "") !== (draft.note.trim() || "");
        const itemCount = draft.mode === "items" ? draft.items.length : 0;
        modal(`<div class="edit-confirm"><span class="eyebrow">Confirm revision</span><h2>Save these changes?</h2><p>This updates the existing record. No duplicate transaction or payment will be created.</p><div class="revision-summary"><div><span>Total</span><b>${money(original.amount_cents)} ${amountChanged ? `→ ${money(total)}` : "(unchanged)"}</b></div><div><span>Items</span><b>${original.line_items?.length || 0} → ${itemCount}</b></div><div><span>Due date</span><b>${dueChanged ? `${date(original.due_at)} → ${date(draft.dueAt)}` : date(draft.dueAt)}</b></div><div><span>Note</span><b>${noteChanged ? "Changed" : "Unchanged"}</b></div></div><div class="edit-reason-review"><span>Reason</span><b>${esc(draft.reason.trim())}</b></div>${note("The previous and updated values will be preserved in Edit History.")}<p id="dialog-error" class="error-text" role="alert"></p><div class="actions"><button class="btn" data-action="close-dialog">Cancel</button><button class="btn primary" data-action="confirm-edit">${icon("check")}Save Changes</button></div></div>`);
      } catch (error) {
        $("#form-error").textContent = error.message;
      }
    };
  }
  if ($("#payment-form")) {
    const f = $("#payment-form");
    $("#customer-select").onchange = () => {
      syncDraft();
      render();
    };
    f.oninput = () => {
      syncDraft();
      const amount = parseCents(draft.amount) || 0,
        bal = balance(draft.customerId) - amount;
      $("#payment-preview").textContent = "−" + money(amount);
      $("#payment-result").textContent =
        (bal < 0 ? "Credit " : "") + money(bal);
    };
    f.onsubmit = async (e) => {
      e.preventDefault();
      if (busy) return;
      syncDraft();
      const amount = parseCents(draft.amount);
      if (!draft.customerId || !(amount > 0)) {
        $("#form-error").textContent =
          "Choose a customer and enter a valid payment amount.";
        return;
      }
      busy = true;
      f.querySelector('[type="submit"]').disabled = true;
      try {
        lastSaved = await model.addTransaction({
          customerId: draft.customerId,
          type: "payment",
          amountCents: amount,
          note: draft.note,
        });
        cid = draft.customerId;
        draft = null;
        go("success");
      } catch (e) {
        $("#form-error").textContent = e.message;
        f.querySelector('[type="submit"]').disabled = false;
      } finally {
        busy = false;
      }
    };
  }
  if ($("#unlock-form"))
    $("#unlock-form").onsubmit = (e) => {
      e.preventDefault();
      if (Date.now() < pinUntil) {
        $("#form-error").textContent =
          `Try again in ${Math.ceil((pinUntil - Date.now()) / 1000)} seconds.`;
        return;
      }
      if ($("#unlock-pin").value === pin) {
        locked = false;
        pinFailures = 0;
        render();
      } else {
        pinFailures++;
        if (pinFailures >= 5) {
          pinUntil = Date.now() + 30000;
          pinFailures = 0;
        }
        $("#form-error").textContent =
          pinUntil > Date.now()
            ? "Too many attempts. Wait 30 seconds."
            : "Incorrect PIN. Try again.";
      }
    };
}
function readRoute() {
  const parts = location.hash.slice(1).split("/");
  const next = parts[0] || "home";
  if (route === "consent" && next !== "consent" && next !== "record")
    clearConsent();
  if (next === "record" && route !== "record" && route !== "consent")
    draft = null;
  if (next === "payment" && route !== "payment") draft = null;
  route = next;
  if (parts[1] && next === "edit") editId = decodeURIComponent(parts[1]);
  else if (parts[1] && next !== "statement") cid = decodeURIComponent(parts[1]);
  else if (
    [
      "home",
      "people",
      "activity",
      "reminders",
      "more",
      "record",
      "payment",
      "settings",
      "verify",
      "prices",
      "edit",
    ].includes(next)
  )
    if (next !== "edit") cid = null;
  render();
  window.scrollTo(0, 0);
}
window.addEventListener("hashchange", readRoute);
window.addEventListener("pagehide", () => {
  if (cameraStream) stopCamera(cameraStream, $("#camera-video"));
  cameraStream = null;
  cameraActive = false;
});
await model.ready;
loading = false;
readRoute();
