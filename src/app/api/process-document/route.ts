import { extractTextFromPDF } from "@/ai/processing/extractText";
import { analyzeDocument } from "@/ai/services/groq";
import type { ProcessDocumentResponse } from "@/ai/types/api";

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
    const text = await extractTextFromPDF(buffer);

    const cleanedText = text.trim();

if (!cleanedText || cleanedText.length < 30) {
  return Response.json(
    {
      success: false,
      error:
        "This PDF appears to be scanned or contains too little readable text.",
      code: "OCR_REQUIRED",
    },
    { status: 400 }
  );
}

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