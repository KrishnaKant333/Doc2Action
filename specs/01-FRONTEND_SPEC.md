# Specification 01: Frontend Specification

**Project:** Doc2Action (Document → Action Automator)  
**Status:** Implemented & Verified on `main`  

---

## 1. Overview

The frontend delivers an accessible, uncluttered, and responsive user experience for the complete Document $\rightarrow$ Action workflow. Built using **Next.js 16 (App Router)**, **React 19**, **TypeScript 5**, and **Tailwind CSS v4**, the application is organized into five primary views:

1. **Upload Screen:** Single and batch document intake with drag-and-drop, validation, and sample selection.
2. **Processing Screen:** Multi-stage animated progress timeline with realistic pipeline feedback.
3. **Results Dashboard:** Immediate document analysis breakdown displaying actions, deadlines, events, and notes.
4. **My Actions View:** Consolidated workspace task manager with status filters, urgency sorting, multi-select batch controls, and export tools.
5. **Document History View:** Chronological workspace record of analyzed files with one-click reloading and bounded retention.

All components are strictly typed and decoupled from underlying transport details, consuming domain interfaces defined in [specs/04-DATA_MODEL.md](04-DATA_MODEL.md).

---

## 2. Component Directory Structure

```text
src/
├── app/
│   ├── layout.tsx             # Root layout with navbar & metadata
│   ├── page.tsx               # Orchestrator for views (Upload, Processing, Results, My Actions, History)
│   └── globals.css            # Dark-mode design system & animations
├── components/
│   ├── upload/                # Dropzone, file preview, validation & sample picker
│   │   ├── DocumentUpload.tsx
│   │   ├── FilePreviewCard.tsx
│   │   ├── SamplePicker.tsx
│   │   └── fileValidation.ts
│   ├── processing/            # Multi-stage progress visualizer
│   │   └── ProcessingScreen.tsx
│   ├── results/               # Analysis results dashboard
│   │   ├── ResultsDashboard.tsx
│   │   ├── ActionCard.tsx
│   │   ├── DeadlinesList.tsx
│   │   ├── EventsList.tsx
│   │   └── NotesList.tsx
│   ├── actions/               # My Actions consolidated workspace
│   │   └── MyActionsView.tsx
│   ├── history/               # Document history view
│   │   └── HistoryView.tsx
│   └── ui/                    # Atomic UI design system primitives
│       ├── badge.tsx
│       ├── button.tsx
│       ├── card.tsx
│       └── icons.tsx
└── lib/
    ├── export/                # Client-side export engine (PDF, CSV, MD, ICS)
    │   └── exportActions.ts
    ├── services/              # API and client state services
    │   ├── apiAnalysisService.ts
    │   └── workspaceService.ts
    └── types/                 # Shared TypeScript domain models
        └── action.ts
```

---

## 3. Screen Specifications

### Screen 1: Upload Screen
Provides an intuitive intake interface supporting single and multi-file batch uploads.
- **Drag-and-Drop Area:** Visual dropzone with distinct drag-over hover feedback, supporting dragging multiple files simultaneously.
- **Browse Files Button:** Native multi-file input trigger allowing document selection.
- **Supported Formats:** `.pdf`, `.docx`, `.doc`, `.txt`.
- **Validation Constraints:**
  - Maximum size: 10 MB per file.
  - Maximum batch: 5 documents per batch.
  - Duplicate detection: Prevents duplicate additions matching filename and byte size.
  - Individual validation: Invalid files are flagged individually without blocking valid selections.
- **File Preview List:** Shows file name, format badge, human-readable size, and remove triggers.
- **Sample Document Picker:** Preloaded sample documents (college notices, event circulars) for rapid judge testing.
- **Primary CTA:** "Analyze Document(s)" button, enabled only when valid documents are queued.

---

### Screen 2: Processing Screen
Maintains user engagement with transparent visual feedback as documents are processed.
- **Multi-Stage Progress Timeline:**
  1. `Uploading` — File payload transfer.
  2. `Extracting` — Text extraction (`pdf-parse`, `mammoth`).
  3. `Analyzing` — Semantic parsing, date detection, and priority assignment via Groq.
  4. `Generating Actions` — Normalization, deduplication, and database persistence.
- **Visual Feedback:** Stage pulse animations, completion checks, and overall progress percentage.
- **Error Handling:** Non-alarming error card with retry and choose-another-file options if processing fails.

---

### Screen 3: Results Dashboard
Displays the immediate output of the analyzed document(s).
- **Summary Metrics Row:** Four counter cards displaying Total Actions, Deadlines, Events, and Important Notes.
- **Action Cards:** Structured cards displaying action title, description, deadline, priority badge (`High`, `Medium`, `Low`), category badge, and source snippet.
- **Deadlines & Events Lists:** Dedicated cards for chronological due dates and scheduled events/meetings.
- **Important Notes:** Bulleted section for prerequisites, rules, and non-actionable notices.
- **Action Controls:** "View in My Actions" CTA and "Analyze Another Document" reset trigger.

---

### Screen 4: My Actions View
A consolidated, workspace-wide task manager aggregating actions across all analyzed documents.
- **Interactive Metric Cards:** Total Tasks, Not Completed (Pending), and Completed. Clicking filters the view immediately.
- **Category Filter:** Filter by Academic, Administrative, Finance, Event, or General.
- **Sorting Options:** Urgency (due soonest), Priority (High $\rightarrow$ Low), Title (A $\rightarrow$ Z), and Newest added.
- **Action Completion:** Native checkbox toggles directly updating completion state in PostgreSQL.
- **Multi-Select Batch Toolbar:** Enter selection mode to select multiple tasks and perform batch actions:
  - Mark Completed
  - Mark Not Completed
  - Bulk Delete
  - Export Selected
- **Export Actions Dropdown:** One-click export to PDF, CSV, Markdown, and Calendar (`.ics`), respecting the user's active filters or selections.

---

### Screen 5: Document History View
Displays previously analyzed documents in the current browser workspace.
- **Document List:** Card view with file name, file size, upload timestamp, and extracted task counts.
- **Reload Actions:** Click any historical document to view its specific action items.
- **Delete Document:** Cascade-delete a document and its associated action items from the workspace.
- **Bounded Retention Notice:** Displays workspace retention policy (most recent 20 documents).

---

## 4. Export Integration

The frontend embeds a pure client-side export utility ([src/lib/export/exportActions.ts](../src/lib/export/exportActions.ts)):
- **PDF Checklist (`.pdf`):** Multi-page vector document with checkboxes, priority badges, category tags, deadlines, source references, and page numbers.
- **CSV Spreadsheet (`.csv`):** Excel-compatible CSV with UTF-8 BOM, escaped values, and structured metadata.
- **Markdown Checklist (`.md`):** Clean portable checklist categorized into Pending and Completed tasks.
- **Calendar (`.ics`):** RFC 5545 iCalendar file mapping deadlines to all-day events and timed meetings to UTC timestamps.
