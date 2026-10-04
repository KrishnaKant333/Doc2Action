/**
 * Simple mock analysis service
 * Simulates multi-step document processing without network overhead or backend coupling.
 * Designed to be swapped with ApiDocumentAnalysisService in Phase 6.
 */

import { AnalysisResult, ProcessingStatus, ProcessingStepDescriptor } from "../types/action";
import { collegeNoticeResult, symposiumCircularResult, officeNoticeResult } from "../mock/sampleData";

export interface ProgressUpdate {
  status: ProcessingStatus;
  stepIndex: number;
  totalSteps: number;
  progressPercent: number;
  message: string;
}

export const PROCESSING_STEPS: ProcessingStepDescriptor[] = [
  {
    key: "uploading",
    label: "Uploading",
    description: "Reading file bytes and verifying file integrity",
  },
  {
    key: "extracting",
    label: "Extracting",
    description: "Extracting raw text and table data from document",
  },
  {
    key: "analyzing",
    label: "Analyzing",
    description: "Detecting dates, deadlines, obligations, and context",
  },
  {
    key: "generating_actions",
    label: "Generating Actions",
    description: "Structuring tasks, priority tags, and metric summaries",
  },
];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Simulates document analysis through the 4 core stages with timed progress callbacks
 */
export async function simulateDocumentAnalysis(
  fileInfo: { name: string; sizeBytes: number; mimeType?: string },
  onProgress?: (update: ProgressUpdate) => void,
  stepDelayMs = 600,
  signal?: AbortSignal
): Promise<AnalysisResult> {
  const steps: { status: ProcessingStatus; message: string; percent: number }[] = [
    { status: "uploading", message: "Uploading document to workspace...", percent: 25 },
    { status: "extracting", message: "Extracting text and tables...", percent: 50 },
    { status: "analyzing", message: "Analyzing tasks, deadlines, and urgency...", percent: 75 },
    { status: "generating_actions", message: "Structuring action items and metrics...", percent: 95 },
  ];

  // Simulated error testing trigger (e.g., file with "corrupt" or "fail" in name)
  const lowerName = fileInfo.name.toLowerCase();
  if (lowerName.includes("corrupt") || lowerName.includes("fail")) {
    await sleep(stepDelayMs);
    throw new Error("We couldn't analyze this document. The file content could not be processed.");
  }

  for (let i = 0; i < steps.length; i++) {
    if (signal?.aborted) {
      throw new Error("Analysis was cancelled by the user.");
    }

    const step = steps[i];
    if (onProgress) {
      onProgress({
        status: step.status,
        stepIndex: i + 1,
        totalSteps: steps.length,
        progressPercent: step.percent,
        message: step.message,
      });
    }
    await sleep(stepDelayMs);
  }

  if (signal?.aborted) {
    throw new Error("Analysis was cancelled by the user.");
  }

  // Pick matching sample result or fallback based on filename
  let baseResult: AnalysisResult;

  if (lowerName.includes("symposium") || lowerName.includes("paper") || lowerName.includes("conference")) {
    baseResult = symposiumCircularResult;
  } else if (lowerName.includes("lease") || lowerName.includes("bill") || lowerName.includes("invoice") || lowerName.includes("office")) {
    baseResult = officeNoticeResult;
  } else {
    // Default to college notice
    baseResult = collegeNoticeResult;
  }

  // Final complete callback
  if (onProgress) {
    onProgress({
      status: "complete",
      stepIndex: steps.length,
      totalSteps: steps.length,
      progressPercent: 100,
      message: "Analysis complete",
    });
  }

  // Return clean result customized with user's uploaded file info
  return {
    ...baseResult,
    document: {
      ...baseResult.document,
      id: `doc-${Date.now()}`,
      name: fileInfo.name,
      sizeBytes: fileInfo.sizeBytes,
      mimeType: fileInfo.mimeType || "application/pdf",
      uploadedAt: new Date().toISOString(),
    },
  };
}
