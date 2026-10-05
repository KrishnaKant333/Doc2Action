# Project Context: Doc2Action (Document → Action Automator)

**Hackathon:** WCC Launchpad 30  
**Project Name:** Doc2Action  
**Track:** Everyday Automation  
**Status:** MVP Production Complete (Final Documentation / Submission)  

---

## 1. Project Overview

Doc2Action is an automated document comprehension application that bridges the gap between static, unstructured documents and real-world execution. Everyday notices, circulars, syllabi, meeting minutes, bills, and project guidelines are packed with dense paragraphs. Locating mandatory obligations, explicit deadlines, and event schedules is manual, error-prone, and often leads to missed deadlines.

Doc2Action parses uploaded documents, segments them into token-budgeted chunks, extracts structured human actions via high-speed AI inference (Groq), normalizes and deduplicates tasks, persists them in a PostgreSQL database via Prisma, and presents them in an interactive workspace with client-side export capabilities (PDF, CSV, Markdown, ICS).

---

## 2. Problem Statement

In academic, corporate, and everyday administrative settings, critical information is distributed primarily through static documents (PDFs, Word docs, notices).
- **Time Sink:** Users spend excessive time scanning pages to isolate 1–2 crucial deadlines.
- **Missed Obligations:** Buried penalties, cutoff dates, and prerequisites are easily overlooked.
- **Cognitive Friction:** Manually translating document text into actionable checklist tasks or calendar items introduces friction.

---

## 3. Target Users

1. **Students & Academics:** Navigating college notices, exam timetables, project submission circulars, and thesis defense schedules.
2. **Professionals & Knowledge Workers:** Reviewing policy circulars, compliance notices, procurement guidelines, and meeting minutes.
3. **General Consumers:** Reviewing administrative letters, renewal notices, and bills.

---

## 4. Core Value Proposition

Convert unstructured document noise into immediate, prioritized clarity:
$$\text{Document (Noise)} \longrightarrow \text{Automated Analysis} \longrightarrow \text{Prioritized Action Items (Clarity)}$$

---

## 5. End-to-End Workflow

```
1. Upload Document(s) ──► 2. Text Extraction ──► 3. Chunking & Rate Limiting ──► 4. Groq AI Extraction ──► 5. Normalization & Deduplication ──► 6. PostgreSQL Persistence ──► 7. Action Dashboard / My Actions ──► 8. Export (PDF/CSV/MD/ICS)
```

1. **Upload:** User provides single or batch documents (PDF, DOCX, TXT up to 5 files, 10MB each).
2. **Extraction:** Native text extraction without external microservices (`pdf-parse`, `mammoth`, UTF-8).
3. **Chunking & Rate Limiting:** Sliding window token chunking with active in-memory rolling TPM rate limiting.
4. **AI Inference:** Groq API running `openai/gpt-oss-20b` with low reasoning effort and strict JSON schema output.
5. **Deduplication:** Normalizes text, dates, and priorities; deterministically eliminates redundant items.
6. **Persistence:** Workspaces, documents, actions, deadlines, events, and notes stored via Prisma ORM in PostgreSQL.
7. **Workspace & My Actions:** Interactive task dashboard with status toggles (Completed / Pending), urgency sorting, category filtering, and multi-select batch operations.
8. **Export:** Pure client-side export to PDF Checklist, CSV Spreadsheet, Markdown Checklist, and Calendar (`.ics`).

---

## 6. Implementation Scope Matrix

| Category | Features Implemented on `main` (Stable) |
|---|---|
| **Intake** | Single & multi-file upload (up to 5 files, 10MB each), drag-and-drop, format validation (`.pdf`, `.docx`, `.doc`, `.txt`), sample quick-picker. |
| **Processing** | Multi-stage visual progress timeline (`Uploading` $\rightarrow$ `Extracting` $\rightarrow$ `Analyzing` $\rightarrow$ `Generating Actions`), real-time error handling. |
| **AI Extraction** | Action items, explicit deadlines, scheduled events, important notes, priority scoring (`High`, `Medium`, `Low`), category classification. |
| **Workspace & State** | Anonymous browser workspaces (zero-login session tracking via cuid cookies), PostgreSQL persistence via Prisma. |
| **Task Management** | "My Actions" consolidated workspace, status toggle checkboxes, urgency/priority/alphabetical sorting, category filtering, multi-select batch actions (mark completed, mark pending, bulk delete). |
| **History** | Workspace document history with reloadable action views, bounded retention (most recent 20 documents). |
| **Export** | Client-side export to PDF Checklist (jsPDF vector document with page breaks), CSV Spreadsheet (Excel UTF-8 BOM), Markdown Checklist, Calendar (`.ics` RFC 5545). |

---

## 7. Experimental Work (Not on `main`)

- **Optical Character Recognition (OCR):** An experimental prototype utilizing **Sarvam AI Vision API** with an offline **Tesseract.js** fallback was implemented on a separate development branch (`feature/ai`) by Prathik. It is designed for scanned, photographed, or image-only documents. Because it is experimental and not yet stable, it is **not merged into `main`** and is not part of the production deployment.

---

## 8. Technology Stack

- **Frontend:** Next.js 16 (App Router), React 19, TypeScript 5, Tailwind CSS v4.
- **Backend APIs:** Next.js Route Handlers (`POST /api/analyze`, `GET /api/actions`, `PATCH /api/actions/[id]`, `PATCH /api/actions/bulk`, `DELETE /api/actions/bulk`, `GET /api/history`, `GET /api/documents/[id]`, `DELETE /api/documents/[id]`).
- **Database:** PostgreSQL with Prisma ORM.
- **AI Inference:** Groq SDK (`openai/gpt-oss-20b`, `GROQ_REASONING_EFFORT=low`, strict JSON schema).
- **Document Parsing:** `pdf-parse`, `mammoth`.
- **Export Engine:** `jspdf` for client-side vector PDF generation; Blob/RFC standards for CSV, Markdown, and ICS.
