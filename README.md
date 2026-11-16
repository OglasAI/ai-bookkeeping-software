# Ledgerly — AI Bookkeeping Review Desk

A client-presentation-ready mock prototype for an accounting firm that wants to reduce manual bookkeeping entry while its clients continue using Zoho Books, TallyPrime, Excel, or other accounting tools.

This is not a general ledger and it does not connect to production financial systems. All documents, companies, values, extraction results, approvals, and integration events are synthetic and deterministic.

## Run locally

Requirements: Node.js 20+ and npm.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Quality checks:

```bash
npm run lint
npm run build
```

## Demonstration flow

1. Start on **Overview** to explain the firm workload and illustrative savings.
2. Open the Gulf Office Mart invoice from the review ledger.
3. Inspect the synthetic source beside the extracted fields and balanced journal.
4. Change the ledger from **Office Supplies** to **Repairs & Maintenance**.
5. Select **Remember this correction** and approve the transaction.
6. Open **Learning insights** to show the confirmed client-specific rule.
7. Open the later Gulf Office Mart invoice to show that the rule changed its suggestion.
8. Review the duplicate City Courier invoice and show that approval is blocked.
9. Open **Integrations** to demonstrate simulated Zoho/Tally handoff and download a real CSV for the Excel client.

Use **Reset demo** to restore the seeded state after a presentation.

## Included prototype behavior

- Three isolated client workspaces using Zoho Books, TallyPrime, and Excel.
- Twelve realistic fictional source documents, plus deterministic simulated uploads.
- Searchable document inbox and multiple intake-source labels.
- Editable extraction fields, confidence, VAT treatment, and exception warnings.
- Balanced debit/credit suggestions with approval validation.
- Approval, rejection, clarification, and audit-history actions.
- Duplicate invoice warning that blocks approval.
- Client-specific supplier-to-ledger learning from an explicitly confirmed correction.
- Simulated Zoho Books and TallyPrime handoffs with honest demo labeling.
- Genuine browser-generated CSV download for approved Excel entries.
- Firm Admin, Accountant, and Client demonstration roles.
- Local browser persistence for a reliable, account-free demonstration.

## Architecture

- `app/_components/bookkeeping-app.tsx` — application shell and interactive screens.
- `app/_components/demo-store.tsx` — client-side state, local persistence, approval and learning actions.
- `lib/types.ts` — typed domain model.
- `lib/fixtures.ts` — synthetic clients, documents, journal lines, and supplier rules.
- `lib/adapters.ts` — replaceable mock contracts for extraction, suggestion, approval, and synchronization.
- `PRODUCT.md` — durable product scope and safety constraints.

The mock adapters intentionally keep future production boundaries visible: `extractDocument()`, `suggestEntry()`, `approveEntry()`, and `syncEntry()` can later be replaced by server-side implementations without changing the demonstration language.

## Honest limitations

- No authentication or production authorization layer.
- Browser storage is for demonstration reliability, not multi-user persistence.
- No live AI model, OCR service, Zoho OAuth/API, Tally connector, or accounting-system write.
- Bank statements are previewed as a future reconciliation input; no matching or reconciliation occurs.
- VAT and ledger suggestions are examples that require qualified accountant review.
- The illustrative time-savings figure is not a measured customer result.
- The prototype does not implement file security, retention, malware scanning, audit immutability, tenant encryption, backups, or operational monitoring required for production.

## Repository

GitHub: [OglasAI/ai-bookkeeping-software](https://github.com/OglasAI/ai-bookkeeping-software)
