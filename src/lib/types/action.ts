/**
 * Domain types for Document -> Action Automator
 * Aligned with specs/04-DATA_MODEL.md
 */

// Confirmed: Urgency / Priority of an action item
export type Priority = "high" | "medium" | "low";

// Confirmed: Common categories for extracted actions
export type Category =
  | "academic"
  | "administrative"
  | "finance"
  | "event"
  | "general";

// Confirmed: Workflow status of an individual action item
export type ActionStatus = "pending" | "in_progress" | "completed";

// Confirmed: State progression for document processing
export type ProcessingStatus =
  | "idle"
  | "uploading"
  | "extracting"
  | "analyzing"
  | "generating_actions"
  | "complete"
  | "error";

// Confirmed: Document metadata
export interface DocumentMetadata {
  id: string;
  name: string;
  sizeBytes: number;
  mimeType: string;
  uploadedAt: string;
  pageCount?: number;
  rawText?: string;
}

// Confirmed: Action item extracted from document
export interface ActionItem {
  id: string;
  title: string;
  description: string;
  deadline: string | null;
  priority: Priority;
  category: Category;
  status: ActionStatus;
  sourceSnippet?: string;
  sourceDocument?: string;
}

// Confirmed: Specific deadline entry
export interface Deadline {
  id: string;
  title: string;
  dueDate: string;
  isStrict?: boolean;
}

// Confirmed: Event entry
export interface Event {
  id: string;
  title: string;
  date: string;
  location?: string;
}

// Confirmed: High-level metric summary for dashboard
export interface AnalysisMetrics {
  totalActions: number;
  totalDeadlines: number;
  totalEvents: number;
  highPriorityCount: number;
}

// Confirmed: Complete structured analysis result
export interface AnalysisResult {
  document: DocumentMetadata;
  documents?: DocumentMetadata[];
  metrics: AnalysisMetrics;
  actions: ActionItem[];
  deadlines: Deadline[];
  events: Event[];
  importantNotes: string[];
  processingDurationMs?: number;
  modelMetadata?: {
    modelName?: string;
    confidenceScore?: number;
  };
}

// Processing step descriptor for UI progress timelines
export interface ProcessingStepDescriptor {
  key: ProcessingStatus;
  label: string;
  description: string;
}
