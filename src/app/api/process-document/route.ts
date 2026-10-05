import { extractTextFromPDF } from "@/ai/processing/extractText";
import { analyzeDocument } from "@/ai/services/groq";
import type { ProcessDocumentResponse } from "@/ai/types/api";
import { extractTextWithSarvam } from "@/ai/processing/sarvamVision";
import { extractTextWithTesseract } from "@/ai/processing/tesseractOcr";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return Response.json(
        {
          success: false,
          error: "No PDF file provided",
        },
        { status: 400 }
      );
    }

    if (file.type !== "application/pdf") {
      return Response.json(
        {
          success: false,
          error: "Only PDF files are allowed",
        },
        { status: 400 }
      );
    }
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

if (file.size > MAX_FILE_SIZE) {
  return Response.json(
    {
      success: false,
      error: "PDF file is too large. Maximum size is 10 MB.",
    },
    { status: 400 }
  );
}

    // Convert uploaded PDF to Buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Extract text from PDF
    let text = await extractTextFromPDF(buffer);


const cleanedText = text
  .replace(/--\s*\d+\s+of\s+\d+\s*--/gi, "")
  .trim();

if (cleanedText.length < 30) {
  console.log("No meaningful PDF text found. Starting Sarvam OCR...");

  try {
    text = await extractTextWithSarvam(buffer, file.name);

    if (!text || text.trim().length < 30) {
      throw new Error("Sarvam returned insufficient text");
    }

    console.log("Sarvam OCR succeeded.");
  } catch (sarvamError) {
    console.error(
      "Sarvam OCR failed. Falling back to Tesseract...",
      sarvamError
    );

    try {
      text = await extractTextWithTesseract(buffer);

      if (!text || text.trim().length < 30) {
        return Response.json(
          {
            success: false,
            error: "Could not extract enough text from this PDF.",
            code: "OCR_FAILED",
          },
          { status: 422 }
        );
      }

      console.log("Tesseract OCR succeeded.");
    } catch (tesseractError) {
      console.error("Tesseract OCR also failed:", tesseractError);

      return Response.json(
        {
          success: false,
          error: "Could not extract text from this scanned PDF.",
          code: "OCR_FAILED",
        },
        { status: 422 }
      );
    }
  }
}
console.log("FINAL TEXT LENGTH:", text.length);
console.log("FINAL TEXT PREVIEW:", text.slice(0, 500));

    // Analyze extracted text using Groq
    const analysis = await analyzeDocument(text);

   const response: ProcessDocumentResponse = {
  success: true,
  filename: file.name,
  analysis,
};

return Response.json(response);
  } catch (error) {
    console.error("Document processing error:", error);

    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}