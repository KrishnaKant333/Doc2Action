# Specification 04: Data Model

**Project:** Document → Action Automator  
**Status:** Approved Domain Model  

---

## 1. Overview

This document defines the core domain models and TypeScript interfaces used by the frontend and shared conceptually with the backend. Fields are kept minimal and directly relevant to the MVP workflow.

---

## 2. Core Enumerations & Types

```typescript
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
```

---

## 3. Domain Models

### Document (Metadata)
Represents the user-uploaded document.

| Field | Type | Requirement | Description |
|---|---|---|---|
| `id` | `string` | **Confirmed** | Unique identifier for the document |
| `name` | `string` | **Confirmed** | Original file name (e.g., `college_notice.pdf`) |
| `sizeBytes` | `number` | **Confirmed** | File size in bytes |
| `mimeType` | `string` | **Confirmed** | File MIME type (e.g., `application/pdf`) |
| `uploadedAt` | `string` | **Confirmed** | ISO timestamp of upload |
| `pageCount` | `number` | *TBD* | Number of pages (optional/TBD) |
| `rawText` | `string` | *TBD* | Extracted raw text content (optional/TBD) |

### ActionItem
Represents an individual task or requirement extracted from the document.

| Field | Type | Requirement | Description |
|---|---|---|---|
| `id` | `string` | **Confirmed** | Unique identifier for the action item |
| `title` | `string` | **Confirmed** | Concise action summary (e.g. "Submit project report") |
| `description` | `string` | **Confirmed** | Contextual detail or excerpt from document |
| `deadline` | `string \| null` | **Confirmed** | Formatted date/time string (e.g. "15 October 2026") |
| `priority` | `Priority` | **Confirmed** | Urgency level (`high`, `medium`, `low`) |
| `category` | `Category` | **Confirmed** | Categorical classification |
| `status` | `ActionStatus` | **Confirmed** | Task status (`pending`, `in_progress`, `completed`) |
| `sourceSnippet` | `string` | *TBD* | Direct quote from document justifying this action |

### Deadline
Explicit representation of dates/cutoffs identified in the document.

| Field | Type | Requirement | Description |
|---|---|---|---|
| `id` | `string` | **Confirmed** | Unique identifier |
| `title` | `string` | **Confirmed** | What is due |
| `dueDate` | `string` | **Confirmed** | Date string or ISO timestamp |
| `isStrict` | `boolean` | *TBD* | Whether strict penalties apply (optional) |

### Event
Specific scheduled events, meetings, or sessions identified in the document.

| Field | Type | Requirement | Description |
|---|---|---|---|
| `id` | `string` | **Confirmed** | Unique identifier |
| `title` | `string` | **Confirmed** | Name of the event / meeting |
| `date` | `string` | **Confirmed** | Event date and time string |
| `location` | `string` | *TBD* | Location or virtual link if mentioned |

---

## 4. Analysis Result (Top-Level Container)

The complete result structure delivered after document processing:

```typescript
export interface AnalysisResult {
  // Confirmed fields
  document: {
    id: string;
    name: string;
    sizeBytes: number;
    uploadedAt: string;
  };
  metrics: {
    totalActions: number;
    totalDeadlines: number;
    totalEvents: number;
    highPriorityCount: number;
  };
  actions: ActionItem[];
  deadlines: Deadline[];
  events: Event[];
  importantNotes: string[];

  // TBD fields
  processingDurationMs?: number; // Execution time for performance analysis
  modelMetadata?: {              // Debug metadata for model/prompt used
    modelName?: string;
    confidenceScore?: number;
  };
}
```
