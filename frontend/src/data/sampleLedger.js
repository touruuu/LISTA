// Temporary frontend-only seed data.
// Replace this module when the future backend integration is introduced.
export const SAMPLE_PRICES = [
  ['Rice (1 kg)', 6500], ['Cooking oil', 8500], ['Canned sardines', 2800],
  ['Instant noodles', 1500], ['Bread', 2200], ['Eggs (1 dozen)', 12000],
];

export const SAMPLE_CUSTOMERS = [
  ['c-001', 'Aling Rosa'], ['c-002', 'Jun Reyes'], ['c-003', 'Ana Cruz'],
  ['c-004', 'Liza Mendoza'], ['c-005', 'Ben Navarro'], ['c-006', 'Ramon Castillo'],
];

export const SAMPLE_TRANSACTIONS = [
  ['t-001', 'c-001', 'utang', 425000, '2026-09-10T09:30:00.000Z', 'Groceries', '2026-09-18'],
  ['t-002', 'c-002', 'utang', 235000, '2026-09-14T07:15:00.000Z', 'Rice and household items', '2026-10-05'],
  ['t-003', 'c-003', 'utang', 185000, '2026-09-12T08:10:00.000Z', 'Weekly groceries', '2026-09-20'],
  ['t-004', 'c-004', 'utang', 70000, '2026-09-10T08:10:00.000Z', 'Market items', null],
  ['t-005', 'c-004', 'payment', 70000, '2026-09-15T13:45:00.000Z', 'Paid in full', null],
  ['t-006', 'c-005', 'payment', 15000, '2026-09-16T11:20:00.000Z', 'Extra payment', null],
];
