# Ledgerly — AI Bookkeeping Prototype Handover

## 1. Project summary

Ledgerly is an AI-assisted bookkeeping review platform for accounting firms managing multiple client companies.

The platform is intended to:

- Centralize invoices, receipts, vouchers, bank statements, and spreadsheets.
- Extract important information from documents using AI.
- Suggest ledger classifications and balanced journal entries.
- Allow an accountant to review and correct every suggestion.
- Send approved entries to the client's existing accounting system.
- Keep each client's information in a separate workspace.

Ledgerly is not intended to replace Zoho Books, TallyPrime, Excel, or another accounting package. It acts as the document intake, AI assistance, review, approval, and integration layer.

## 2. Current project status

The current version is a working demonstration prototype.

It includes:

- Three fictional client companies.
- Separate company workspaces.
- A document inbox.
- Document extraction and review screens.
- Balanced journal-entry suggestions.
- Approval, rejection, and clarification actions.
- Duplicate-invoice controls.
- Supplier-specific learning demonstrations.
- Illustrative financial statements for each company.
- Simulated Zoho Books and TallyPrime integrations.
- A working CSV export for Excel.
- Desktop and mobile layouts.
- A client-only document upload portal with local file selection.
- Demo AI categorization for common expenses including fuel, meals, travel, utilities, office supplies, cleaning, repairs, courier, and software.
- PDF downloads for financial statements and document-review summaries.
- Local browser persistence and a demo reset function.

All companies, documents, amounts, financial figures, extraction results, and integration events are synthetic demonstration data.

## 3. User roles

### Firm Admin

The Firm Admin oversees the accounting firm and all client workspaces.

The intended responsibilities include:

- Viewing firm-wide workload.
- Managing clients and users.
- Monitoring document and approval activity.
- Managing integrations and security settings.

### Accountant

The Accountant performs bookkeeping review work.

The intended responsibilities include:

- Reviewing extracted document information.
- Correcting ledger suggestions.
- Checking debit and credit entries.
- Approving or rejecting transactions.
- Requesting clarification.
- Reviewing company financial statements.

### Client

The Client has access only to its own company workspace.

The intended responsibilities include:

- Uploading source documents.
- Viewing document status.

The current prototype intentionally limits the Client role to document upload and status tracking. Invoice creation, extraction editing, ledger selection, approval, integrations, and financial-statement controls remain accountant/admin functions.

The prototype demonstrates these roles visually. Production authentication and authorization have not yet been implemented.

## 4. Application pages

### 4.1 Overview

The Overview is the accounting firm's main dashboard.

It shows:

- Number of client companies.
- Documents waiting for review.
- Approved transactions.
- Recent activity.
- Items requiring attention.
- Illustrative time-saving information.

This is the accountant's daily starting page.

### 4.2 Clients

The Clients page lists the companies managed by the accounting firm.

For each client, it shows information such as:

- Company name.
- Accounting system used.
- Document volume.
- Review workload.
- Approval status.
- Integration type.

Selecting a client changes the active workspace to that company. Information from different companies is not combined.

### 4.3 Document Inbox

The Document Inbox is the central location for incoming accounting records.

The prototype includes:

- Purchase invoices.
- Receipts.
- Expense vouchers.
- Credit notes.
- Bank statements.

Users can:

- Search documents.
- Filter documents by status.
- See the company associated with each document.
- Open a document for detailed review.
- Demonstrate a simulated upload.

Document statuses include:

- Uploaded.
- Processing.
- Needs review.
- Approved.
- Rejected.
- Demo exported.
- Demo synchronized.
- Error.

### 4.4 Document Review

The Document Review screen shows the source document beside the extracted accounting information.

The accountant can inspect:

- Supplier name.
- Invoice number.
- Invoice date.
- Due date.
- Subtotal.
- VAT amount and treatment.
- Total amount.
- Suggested ledger account.
- Suggested debit and credit lines.
- Extraction confidence.
- Warnings and possible duplicates.
- Review and audit history.

