export type PriorityLevel = "high" | "medium" | "low";

export type CategoryType =
  | "academic"
  | "administrative"
  | "finance"
  | "event"
  | "general";

export interface ExtractedAction {
  title: string;
  description: string;
  deadline: string | null;
  priority: PriorityLevel;
  category: CategoryType;
  source_snippet: string | null;
}

export interface ExtractedDeadline {
  title: string;
  due_date: string;
  is_strict: boolean;
}

export interface ExtractedEvent {
  title: string;
  date: string | null;
  location: string | null;
}

export interface DocumentAnalysis {
  actions: ExtractedAction[];
  deadlines: ExtractedDeadline[];
  events: ExtractedEvent[];
  important_notes: string[];
}