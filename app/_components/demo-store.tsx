"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { initialDocuments, initialMappings } from "@/lib/fixtures";
import { approveEntry, isBalanced } from "@/lib/adapters";
import { uploadedFileType } from "@/lib/upload-classification";
import { clearDocumentFiles } from "@/lib/file-store";
import type {
  BookkeepingDocument,
  DemoState,
  DocumentStatus,
  ExtractedFields,
  Role,
  SupplierMapping,
  UploadedDocumentInput,
} from "@/lib/types";

const STORAGE_KEY = "ledgerly-demo-state-v1";

const defaultState: DemoState = {
  documents: initialDocuments,
  mappings: initialMappings,
  role: "Accountant",
  selectedClientId: "all",
};

interface DemoContextValue extends DemoState {
  hydrated: boolean;
  setRole: (role: Role) => void;
  setSelectedClientId: (id: string) => void;
  updateFields: (id: string, fields: Partial<ExtractedFields>) => void;
  updateLedger: (id: string, ledger: string) => void;
  setStatus: (id: string, status: DocumentStatus, action: string) => void;
  approve: (id: string, confirmMapping: boolean) => { ok: boolean; message: string };
  reject: (id: string, reason: string) => { ok: boolean; message: string };
  simulateProcess: (id: string) => void;
  simulateUpload: (input: UploadedDocumentInput) => string;
  reset: () => void;
  exportCsv: (clientId?: string) => number;
}

const DemoContext = createContext<DemoContextValue | null>(null);

