import type { BookkeepingDocument, Client, ClientFinancials, SupplierMapping } from "./types";

export const clients: Client[] = [
  {
    id: "c1",
    name: "Northstar Creative Trading LLC",
    shortName: "NC",
    integration: "Zoho Books",
    color: "#1f7a67",
    monthlyVolume: 86,
    contact: "Maya Thomas",
    lastActivity: "12 min ago",
  },
  {
    id: "c2",
    name: "Desert Bloom Facilities Management",
    shortName: "DB",
    integration: "TallyPrime",
    color: "#b66a3c",
    monthlyVolume: 132,
    contact: "Omar Rahman",
    lastActivity: "38 min ago",
  },
  {
    id: "c3",
    name: "Harbour Lane Consulting FZ-LLC",
    shortName: "HL",
    integration: "Excel",
    color: "#4f5f97",
    monthlyVolume: 54,
    contact: "Nadia Saleh",
    lastActivity: "Yesterday",
  },
];

const audit = (action: string, actor = "Demo extraction service") => [
  { id: `${action}-1`, actor, action, at: "16 Nov 2026, 10:24" },
  { id: `${action}-0`, actor: "Client portal", action: "Document received", at: "16 Nov 2026, 10:22" },
];

const journal = (ledger: string, subtotal: number, tax: number, credit = "Accounts Payable") => [
  { id: "l1", account: ledger, debit: subtotal, credit: 0 },
  ...(tax ? [{ id: "l2", account: "Input VAT Recoverable", debit: tax, credit: 0 }] : []),
  { id: "l3", account: credit, debit: 0, credit: subtotal + tax },
];

