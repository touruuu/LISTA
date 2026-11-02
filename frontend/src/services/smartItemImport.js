export const SMART_IMPORT_METHODS = {
  spreadsheet: { title: "Excel / CSV", description: "Import a product list from a spreadsheet.", accept: ".xlsx,.xls,.csv", inputLabel: "Choose Excel or CSV file" },
  handwritten: { title: "Handwritten List", description: "Capture or upload a handwritten shopping list.", accept: "image/*", inputLabel: "Choose handwritten list image" },
  receipt: { title: "Receipt Scanner", description: "Capture or upload a receipt photo.", accept: "image/*", inputLabel: "Choose receipt image" },
};

const MOCK_ITEMS = [
  { label: "Rice (1 kg)", quantity: 2, price: "65" },
  { label: "Cooking Oil", quantity: 1, price: "85" },
  { label: "Canned Sardines", quantity: 3, price: "28" },
  { label: "Instant Noodles", quantity: 5, price: "15" },
  { label: "Coffee Sachet", quantity: 4, price: "12" },
];

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

// Frontend-only presentation adapter. Replace this function with a real parser
// or OCR service later; the modal and ledger integration can remain unchanged.
export async function simulateSmartExtraction({ onProgress } = {}) {
  onProgress?.("Reading your file…");
  await wait(550);
  onProgress?.("Recognizing items and quantities…");
  await wait(550);
  onProgress?.("Checking prices…");
  await wait(350);
  return MOCK_ITEMS.map((item) => ({ ...item }));
}
