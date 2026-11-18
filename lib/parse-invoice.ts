// Finds invoice fields in OCR text using simple rules. Tuned for UAE invoices (AED, VAT, day-first dates).
export type ParsedInvoice = {
  supplier?: string;
  invoiceNumber?: string;
  date?: string;
  subtotal?: number;
  tax?: number;
  total?: number;
  found: number; // how many of the 5 key fields were found
};

const NUMBER = /\d{1,3}(?:,\d{3})+(?:\.\d{1,2})?|\d+\.\d{1,2}|\d+/g;
const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
const round = (n: number) => Math.round(n * 100) / 100;

const amountsIn = (line: string) =>
  (line.replace(/\d+(?:\.\d+)?\s*%/g, "").match(NUMBER) ?? []).map((n) => Number(n.replace(/,/g, "")));

// Amounts on lines matching `include`; if the label line has no number, look at the next line.
function amountsFor(lines: string[], include: RegExp, exclude?: RegExp) {
  const values: number[] = [];
  lines.forEach((line, i) => {
    if (!include.test(line) || (exclude && exclude.test(line))) return;
    const here = amountsIn(line);
    const found = here.length ? here : amountsIn(lines[i + 1] ?? "");
    if (found.length) values.push(found[found.length - 1]);
  });
  return values;
}

function iso(year: string, month: string, day: string) {
  const m = Number(month), d = Number(day);
  if (m < 1 || m > 12 || d < 1 || d > 31) return undefined;
  return `${year}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function findDate(text: string) {
  let m = text.match(/\b(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})\b/);
  if (m) return iso(m[1], m[2], m[3]);
  m = text.match(/\b(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})\b/);
  if (m) return iso(m[3].length === 2 ? `20${m[3]}` : m[3], m[2], m[1]); // day first (UAE)
  m = text.match(/\b(\d{1,2})[\s-]+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*[\s,-]+(\d{4})\b/i);
  if (m) return iso(m[3], String(MONTHS.indexOf(m[2].toLowerCase()) + 1), m[1]);
  m = text.match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(\d{1,2}),?\s+(\d{4})\b/i);
  if (m) return iso(m[3], String(MONTHS.indexOf(m[1].toLowerCase()) + 1), m[2]);
  return undefined;
}

export function parseInvoiceText(text: string): ParsedInvoice {
  const lines = text.split(/\r?\n/).map((l) => l.replace(/\s+/g, " ").trim()).filter(Boolean);

  // Supplier: first meaningful line near the top
  const supplier = lines.slice(0, 8).find((l) =>
    /[a-z]{3,}/i.test(l) &&
    !/^(tax\s+)?invoice|^receipt|^bill|page|date|trn|tel|phone|fax|e-?mail|www|http|p\.?\s?o\.?\s?box/i.test(l) &&
    !/\d{6,}/.test(l))?.slice(0, 80);

  // Invoice number
  const invoiceNumber = text.match(
    /(?:invoice|inv|bill|receipt|voucher|ref(?:erence)?)\s*(?:no\.?|number|num|#)\s*[:#.-]?\s*([A-Z0-9][A-Z0-9/-]{2,})/i)?.[1];

  // Date: prefer the line labelled "date" (not "due date")
  const dateIndex = lines.findIndex((l) => /date/i.test(l) && !/due/i.test(l));
  const date = (dateIndex >= 0 ? findDate(`${lines[dateIndex]} ${lines[dateIndex + 1] ?? ""}`) : undefined) ?? findDate(text);

  // Amounts
  const totals = amountsFor(lines,
    /grand total|total amount|amount due|balance due|total payable|net payable|total\s*\(?incl|total\s*aed|^total\b/i,
    /sub\s*-?\s*total|excl|before vat|without vat/i);
  let total = totals.length ? Math.max(...totals) : undefined;

  const taxes = amountsFor(lines, /\bvat\b|\btax\b/i, /invoice|trn|registration|number|total|excl|incl/i)
    .filter((v) => total === undefined || v < total);
  let tax = taxes.length ? taxes[taxes.length - 1] : undefined;

  const subtotals = amountsFor(lines,
    /sub\s*-?\s*total|net amount|taxable amount|amount before vat|total\s*\(?excl|total before vat/i);
  let subtotal = subtotals.length ? subtotals[subtotals.length - 1] : undefined;

  // Fill gaps so subtotal + VAT = total
  if (total !== undefined && tax !== undefined && subtotal === undefined) subtotal = round(total - tax);
  if (total !== undefined && subtotal !== undefined && tax === undefined) tax = round(total - subtotal);
  if (total === undefined && subtotal !== undefined) total = round(subtotal + (tax ?? 0));
  if (total !== undefined && subtotal === undefined) { subtotal = total; tax = tax ?? 0; }

  const found = [supplier, invoiceNumber, date, total, tax].filter((v) => v !== undefined).length;
  return { supplier, invoiceNumber, date, subtotal, tax, total, found };
}