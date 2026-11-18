// Detects what kind of expense a document is from its text (OCR output + file name).
export type ExpenseCategory = { id: string; label: string; keywords: string[]; ledgerHints: string[] };

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  { id: "fuel", label: "Fuel", ledgerHints: ["fuel", "motor", "vehicle", "travel"],
    keywords: ["adnoc", "enoc", "eppco", "emarat", "petrol", "diesel", "gasoline", "fuel", "unleaded", "super 98", "special 95", "e-plus 91", "litre", "litres", "ltr"] },
  { id: "meals", label: "Food & meals", ledgerHints: ["meal", "food", "entertainment", "staff welfare"],
    keywords: ["restaurant", "cafe", "café", "coffee", "talabat", "deliveroo", "noon food", "careem food", "zomato", "kitchen", "grill", "burger", "pizza", "shawarma", "bakery", "starbucks", "mcdonald", "kfc", "meal", "dine in", "takeaway", "catering", "food"] },
  { id: "travel", label: "Travel & transport", ledgerHints: ["travel", "transport"],
    keywords: ["emirates airline", "flydubai", "etihad", "air arabia", "airline", "flight", "boarding pass", "hotel", "booking.com", "airbnb", "careem", "uber", "taxi", "rta", "salik", "nol", "metro", "parking", "mawaqif", "car rental"] },
  { id: "utilities", label: "Utilities", ledgerHints: ["utilit", "electric"],
    keywords: ["dewa", "sewa", "addc", "aadc", "fewa", "electricity", "water bill", "empower", "district cooling"] },
  { id: "telecom", label: "Telephone & internet", ledgerHints: ["telephone", "internet", "telecom", "utilit"],
    keywords: ["etisalat", "e& ", "du.ae", "du telecom", "virgin mobile", "internet", "broadband", "postpaid", "mobile plan"] },
  { id: "office", label: "Office supplies", ledgerHints: ["office supplies", "stationery", "office"],
    keywords: ["stationery", "office supplies", "a4 paper", "toner", "ink cartridge", "printer paper", "pens", "folders", "staples", "office mart"] },
  { id: "cleaning", label: "Cleaning", ledgerHints: ["cleaning"],
    keywords: ["cleaning", "detergent", "janitorial", "sanitizer", "housekeeping", "pest control", "laundry"] },
  { id: "repairs", label: "Repairs & maintenance", ledgerHints: ["repair", "maintenance"],
    keywords: ["repair", "maintenance", "spare parts", "plumbing", "electrical works", "ac service", "a/c service", "air conditioning", "technician", "workshop", "tyre", "tyres", "oil change"] },
  { id: "courier", label: "Courier & postage", ledgerHints: ["courier", "postage", "delivery", "freight"],
    keywords: ["aramex", "dhl", "fedex", "ups", "emirates post", "smsa", "courier", "shipment", "waybill", "airway bill"] },
  { id: "software", label: "Software & subscriptions", ledgerHints: ["software", "subscription", "computer"],
    keywords: ["microsoft", "office 365", "google workspace", "adobe", "aws", "amazon web services", "zoom", "slack", "subscription", "licence key", "saas", "hosting", "domain", "godaddy"] },
  { id: "rent", label: "Rent", ledgerHints: ["rent", "lease"],
    keywords: ["rent", "lease", "tenancy", "ejari", "landlord"] },
  { id: "government", label: "Government fees", ledgerHints: ["government", "licen", "fees"],
    keywords: ["tasheel", "amer", "gdrfa", "mohre", "dubai economy", "ded", "visa fee", "emirates id", "trade license", "trade licence", "municipality", "traffic fine"] },
  { id: "insurance", label: "Insurance", ledgerHints: ["insurance"],
    keywords: ["insurance", "takaful", "policy premium", "premium"] },
  { id: "professional", label: "Professional fees", ledgerHints: ["professional", "consult", "legal"],
    keywords: ["audit fee", "legal fee", "consultancy", "consulting", "accounting services", "advocate", "lawyer"] },
  { id: "bank", label: "Bank charges", ledgerHints: ["bank charge", "bank"],
    keywords: ["bank charges", "service fee", "transfer fee", "remittance fee", "emirates nbd", "adcb", "mashreq"] },
];

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Returns the best-matching category and the words that matched, or null. */
export function detectExpenseCategory(text: string) {
  const haystack = ` ${text.toLowerCase()} `;
  let best: { category: ExpenseCategory; matches: string[] } | null = null;
  for (const category of EXPENSE_CATEGORIES) {
    const matches = category.keywords.filter((kw) => new RegExp(`(?:^|[^a-z0-9])${escape(kw.trim())}(?:[^a-z0-9]|$)`).test(haystack));
    if (matches.length && (!best || matches.length > best.matches.length)) best = { category, matches };
  }
  return best;
}

/** Picks the first ledger from the app's ledger list that fits the category. */
export function ledgerForCategory(category: ExpenseCategory, options: readonly string[]) {
  for (const hint of category.ledgerHints) {
    const found = options.find((option) => option.toLowerCase().includes(hint));
    if (found) return found;
  }
  return undefined;
}