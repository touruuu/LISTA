import {
  SAMPLE_CUSTOMERS,
  SAMPLE_PRICES,
  SAMPLE_TRANSACTIONS,
} from "../data/sampleLedger.js";

/* Temporary frontend-only ledger service.
 * It keeps data access separate from the UI until the future backend is built.
 */

const HASH_FIELDS = [
  "id",
  "customer_id",
  "type",
  "amount_cents",
  "balance_after_cents",
  "line_items",
  "artifact_hash",
  "prev_tx_hash",
  "created_at",
  "note",
  "voided",
  "voids_tx_id",
  "due_at",
  "edit_history",
];

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, canonicalize(value[key])]),
    );
  }
  return value;
}

export function canonicalJson(value) {
  return JSON.stringify(canonicalize(value));
}

async function sha256Bytes(bytes) {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle)
    throw new Error("Web Crypto SHA-256 is unavailable in this environment.");
  const digest = await subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function sha256Text(text) {
  return sha256Bytes(new TextEncoder().encode(text));
}

function decodeDataUrl(dataUrl) {
  if (typeof dataUrl !== "string")
    throw new TypeError("Artifact must be supplied as a data URL.");
  const match = /^data:([^;,]+)?(;base64)?,([\s\S]*)$/i.exec(dataUrl);
  if (!match) throw new TypeError("Artifact must be a valid data URL.");
  const encoded = match[3];
  if (match[2]) {
    const binary = globalThis.atob
      ? globalThis.atob(encoded)
      : Buffer.from(encoded, "base64").toString("binary");
    return {
      mime: match[1] || "text/plain",
      bytes: Uint8Array.from(binary, (c) => c.charCodeAt(0)),
    };
  }
  return {
    mime: match[1] || "text/plain",
    bytes: new TextEncoder().encode(decodeURIComponent(encoded)),
  };
}

function copy(value) {
  return structuredClone(value);
}

function ensureIntegerCents(value, label = "amountCents") {
  if (!Number.isSafeInteger(value) || value <= 0)
    throw new RangeError(
      `${label} must be a positive integer number of centavos.`,
    );
}

function balanceDelta(transaction) {
  return transaction.type === "utang"
    ? transaction.amount_cents
    : -transaction.amount_cents;
}

export class LedgerModel {
  constructor({ now = () => new Date(), idFactory } = {}) {
    this._now = now;
    this._idFactory =
      idFactory || ((prefix) => `${prefix}-${globalThis.crypto.randomUUID()}`);
    this._queue = Promise.resolve();
    this._tampered = new Map();
    this._revision = 0;
    this.ready = this._seed();
  }

  _mutate(work, { allowTampered = false } = {}) {
    const result = this._queue.then(async () => {
      await this.ready;
      if (this._tampered.size && !allowTampered)
        throw new Error("Restore the demo chain before making another change.");
      const value = await work();
      this._revision += 1;
      return copy(value);
    });
    this._queue = result.catch(() => undefined);
    return result;
  }

  async _seed() {
    this.customers = SAMPLE_CUSTOMERS.map(([id, name]) => ({
      id,
      name,
      created_at: "2026-09-01T00:00:00.000Z",
    }));
    this.prices = SAMPLE_PRICES.map(([label, unit_price_cents]) => ({
      label,
      unit_price_cents,
      updated_at: "2026-09-01T00:00:00.000Z",
    }));
    this.transactions = [];
    this.statements = {};
    for (const [
      id,
      customer_id,
      type,
      amount_cents,
      created_at,
      note,
      due_at,
    ] of SAMPLE_TRANSACTIONS) {
      this.transactions.push({
        id,
        customer_id,
        type,
        amount_cents,
        balance_after_cents: 0,
        line_items: null,
        note,
        artifact: null,
        artifact_hash: null,
        prev_tx_hash: null,
        tx_hash: null,
        due_at,
        voided: false,
        voids_tx_id: null,
        edit_history: [],
        created_at,
      });
    }
    await this._rebuild();
  }

  async _rebuild() {
    const balances = new Map(
      this.customers.map((customer) => [customer.id, 0]),
    );
    let previousHash = null;
    for (const transaction of this.transactions) {
      const next =
        (balances.get(transaction.customer_id) || 0) +
        balanceDelta(transaction);
      if (!Number.isSafeInteger(next))
        throw new RangeError(
          "Running balance exceeds the safe integer-centavo range.",
        );
      balances.set(transaction.customer_id, next);
      transaction.balance_after_cents = next;
      transaction.prev_tx_hash = previousHash;
      transaction.tx_hash = await this._transactionHash(transaction);
      previousHash = transaction.tx_hash;
    }
  }

