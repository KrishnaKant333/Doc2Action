export interface ActionItem {
  task: string;
  deadline: string | null;
}

export interface Deadline {
  date: string;
  description: string;
}

export interface EventItem {
  name: string;
  date: string | null;
  time: string | null;
  location: string | null;
}

export interface DocumentAnalysis {
  actionable_tasks: ActionItem[];
  deadlines: Deadline[];
  events: EventItem[];
  important_info: string[];
}