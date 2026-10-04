import { analyzeDocument } from "@/ai/services/groq";

export async function GET() {
  try {
    const result = await analyzeDocument(
      "All students must submit the Engineering Project Report by 15 October 2026. The project viva will be held on 20 October 2026 at 10 AM in Lab 3."
    );

    return Response.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error(error);

    return Response.json(
      {
        success: false,
        error: "AI processing failed",
      },
      { status: 500 }
    );
  }
}