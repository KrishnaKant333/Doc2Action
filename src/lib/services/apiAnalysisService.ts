import { AnalysisResult, ActionItem } from "../types/action";
import {
  simulateDocumentAnalysis,
  ProgressUpdate,
} from "./mockAnalysisService";

export interface AnalyzeResponsePayload {
  result: AnalysisResult;
  persisted: boolean;
  warning?: string;
}

export interface RecentDocumentItem {
  id: string;
  name: string;
  sizeBytes: number;
  mimeType: string;
  uploadedAt: string;
  actionCount: number;
  deadlineCount: number;
  eventCount: number;
}

export interface MyActionsGrouped {
  metrics: {
    total: number;
    pending: number;
    completed: number;
    overdue: number;
    dueSoon: number;
  };
  groups: {
    overdue: ActionItem[];
    dueSoon: ActionItem[];
    upcoming: ActionItem[];
    completed: ActionItem[];
  };
}

/**
 * Uploads documents to the Next.js API route /api/analyze with real-time simulated progress steps.
 * Falls back to local simulation if offline or explicitly configured.
 */
export async function analyzeDocuments(
  files: File[],
  onProgress?: (update: ProgressUpdate) => void,
  signal?: AbortSignal
): Promise<AnalyzeResponsePayload> {
  // Check if explicit mock mode is requested
  const forceMock = process.env.NEXT_PUBLIC_USE_MOCK === "true";

  if (forceMock) {
    const mockResult = await simulateDocumentAnalysis(
      files.map((f) => ({ name: f.name, sizeBytes: f.size, mimeType: f.type })),
      onProgress,
      600,
      signal
    );
    return {
      result: mockResult,
      persisted: false,
      warning: "Running in mock simulation mode.",
    };
  }

  // Initial stage: Uploading / Request Preparation
  if (onProgress) {
    onProgress({
      status: "uploading",
      stepIndex: 1,
      totalSteps: 4,
      progressPercent: 12,
      message:
        files.length > 1
          ? `Preparing and uploading ${files.length} documents...`
          : "Preparing document for analysis...",
    });
  }

  const startTime = Date.now();
  let currentStage: "uploading" | "extracting" | "analyzing" | "generating_actions" = "uploading";

  // Dynamic lifecycle-driven progress tracker
  const intervalId = setInterval(() => {
    const elapsed = Date.now() - startTime;

    if (elapsed > 800 && currentStage === "uploading") {
      currentStage = "extracting";
      if (onProgress) {
        onProgress({
          status: "extracting",
          stepIndex: 2,
          totalSteps: 4,
          progressPercent: 28,
          message:
            files.length > 1
              ? `Extracting text and tables from ${files.length} documents...`
              : "Extracting readable text and document sections...",
        });
      }
    } else if (elapsed > 2800 && currentStage === "extracting") {
      currentStage = "analyzing";
      if (onProgress) {
        onProgress({
          status: "analyzing",
          stepIndex: 3,
          totalSteps: 4,
          progressPercent: 42,
          message: "Analyzing directives, deadlines, and obligations with AI...",
        });
      }
    } else if (currentStage === "analyzing") {
      // Smooth asymptotic easing from 42% towards 82% over the duration of AI processing
      const progressBonus = Math.min(
        40,
        Math.round(40 * (1 - Math.exp(-(elapsed - 2800) / 45000)))
      );
      const dynamicPercent = 42 + progressBonus;

      // Honest, contextual progress messaging based on elapsed duration
      let activeMessage = "Analyzing directives, deadlines, and obligations with AI...";
      if (elapsed > 45000) {
        activeMessage = "Pacing analysis between document sections to respect service limits...";
      } else if (elapsed > 18000) {
        activeMessage = "Evaluating document sections, policies, and requirements...";
      }

      if (onProgress) {
        onProgress({
          status: "analyzing",
          stepIndex: 3,
          totalSteps: 4,
          progressPercent: dynamicPercent,
          message: activeMessage,
        });
      }
    }
  }, 1000);

  try {
    const formData = new FormData();
    for (const file of files) {
      formData.append("files", file);
    }

    const response = await fetch("/api/analyze", {
      method: "POST",
      body: formData,
      signal,
    });

    clearInterval(intervalId);

    const json = await response.json();

    if (!response.ok || !json.success) {
      throw new Error(
        json.error || `Server responded with status ${response.status}`
      );
    }

    // Stage 4: Generating Actions (Actual post-fetch restructuring)
    if (onProgress) {
      onProgress({
        status: "generating_actions",
        stepIndex: 4,
        totalSteps: 4,
        progressPercent: 90,
        message: "Structuring extracted actions, deadlines, and important notes...",
      });
    }

    // Brief visual confirmation before 100% complete
    await new Promise((resolve) => setTimeout(resolve, 400));

    if (onProgress) {
      onProgress({
        status: "complete",
        stepIndex: 4,
        totalSteps: 4,
        progressPercent: 100,
        message: "Analysis complete!",
      });
    }

    return {
      result: json.data as AnalysisResult,
      persisted: Boolean(json.persisted),
      warning: json.warning,
    };
  } catch (error: unknown) {
    clearInterval(intervalId);

    if (signal?.aborted) {
      throw new Error("Analysis was cancelled by the user.");
    }

    const errMessage = error instanceof Error ? error.message : "Failed to analyze document.";
    throw new Error(errMessage);
  }
}

/**
 * Fetches recent documents for the active workspace.
 */
export async function fetchRecentDocuments(): Promise<RecentDocumentItem[]> {
  try {
    const res = await fetch("/api/history");
    if (!res.ok) return [];
    const json = await res.json();
    return json.documents ?? [];
  } catch (error) {
    console.error("Failed to load history:", error);
    return [];
  }
}

/**
 * Fetches a single document's analysis result by ID.
 */
export async function fetchDocumentById(id: string): Promise<AnalysisResult | null> {
  try {
    const res = await fetch(`/api/documents/${id}`);
    if (!res.ok) return null;
    const json = await res.json();
    return json.data ?? null;
  } catch (error) {
    console.error("Failed to load document details:", error);
    return null;
  }
}

/**
 * Fetches all actions grouped across documents for My Actions view.
 */
export async function fetchMyActions(): Promise<MyActionsGrouped | null> {
  try {
    const res = await fetch("/api/actions");
    if (!res.ok) return null;
    const json = await res.json();
    return {
      metrics: json.metrics,
      groups: json.groups,
    };
  } catch (error) {
    console.error("Failed to fetch my actions:", error);
    return null;
  }
}

/**
 * Updates an action item's status.
 */
export async function updateActionStatus(
  id: string,
  status: "pending" | "completed"
): Promise<boolean> {
  try {
    const res = await fetch(`/api/actions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    return res.ok;
  } catch (error) {
    console.error("Failed to update action:", error);
    return false;
  }
}

/**
 * Bulk updates action items' status.
 */
export async function bulkUpdateActionStatus(
  ids: string[],
  status: "pending" | "completed",
  all = false
): Promise<boolean> {
  try {
    const res = await fetch("/api/actions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids, status, all }),
    });
    return res.ok;
  } catch (error) {
    console.error("Failed to bulk update actions:", error);
    return false;
  }
}

/**
 * Bulk deletes action items.
 */
export async function bulkDeleteActions(
  ids: string[],
  all = false
): Promise<boolean> {
  try {
    const res = await fetch("/api/actions", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids, all }),
    });
    return res.ok;
  } catch (error) {
    console.error("Failed to bulk delete actions:", error);
    return false;
  }
}

