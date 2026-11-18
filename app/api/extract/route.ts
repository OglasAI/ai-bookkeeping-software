import "server-only";

import OpenAI from "openai";

export const maxDuration = 30;

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const DOCUMENT_TYPES = ["Sales invoice", "Purchase invoice", "Expense receipt", "Payment received", "Payment made", "Credit note", "Other"] as const;
const VAT_TREATMENTS = ["Standard 5%", "Zero-rated", "Exempt", "Out of scope", "Reverse charge"] as const;
const VAT_TYPES = ["INPUT", "OUTPUT", "NONE"] as const;

type AiExtraction = {
  documentType: (typeof DOCUMENT_TYPES)[number]; counterparty: string; counterpartyTrn: string; invoiceNumber: string;
  date: string; dueDate: string; subtotal: number; vat: number; total: number;
  vatTreatment: (typeof VAT_TREATMENTS)[number]; suggestedLedger: string; transactionType: string; explanation: string; confidence: number;
  journal: Array<{ account: string; debit: number; credit: number; vatType: (typeof VAT_TYPES)[number]; vatRecoverable: boolean }>;
};

function isAiExtraction(value: unknown, ledgers: string[]): value is AiExtraction {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<AiExtraction>;
  return DOCUMENT_TYPES.includes(item.documentType as (typeof DOCUMENT_TYPES)[number])
    && typeof item.counterparty === "string" && typeof item.counterpartyTrn === "string" && typeof item.invoiceNumber === "string"
    && typeof item.date === "string" && typeof item.dueDate === "string" && typeof item.subtotal === "number" && typeof item.vat === "number" && typeof item.total === "number"
    && VAT_TREATMENTS.includes(item.vatTreatment as (typeof VAT_TREATMENTS)[number]) && typeof item.suggestedLedger === "string" && ledgers.includes(item.suggestedLedger)
    && typeof item.transactionType === "string" && typeof item.explanation === "string" && typeof item.confidence === "number" && Array.isArray(item.journal)
    && item.journal.every((line) => typeof line.account === "string" && typeof line.debit === "number" && typeof line.credit === "number" && VAT_TYPES.includes(line.vatType) && typeof line.vatRecoverable === "boolean");
}

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) return Response.json({ error: "missing_api_key" }, { status: 503 });
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const rawLedgers = formData.get("ledgerOptions");
    if (!(file instanceof File) || typeof rawLedgers !== "string") return Response.json({ error: "invalid_request" }, { status: 400 });
    if (file.size > MAX_FILE_SIZE) return Response.json({ error: "file_too_large" }, { status: 413 });
    if (!["application/pdf", "image/jpeg", "image/png"].includes(file.type)) return Response.json({ error: "unsupported_file_type" }, { status: 415 });

    const parsed: unknown = JSON.parse(rawLedgers);
    const ledgers = Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === "string") : [];
    if (!ledgers.length) return Response.json({ error: "invalid_ledger_options" }, { status: 400 });

    const dataUrl = `data:${file.type};base64,${Buffer.from(await file.arrayBuffer()).toString("base64")}`;
    const source = file.type === "application/pdf"
      ? { type: "input_file" as const, filename: file.name, file_data: dataUrl }
      : { type: "input_image" as const, image_url: dataUrl, detail: "auto" as const };
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await openai.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      input: [{ role: "user", content: [source, { type: "input_text", text: [
        "Read this UAE bookkeeping document and propose a balanced double-entry journal in AED.",
        "UAE standard VAT is 5%. Purchases debit an expense/asset and Input VAT, then credit bank/cash/payables. Sales debit bank/receivables and credit revenue plus Output VAT. Reverse charge must include both Input VAT and Output VAT.",
        "Use empty strings for missing text or dates and zero for missing amounts. The explanation must be one or two plain-English sentences for an accountant.",
        `The suggested ledger must be exactly one of: ${ledgers.join(", ")}`,
      ].join("\n") }] }],
      text: { format: { type: "json_schema", name: "ledgerly_document_extraction", strict: true, schema: {
        type: "object", additionalProperties: false,
        properties: {
          documentType: { type: "string", enum: DOCUMENT_TYPES }, counterparty: { type: "string" }, counterpartyTrn: { type: "string" }, invoiceNumber: { type: "string" }, date: { type: "string" }, dueDate: { type: "string" },
          subtotal: { type: "number", minimum: 0 }, vat: { type: "number", minimum: 0 }, total: { type: "number", minimum: 0 }, vatTreatment: { type: "string", enum: VAT_TREATMENTS }, suggestedLedger: { type: "string", enum: ledgers },
          transactionType: { type: "string" }, explanation: { type: "string" }, confidence: { type: "number", minimum: 0, maximum: 100 },
          journal: { type: "array", minItems: 2, items: { type: "object", additionalProperties: false, properties: { account: { type: "string" }, debit: { type: "number", minimum: 0 }, credit: { type: "number", minimum: 0 }, vatType: { type: "string", enum: VAT_TYPES }, vatRecoverable: { type: "boolean" } }, required: ["account", "debit", "credit", "vatType", "vatRecoverable"] } },
        },
        required: ["documentType", "counterparty", "counterpartyTrn", "invoiceNumber", "date", "dueDate", "subtotal", "vat", "total", "vatTreatment", "suggestedLedger", "transactionType", "explanation", "confidence", "journal"],
      } } },
    });

    const extraction: unknown = JSON.parse(response.output_text);
    if (!isAiExtraction(extraction, ledgers)) return Response.json({ error: "invalid_ai_response" }, { status: 502 });
    const debit = extraction.journal.reduce((sum, line) => sum + line.debit, 0);
    const credit = extraction.journal.reduce((sum, line) => sum + line.credit, 0);
    const balanced = Math.abs(debit - credit) < 0.01;
    return Response.json({
      source: "ai", category: extraction.transactionType, ledger: extraction.suggestedLedger,
      fields: { supplier: extraction.counterparty, counterpartyTrn: extraction.counterpartyTrn, invoiceNumber: extraction.invoiceNumber, date: extraction.date, dueDate: extraction.dueDate, currency: "AED", subtotal: extraction.subtotal, tax: extraction.vat, total: extraction.total, documentType: extraction.documentType, confidence: balanced ? Math.round(extraction.confidence) : Math.min(40, Math.round(extraction.confidence)) },
      journal: extraction.journal.map((line, index) => ({ id: `ai-line-${index + 1}`, ...line })), vatTreatment: extraction.vatTreatment,
      transactionType: extraction.transactionType, explanation: extraction.explanation, warnings: balanced ? [] : ["AI proposal was out of balance and requires accountant correction."],
    });
  } catch (error) {
    if (error instanceof OpenAI.APIError) return Response.json({ error: error.code ?? "openai_error" }, { status: error.status === 429 ? 429 : 502 });
    return Response.json({ error: "extraction_failed" }, { status: 500 });
  }
}