const cloneDefaults = (): DemoState => JSON.parse(JSON.stringify(defaultState)) as DemoState;

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<DemoState>(cloneDefaults);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = window.localStorage.getItem(STORAGE_KEY);
    } catch {
      // The deterministic seed remains available when storage is blocked.
    }
    queueMicrotask(() => {
      if (saved) setState(JSON.parse(saved) as DemoState);
      setHydrated(true);
    });
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [hydrated, state]);

  const updateDocument = (id: string, updater: (document: BookkeepingDocument) => BookkeepingDocument) => {
    setState((current) => ({
      ...current,
      documents: current.documents.map((document) => (document.id === id ? updater(document) : document)),
    }));
  };

  const value = useMemo<DemoContextValue>(() => ({
    ...state,
    hydrated,
    setRole: (role) => setState((current) => ({
      ...current,
      role,
      selectedClientId: role === "Client" && current.selectedClientId === "all" ? "c1" : current.selectedClientId,
    })),
    setSelectedClientId: (selectedClientId) => setState((current) => ({ ...current, selectedClientId })),
    updateFields: (id, fields) => updateDocument(id, (document) => {
      const nextFields = { ...document.fields, ...fields };
      nextFields.total = Math.round((nextFields.subtotal + nextFields.tax) * 100) / 100;
      const isCredit = nextFields.documentType === "Credit note";
      const journal = document.journal.map((line, index, lines) => {
        if (isCredit) {
          if (index === 0) return { ...line, debit: nextFields.total, credit: 0 };
          if (line.account === "Input VAT Recoverable") return { ...line, debit: 0, credit: nextFields.tax };
          return { ...line, debit: 0, credit: nextFields.subtotal };
        }
        if (index === 0) return { ...line, debit: nextFields.subtotal, credit: 0 };
        if (line.account === "Input VAT Recoverable") return { ...line, debit: nextFields.tax, credit: 0 };
        if (index === lines.length - 1) return { ...line, debit: 0, credit: nextFields.total };
        return line;
      });
      return {
        ...document,
        fields: nextFields,
        journal,
        audit: [{ id: crypto.randomUUID(), actor: "Demo accountant", action: "Corrected extracted fields and recalculated entry", at: "Just now" }, ...document.audit],
      };
    }),
    updateLedger: (id, ledger) => updateDocument(id, (document) => ({
      ...document,
      suggestedLedger: ledger,
      journal: document.journal.map((line, index) => index === 0 ? { ...line, account: ledger } : line),
      audit: [{ id: crypto.randomUUID(), actor: "Demo accountant", action: `Changed ledger to ${ledger}`, at: "Just now" }, ...document.audit],
    })),
    setStatus: (id, status, action) => updateDocument(id, (document) => ({
      ...document,
      status,
      audit: [{ id: crypto.randomUUID(), actor: "Demo accountant", action, at: "Just now" }, ...document.audit],
    })),
    approve: (id, confirmMapping) => {
      const document = state.documents.find((item) => item.id === id);
      if (!document) return { ok: false, message: "Document not found." };
      if (document.duplicateOf) return { ok: false, message: "Resolve the duplicate warning before approval." };
      if (document.fields.documentType === "Bank statement") return { ok: false, message: "Bank reconciliation is a future feature in this demo." };
      if (!approveEntry(document)) {
        const balance = isBalanced(document.journal);
        return { ok: false, message: balance.balanced ? "This entry cannot be approved." : "Debit and credit totals must balance." };
      }

      setState((current) => {
        let mappings = current.mappings;
        let documents = current.documents.map((item) => item.id === id ? {
          ...item,
          status: "approved" as const,
          warnings: item.isUserUpload ? item.warnings.filter((warning) => !warning.includes("must be confirmed")) : item.warnings,
          classificationReason: item.isUserUpload ? `Accountant confirmed ${item.suggestedLedger} during approval.` : item.classificationReason,
          audit: [{ id: crypto.randomUUID(), actor: "Demo accountant", action: "Approved transaction suggestion", at: "Just now" }, ...item.audit],
        } : item);

        if (confirmMapping && document.suggestedLedger !== document.originalLedger) {
          const mapping: SupplierMapping = {
            id: crypto.randomUUID(),
            clientId: document.clientId,
            supplier: document.fields.supplier,
            ledger: document.suggestedLedger,
            previousLedger: document.originalLedger,
            confirmedBy: "Demo accountant",
            confirmedAt: "16 Nov 2026",
            applications: 1,
          };
          mappings = [mapping, ...current.mappings.filter((item) => !(item.clientId === mapping.clientId && item.supplier === mapping.supplier))];
          documents = documents.map((item) => {
            if (item.id === id || item.clientId !== mapping.clientId || item.fields.supplier !== mapping.supplier || item.status === "approved") return item;
            return {
              ...item,
              suggestedLedger: mapping.ledger,
              learnedFromMapping: true,
              status: item.status === "uploaded" ? "needs_review" : item.status,
              journal: item.journal.map((line, index) => index === 0 ? { ...line, account: mapping.ledger } : line),
              audit: [{ id: crypto.randomUUID(), actor: "Client learning rule", action: `Applied confirmed ${mapping.supplier} → ${mapping.ledger} mapping`, at: "Just now" }, ...item.audit],
            };
          });
        }
        return { ...current, documents, mappings };
      });
      return { ok: true, message: confirmMapping && document.suggestedLedger !== document.originalLedger ? "Approved and saved as a client-specific supplier rule." : "Transaction approved." };
    },
    reject: (id, reason) => {
      const cleanReason = reason.trim();
      if (!cleanReason) return { ok: false, message: "Enter a rejection reason before rejecting this document." };
      updateDocument(id, (document) => ({
        ...document,
        status: "rejected",
        rejectReason: cleanReason,
        rejectedBy: state.role,
        rejectedAt: new Intl.DateTimeFormat("en-AE", { dateStyle: "medium", timeStyle: "short" }).format(new Date()),
        audit: [{ id: crypto.randomUUID(), actor: state.role, action: `Rejected — ${cleanReason}`, at: "Just now" }, ...document.audit],
      }));
      return { ok: true, message: "Document moved to the rejected archive." };
    },
    simulateProcess: (id) => updateDocument(id, (document) => ({
      ...document,
      status: "needs_review",
      audit: [{ id: crypto.randomUUID(), actor: "Demo extraction service", action: "Deterministic extraction completed", at: "Just now" }, ...document.audit],
    })),
    simulateUpload: (input) => {
      if (state.role !== "Client") throw new Error("Only the client portal can upload source documents.");
      const id = `d-${Date.now()}`;
      const fields = {
        ...input.fields,
        total: Math.round((input.fields.subtotal + input.fields.tax) * 100) / 100,
      };
      const document: BookkeepingDocument = {
        ...JSON.parse(JSON.stringify(initialDocuments[0])) as BookkeepingDocument,
        id,
        clientId: input.clientId,
        fileName: input.fileName,
        fileType: uploadedFileType(input.fileName),
        fileSize: input.fileSize,
        source: "Portal",
        status: "needs_review",
        receivedAt: "Just now",
        isUserUpload: true,
        extractionSource: input.source,
        expenseCategory: input.category,
        classificationReason: input.explanation ?? `${input.source.toUpperCase()} classified this document as ${input.category} and suggested ${input.ledger}.`,
        aiExplanation: input.explanation,
        originalLedger: input.ledger,
        suggestedLedger: input.ledger,
        transactionType: input.transactionType ?? "Supplier bill / expense",
        vatTreatment: input.vatTreatment ?? (fields.tax > 0 ? "Standard-rated purchase with input VAT" : "No input VAT extracted"),
        fields,
        journal: input.journal ?? [
          { id: "l1", account: input.ledger, debit: fields.subtotal, credit: 0 },
          { id: "l2", account: "Input VAT Recoverable", debit: fields.tax, credit: 0 },
          { id: "l3", account: "Accounts Payable", debit: 0, credit: fields.total },
        ],
        warnings: input.warnings ?? [`${input.source.toUpperCase()} extraction and ledger suggestion must be confirmed by an accountant.`],
        audit: [
          { id: crypto.randomUUID(), actor: `${input.source.toUpperCase()} extraction`, action: `Extracted document · Source: ${input.source.toUpperCase()} · Category: ${input.category} · Ledger: ${input.ledger}`, at: "Just now" },
          { id: crypto.randomUUID(), actor: "Client portal", action: `Uploaded ${input.fileName}`, at: "Just now" },
        ],
      };
      setState((current) => ({ ...current, documents: [document, ...current.documents] }));
      return id;
    },
    reset: () => {
      setState(cloneDefaults());
      void clearDocumentFiles();
    },
    exportCsv: (clientId) => {
      const exportable = state.documents.filter((document) =>
        ["approved", "demo_exported", "demo_synced"].includes(document.status) && (!clientId || clientId === "all" || document.clientId === clientId));
      const header = ["Client", "Date", "Supplier", "Invoice number", "Ledger", "Net AED", "VAT AED", "Total AED", "Status"];
      const rows = exportable.map((document) => [
        document.clientId,
        document.fields.date,
        document.fields.supplier,
        document.fields.invoiceNumber,
        document.suggestedLedger,
        document.fields.subtotal.toFixed(2),
        document.fields.tax.toFixed(2),
        document.fields.total.toFixed(2),
        document.status,
      ]);
      const csv = [header, ...rows].map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n");
      const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "approved-bookkeeping-demo.csv";
      anchor.click();
      URL.revokeObjectURL(url);
      setState((current) => ({
        ...current,
        documents: current.documents.map((document) => exportable.some((item) => item.id === document.id) && document.status === "approved" ? { ...document, status: "demo_exported" } : document),
      }));
      return exportable.length;
    },
  }), [state, hydrated]);

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemo() {
  const context = useContext(DemoContext);
  if (!context) throw new Error("useDemo must be used inside DemoProvider");
  return context;
}