export const initialDocuments: BookkeepingDocument[] = [
  {
    id: "d1", clientId: "c1", fileName: "Gulf_Office_Mart_INV-2048.pdf", fileType: "PDF", status: "needs_review", receivedAt: "Today, 10:22", source: "Portal",
    fields: { supplier: "Gulf Office Mart", date: "2026-11-15", invoiceNumber: "INV-2048", currency: "AED", subtotal: 1000, tax: 50, total: 1050, documentType: "Purchase invoice", confidence: 94 },
    originalLedger: "Office Supplies", suggestedLedger: "Office Supplies", vatTreatment: "Standard-rated purchase · 5% input VAT", transactionType: "Supplier bill", journal: journal("Office Supplies", 1000, 50), warnings: ["Confirm business purpose before claiming input VAT"], audit: audit("Fields extracted with 94% confidence"),
  },
  {
    id: "d2", clientId: "c1", fileName: "City_Courier_CC-7714.jpg", fileType: "JPG", status: "approved", receivedAt: "Today, 09:41", source: "WhatsApp import",
    fields: { supplier: "City Courier Services", date: "2026-11-14", invoiceNumber: "CC-7714", currency: "AED", subtotal: 240, tax: 12, total: 252, documentType: "Receipt", confidence: 97 },
    originalLedger: "Courier & Delivery", suggestedLedger: "Courier & Delivery", vatTreatment: "Standard-rated purchase · 5% input VAT", transactionType: "Bank-paid expense", journal: journal("Courier & Delivery", 240, 12, "Mashreq Bank"), warnings: [], audit: audit("Approved by Aisha Khan", "Aisha Khan"),
  },
  {
    id: "d3", clientId: "c1", fileName: "Cloudline_Hosting_NOV.pdf", fileType: "PDF", status: "processing", receivedAt: "Today, 11:06", source: "Email",
    fields: { supplier: "Cloudline Hosting", date: "2026-11-16", invoiceNumber: "CL-11902", currency: "AED", subtotal: 680, tax: 34, total: 714, documentType: "Purchase invoice", confidence: 88 },
    originalLedger: "Software Subscriptions", suggestedLedger: "Software Subscriptions", vatTreatment: "Review tax invoice details", transactionType: "Supplier bill", journal: journal("Software Subscriptions", 680, 34), warnings: ["TRN partially obscured"], audit: audit("Document queued for extraction"),
  },
  {
    id: "d4", clientId: "c1", fileName: "Emirates_Stationery_8821.pdf", fileType: "PDF", status: "demo_synced", receivedAt: "13 Nov, 15:19", source: "Shared folder",
    fields: { supplier: "Emirates Stationery", date: "2026-11-13", invoiceNumber: "ES-8821", currency: "AED", subtotal: 420, tax: 21, total: 441, documentType: "Purchase invoice", confidence: 99 },
    originalLedger: "Office Supplies", suggestedLedger: "Office Supplies", vatTreatment: "Standard-rated purchase · 5% input VAT", transactionType: "Supplier bill", journal: journal("Office Supplies", 420, 21), warnings: [], audit: audit("Demo sync completed", "Zoho Books simulator"),
  },
  {
    id: "d5", clientId: "c2", fileName: "Al_Noor_AC_Service_491.pdf", fileType: "PDF", status: "needs_review", receivedAt: "Today, 08:52", source: "Portal",
    fields: { supplier: "Al Noor AC Services", date: "2026-11-14", invoiceNumber: "ANS-491", currency: "AED", subtotal: 1850, tax: 92.5, total: 1942.5, documentType: "Purchase invoice", confidence: 91 },
    originalLedger: "Repairs & Maintenance", suggestedLedger: "Repairs & Maintenance", vatTreatment: "Standard-rated purchase · 5% input VAT", transactionType: "Supplier bill", journal: journal("Repairs & Maintenance", 1850, 92.5), warnings: ["Cost centre not detected"], audit: audit("Entry suggestion prepared"),
  },
  {
    id: "d6", clientId: "c1", fileName: "City_Courier_CC-7714-copy.jpg", fileType: "JPG", status: "needs_review", receivedAt: "Today, 10:58", source: "Email",
    fields: { supplier: "City Courier Services", date: "2026-11-14", invoiceNumber: "CC-7714", currency: "AED", subtotal: 240, tax: 12, total: 252, documentType: "Receipt", confidence: 98 },
    originalLedger: "Courier & Delivery", suggestedLedger: "Courier & Delivery", vatTreatment: "Standard-rated purchase · 5% input VAT", transactionType: "Bank-paid expense", journal: journal("Courier & Delivery", 240, 12, "Mashreq Bank"), warnings: ["Probable duplicate: supplier and invoice number match an approved document"], duplicateOf: "d2", audit: audit("Duplicate warning raised"),
  },
  {
    id: "d7", clientId: "c2", fileName: "Petrol_Receipt_1109.jpg", fileType: "JPG", status: "approved", receivedAt: "15 Nov, 18:34", source: "WhatsApp import",
    fields: { supplier: "ADNOC Distribution", date: "2026-11-15", invoiceNumber: "R-91844", currency: "AED", subtotal: 300, tax: 15, total: 315, documentType: "Receipt", confidence: 96 },
    originalLedger: "Vehicle Fuel", suggestedLedger: "Vehicle Fuel", vatTreatment: "Input VAT eligibility requires confirmation", transactionType: "Cash expense", journal: journal("Vehicle Fuel", 300, 15, "Petty Cash"), warnings: [], audit: audit("Approved by Sameer Ali", "Sameer Ali"),
  },
  {
    id: "d8", clientId: "c1", fileName: "Gulf_Office_Mart_INV-2110.pdf", fileType: "PDF", status: "uploaded", receivedAt: "Today, 11:18", source: "Portal",
    fields: { supplier: "Gulf Office Mart", date: "2026-11-16", invoiceNumber: "INV-2110", currency: "AED", subtotal: 750, tax: 37.5, total: 787.5, documentType: "Purchase invoice", confidence: 95 },
    originalLedger: "Office Supplies", suggestedLedger: "Office Supplies", vatTreatment: "Standard-rated purchase · 5% input VAT", transactionType: "Supplier bill", journal: journal("Office Supplies", 750, 37.5), warnings: [], audit: audit("Document uploaded; ready for demo processing"),
  },
  {
    id: "d9", clientId: "c2", fileName: "November_Bank_Statement.pdf", fileType: "PDF", status: "needs_review", receivedAt: "14 Nov, 17:03", source: "Shared folder",
    fields: { supplier: "Emirates NBD", date: "2026-11-14", invoiceNumber: "STMT-NOV-01", currency: "AED", subtotal: 0, tax: 0, total: 0, documentType: "Bank statement", confidence: 99 },
    originalLedger: "Bank statement", suggestedLedger: "Bank statement", vatTreatment: "Not applicable", transactionType: "Future reconciliation input", journal: [], warnings: ["Future feature: preview only — no reconciliation is performed"], audit: audit("Statement identified; reconciliation not enabled"),
  },
  {
    id: "d10", clientId: "c2", fileName: "Metro_Cleaning_302.pdf", fileType: "PDF", status: "rejected", receivedAt: "12 Nov, 11:25", source: "Email",
    fields: { supplier: "Metro Cleaning Products", date: "2026-11-11", invoiceNumber: "MC-302", currency: "AED", subtotal: 925, tax: 46.25, total: 971.25, documentType: "Purchase invoice", confidence: 73 },
    originalLedger: "Cleaning Supplies", suggestedLedger: "Cleaning Supplies", vatTreatment: "Tax invoice details incomplete", transactionType: "Supplier bill", journal: journal("Cleaning Supplies", 925, 46.25), warnings: ["Supplier TRN missing", "Invoice date uncertain"], audit: audit("Rejected — clearer copy requested", "Sameer Ali"),
  },
  {
    id: "d11", clientId: "c3", fileName: "Freelancer_Payment_Voucher.xlsx", fileType: "XLSX", status: "approved", receivedAt: "15 Nov, 12:12", source: "Portal",
    fields: { supplier: "Studio North FZCO", date: "2026-11-15", invoiceNumber: "PV-1107", currency: "AED", subtotal: 3200, tax: 0, total: 3200, documentType: "Expense voucher", confidence: 93 },
    originalLedger: "Professional Fees", suggestedLedger: "Professional Fees", vatTreatment: "No VAT supplied", transactionType: "Bank-paid expense", journal: journal("Professional Fees", 3200, 0, "Wio Business Bank"), warnings: [], audit: audit("Approved by Aisha Khan", "Aisha Khan"),
  },
  {
    id: "d12", clientId: "c3", fileName: "Travel_Credit_Note_CN44.pdf", fileType: "PDF", status: "needs_review", receivedAt: "Today, 09:08", source: "Email",
    fields: { supplier: "Falcon Travel Services", date: "2026-11-15", invoiceNumber: "CN-44", currency: "AED", subtotal: 500, tax: 25, total: 525, documentType: "Credit note", confidence: 86 },
    originalLedger: "Travel Expense", suggestedLedger: "Travel Expense", vatTreatment: "Reverse previous input VAT", transactionType: "Supplier credit", journal: [
      { id: "l1", account: "Accounts Payable", debit: 525, credit: 0 },
      { id: "l2", account: "Travel Expense", debit: 0, credit: 500 },
      { id: "l3", account: "Input VAT Recoverable", debit: 0, credit: 25 },
    ], warnings: ["Match against original supplier bill before approval"], audit: audit("Credit note identified"),
  },
];

