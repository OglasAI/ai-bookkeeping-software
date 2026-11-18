import type { DocumentType } from "./types";

export interface UploadClassification {
  label: string;
  supplier: string;
  ledger: string;
  documentType: DocumentType;
  subtotal: number;
  tax: number;
  transactionType: string;
  reason: string;
}

const rules: Array<{ words: string[]; result: Omit<UploadClassification, "reason"> }> = [
  { words: ["fuel", "petrol", "diesel", "gas", "enoc", "adnoc"], result: { label: "Fuel expense", supplier: "Fuel station receipt", ledger: "Vehicle Fuel", documentType: "Receipt", subtotal: 180, tax: 9, transactionType: "Expense receipt" } },
  { words: ["food", "restaurant", "cafe", "meal", "lunch", "dinner"], result: { label: "Meals & entertainment", supplier: "Restaurant receipt", ledger: "Meals & Entertainment", documentType: "Receipt", subtotal: 120, tax: 6, transactionType: "Expense receipt" } },
  { words: ["taxi", "uber", "careem", "travel", "hotel", "flight"], result: { label: "Travel expense", supplier: "Travel provider", ledger: "Travel Expense", documentType: "Receipt", subtotal: 260, tax: 13, transactionType: "Expense receipt" } },
  { words: ["phone", "internet", "electric", "water", "utility", "du", "etisalat"], result: { label: "Utilities", supplier: "Utility provider", ledger: "Utilities", documentType: "Purchase invoice", subtotal: 420, tax: 21, transactionType: "Supplier bill" } },
  { words: ["office", "stationery", "paper", "printer"], result: { label: "Office supplies", supplier: "Office supplier", ledger: "Office Supplies", documentType: "Purchase invoice", subtotal: 310, tax: 15.5, transactionType: "Supplier bill" } },
  { words: ["clean", "detergent", "hygiene"], result: { label: "Cleaning supplies", supplier: "Cleaning supplier", ledger: "Cleaning Supplies", documentType: "Purchase invoice", subtotal: 240, tax: 12, transactionType: "Supplier bill" } },
  { words: ["repair", "maintenance", "service"], result: { label: "Repairs & maintenance", supplier: "Maintenance provider", ledger: "Repairs & Maintenance", documentType: "Purchase invoice", subtotal: 650, tax: 32.5, transactionType: "Supplier bill" } },
  { words: ["courier", "delivery", "shipping"], result: { label: "Courier & delivery", supplier: "Courier provider", ledger: "Courier & Delivery", documentType: "Purchase invoice", subtotal: 95, tax: 4.75, transactionType: "Supplier bill" } },
  { words: ["software", "subscription", "hosting", "cloud"], result: { label: "Software subscription", supplier: "Software provider", ledger: "Software Subscriptions", documentType: "Purchase invoice", subtotal: 380, tax: 19, transactionType: "Supplier bill" } },
];

export function classifyUploadedDocument(fileName: string): UploadClassification {
  const normalized = fileName.toLowerCase().replace(/[_-]+/g, " ");
  const match = rules.find((rule) => rule.words.some((word) => normalized.includes(word)));
  if (match) {
    const matchedWord = match.words.find((word) => normalized.includes(word))!;
    return { ...match.result, reason: `Demo AI matched "${matchedWord}" in the file name. Accountant confirmation is still required.` };
  }
  const invoiceLike = /invoice|bill/.test(normalized);
  return {
    label: invoiceLike ? "General supplier bill" : "General business expense",
    supplier: "Uploaded supplier",
    ledger: "General Expenses",
    documentType: invoiceLike ? "Purchase invoice" : "Expense voucher",
    subtotal: 250,
    tax: 12.5,
    transactionType: invoiceLike ? "Supplier bill" : "Expense voucher",
    reason: "No specific keyword was found, so the demo AI used a general expense category. Accountant confirmation is required.",
  };
}

export function uploadedFileType(fileName: string): "PDF" | "JPG" | "PNG" | "XLSX" | "CSV" {
  const extension = fileName.split(".").pop()?.toLowerCase();
  if (extension === "pdf") return "PDF";
  if (extension === "png") return "PNG";
  if (extension === "xls" || extension === "xlsx") return "XLSX";
  if (extension === "csv") return "CSV";
  return "JPG";
}