  async _transactionHash(transaction) {
    const payload = Object.fromEntries(
      HASH_FIELDS.map((field) => [field, transaction[field] ?? null]),
    );
    return sha256Text(canonicalJson(payload));
  }

  getState() {
    const state = copy({
      customers: this.customers,
      transactions: this.transactions,
      prices: this.prices,
      statements: this.statements,
      storage: "Temporary in-memory frontend state.",
      revision: this._revision,
    });
    state.transactions = state.transactions.map((transaction) => ({
      ...transaction,
      has_artifact: Boolean(transaction.artifact),
    }));
    return state;
  }

  getDashboard() {
    const state = this.getState();
    const balances = state.customers.map((customer) => ({
      customerId: customer.id,
      balanceCents: state.transactions
        .filter((tx) => tx.customer_id === customer.id)
        .reduce((total, tx) => total + balanceDelta(tx), 0),
    }));
    const today = this._now().toISOString().slice(0, 10);
    const overdueByCustomer = {};
    const correctionIds = new Set(
      state.transactions
        .filter((tx) => tx.voids_tx_id)
        .map((tx) => tx.voids_tx_id),
    );
    for (const customer of state.customers) {
      const lots = [];
      for (const tx of state.transactions.filter(
        (row) => row.customer_id === customer.id,
      )) {
        if (tx.voided || tx.voids_tx_id || correctionIds.has(tx.id)) continue;
        if (tx.type === "utang")
          lots.push({ remaining: tx.amount_cents, due_at: tx.due_at });
        else {
          let payment = tx.amount_cents;
          for (const lot of lots) {
            const applied = Math.min(payment, lot.remaining);
            lot.remaining -= applied;
            payment -= applied;
            if (!payment) break;
          }
        }
      }
      const positiveBalance =
        balances.find((row) => row.customerId === customer.id)?.balanceCents ??
        0;
      const overdue = lots.reduce(
        (sum, lot) =>
          sum + (lot.due_at && lot.due_at < today ? lot.remaining : 0),
        0,
      );
      overdueByCustomer[customer.id] = Math.min(
        overdue,
        Math.max(positiveBalance, 0),
      );
    }
    return {
      customerCount: state.customers.length,
      receivablesCents: balances.reduce(
        (sum, row) => sum + Math.max(row.balanceCents, 0),
        0,
      ),
      creditCents: balances.reduce(
        (sum, row) => sum + Math.max(-row.balanceCents, 0),
        0,
      ),
      collectionTodayCents: state.transactions
        .filter(
          (tx) =>
            tx.type === "payment" &&
            !tx.voided &&
            !tx.voids_tx_id &&
            tx.created_at.slice(0, 10) === today,
        )
        .reduce((sum, tx) => sum + tx.amount_cents, 0),
      overdueCents: Object.values(overdueByCustomer).reduce(
        (sum, cents) => sum + cents,
        0,
      ),
      overdueByCustomer,
      balances,
    };
  }

  getCustomer(customerId) {
    const state = this.getState();
    const customer = state.customers.find((row) => row.id === customerId);
    if (!customer) return null;
    const transactions = state.transactions.filter(
      (row) => row.customer_id === customerId,
    );
    return {
      ...customer,
      balance_cents: transactions.at(-1)?.balance_after_cents ?? 0,
      transactions,
    };
  }

  addCustomer(name) {
    return this._mutate(async () => {
      const cleanName = String(name ?? "").trim();
      if (!cleanName) throw new TypeError("Customer name is required.");
      if (
        this.customers.some(
          (row) =>
            row.name.toLocaleLowerCase() === cleanName.toLocaleLowerCase(),
        )
      )
        throw new Error("A customer with this name already exists.");
      const customer = {
        id: this._idFactory("c"),
        name: cleanName,
        created_at: this._now().toISOString(),
      };
      this.customers.push(customer);
      return customer;
    });
  }

  deleteCustomer(customerId) {
    return this._mutate(async () => {
      const index = this.customers.findIndex(
        (customer) => customer.id === customerId,
      );
      if (index < 0) throw new Error("Customer was not found.");
      const [deleted] = this.customers.splice(index, 1);
      this.transactions = this.transactions.filter(
        (tx) => tx.customer_id !== customerId,
      );
      delete this.statements[customerId];
      await this._rebuild();
      return deleted;
    });
  }

