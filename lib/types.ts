export type Role = "Firm Admin" | "Accountant" | "Client";

export type IntegrationType = "Zoho Books" | "TallyPrime" | "Excel";

export type DocumentType =
  | "Purchase invoice"
  | "Receipt"
  | "Expense voucher"
  | "Bank statement"
  | "Credit note";

export type DocumentStatus =
  | "uploaded"
  | "processing"
  | "needs_review"
  | "approved"
  | "rejected"
  | "demo_exported"
  | "demo_synced"
  | "error";

export interface Client {
  id: string;
  name: string;
  shortName: string;
  integration: IntegrationType;
  color: string;
  monthlyVolume: number;
  contact: string;
  lastActivity: string;
}

export interface ExtractedFields {
  supplier: string;
  date: string;
  invoiceNumber: string;
  currency: "AED";
  subtotal: number;
  tax: number;
  total: number;
  documentType: DocumentType;
  confidence: number;
}

export interface JournalLine {
  id: string;
  account: string;
  debit: number;
  credit: number;
  note?: string;
}

export interface AuditEvent {
  id: string;
  actor: string;
  action: string;
  at: string;
}

export interface BookkeepingDocument {
  id: string;
  clientId: string;
  fileName: string;
  fileType: "PDF" | "JPG" | "XLSX";
  status: DocumentStatus;
  receivedAt: string;
  source: "Portal" | "Email" | "Shared folder" | "WhatsApp import";
  fields: ExtractedFields;
  originalLedger: string;
  suggestedLedger: string;
  vatTreatment: string;
  transactionType: string;
  journal: JournalLine[];
  warnings: string[];
  duplicateOf?: string;
  learnedFromMapping?: boolean;
  audit: AuditEvent[];
}

export interface SupplierMapping {
  id: string;
  clientId: string;
  supplier: string;
  ledger: string;
  previousLedger: string;
  confirmedBy: string;
  confirmedAt: string;
  applications: number;
}

export interface DemoState {
  documents: BookkeepingDocument[];
  mappings: SupplierMapping[];
  role: Role;
  selectedClientId: string;
}

export type View =
  | "overview"
  | "clients"
  | "inbox"
  | "approvals"
  | "integrations"
  | "learning";