export const initialMappings: SupplierMapping[] = [
  { id: "m1", clientId: "c2", supplier: "ADNOC Distribution", ledger: "Vehicle Fuel", previousLedger: "General Expenses", confirmedBy: "Sameer Ali", confirmedAt: "12 Nov 2026", applications: 4 },
  { id: "m2", clientId: "c3", supplier: "Studio North FZCO", ledger: "Professional Fees", previousLedger: "Subcontractors", confirmedBy: "Aisha Khan", confirmedAt: "10 Nov 2026", applications: 2 },
];

export const ledgerOptions = [
  "Office Supplies",
  "Repairs & Maintenance",
  "Courier & Delivery",
  "Software Subscriptions",
  "Vehicle Fuel",
  "Cleaning Supplies",
  "Professional Fees",
  "Travel Expense",
];

export const clientFinancials: ClientFinancials[] = [
  {
    clientId: "c1", currency: "AED", asOf: "30 November 2026",
    accounts: [
      { id: "c1-bank", code: "1100", name: "Bank & cash", category: "Asset", balance: 48750, documentIds: ["d2"] },
      { id: "c1-ar", code: "1200", name: "Accounts receivable", category: "Asset", balance: 22400, documentIds: [] },
      { id: "c1-prepaid", code: "1300", name: "Prepaid expenses", category: "Asset", balance: 3500, documentIds: [] },
      { id: "c1-equipment", code: "1500", name: "Office equipment", category: "Asset", balance: 18000, documentIds: [] },
      { id: "c1-ap", code: "2100", name: "Accounts payable", category: "Liability", balance: 17850, documentIds: ["d1", "d4", "d8"] },
      { id: "c1-vat", code: "2200", name: "VAT payable", category: "Liability", balance: 3200, documentIds: ["d1", "d2", "d4", "d8"] },
      { id: "c1-accrued", code: "2300", name: "Accrued expenses", category: "Liability", balance: 4600, documentIds: ["d3"] },
      { id: "c1-capital", code: "3100", name: "Share capital", category: "Equity", balance: 40000, documentIds: [] },
      { id: "c1-retained", code: "3200", name: "Opening retained earnings", category: "Equity", balance: 2250, documentIds: [] },
      { id: "c1-revenue", code: "4100", name: "Service revenue", category: "Income", balance: 38500, documentIds: [] },
      { id: "c1-office", code: "5100", name: "Office supplies", category: "Expense", balance: 2450, documentIds: ["d1", "d4", "d8"] },
      { id: "c1-software", code: "5200", name: "Software subscriptions", category: "Expense", balance: 2140, documentIds: ["d3"] },
      { id: "c1-courier", code: "5300", name: "Courier & delivery", category: "Expense", balance: 1260, documentIds: ["d2", "d6"] },
      { id: "c1-repairs", code: "5400", name: "Repairs & maintenance", category: "Expense", balance: 3100, documentIds: ["d1", "d8"] },
      { id: "c1-professional", code: "5500", name: "Professional fees", category: "Expense", balance: 4800, documentIds: [] },
    ],
  },
  {
    clientId: "c2", currency: "AED", asOf: "30 November 2026",
    accounts: [
      { id: "c2-bank", code: "1100", name: "Bank & cash", category: "Asset", balance: 72000, documentIds: ["d7", "d9"] },
      { id: "c2-ar", code: "1200", name: "Accounts receivable", category: "Asset", balance: 31000, documentIds: [] },
      { id: "c2-inventory", code: "1400", name: "Consumables inventory", category: "Asset", balance: 8500, documentIds: ["d10"] },
      { id: "c2-equipment", code: "1500", name: "Plant & equipment", category: "Asset", balance: 65000, documentIds: [] },
      { id: "c2-ap", code: "2100", name: "Accounts payable", category: "Liability", balance: 28000, documentIds: ["d5", "d10"] },
      { id: "c2-vat", code: "2200", name: "VAT payable", category: "Liability", balance: 6500, documentIds: ["d5", "d7", "d10"] },
      { id: "c2-loan", code: "2400", name: "Equipment loan", category: "Liability", balance: 45000, documentIds: [] },
      { id: "c2-accrued", code: "2300", name: "Accrued expenses", category: "Liability", balance: 7000, documentIds: [] },
      { id: "c2-capital", code: "3100", name: "Opening owner equity", category: "Equity", balance: 60000, documentIds: [] },
      { id: "c2-revenue", code: "4100", name: "Facilities service revenue", category: "Income", balance: 62000, documentIds: [] },
      { id: "c2-maintenance", code: "5100", name: "Repairs & maintenance", category: "Expense", balance: 11200, documentIds: ["d5"] },
      { id: "c2-fuel", code: "5200", name: "Vehicle fuel", category: "Expense", balance: 6800, documentIds: ["d7"] },
      { id: "c2-cleaning", code: "5300", name: "Cleaning supplies", category: "Expense", balance: 5900, documentIds: ["d10"] },
      { id: "c2-payroll", code: "5400", name: "Payroll & contract labour", category: "Expense", balance: 8100, documentIds: [] },
    ],
  },
  {
    clientId: "c3", currency: "AED", asOf: "30 November 2026",
    accounts: [
      { id: "c3-bank", code: "1100", name: "Bank & cash", category: "Asset", balance: 35000, documentIds: ["d11"] },
      { id: "c3-ar", code: "1200", name: "Accounts receivable", category: "Asset", balance: 18000, documentIds: [] },
      { id: "c3-equipment", code: "1500", name: "Computer equipment", category: "Asset", balance: 12000, documentIds: [] },
      { id: "c3-prepaid", code: "1300", name: "Prepaid expenses", category: "Asset", balance: 2000, documentIds: [] },
      { id: "c3-ap", code: "2100", name: "Accounts payable", category: "Liability", balance: 9000, documentIds: ["d12"] },
      { id: "c3-vat", code: "2200", name: "VAT payable", category: "Liability", balance: 2000, documentIds: ["d12"] },
      { id: "c3-accrued", code: "2300", name: "Accrued expenses", category: "Liability", balance: 3000, documentIds: ["d11"] },
      { id: "c3-capital", code: "3100", name: "Opening owner equity", category: "Equity", balance: 35000, documentIds: [] },
      { id: "c3-revenue", code: "4100", name: "Consulting revenue", category: "Income", balance: 29000, documentIds: [] },
      { id: "c3-professional", code: "5100", name: "Professional fees", category: "Expense", balance: 5200, documentIds: ["d11"] },
      { id: "c3-travel", code: "5200", name: "Travel expense", category: "Expense", balance: 3100, documentIds: ["d12"] },
      { id: "c3-software", code: "5300", name: "Software subscriptions", category: "Expense", balance: 2700, documentIds: [] },
    ],
  },
];
