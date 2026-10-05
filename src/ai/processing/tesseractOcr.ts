import { PDFParse } from "pdf-parse";
import { createWorker } from "tesseract.js";
import path from "path";

export async function extractTextWithTesseract(
  fileBuffer: Buffer
): Promise<string> {
  const parser = new PDFParse({ data: fileBuffer });

  const workerPath = path.join(
    process.cwd(),
    "node_modules",
    "tesseract.js",
    "src",
    "worker-script",
    "node",
    "index.js"
  );

  const worker = await createWorker("eng", 1, {
    workerPath,
  });

  try {
    const screenshots = await parser.getScreenshot({
      desiredWidth: 1600,
      imageBuffer: true,
      imageDataUrl: false,
    });

    const pageTexts: string[] = [];

    for (const page of screenshots.pages) {
      if (!page.data) continue;

      console.log("Running Tesseract OCR on page...");

      const result = await worker.recognize(Buffer.from(page.data));

      pageTexts.push(result.data.text.trim());
    }

    return pageTexts
      .filter((text) => text.length > 0)
      .join("\n\n");
  } finally {
    await worker.terminate();
    await parser.destroy();
  }
}