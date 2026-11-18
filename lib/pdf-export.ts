import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";
import type { BookkeepingDocument, Client, FinancialAccount } from "./types";

const formatMoney = (value: number) => new Intl.NumberFormat("en-AE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
const safeName = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

function addHeader(pdf: jsPDF, client: Client, title: string, subtitle: string) {
  pdf.setFillColor(21, 40, 37);
  pdf.rect(0, 0, 210, 38, "F");
  pdf.setTextColor(244, 240, 231);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(18);
  pdf.text("LEDGERLY", 16, 15);
  pdf.setFontSize(9);
  pdf.setFont("helvetica", "normal");
  pdf.text("ACCOUNTANT REVIEW DESK - DEMO / ILLUSTRATIVE", 16, 22);
  pdf.setTextColor(23, 39, 34);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(17);
  pdf.text(title, 16, 52);
  pdf.setFontSize(11);
  pdf.text(client.name, 16, 60);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(94, 105, 100);
  pdf.setFontSize(9);
  pdf.text(subtitle, 16, 67);
}

function addFooter(pdf: jsPDF) {
  const pageCount = pdf.getNumberOfPages();
  for (let page = 1; page <= pageCount; page += 1) {
    pdf.setPage(page);
    pdf.setDrawColor(216, 209, 195);
    pdf.line(16, 280, 194, 280);
    pdf.setTextColor(94, 105, 100);
    pdf.setFontSize(7.5);
    pdf.text("Illustrative prototype output - not audited, filed, or production financial statements.", 16, 286);
    pdf.text(`Page ${page} of ${pageCount}`, 194, 286, { align: "right" });
  }
}

export function downloadFinancialStatementPdf(input: {
  client: Client;
  accounts: FinancialAccount[];
  statement: "balance" | "trial" | "profit";
  statementDate: string;
}) {
  const { client, accounts, statement, statementDate } = input;
  const pdf = new jsPDF({ unit: "mm", format: "a4" });
  const byCategory = (category: FinancialAccount["category"]) => accounts.filter((account) => account.category === category);
  const total = (category: FinancialAccount["category"]) => byCategory(category).reduce((sum, account) => sum + account.balance, 0);
  const assets = total("Asset");
  const liabilities = total("Liability");
  const openingEquity = total("Equity");
  const income = total("Income");
  const expenses = total("Expense");
  const netProfit = income - expenses;
  const equity = openingEquity + netProfit;
  const title = statement === "balance" ? "Balance Sheet" : statement === "trial" ? "Trial Balance" : "Profit and Loss";
  const subtitle = statement === "profit" ? `For the period ending ${statementDate}` : `As at ${statementDate}`;
  addHeader(pdf, client, title, subtitle);

  if (statement === "balance") {
    autoTable(pdf, {
      startY: 76,
      head: [["Accounting equation", "AED"]],
      body: [["Total assets", formatMoney(assets)], ["Total liabilities", formatMoney(liabilities)], ["Total equity", formatMoney(equity)], ["Liabilities + equity", formatMoney(liabilities + equity)]],
      theme: "grid",
      headStyles: { fillColor: [23, 115, 95] },
      columnStyles: { 1: { halign: "right" } },
    });
    const balanceRows = [
      ...byCategory("Asset").map((account) => [account.code, account.name, "Asset", formatMoney(account.balance)]),
      ...byCategory("Liability").map((account) => [account.code, account.name, "Liability", formatMoney(account.balance)]),
      ...byCategory("Equity").map((account) => [account.code, account.name, "Equity", formatMoney(account.balance)]),
      ["", "Current period net profit", "Equity", formatMoney(netProfit)],
    ];
    autoTable(pdf, {
      startY: (pdf as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable!.finalY + 8,
      head: [["Code", "Account", "Section", "AED"]],
      body: balanceRows,
      theme: "striped",
      headStyles: { fillColor: [21, 40, 37] },
      columnStyles: { 3: { halign: "right" } },
    });
  } else if (statement === "trial") {
    const rows = accounts.map((account) => {
      const debit = account.category === "Asset" || account.category === "Expense";
      return [account.code, account.name, account.category, debit ? formatMoney(account.balance) : "-", debit ? "-" : formatMoney(account.balance)];
    });
    rows.push(["", "TOTAL", "", formatMoney(assets + expenses), formatMoney(liabilities + openingEquity + income)]);
    autoTable(pdf, { startY: 76, head: [["Code", "Account", "Category", "Debit AED", "Credit AED"]], body: rows, theme: "striped", headStyles: { fillColor: [21, 40, 37] }, columnStyles: { 3: { halign: "right" }, 4: { halign: "right" } } });
  } else {
    const rows = [
      ...byCategory("Income").map((account) => [account.code, account.name, "Income", formatMoney(account.balance)]),
      ...byCategory("Expense").map((account) => [account.code, account.name, "Expense", formatMoney(account.balance)]),
      ["", "NET PROFIT", "", formatMoney(netProfit)],
    ];
    autoTable(pdf, { startY: 76, head: [["Code", "Account", "Type", "AED"]], body: rows, theme: "striped", headStyles: { fillColor: [21, 40, 37] }, columnStyles: { 3: { halign: "right" } } });
  }

  addFooter(pdf);
  pdf.save(`${safeName(client.shortName)}-${safeName(title)}-${safeName(statementDate)}.pdf`);
}

export function downloadDocumentPdf(document: BookkeepingDocument, client: Client) {
  const pdf = new jsPDF({ unit: "mm", format: "a4" });
  addHeader(pdf, client, "Document Review Summary", `${document.fileName} - received through ${document.source}`);
  autoTable(pdf, {
    startY: 76,
    head: [["Extracted field", "Value"]],
    body: [
      ["Document type", document.fields.documentType],
      ["Supplier", document.fields.supplier],
      ["Invoice / reference", document.fields.invoiceNumber],
      ["Date", document.fields.date],
      ["Suggested ledger", document.suggestedLedger],
      ["Net amount", `AED ${formatMoney(document.fields.subtotal)}`],
      ["VAT", `AED ${formatMoney(document.fields.tax)}`],
      ["Total", `AED ${formatMoney(document.fields.total)}`],
      ["Review status", document.status.replaceAll("_", " ")],
      ["Extraction confidence", `${document.fields.confidence}%`],
    ],
    theme: "grid",
    headStyles: { fillColor: [23, 115, 95] },
  });
  autoTable(pdf, {
    startY: (pdf as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable!.finalY + 9,
    head: [["Journal account", "Debit AED", "Credit AED"]],
    body: document.journal.map((line) => [line.account, line.debit ? formatMoney(line.debit) : "-", line.credit ? formatMoney(line.credit) : "-"]),
    foot: [["Total", formatMoney(document.journal.reduce((sum, line) => sum + line.debit, 0)), formatMoney(document.journal.reduce((sum, line) => sum + line.credit, 0))]],
    theme: "striped",
    headStyles: { fillColor: [21, 40, 37] },
    footStyles: { fillColor: [237, 231, 220], textColor: [23, 39, 34], fontStyle: "bold" },
    columnStyles: { 1: { halign: "right" }, 2: { halign: "right" } },
  });
  addFooter(pdf);
  pdf.save(`${safeName(document.fields.supplier)}-${safeName(document.fields.invoiceNumber)}.pdf`);
}
