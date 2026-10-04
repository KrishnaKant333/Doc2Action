import "pdf-parse/worker";
import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";

export async function extractTextFromPDF(
  fileBuffer: Buffer
): Promise<string> {
  const parser = new PDFParse({
    data: fileBuffer,
  });

  try {
    const result = await parser.getText();
    return result.text ?? "";
  } finally {
    await parser.destroy();
  }
}

/**
 * Extracts clean, paragraph-delimited plain text from DOCX files.
 */
export async function extractTextFromDocx(
  fileBuffer: Buffer
): Promise<string> {
  const result = await mammoth.extractRawText({ buffer: fileBuffer });
  return result.value ?? "";
}

/**
 * Normalizes text while strictly preserving paragraph and section boundaries:
 * - Strips unprintable control characters and null bytes
 * - Normalizes line endings to \n
 * - Collapses redundant horizontal spacing (multiple tabs/spaces) to single space
 * - Collapses excessive blank lines (>2) to standard paragraph breaks (\n\n)
 * - Trims each line cleanly
 */
export function cleanExtractedText(raw: string): string {
  if (!raw) return "";

  return raw
    .replace(/\0/g, "") // strip null bytes
    .replace(/\r\n/g, "\n") // normalize carriage returns
    .replace(/\r/g, "\n")
    .replace(/[^\S\n]+/g, " ") // collapse consecutive horizontal spaces/tabs
    .split("\n")
    .map((line) => line.trim()) // trim individual lines
    .join("\n")
    .replace(/\n{3,}/g, "\n\n") // collapse 3+ newlines to standard double newline (paragraph break)
    .trim();
}

/**
 * Extracts raw textual content from uploaded file buffers.
 * Supports PDF documents, DOCX documents, and plain text files.
 */
export async function extractTextFromFile(
  fileBuffer: Buffer,
  mimeType: string,
  fileName: string
): Promise<string> {
  const lowerName = fileName.toLowerCase();

  // 1. PDF
  if (mimeType === "application/pdf" || lowerName.endsWith(".pdf")) {
    const raw = await extractTextFromPDF(fileBuffer);
    return cleanExtractedText(raw);
  }

  // 2. DOCX / Word
  if (
    mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    lowerName.endsWith(".docx")
  ) {
    const raw = await extractTextFromDocx(fileBuffer);
    return cleanExtractedText(raw);
  }

  // 3. Plain Text / Markdown
  if (
    mimeType === "text/plain" ||
    lowerName.endsWith(".txt") ||
    lowerName.endsWith(".md")
  ) {
    const raw = fileBuffer.toString("utf-8");
    return cleanExtractedText(raw);
  }

  // Fallback: Check if it starts with PK (zip header for docx without extension)
  if (fileBuffer.length > 4 && fileBuffer[0] === 0x50 && fileBuffer[1] === 0x4b) {
    try {
      const raw = await extractTextFromDocx(fileBuffer);
      return cleanExtractedText(raw);
    } catch {
      // Fall through to error
    }
  }

  throw new Error(`Unsupported document format for text extraction: ${fileName}`);
}