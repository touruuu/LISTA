const fixture = {
  borrower: { id: "demo-borrower", name: "Maria Santos" },
  store: {
    name: "Tindahan ni Aling Rosa",
    details: "Neighborhood sari-sari store · Barangay Maligaya",
    contact: "Demo contact: 0917 000 0000",
  },
  transactions: [
    {
      id: "DEMO-U-1001",
      customer_id: "demo-borrower",
      type: "utang",
      amount_cents: 35000,
      balance_after_cents: 35000,
      created_at: "2026-10-18T08:30:00+08:00",
      due_at: "2026-10-28",
      line_items: [
        { label: "Rice", quantity: 2, unit_price_cents: 6500 },
        { label: "Cooking oil", quantity: 1, unit_price_cents: 9000 },
        { label: "Household items", quantity: 1, unit_price_cents: 13000 },
      ],
    },
    {
      id: "DEMO-U-1002",
      customer_id: "demo-borrower",
      type: "utang",
      amount_cents: 18000,
      balance_after_cents: 53000,
      created_at: "2026-10-23T17:15:00+08:00",
      due_at: "2026-11-10",
      line_items: [
        { label: "Milk", quantity: 2, unit_price_cents: 5000 },
        { label: "Bread and eggs", quantity: 1, unit_price_cents: 8000 },
      ],
    },
    {
      id: "DEMO-P-1003",
      customer_id: "demo-borrower",
      type: "payment",
      amount_cents: 20000,
      balance_after_cents: 33000,
      created_at: "2026-10-26T12:05:00+08:00",
      note: "Cash payment",
    },
    {
      id: "DEMO-U-1004",
      customer_id: "demo-borrower",
      type: "utang",
      amount_cents: 12000,
      balance_after_cents: 45000,
      created_at: "2026-11-01T18:40:00+08:00",
      due_at: "2026-11-15",
      line_items: [{ label: "Mobile load", quantity: 1, unit_price_cents: 12000 }],
    },
    {
      id: "DEMO-P-1005",
      customer_id: "demo-borrower",
      type: "payment",
      amount_cents: 15000,
      balance_after_cents: 30000,
      created_at: "2026-11-03T09:20:00+08:00",
      note: "Partial payment",
    },
  ],
  paymentRequests: [
    {
      id: "DEMO-REQ-OLD-1",
      method: "GCash",
      amount_cents: 10000,
      utang_reference: "DEMO-U-1001",
      payment_reference: "SAMPLE-REF-01",
      status: "Rejected",
      created_at: "2026-10-20T14:10:00+08:00",
      demo_only: true,
    },
  ],
};

export function createBorrowerPortalDemo() {
  return structuredClone(fixture);
}
