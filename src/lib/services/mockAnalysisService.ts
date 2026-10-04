/**
 * Simple mock analysis service
 * Simulates multi-step document processing without network overhead or backend coupling.
 * Designed to be swapped with ApiDocumentAnalysisService in Phase 6.
 */

import {
  AnalysisResult,
  ProcessingStatus,
  ProcessingStepDescriptor,
  ActionItem,
  Deadline,
  Event,
} from "../types/action";
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

export type FileInputInfo = { name: string; sizeBytes: number; mimeType?: string };

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Simulates document analysis through the 4 core stages with timed progress callbacks.
 * Supports single file or multi-document batch analysis.
 */
export async function simulateDocumentAnalysis(
  fileOrFiles: FileInputInfo | FileInputInfo[],
  onProgress?: (update: ProgressUpdate) => void,
  stepDelayMs = 600,
  signal?: AbortSignal
): Promise<AnalysisResult> {
  const files: FileInputInfo[] = Array.isArray(fileOrFiles) ? fileOrFiles : [fileOrFiles];
  const fileCount = files.length;
  const isBatch = fileCount > 1;

  const steps: { status: ProcessingStatus; message: string; percent: number }[] = [
    {
      status: "uploading",
      message: isBatch
        ? `Uploading ${fileCount} documents to workspace...`
        : `Uploading document to workspace...`,
      percent: 25,
    },
    {
      status: "extracting",
      message: isBatch
        ? `Extracting text and tables from ${fileCount} documents...`
        : `Extracting text and tables...`,
      percent: 50,
    },
    {
      status: "analyzing",
      message: isBatch
        ? `Analyzing tasks, deadlines, and urgency across ${fileCount} documents...`
        : `Analyzing tasks, deadlines, and urgency...`,
      percent: 75,
    },
    {
      status: "generating_actions",
      message: isBatch
        ? `Structuring unified action items and metrics...`
        : `Structuring action items and metrics...`,
      percent: 95,
    },
  ];

  // Simulated error testing trigger (e.g., file with "corrupt" or "fail" in name)
  const corruptFile = files.find(
    (f) => f.name.toLowerCase().includes("corrupt") || f.name.toLowerCase().includes("fail")
  );
  if (corruptFile) {
    await sleep(stepDelayMs);
    throw new Error(
      `We couldn't analyze "${corruptFile.name}". The file content could not be processed.`
    );
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

  // Predefined sample pool for varied extraction results
  const samplePool = [collegeNoticeResult, symposiumCircularResult, officeNoticeResult];

  const allActions: ActionItem[] = [];
  const allDeadlines: Deadline[] = [];
  const allEvents: Event[] = [];
  const allNotes: string[] = [];

  const documentsMeta = files.map((f, idx) => ({
    id: `doc-${Date.now()}-${idx + 1}`,
    name: f.name,
    sizeBytes: f.sizeBytes,
    mimeType: f.mimeType || "application/pdf",
    uploadedAt: new Date().toISOString(),
  }));

  files.forEach((file, idx) => {
    const lowerName = file.name.toLowerCase();
    let sample: AnalysisResult;

    if (lowerName.includes("symposium") || lowerName.includes("paper") || lowerName.includes("conference")) {
      sample = symposiumCircularResult;
    } else if (
      lowerName.includes("lease") ||
      lowerName.includes("bill") ||
      lowerName.includes("invoice") ||
      lowerName.includes("office") ||
      lowerName.includes("fee")
    ) {
      sample = officeNoticeResult;
    } else if (
      lowerName.includes("college") ||
      lowerName.includes("notice") ||
      lowerName.includes("exam") ||
      lowerName.includes("project")
    ) {
      sample = collegeNoticeResult;
    } else {
      // Rotate through sample pool for variety
      sample = samplePool[idx % samplePool.length];
    }

    // Support test variations based on filename (e.g. document without deadlines, without events, or unassigned source)
    const isNoDeadlines =
      lowerName.includes("no-deadline") ||
      lowerName.includes("no_deadline") ||
      lowerName.includes("nodeadline");
    const isNoEvents =
      lowerName.includes("no-event") ||
      lowerName.includes("no_event") ||
      lowerName.includes("noevent");
    const isUnassignedSource =
      lowerName.includes("unassigned") ||
      lowerName.includes("no-source") ||
      lowerName.includes("missing-source");

    const sourceDoc = isUnassignedSource ? undefined : file.name;

    // Attach source document filename and unique IDs to actions
    const fileActions = sample.actions.map((act, actIdx) => ({
      ...act,
      id: `act-${idx + 1}-${actIdx + 1}-${act.id}`,
      sourceDocument: sourceDoc,
    }));
    allActions.push(...fileActions);

    // Attach deadlines (unless document specifically has no deadlines for testing)
    if (!isNoDeadlines) {
      const fileDeadlines = sample.deadlines.map((dl, dlIdx) => ({
        ...dl,
        id: `dl-${idx + 1}-${dlIdx + 1}-${dl.id}`,
        sourceDocument: sourceDoc,
      }));
      allDeadlines.push(...fileDeadlines);
    }

    // Attach events (unless document specifically has no events for testing)
    if (!isNoEvents) {
      const fileEvents = sample.events.map((ev, evIdx) => ({
        ...ev,
        id: `ev-${idx + 1}-${evIdx + 1}-${ev.id}`,
        sourceDocument: sourceDoc,
      }));
      allEvents.push(...fileEvents);
    }

    allNotes.push(...sample.importantNotes);
  });

  const totalSize = files.reduce((acc, f) => acc + f.sizeBytes, 0);

  const primaryDocument =
    files.length === 1
      ? documentsMeta[0]
      : {
          id: `batch-${Date.now()}`,
          name: `${fileCount} Documents`,
          sizeBytes: totalSize,
          mimeType: "multipart/batch",
          uploadedAt: new Date().toISOString(),
        };

  // Final complete callback
  if (onProgress) {
    onProgress({
      status: "complete",
      stepIndex: steps.length,
      totalSteps: steps.length,
      progressPercent: 100,
      message: isBatch ? `Analysis of ${fileCount} documents complete!` : "Analysis complete!",
    });
  }

  return {
    document: primaryDocument,
    documents: documentsMeta,
    metrics: {
      totalActions: allActions.length,
      totalDeadlines: allDeadlines.length,
      totalEvents: allEvents.length,
      highPriorityCount: allActions.filter((a) => a.priority === "high").length,
    },
    actions: allActions,
    deadlines: allDeadlines,
    events: allEvents,
    importantNotes: Array.from(new Set(allNotes)),
    processingDurationMs: 1100 + fileCount * 250,
  };
}
