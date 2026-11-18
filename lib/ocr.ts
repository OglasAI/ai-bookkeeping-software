// Reads text from an uploaded file entirely in the browser. Nothing is sent to a server.
type Progress = (message: string) => void;

async function ocrImage(image: Blob | HTMLCanvasElement, onProgress?: Progress) {
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("eng", 1, {
    logger: (m) => {
      if (m.status === "recognizing text") onProgress?.(`Reading text… ${Math.round(m.progress * 100)}%`);
    },
  });
  try {
    const { data } = await worker.recognize(image);
    return data.text;
  } finally {
    await worker.terminate();
  }
}

async function readPdf(file: File, onProgress?: Progress) {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;

  // 1) Digital PDF: take the text directly (first 3 pages)
  let text = "";
  for (let n = 1; n <= Math.min(pdf.numPages, 3); n++) {
    const page = await pdf.getPage(n);
    const content = await page.getTextContent();
    text += content.items.map((item) => ("str" in item ? item.str + (item.hasEOL ? "\n" : " ") : "")).join("") + "\n";
  }
  if (text.replace(/\s/g, "").length > 40) return text;

  // 2) Scanned PDF: turn page 1 into an image and OCR it
  onProgress?.("Scanned PDF detected, running OCR…");
  const page = await pdf.getPage(1);
  const viewport = page.getViewport({ scale: 2.5 });
  const canvas = document.createElement("canvas");
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  await page.render({ canvasContext: canvas.getContext("2d")!, viewport }).promise;
  return ocrImage(canvas, onProgress);
}

export async function readDocumentText(file: File, onProgress?: Progress): Promise<string> {
  const name = file.name.toLowerCase();
  if (file.type === "application/pdf" || name.endsWith(".pdf")) return readPdf(file, onProgress);
  if (file.type.startsWith("image/")) return ocrImage(file, onProgress);
  if (name.endsWith(".csv")) return file.text();
  return "";
}