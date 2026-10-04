import { extractTextFromPDF } from "@/ai/processing/extractText";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return Response.json(
        { success: false, error: "No PDF file provided" },
        { status: 400 }
      );
    }

    if (file.type !== "application/pdf") {
      return Response.json(
        { success: false, error: "Only PDF files are allowed" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const text = await extractTextFromPDF(buffer);

    return Response.json({
      success: true,
      filename: file.name,
      text,
      textLength: text.length,
    });
  } catch (error) {
    console.error(error);

    return Response.json(
  {
    success: false,
    error: error instanceof Error ? error.message : String(error),
  },
  { status: 500 }
);
  }
}