Available actions include:

- Approve the transaction.
- Reject the transaction.
- Request clarification.
- Correct extracted information.
- Change the suggested ledger.
- Remember an approved supplier correction.

Approval is blocked when the journal entry is not balanced or when an unresolved duplicate warning exists.

### 4.5 Financial Statements

The Financial Statements page presents separate illustrative reports for each client company.

Users can switch between companies, but the companies are never consolidated automatically.

The page includes three reports.

#### Balance Sheet

The Balance Sheet shows what the company owns, what it owes, and the owner's interest in the company.

The accounting equation is:

`Assets = Liabilities + Equity`

Example asset accounts include:

- Bank and cash.
- Accounts receivable.
- Prepaid expenses.
- Office equipment.

Example liability accounts include:

- Accounts payable.
- VAT payable.
- Accrued expenses.

Example equity items include:

- Share capital.
- Opening retained earnings.
- Current-period net profit.

The page visibly confirms whether the illustrative statement balances.

#### Trial Balance

The Trial Balance lists each account and its debit or credit balance.

Its control equation is:

`Total debits = Total credits`

This helps identify missing or incorrectly posted accounting entries.

#### Profit and Loss

The Profit and Loss statement shows the company's performance for the reporting period.

Its calculation is:

`Income - Expenses = Net profit`

The page shows:

- Income accounts.
- Expense accounts.
- Total income.
- Total expenses.
- Net profit.

#### Account drill-down

Selecting an account opens supporting information.

Only approved, demo-exported, or demo-synchronized documents can be displayed as supporting documents. Uploaded, unreviewed, rejected, or duplicate-held documents are not presented as accounting support.

Some figures are explicitly identified as synthetic opening or summary balances and therefore do not have individual source documents.

#### Demonstration balances

The three seeded companies balance as follows:

| Company | Assets | Liabilities | Equity | Balance check |
|---|---:|---:|---:|---|
| Northstar Creative Trading LLC | AED 92,650 | AED 25,650 | AED 67,000 | Balanced |
| Desert Bloom Facilities Management | AED 176,500 | AED 86,500 | AED 90,000 | Balanced |
| Harbour Lane Consulting FZ-LLC | AED 67,000 | AED 14,000 | AED 53,000 | Balanced |

These are illustrative figures, not filed financial statements or production books.

### 4.6 Approval Queue

The Approval Queue is the accountant's work list.

It helps the accountant find:

- Documents ready for review.
- Low-confidence extractions.
- Possible duplicate invoices.
- Missing information.
- Entries that cannot yet be approved.

Its purpose is to reduce the need to search manually through every uploaded document.

### 4.7 Integrations

The Integrations page demonstrates what happens to approved transactions.

#### Zoho Books

The intended production workflow is:

1. Connect the client's Zoho Books organization through OAuth.
2. Store tokens securely for that specific client.
3. Send only approved entries to the correct organization.
4. Attach the source document where the Zoho API supports it.
5. Record success or error information.

Zoho operations are simulated in the prototype.

#### TallyPrime

The intended production workflow uses a secure connector installed on the client's computer.

The connector would:

1. Retrieve approved entries.
2. Verify the selected Tally company.
3. Post entries into the local Tally installation.
4. Prevent duplicate posting.
5. Return success or error information to the portal.

Tally would normally need to be running. The connector and posting process are simulated in the prototype.

#### Excel

Approved entries can be downloaded as a CSV file.

The CSV download is functional and can be opened in Microsoft Excel, Google Sheets, or another spreadsheet application.

### 4.8 Learning Insights

The Learning Insights page demonstrates client-specific learning from accountant corrections.

Example workflow:

1. The system suggests `Office Supplies` for a supplier.
2. The accountant changes it to `Repairs & Maintenance`.
3. The accountant selects `Remember this correction`.
4. A rule is recorded for that supplier and client.
5. A later invoice from that supplier receives the corrected suggestion.

