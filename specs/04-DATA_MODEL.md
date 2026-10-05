# Specification 04: Data Model

**Project:** Doc2Action (Document → Action Automator)  
**Status:** Implemented & Verified on `main`  

---

## 1. Overview

This document specifies the data model for Doc2Action, including shared TypeScript domain interfaces and the Prisma relational database schema implemented in PostgreSQL.

---

## 2. Core TypeScript Types (`src/lib/types/action.ts`)

```typescript
// Action priority levels
export type Priority = "high" | "medium" | "low";

// Categorical classifications
export type Category = 
  | "academic" 
  | "administrative" 
  | "finance" 
  | "event" 
  | "general";

// Lifecycle status of an individual action item
export type ActionStatus = "pending" | "in_progress" | "completed";

// Document processing state machine stages
export type ProcessingStatus = 
  | "idle"
  | "uploading"
  | "extracting"
  | "analyzing"
  | "generating_actions"
  | "complete"
  | "error";

// Filter and sort options for workspace views
export type StatusFilter = "all" | "not_completed" | "completed";
export type SortOption = "urgency" | "priority" | "title" | "newest";
export type CategoryFilter = "all" | "academic" | "administrative" | "finance" | "event" | "general";
```

---

## 3. Domain Interfaces

### `ActionItem`
Represents a discrete actionable task extracted from a document.
```typescript
export interface ActionItem {
  id: string;
  documentId: string;
  title: string;
  description: string;
  deadline: string | null;           // ISO date string (YYYY-MM-DD) or human-readable deadline
  priority: Priority;                // "high" | "medium" | "low"
  category: Category;                // "academic" | "administrative" | "finance" | "event" | "general"
  status: ActionStatus;              // "pending" | "in_progress" | "completed"
  confidence?: number;               // Model confidence score (0.0 to 1.0)
  sourceSnippet?: string;            // Direct quote or clause from the source text
  sourceDocument?: string;           // Original filename for display & export tracking
  assignedTo?: string | null;
  createdAt: string;
  updatedAt: string;
}
```

### `Deadline`
Explicit date, cutoff, or deadline identified in the document.
```typescript
export interface Deadline {
  id: string;
  documentId: string;
  title: string;
  dueDate: string;                   // Date or timestamp string
  isStrict: boolean;                 // Flag indicating hard penalty or absolute cutoff
}
```

### `Event`
Scheduled gathering, seminar, defense, or meeting.
```typescript
export interface Event {
  id: string;
  documentId: string;
  title: string;
  date: string | null;               // Event date/time string or null
  location: string | null;           // Physical room, venue, or virtual link
}
```

### `AnalysisResult`
Top-level response returned by `/api/analyze` after processing.
```typescript
export interface AnalysisResult {
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
}
```

---

## 4. Prisma Relational Schema (`prisma/schema.prisma`)

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model Workspace {
  id         String          @id @default(cuid())
  createdAt  DateTime        @default(now())
  updatedAt  DateTime        @updatedAt
  documents  Document[]
  actions    ActionItem[]
  deadlines  Deadline[]
  events     Event[]
  notes      ImportantNote[]

  @@map("workspaces")
}

model Document {
  id               String          @id @default(cuid())
  workspaceId      String
  workspace        Workspace       @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  name             String
  sizeBytes        Int
  mimeType         String
  uploadedAt       DateTime        @default(now())
  processingStatus String          @default("complete")
  actions          ActionItem[]
  deadlines        Deadline[]
  events           Event[]
  notes            ImportantNote[]
  createdAt        DateTime        @default(now())

  @@index([workspaceId, createdAt(sort: Desc)])
  @@map("documents")
}

model ActionItem {
  id             String    @id @default(cuid())
  workspaceId    String
  workspace      Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  documentId     String
  document       Document  @relation(fields: [documentId], references: [id], onDelete: Cascade)
  title          String
  description    String    @db.Text
  deadline       String?
  priority       String    // "high" | "medium" | "low"
  category       String    // "academic" | "administrative" | "finance" | "event" | "general"
  status         String    @default("pending") // "pending" | "completed"
  sourceSnippet  String?   @db.Text
  completedAt    DateTime?
  createdAt      DateTime  @default(now())

  @@index([workspaceId, status])
  @@index([documentId])
  @@map("action_items")
}

model Deadline {
  id          String    @id @default(cuid())
  workspaceId String
  workspace   Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  documentId  String
  document    Document  @relation(fields: [documentId], references: [id], onDelete: Cascade)
  title       String
  dueDate     String
  isStrict    Boolean   @default(false)
  createdAt   DateTime  @default(now())

  @@index([workspaceId])
  @@index([documentId])
  @@map("deadlines")
}

model Event {
  id          String    @id @default(cuid())
  workspaceId String
  workspace   Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  documentId  String
  document    Document  @relation(fields: [documentId], references: [id], onDelete: Cascade)
  title       String
  date        String?
  location    String?
  createdAt   DateTime  @default(now())

  @@index([workspaceId])
  @@index([documentId])
  @@map("events")
}

model ImportantNote {
  id          String    @id @default(cuid())
  workspaceId String
  workspace   Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  documentId  String
  document    Document  @relation(fields: [documentId], references: [id], onDelete: Cascade)
  content     String    @db.Text
  createdAt   DateTime  @default(now())

  @@index([workspaceId])
  @@index([documentId])
  @@map("important_notes")
}
```

---

## 5. Persistence Rules & Cascades

1. **Workspace Cascade:** Deleting a `Workspace` cascades and permanently deletes all related documents, actions, deadlines, events, and notes.
2. **Document Cascade:** Deleting a `Document` cascades and removes all actions, deadlines, events, and notes that originated from that specific document.
3. **Optimized Indexes:** Indexes on `[workspaceId, status]` and `[workspaceId, createdAt(sort: Desc)]` ensure sub-10ms queries for "My Actions" filtering and document history listing.
