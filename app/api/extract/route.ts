import "server-only";

import OpenAI from "openai";

export const maxDuration = 30;

const MAX_FILE_SIZE = 4 * 1024 * 1024;
const CATEGORIES = [
  "fuel",
  "meals",
  "travel",
  "utilities",
  "telecom",
  "office",
  "cleaning",
  "repairs",
  "courier",
  "software",
  "rent",
  "government",
  "insurance",
  "professional",
  "bank",
  "other",
] as const;

type Extraction = {
  supplier: string;
  invoiceNumber: string;
  date: string;
  subtotal: number;
  tax: number;
  total: number;
  category: string;
  ledger: string;
  confidence: number;
};

function isExtraction(value: unknown, ledgerOptions: string[]): value is Extraction {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return typeof item.supplier === "string"
    && typeof item.invoiceNumber === "string"
    && typeof item.date === "string"
    && /^\d{4}-\d{2}-\d{2}$/.test(item.date)
    && typeof item.subtotal === "number"
    && Number.isFinite(item.subtotal)
    && typeof item.tax === "number"
    && Number.isFinite(item.tax)
    && typeof item.total === "number"
    && Number.isFinite(item.total)
    && typeof item.category === "string"
    && CATEGORIES.includes(item.category as (typeof CATEGORIES)[number])
    && typeof item.ledger === "string"
    && ledgerOptions.includes(item.ledger)
    && typeof item.confidence === "number"
    && Number.isInteger(item.confidence)
    && item.confidence >= 0
    && item.confidence <= 100;
}

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return Response.json({ error: "missing_api_key" }, { status: 503 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const rawLedgerOptions = formData.get("ledgerOptions");
    if (!(file instanceof File) || typeof rawLedgerOptions !== "string") {
      return Response.json({ error: "invalid_request" }, { status: 400 });
    }
    if (file.size > MAX_FILE_SIZE) {
      return Response.json({ error: "file_too_large" }, { status: 413 });
    }

    const parsedLedgerOptions: unknown = JSON.parse(rawLedgerOptions);
    const ledgerOptions = Array.isArray(parsedLedgerOptions)
      ? parsedLedgerOptions.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
      : [];
    if (ledgerOptions.length === 0) {
      return Response.json({ error: "invalid_ledger_options" }, { status: 400 });
    }

    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    const isImage = file.type.startsWith("image/");
    if (!isPdf && !isImage) {
      return Response.json({ error: "unsupported_file_type" }, { status: 415 });
    }

    const base64 = Buffer.from(await file.arrayBuffer()).toString("base64");
    const dataUrl = `data:${file.type || (isPdf ? "application/pdf" : "image/jpeg")};base64,${base64}`;
    const fileInput = isPdf
      ? { type: "input_file" as const, filename: file.name, file_data: dataUrl, detail: "low" as const }
      : { type: "input_image" as const, image_url: dataUrl, detail: "auto" as const };

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await client.responses.create({
      model: "gpt-6-luna",
      reasoning: { effort: "none" },
      input: [{
        role: "user",
        content: [
          fileInput,
          {
            type: "input_text",
            text: [
              "Extract the bookkeeping data from this document.",
              "Use YYYY-MM-DD for date and non-negative numbers for amounts.",
              "Choose the best expense category and exactly one supplied ledger.",
              "If a text identifier is absent, return an empty string. If an amount is absent, return 0.",
              `Allowed ledgers: ${ledgerOptions.join(", ")}`,
            ].join("\n"),
          },
        ],
      }],
      text: {
        format: {
          type: "json_schema",
          name: "bookkeeping_document_extraction",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              supplier: { type: "string" },
              invoiceNumber: { type: "string" },
              date: { type: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}$" },
              subtotal: { type: "number", minimum: 0 },
              tax: { type: "number", minimum: 0 },
              total: { type: "number", minimum: 0 },
              category: { type: "string", enum: CATEGORIES },
              ledger: { type: "string", enum: ledgerOptions },
              confidence: { type: "integer", minimum: 0, maximum: 100 },
            },
            required: ["supplier", "invoiceNumber", "date", "subtotal", "tax", "total", "category", "ledger", "confidence"],
          },
        },
      },
    });

    const extraction: unknown = JSON.parse(response.output_text);
    if (!isExtraction(extraction, ledgerOptions)) {
      return Response.json({ error: "invalid_ai_response" }, { status: 502 });
    }
    return Response.json({ source: "ai", ...extraction });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return Response.json({ error: "invalid_json" }, { status: 502 });
    }
    if (error instanceof OpenAI.APIError) {
      const status = error.status === 401 || error.status === 429 ? error.status : error.status >= 500 ? 502 : 500;
      return Response.json({ error: error.code ?? "openai_error" }, { status });
    }
    return Response.json({ error: "extraction_failed" }, { status: 500 });
  }
}
