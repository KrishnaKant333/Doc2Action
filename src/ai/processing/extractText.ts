import "pdf-parse/worker";
import { PDFParse } from "pdf-parse";

export async function extractTextFromPDF(
  fileBuffer: Buffer
): Promise<string> {
  const parser = new PDFParse({
    data: fileBuffer,
  });

  try {
    const result = await parser.getText();
    return result.text;
  } finally {
    await parser.destroy();
  }
}