  addTransaction({
    customerId,
    type,
    amountCents,
    lineItems = null,
    note = "",
    dueAt = null,
    artifactDataUrl = null,
  }) {
    return this._mutate(async () => {
      if (!this.customers.some((customer) => customer.id === customerId))
        throw new Error("Choose an existing customer.");
      if (!["utang", "payment"].includes(type))
        throw new TypeError("Transaction type must be utang or payment.");
      ensureIntegerCents(amountCents);
      if (type === "utang" && !artifactDataUrl)
        throw new Error(
          "A synthetic consent artifact is required for every new utang.",
        );
      if (type === "payment" && artifactDataUrl)
        throw new Error("Payments do not accept a consent artifact.");
      const items = lineItems == null ? null : copy(lineItems);
      if (
        items &&
        (!Array.isArray(items) ||
          items.some(
            (item) =>
              !Number.isSafeInteger(item.quantity) ||
              item.quantity <= 0 ||
              !Number.isSafeInteger(item.unit_price_cents) ||
              item.unit_price_cents < 0,
          ))
      ) {
        throw new TypeError(
          "Each item needs a positive integer quantity and integer-centavo unit price.",
        );
      }
      if (items) {
        const itemTotal = items.reduce((sum, item) => {
          const rowTotal = item.quantity * item.unit_price_cents;
          const next = sum + rowTotal;
          if (!Number.isSafeInteger(rowTotal) || !Number.isSafeInteger(next))
            throw new RangeError(
              "Item total exceeds the safe integer-centavo range.",
            );
          return next;
        }, 0);
        if (itemTotal !== amountCents)
          throw new Error("Itemized total must equal amountCents.");
      }
      const latest = this.transactions
        .filter((tx) => tx.customer_id === customerId)
        .at(-1);
      const nextBalance =
        (latest?.balance_after_cents ?? 0) +
        (type === "utang" ? amountCents : -amountCents);
      if (!Number.isSafeInteger(nextBalance))
        throw new RangeError(
          "Running balance exceeds the safe integer-centavo range.",
        );
      const artifact = artifactDataUrl ? decodeDataUrl(artifactDataUrl) : null;
      const transaction = {
        id: this._idFactory("t"),
        customer_id: customerId,
        type,
        amount_cents: amountCents,
        balance_after_cents: nextBalance,
        line_items: items,
        note: String(note ?? "").trim() || null,
        artifact: artifact
          ? { mime: artifact.mime, data_url: artifactDataUrl }
          : null,
        artifact_hash: artifact ? await sha256Bytes(artifact.bytes) : null,
        prev_tx_hash: null,
        tx_hash: null,
        due_at: dueAt || null,
        voided: false,
        voids_tx_id: null,
        edit_history: [],
        created_at: this._now().toISOString(),
      };
      this.transactions.push(transaction);
      await this._rebuild();
      return transaction;
    });
  }