A correction for one company does not automatically affect another company.

### 4.9 Workspace Selector

The workspace selector allows the accountant to choose:

- A firm-wide view.
- One specific company.

When a company is selected, the inbox, statements, and related information are restricted to that company.

### 4.10 Reset Demo

The Reset Demo button restores the original seeded state.

It removes demonstration changes such as:

- New approvals.
- Rejections.
- Simulated uploads.
- Learned supplier corrections.
- Simulated synchronization results.

This allows the demonstration to be repeated reliably.

## 5. Complete document workflow

The intended workflow is:

1. A client uploads a receipt, invoice, voucher, bank statement, or spreadsheet.
2. The document enters the client's isolated workspace.
3. AI or OCR extracts the important information.
4. The system suggests a ledger classification and journal entry.
5. The accountant compares the suggestion with the source document.
6. The accountant corrects any errors.
7. The system checks that debits equal credits.
8. The accountant approves, rejects, or requests clarification.
9. An approved transaction is recorded in the internal transaction database.
10. The approved entry is synchronized to Zoho Books, sent to the Tally connector, or exported to Excel.
11. The source document, decision history, and synchronization result remain linked for audit purposes.

In simplified form:

```text
Client uploads document
        ↓
AI extracts information
        ↓
System suggests accounting treatment
        ↓
Accountant reviews and corrects it
        ↓
Accountant approves it
        ↓
Approved transaction is recorded
        ↓
Zoho / Tally / Excel handoff
        ↓
Source document and audit history remain attached
```

## 6. Where approved documents currently go

In the prototype, approvals are stored in the browser using local storage.

They are not sent to a real accounting system.

The current prototype behavior is:

- Zoho Books synchronization is simulated.
- TallyPrime synchronization is simulated.
- Excel CSV export is functional.
- No real production accounting data is changed.
- A selected local file is not uploaded to a server or retained. Only deterministic demonstration metadata is stored in the browser.
- The demo classifier uses file-name keywords rather than reading the document with OCR or an AI model.

In production, the original document should be stored in secure object storage, while its metadata, extraction results, approval history, journal suggestion, and integration result should be stored in the application database.

## 7. Client portal

The current prototype uses the same application shell to demonstrate accountant and client roles.

A production client portal should allow each client to:

- Sign in securely.
- See only its own company.
- Upload files.
- Track document processing status.
- Answer clarification requests.
- See approved documents and permitted reports.
- View integration status where appropriate.

The production client should never be able to view another company's documents, reports, or users.

## 8. Technical implementation

The prototype uses:

- Next.js App Router.
- React.
- TypeScript.
- Custom responsive CSS.
- Lucide icons.
- Deterministic fixture data.
- Browser local storage.

Important files include:

- `app/_components/bookkeeping-app.tsx` — application interface and screens.
- `app/_components/demo-store.tsx` — local demonstration state and actions.
- `app/globals.css` — visual design and responsive behavior.
- `lib/types.ts` — domain types.
- `lib/fixtures.ts` — fictional clients, documents, journals, and financial data.
- `lib/adapters.ts` — replaceable extraction, suggestion, approval, and synchronization contracts.
- `PRODUCT.md` — product scope and safety principles.
- `README.md` — repository setup and demonstration guide.

## 9. Repository and deployment

GitHub repository:

