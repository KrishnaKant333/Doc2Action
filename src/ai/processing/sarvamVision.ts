import { SarvamAIClient } from "sarvamai";
import JSZip from "jszip";

const sarvam = new SarvamAIClient({
  apiSubscriptionKey: process.env.SARVAM_API_KEY,
});

export async function extractTextWithSarvam(
  fileBuffer: Buffer,
  filename: string
): Promise<string> {
  const job = await sarvam.docAi.digitise({
    file: [
      {
        data: new Uint8Array(fileBuffer),
        filename,
        contentType: "application/pdf",
      },
    ],
    language: "en-IN",
    output_format: "md",
  });

  console.log("Sarvam job:", job);

  const terminalStates = new Set([
    "completed",
    "partially_completed",
    "failed",
    "rejected",
  ]);

  let status = await sarvam.docAi.getStatus(job.job_id);

  while (!terminalStates.has(status.status.toLowerCase())) {
    await new Promise((resolve) => setTimeout(resolve, 3000));
    status = await sarvam.docAi.getStatus(job.job_id);
  }

  console.log("Sarvam final status:", status.status);

  if (
    status.status.toLowerCase() !== "completed" &&
    status.status.toLowerCase() !== "partially_completed"
  ) {
    throw new Error(`Sarvam OCR failed: ${status.status}`);
  }

  // Get the download URL for the generated Markdown output
  const download = await sarvam.docAi.getDownloadUrl(job.job_id);

  console.log("Sarvam download URL received");

  const response = await fetch(download.url);

  if (!response.ok) {
    throw new Error(
      `Failed to download Sarvam OCR result: ${response.status}`
    );
  }

  const zipBuffer = Buffer.from(await response.arrayBuffer());

  const zip = await JSZip.loadAsync(zipBuffer);

  // Find the generated Markdown file
  const markdownFile = Object.keys(zip.files).find(
    (name) => name.toLowerCase().endsWith(".md")
  );

  if (!markdownFile) {
    throw new Error("Sarvam OCR result did not contain a Markdown file.");
  }

  const text = await zip.files[markdownFile].async("string");

// Remove huge embedded base64 images from Sarvam Markdown.
// Keep the image alt text, e.g. ![Image](data:...) -> Image
const cleanedText = text
  .replace(
    /!\[([^\]]*)\]\(data:image\/[^;]+;base64,[^)]+\)/g,
    "$1"
  )
  .replace(
    /data:image\/[a-zA-Z0-9.+-]+;base64,[A-Za-z0-9+/=]+/g,
    ""
  )
  .replace(/\n{3,}/g, "\n\n")
  .trim();

console.log(
  "Sarvam original text length:",
  text.length
);

console.log(
  "Sarvam cleaned text length:",
  cleanedText.length
);

console.log(
  "Sarvam cleaned text preview:",
  cleanedText.slice(0, 1000)
);

if (cleanedText.length < 30) {
  throw new Error("Sarvam returned no usable document text.");
}

return cleanedText;
  console.log(
    "Sarvam extracted text preview:",
    text.slice(0, 1000)
  );

  if (!text || text.trim().length < 30) {
    throw new Error("Sarvam returned no usable document text.");
  }

  return text.trim();
}