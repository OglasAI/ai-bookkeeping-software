import { classifyUploadedDocument } from "./upload-classification";
import { detectExpenseCategory, ledgerForCategory } from "./expense-categories";
import { readDocumentText } from "./ocr";
import { parseInvoiceText } from "./parse-invoice";
import type { BookkeepingDocument, JournalLine, UploadedExtraction } from "./types";

export interface ExtractionResult {
  documentId: string;
  confidence: number;
  simulated: true;
}

export interface SyncResult {
  documentId: string;
  status: "demo_synced";
  reference: string;
  simulated: true;
}

export function extractDocument(document: BookkeepingDocument): Promise<ExtractionResult> {
  return Promise.resolve({
    documentId: document.id,
    confidence: document.fields.confidence,
    simulated: true,
  });
}

export function suggestEntry(document: BookkeepingDocument): JournalLine[] {
  return document.journal.map((line) => ({ ...line }));
}

export function approveEntry(document: BookkeepingDocument): boolean {
  if (document.duplicateOf || document.fields.documentType === "Bank statement") return false;
  const debit = document.journal.reduce((sum, line) => sum + line.debit, 0);
  const credit = document.journal.reduce((sum, line) => sum + line.credit, 0);
  const calculatedTotal = document.fields.subtotal + document.fields.tax;
  return document.journal.length > 0 &&
    Math.abs(debit - credit) < 0.001 &&
    Math.abs(document.fields.total - calculatedTotal) < 0.001 &&
    Math.abs(debit - calculatedTotal) < 0.001;
}

export function syncEntry(document: BookkeepingDocument): Promise<SyncResult> {
  if (document.status !== "approved" && document.status !== "demo_exported") {
    return Promise.reject(new Error("Accountant approval is required before demo sync."));
  }
  return Promise.resolve({
    documentId: document.id,
    status: "demo_synced",
    reference: `DEMO-${document.id.toUpperCase()}-${Date.now().toString().slice(-4)}`,
    simulated: true,
  });
}

export function isBalanced(lines: JournalLine[]) {
  const debit = lines.reduce((sum, line) => sum + line.debit, 0);
  const credit = lines.reduce((sum, line) => sum + line.credit, 0);
  return { debit, credit, balanced: Math.abs(debit - credit) < 0.001 };
}

function isUploadedExtraction(value: unknown): value is UploadedExtraction {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<UploadedExtraction>;
  return !!item.fields && typeof item.fields.supplier === "string"
    && typeof item.fields.total === "number"
    && typeof item.ledger === "string"
    && typeof item.explanation === "string"
    && Array.isArray(item.journal)
    && Array.isArray(item.warnings);
}

function demoExtraction(file: File): UploadedExtraction {
  const classification = classifyUploadedDocument(file.name);
  const total = Math.round((classification.subtotal + classification.tax) * 100) / 100;
  const journal: JournalLine[] = [
    { id: crypto.randomUUID(), account: classification.ledger, debit: classification.subtotal, credit: 0, vatType: "NONE", vatRecoverable: false },
    ...(classification.tax ? [{ id: crypto.randomUUID(), account: "Input VAT Recoverable", debit: classification.tax, credit: 0, vatType: "INPUT" as const, vatRecoverable: true }] : []),
    { id: crypto.randomUUID(), account: "Accounts Payable", debit: 0, credit: total, vatType: "NONE", vatRecoverable: false },
  ];
  return {
    source: "demo",
    category: classification.label,
    ledger: classification.ledger,
    fields: {
      supplier: classification.supplier,
      invoiceNumber: "",
      date: new Date().toISOString().slice(0, 10),
      currency: "AED",
      subtotal: classification.subtotal,
      tax: classification.tax,
      total,
      documentType: classification.documentType,
      confidence: 62,
    },
    journal,
    vatTreatment: classification.tax ? "Standard-rated purchase · 5% input VAT" : "Out of scope / no VAT extracted",
    transactionType: classification.transactionType,
    explanation: `${classification.label} identified from the file name. This demo extraction is a fallback and every field must be checked by the accountant.`,
    warnings: ["Demo extraction used because live AI was unavailable."],
  };
}

async function browserOcrExtraction(file: File, ledgerOptions: readonly string[], onProgress?: (message: string) => void): Promise<UploadedExtraction> {
  const text = await readDocumentText(file, onProgress);
  const parsed = parseInvoiceText(text);
  if (parsed.found === 0) throw new Error("Browser OCR could not identify bookkeeping fields.");
  const classification = classifyUploadedDocument(`${file.name} ${text}`);
  const detectedCategory = detectExpenseCategory(`${file.name}\n${text}`);
  const ledger = detectedCategory ? ledgerForCategory(detectedCategory.category, ledgerOptions) ?? classification.ledger : classification.ledger;
  const subtotal = parsed.subtotal ?? (parsed.total != null && parsed.tax != null ? parsed.total - parsed.tax : 0);
  const tax = parsed.tax ?? 0;
  const total = parsed.total ?? Math.round((subtotal + tax) * 100) / 100;
  const journal: JournalLine[] = [
    { id: crypto.randomUUID(), account: ledger, debit: subtotal, credit: 0, vatType: "NONE", vatRecoverable: false },
    ...(tax ? [{ id: crypto.randomUUID(), account: "Input VAT Recoverable", debit: tax, credit: 0, vatType: "INPUT" as const, vatRecoverable: true }] : []),
    { id: crypto.randomUUID(), account: "Accounts Payable", debit: 0, credit: total, vatType: "NONE", vatRecoverable: false },
  ];
  return {
    source: "ocr",
    category: detectedCategory?.category.label ?? classification.label,
    ledger,
    fields: {
      supplier: parsed.supplier ?? classification.supplier,
      invoiceNumber: parsed.invoiceNumber ?? "",
      date: parsed.date ?? "",
      currency: "AED",
      subtotal,
      tax,
      total,
      documentType: classification.documentType,
      confidence: Math.min(85, Math.max(25, Math.round((parsed.found / 5) * 100))),
    },
    journal,
    vatTreatment: tax ? "Standard-rated purchase · extracted VAT requires confirmation" : "No VAT extracted",
    transactionType: classification.transactionType,
    explanation: "Live AI was unavailable, so Ledgerly read the document locally with browser OCR. The extracted text and amounts require accountant confirmation.",
    warnings: ["Browser OCR fallback used because live AI was unavailable."],
  };
}

export async function extractUploadedFile(file: File, ledgerOptions: readonly string[], onProgress?: (message: string) => void): Promise<UploadedExtraction> {
  try {
    const body = new FormData();
    body.append("file", file);
    body.append("ledgerOptions", JSON.stringify(ledgerOptions));
    const response = await fetch("/api/extract", { method: "POST", body });
    if (!response.ok) throw new Error(`Extraction failed with status ${response.status}.`);
    const value: unknown = await response.json();
    if (!isUploadedExtraction(value)) throw new Error("The extraction response was incomplete.");
    return value;
  } catch {
    try {
      return await browserOcrExtraction(file, ledgerOptions, onProgress);
    } catch {
      return demoExtraction(file);
    }
  }
}