  editTransaction(transactionId, {
    amountCents,
    lineItems = null,
    note = "",
    dueAt = null,
    reason,
  }) {
    return this._mutate(async () => {
      const transaction = this.transactions.find((tx) => tx.id === transactionId);
      if (!transaction) throw new Error("Transaction was not found.");
      if (transaction.type !== "utang")
        throw new Error("Only utang records can be edited.");
      if (transaction.voided || transaction.voids_tx_id)
        throw new Error("Voided and correction records cannot be edited.");
      ensureIntegerCents(amountCents);
      const cleanReason = String(reason ?? "").trim();
      if (!cleanReason) throw new Error("A reason for editing is required.");
      const items = lineItems == null ? null : copy(lineItems);
      if (
        items &&
        (!Array.isArray(items) ||
          !items.length ||
          items.some(
            (item) =>
              !String(item.label ?? "").trim() ||
              !Number.isSafeInteger(item.quantity) ||
              item.quantity <= 0 ||
              !Number.isSafeInteger(item.unit_price_cents) ||
              item.unit_price_cents <= 0,
          ))
      )
        throw new TypeError("Each item needs a name, positive quantity, and positive integer-centavo unit price.");
      if (items) {
        const itemTotal = items.reduce((sum, item) => {
          const rowTotal = item.quantity * item.unit_price_cents;
          const next = sum + rowTotal;
          if (!Number.isSafeInteger(rowTotal) || !Number.isSafeInteger(next))
            throw new RangeError("Item total exceeds the safe integer-centavo range.");
          return next;
        }, 0);
        if (itemTotal !== amountCents)
          throw new Error("Itemized total must equal amountCents.");
      }
      const correctionIds = new Set(
        this.transactions.filter((tx) => tx.voids_tx_id).map((tx) => tx.voids_tx_id),
      );
      const lots = [];
      for (const tx of this.transactions.filter((row) => row.customer_id === transaction.customer_id)) {
        if (tx.voided || tx.voids_tx_id || correctionIds.has(tx.id)) continue;
        if (tx.type === "utang") lots.push({ id: tx.id, original: tx.amount_cents, remaining: tx.amount_cents });
        else {
          let payment = tx.amount_cents;
          for (const lot of lots) {
            const applied = Math.min(payment, lot.remaining);
            lot.remaining -= applied;
            payment -= applied;
            if (!payment) break;
          }
        }
      }
      const targetLot = lots.find((lot) => lot.id === transactionId);
      const paidCents = targetLot ? targetLot.original - targetLot.remaining : 0;
      if (amountCents < paidCents)
        throw new Error(`This record already has ${paidCents} centavos applied in payments. Its edited total cannot be lower than that amount.`);
      const previous = {
        amount_cents: transaction.amount_cents,
        line_items: copy(transaction.line_items),
        due_at: transaction.due_at,
        note: transaction.note,
      };
      transaction.amount_cents = amountCents;
      transaction.line_items = items;
      transaction.due_at = dueAt || null;
      transaction.note = String(note ?? "").trim() || null;
      transaction.edit_history ||= [];
      transaction.edit_history.push({
        edited_at: this._now().toISOString(),
        reason: cleanReason,
        previous,
        updated: {
          amount_cents: transaction.amount_cents,
          line_items: copy(transaction.line_items),
          due_at: transaction.due_at,
          note: transaction.note,
        },
      });
      await this._rebuild();
      return transaction;
    });
  }

  voidTransaction(transactionId) {
    return this._mutate(async () => {
      const original = this.transactions.find((tx) => tx.id === transactionId);
      if (!original) throw new Error("Transaction was not found.");
      if (original.voids_tx_id)
        throw new Error("A correction transaction cannot be voided.");
      if (original.voided) throw new Error("Transaction is already voided.");
      original.voided = true;
      const correction = {
        id: this._idFactory("t"),
        customer_id: original.customer_id,
        type: original.type === "utang" ? "payment" : "utang",
        amount_cents: original.amount_cents,
        balance_after_cents: 0,
        line_items: null,
        note: `Correction for ${original.id}`,
        artifact: null,
        artifact_hash: null,
        prev_tx_hash: null,
        tx_hash: null,
        due_at: null,
        voided: false,
        voids_tx_id: original.id,
        edit_history: [],
        created_at: this._now().toISOString(),
      };
      this.transactions.push(correction);
      await this._rebuild();
      return { original, correction };
    });
  }

  hardDeleteTransaction(transactionId) {
    return this._mutate(async () => {
      const index = this.transactions.findIndex(
        (tx) => tx.id === transactionId,
      );
      if (index < 0) throw new Error("Transaction was not found.");
      const [deleted] = this.transactions.splice(index, 1);
      if (deleted.voids_tx_id) {
        const original = this.transactions.find(
          (tx) => tx.id === deleted.voids_tx_id,
        );
        if (original) original.voided = false;
      } else {
        this.transactions = this.transactions.filter(
          (tx) => tx.voids_tx_id !== transactionId,
        );
      }
      await this._rebuild();
      return deleted;
    });
  }

  async verifyChain() {
    await this.ready;
    await this._queue;
    let previousHash = null;
    for (const transaction of this.transactions) {
      if (transaction.prev_tx_hash !== previousHash)
        return {
          valid: false,
          brokenId: transaction.id,
          reason: "Previous hash link does not match.",
        };
      const expected = await this._transactionHash(transaction);
      if (transaction.tx_hash !== expected)
        return {
          valid: false,
          brokenId: transaction.id,
          reason: "Transaction fields do not match their SHA-256 hash.",
        };
      previousHash = transaction.tx_hash;
    }
    return {
      valid: true,
      count: this.transactions.length,
      message: "Synthetic transaction chain is intact.",
    };
  }

