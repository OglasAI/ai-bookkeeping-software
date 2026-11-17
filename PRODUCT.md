# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js App Router, TypeScript, Tailwind CSS, Lucide icons, and deterministic local demo data. The user supplied this stack in the approved prototype specification.

## Users

- Firm admins overseeing 10–15 client businesses and firm-wide workload.
- Accountants reviewing extracted document data, correcting ledger suggestions, approving entries, and exporting or synchronizing approved work.
- Client users uploading invoices, receipts, vouchers, bank statements, and spreadsheets into their own isolated workspace.

## Product Purpose

Reduce manual bookkeeping entry by centralizing source documents, suggesting accounting treatment, and keeping an accountant in control of every approval. The prototype must demonstrate the complete workflow credibly to an accounting firm without pretending to be a production ledger or a live integration.

## Positioning

The product is an AI-assisted interpretation and approval layer that works alongside each client's existing accounting system. Its distinctive mechanism is client-specific learning from confirmed accountant corrections while preserving mandatory review, auditability, and source-document context.

## Operating Context

Clients currently send documents through WhatsApp, email, and shared folders. Source material includes PDFs, images, bank statements, and Excel reports. Clients continue using Zoho Books, TallyPrime, Excel, or other tools. The prototype covers a firm dashboard, isolated client workspaces, document intake, deterministic extraction, accounting suggestions, review, approval, illustrative company-level financial statements, simulated sync, CSV export, and learning insights.

## Capabilities and Constraints

- Mock prototype only; no live Zoho or Tally posting, OAuth, production credentials, or real financial records.
- Three seeded client workspaces: Zoho Books, TallyPrime, and Excel.
- At least 12 fictional documents across multiple review states.
- Accountant approval is mandatory before export or simulated sync.
- Suggested journal lines must balance before approval.
- Each client has an isolated illustrative Balance Sheet, Trial Balance, and Profit & Loss view. Assets must equal liabilities plus equity, and trial-balance debits must equal credits.
- Statement figures use synthetic opening and summary balances for demonstration; they do not represent a complete general ledger or filed financial statements.
- Duplicate invoices are flagged and blocked pending resolution.
- Confirming a supplier-to-ledger correction changes later suggestions for the same supplier and client.
- CSV export is real and downloadable; other integration operations are explicitly labeled Demo / Simulated.
- Bank reconciliation appears only as a clearly labeled future capability.
- All client-scoped records carry a client identifier and remain isolated in the interface.
- State is persisted locally for demo reliability and can be reset.

## Evidence on Hand

- `C:/Users/shazi/Downloads/AI_BOOKKEEPING_POC_SPEC.md` — approved prototype specification.
- `C:/Users/shazi/Downloads/CODEX_BUILD_PROMPT.md` — approved implementation brief.
- `C:/Users/shazi/.codex/attachments/13631c9b-4b41-4edd-8c73-7ccbec0016d5/Pasted text.txt` — discovery-call transcript supporting the product workflow.
- No real customer financial records, production integration credentials, brand assets, testimonials, or validated savings data are available. All demonstration data and efficiency figures must be labeled illustrative.

## Product Principles

1. Human approval is the control point, not an afterthought.
2. Every suggestion stays traceable to its source document and correction history.
3. Client boundaries remain visible and strict at every step.
4. Mock behavior is clearly distinguished from live financial posting.
5. The prototype proves the workflow through working interactions rather than unsupported claims.

## Accessibility & Inclusion

The desktop-first web application must remain usable on mobile, support keyboard focus, use readable contrast, and communicate state through labels and icons rather than color alone.