[https://github.com/OglasAI/ai-bookkeeping-software](https://github.com/OglasAI/ai-bookkeeping-software)

Production deployment:

[https://ai-bookkeeping-software.vercel.app](https://ai-bookkeeping-software.vercel.app)

The project is deployed through Vercel. The Vercel project currently uses Vercel authentication protection.

## 10. Quality checks completed

The following checks have been completed:

- ESLint validation.
- TypeScript validation.
- Next.js production build.
- Desktop visual review.
- Mobile visual review.
- Balance Sheet equation checks for all three companies.
- Trial Balance debit and credit checks.
- Approved-document provenance checks for financial-statement drill-downs.
- GitHub push.
- Vercel production deployment.

## 11. Current limitations

The prototype does not yet include:

- Production authentication.
- Database-backed multi-user storage.
- Real file storage.
- Real OCR or AI extraction.
- Live Zoho Books OAuth or API posting.
- A functioning Tally desktop connector.
- Bank reconciliation matching.
- A complete production general ledger.
- Production opening-balance migration.
- Depreciation and accrual automation.
- Period closing and adjusting journals.
- Immutable audit logs.
- Malware scanning.
- Backup and disaster recovery.
- Production monitoring and alerting.
- Tenant-level encryption and formal retention controls.

The financial statements demonstrate the intended reporting experience using synthetic balances. They must not be represented as real, audited, or filed accounts.

## 12. Requirements for a production financial system

To generate reliable production Balance Sheets, Trial Balances, and Profit and Loss statements, the system will require:

- A complete chart of accounts for every client.
- Verified opening balances.
- Double-entry journal storage.
- Posting dates and accounting periods.
- Customer and supplier subledgers.
- Bank and cash ledgers.
- Accounts receivable and accounts payable.
- VAT and tax controls.
- Accruals and prepayments.
- Fixed assets and depreciation.
- Adjustment journals.
- Reversals and corrections.
- Period locking and closing.
- Audit history.
- Accountant review and sign-off.

## 13. Recommended next development phases

### Phase 1 — Production foundation

- Add authentication and role-based access.
- Add organization and client tenant isolation.
- Add a production database.
- Add secure document storage.
- Add file validation and malware scanning.
- Add an immutable audit trail.

### Phase 2 — Real document processing

- Connect OCR and AI extraction services.
- Store extraction confidence and evidence coordinates.
- Add background processing queues.
- Add retry and failure handling.
- Add production duplicate detection.

### Phase 3 — Accounting controls

- Add a complete chart of accounts.
- Add a transaction and journal database.
- Add posting periods and locks.
- Add opening-balance migration.
- Generate statements from posted journal entries rather than fixture balances.

### Phase 4 — Integrations

- Add Zoho Books OAuth and sandbox integration.
- Build and test the Tally desktop connector.
- Add duplicate-post prevention and company verification.
- Add integration logs and retry controls.

### Phase 5 — Reconciliation and pilot

- Add bank-statement parsing.
- Add transaction matching and reconciliation.
- Pilot with two or three clients.
- Include at least one Zoho client and one Tally client.
- Measure accountant corrections, processing time, and extraction accuracy.

## 14. Prototype demonstration sequence

The recommended presentation flow is:

1. Open Overview and explain the firm's workload.
2. Open Clients and select a company.
3. Open Document Inbox.
4. Select an invoice that needs review.
5. Compare the source document with the extracted information.
6. Correct the suggested ledger account.
7. Select `Remember this correction`.
8. Approve the transaction.
9. Open Learning Insights to show the saved client-specific rule.
10. Open a later invoice from the same supplier to demonstrate the improved suggestion.
11. Open the duplicate invoice and show that approval is blocked.
12. Open Financial Statements and show the balanced Balance Sheet.
13. Open Trial Balance and show matching debits and credits.
14. Open Profit and Loss and explain net profit.
15. Switch between companies to demonstrate client isolation.
16. Open Integrations and demonstrate simulated Zoho or Tally synchronization.
17. Demonstrate the Excel CSV download.
18. Use Reset Demo to restore the original state.

## 15. Final position

The current prototype successfully demonstrates the intended end-to-end concept:

- Documents are centralized by client.
- AI-assisted accounting suggestions are presented for review.
- Accountants remain in control of approval.
- Corrections can improve future client-specific suggestions.
- Approved transactions can be handed off to existing accounting systems.
- Every company has a separate illustrative financial reporting view.

The next major step is to replace local demonstration behavior with production authentication, secure storage, a database-backed double-entry transaction system, real AI extraction, and live accounting integrations.