  tamperTransaction(transactionId, patch) {
    return this._mutate(async () => {
      const transaction = this.transactions.find(
        (tx) => tx.id === transactionId,
      );
      if (!transaction) throw new Error("Transaction was not found.");
      if (!this._tampered.has(transactionId))
        this._tampered.set(transactionId, copy(transaction));
      Object.assign(transaction, copy(patch));
      return transaction;
    });
  }

  restoreSampleData() {
    return this._mutate(
      async () => {
        for (const [id, saved] of this._tampered) {
          const index = this.transactions.findIndex(
            (transaction) => transaction.id === id,
          );
          if (index >= 0) this.transactions[index] = copy(saved);
        }
        this._tampered.clear();
        await this._rebuild();
        return {
          restored: true,
          customerCount: this.customers.length,
          transactionCount: this.transactions.length,
        };
      },
      { allowTampered: true },
    );
  }

  getPriceBook() {
    return copy(this.prices);
  }

  setPrice(label, unitPriceCents) {
    return this._mutate(async () => {
      const cleanLabel = String(label ?? "").trim();
      if (!cleanLabel) throw new TypeError("Price item label is required.");
      ensureIntegerCents(unitPriceCents, "unitPriceCents");
      const price = {
        label: cleanLabel,
        unit_price_cents: unitPriceCents,
        updated_at: this._now().toISOString(),
      };
      const index = this.prices.findIndex(
        (item) =>
          item.label.toLocaleLowerCase() === cleanLabel.toLocaleLowerCase(),
      );
      if (index < 0) this.prices.push(price);
      else this.prices[index] = price;
      return price;
    });
  }

  deletePrice(label) {
    return this._mutate(async () => {
      const index = this.prices.findIndex((item) => item.label === label);
      if (index < 0) throw new Error("Price item was not found.");
      return this.prices.splice(index, 1)[0];
    });
  }

  createStatement(customerId) {
    return this._mutate(async () => {
      if (!this.customers.some((customer) => customer.id === customerId))
        throw new Error("Customer was not found.");
      const token = globalThis.crypto.randomUUID();
      this.statements[customerId] = token;
      return { customer_id: customerId, token, simulated: true };
    });
  }

  resetEmpty() {
    return this._mutate(async () => {
      this.customers = [];
      this.prices = [];
      this.transactions = [];
      this.statements = {};
      this._tampered.clear();
      return { reset: true, customerCount: 0, transactionCount: 0 };
    });
  }

  resetSamples() {
    return this._mutate(
      async () => {
        this._tampered.clear();
        await this._seed();
        return {
          reset: true,
          customerCount: this.customers.length,
          transactionCount: this.transactions.length,
        };
      },
      { allowTampered: true },
    );
  }
}

export function createLedgerModel(options) {
  return new LedgerModel(options);
}

export function createLedgerService(options) {
  const ledger = createLedgerModel(options);
  return {
    ready: ledger.ready,
    refresh: async () => ledger.getState(),
    getState: () => ledger.getState(),
    getCustomer: (id) => ledger.getCustomer(id),
    getDashboard: () => ledger.getDashboard(),
    getPriceBook: () => ledger.getPriceBook(),
    addCustomer: (name) => ledger.addCustomer(name),
    deleteCustomer: (id) => ledger.deleteCustomer(id),
    addTransaction: ({ artifact, ...transaction }) =>
      ledger.addTransaction({
        ...transaction,
        artifactDataUrl: artifact
          ? `data:${artifact.mime};base64,${artifact.dataBase64}`
          : null,
      }),
    voidTransaction: (id) => ledger.voidTransaction(id),
    editTransaction: (id, changes) => ledger.editTransaction(id, changes),
    hardDeleteTransaction: (id) => ledger.hardDeleteTransaction(id),
    setPrice: (label, cents) => ledger.setPrice(label, cents),
    deletePrice: (label) => ledger.deletePrice(label),
    createStatement: async (id) => {
      const statement = await ledger.createStatement(id);
      return {
        ...statement,
        url: `${location.origin}${location.pathname}#detail/${encodeURIComponent(id)}`,
      };
    },
    verifyChain: () => ledger.verifyChain(),
    async getArtifact(id) {
      const transaction = ledger
        .getState()
        .transactions.find((row) => row.id === id);
      if (!transaction?.artifact?.data_url)
        throw new Error(
          "No consent evidence is available for this transaction.",
        );
      return fetch(transaction.artifact.data_url).then((response) =>
        response.blob(),
      );
    },
  };
}
