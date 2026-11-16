import type { BookkeepingDocument, JournalLine } from "./types";

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
