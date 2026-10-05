# Doc2Action
### Document → Action Automator

Doc2Action converts everyday documents such as college notices, circulars, event documents, forms, and business memos into structured, actionable tasks, explicit deadlines, scheduled events, and critical notes.

Built for the **WCC Launchpad 30** hackathon (Track: *Everyday Automation*).

---

## The Problem

Important real-world obligations are routinely buried inside static documents—PDF circulars, academic notices, corporate memos, syllabi, and administrative guidelines. Readers are forced to manually sift through dense paragraphs to identify:
- What specific actions are required?
- Who is responsible, and what are the prerequisites?
- What are the firm cutoff dates and deadlines?
- What events or meetings need to be scheduled?

This manual overhead causes missed deadlines, administrative bottlenecks, and unnecessary cognitive friction.

## The Solution

Doc2Action delivers an end-to-end automated document-to-action pipeline:

1. **Upload:** Drop or select digital documents (PDF, DOCX, TXT) individually or in batches (up to 5 documents, 10MB each).
2. **Text Extraction:** Native, reliable text extraction without external microservices (`pdf-parse`, `mammoth`, UTF-8).
3. **Chunking & Token Budgeting:** Long documents are segmented into overlapping sliding windows (~1,800 tokens) with active rolling TPM token rate limiting.
4. **Structured AI Extraction:** Powered by Groq with low reasoning mode and strict JSON schema enforcement to extract human obligations, deadlines, events, and notes with zero reasoning fluff.
5. **Normalization & Deduplication:** Extracted entities are normalized and deterministically deduplicated across chunks and multi-file batches.
6. **Workspace Persistence:** Stored seamlessly in PostgreSQL via Prisma using an anonymous, zero-friction browser workspace model.
7. **Actionable Dashboard & My Actions:** Interactive task dashboard with completion toggling, urgency sorting, priority/category filtering, and multi-select batch controls.
8. **Export:** Export actions on-demand to PDF checklists, CSV spreadsheets, Markdown checklists, or iCalendar (`.ics`) schedules.

---

## Key Features

- **Document Processing:** Direct text parsing for `.pdf`, `.docx`, `.doc`, and `.txt` files with client-side file validation and batch support.
- **AI Action Extraction:** Accurately isolates actionable tasks with titles, descriptions, priorities, and categories.
- **Deadline & Event Detection:** Captures explicit cutoff dates (`is_strict` flags) and scheduled gatherings/meetings.
- **Important Notes:** Surfaces non-actionable stipulations, technical requirements, and prerequisite rules.
- **Priority & Categorization:** Automatically assigns priority levels (`High`, `Medium`, `Low`) and categories (`Academic`, `Administrative`, `Finance`, `Event`, `General`).
- **Deterministic Deduplication:** Normalizes text, dates, and titles to prevent redundant actions across document chunks.
- **My Actions Workspace:** Centralized view of all workspace obligations with status toggles (Completed / Pending), urgency sorting (due soonest, priority, alphabetical), and category filtering.
- **Multi-Select Batch Management:** Select multiple tasks to mark completed, mark pending, or bulk delete.
- **Document History & Bounded Retention:** View previously analyzed documents and their associated action sets with bounded workspace retention (most recent 20 documents).
- **Client-Side Export Engine:**
  - **PDF Checklist:** Professional, vector-sharp document with page-break protection, checkbox icons, priority badges, and metadata.
  - **CSV Spreadsheet:** Standard RFC 4180 format with UTF-8 BOM for immediate compatibility with Microsoft Excel and Google Sheets.
  - **Markdown Checklist:** GitHub/Obsidian/Notion-compatible checklist with grouped pending and completed sections.
  - **Calendar (`.ics`):** Standard RFC 5545 iCalendar format with exact all-day events for date deadlines and UTC timestamps for scheduled times—without fabricating false times.
- **Anonymous Browser Workspaces:** Instant access without mandatory login or account creation; state is tracked through secure workspace session identifiers.
- **Safe Rate-Limit & Error Handling:** Application-level rolling TPM rate limiter with daily token limit detection and user-friendly error normalization (zero provider error leakage).

---

## Architecture

```
User Browser
    │
    ├──► [Upload Interface] ─── (PDF, DOCX, TXT)
    │         │
    │         ▼
    ├──► [Next.js App Router API (/api/analyze)]
    │         │
    │         ├──► Text Extraction (pdf-parse / mammoth)
    │         ├──► Chunking Engine (Sliding window ~1800 tokens)
    │         ├──► TokenRateLimiter (Rolling TPM window budget)
    │         │
    │         ▼
    │    [Groq API (openai/gpt-oss-20b)]
    │         │   - reasoning_effort: "low"
    │         │   - max_completion_tokens: 1200
    │         │   - response_format: json_schema (strict)
    │         │
    │         ▼
    │    [Normalization & Deterministic Deduplication]
    │         │
    │         ▼
    │    [Prisma ORM / PostgreSQL Database]
    │         ├── Workspaces
    │         ├── Documents (History)
    │         ├── ActionItems
    │         ├── Deadlines
    │         ├── Events
    │         └── ImportantNotes
    │
    ├──► [Results Dashboard & Document History]
    ├──► [My Actions Consolidated View]
    └──► [Client-Side Export Engine (PDF, CSV, MD, ICS)]
```

### Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Framework** | Next.js 16 (App Router) | Server-side routing, API route handlers, and static optimization |
| **Language** | TypeScript 5 (Strict) | End-to-end type safety across domain models and APIs |
| **UI Library** | React 19 | Responsive component architecture and interactive state management |
| **Styling** | Tailwind CSS v4 | Dark-mode design system with custom green/neon aesthetic |
| **Database & ORM** | PostgreSQL + Prisma ORM | Relational persistence for workspaces, documents, and action items |
| **AI Inference** | Groq SDK (`openai/gpt-oss-20b`) | High-speed LLM inference with low reasoning and structured JSON output |
| **Document Parsing**| `pdf-parse`, `mammoth` | Client-safe and server-side text extraction from PDFs and Word documents |
| **Document Export** | `jspdf` | Client-side vector PDF generation with automatic page breaks |

---

## AI Pipeline Details

1. **Document Text Ingestion:** Incoming files are validated and parsed into clean raw text strings. Digital PDFs are extracted via `pdf-parse`, and Word documents via `mammoth`.
2. **Chunking Engine:** Documents exceeding the single-request context window are split into overlapping token chunks (~1,800 tokens per chunk with 200-token overlap) using word-boundary heuristics.
3. **Rolling Token Rate Limiting:** A rolling in-memory rate limiter tracks token usage in a strict 60-second sliding window, reserving capacity before dispatching requests to avoid provider throttling.
4. **Structured JSON Extraction:** The model processes each chunk with `reasoning_effort="low"`, a strict JSON schema, and a 1,200 completion token ceiling. It extracts:
   - `actions`: High-value human obligations (omitting internal software features or generic text).
   - `deadlines`: Explicit dates and cutoff times.
   - `events`: Scheduled gatherings and meetings with optional locations.
   - `important_notes`: Key prerequisites and non-actionable rules.
5. **Error Normalization:** Distinguishes temporary TPM limits (automatic retry after reset) from daily token quota exhaustion (fails fast with clear user feedback). Provider error internals are never leaked to the client.
6. **Deterministic Deduplication:** Merges results across chunks, matching duplicate tasks via normalized title strings and deadline dates.

---

## Data Model

Persisted in PostgreSQL via Prisma:

- **Workspace:** Anonymous container identified by a unique ID stored in browser cookies/local state.
- **Document:** Uploaded file record with name, byte size, MIME type, processing status, and timestamp.
- **ActionItem:** Extracted actionable task linked to Document and Workspace, containing title, description, deadline, priority (`high`, `medium`, `low`), category (`academic`, `administrative`, `finance`, `event`, `general`), status (`pending`, `completed`), and source snippet.
- **Deadline:** Structured due date record with title, due date string, and strictness flag.
- **Event:** Scheduled gathering with title, date, and optional location.
- **ImportantNote:** Key rules, prerequisites, or policies.

---

## Export Capabilities

Users can export their actions at any time directly from the **My Actions** toolbar:

- **PDF Checklist (`.pdf`):** Formatted A4 checklist report with generation timestamp, task checkboxes, priority badges, category tags, deadlines, source document references, and dynamic page numbering.
- **CSV Spreadsheet (`.csv`):** Excel- and Google Sheets-ready tabular data with UTF-8 Byte Order Mark (BOM), escaped quotes/commas, and full metadata columns.
- **Markdown Checklist (`.md`):** Portable checklist organized into `## Pending Obligations` (`- [ ]`) and `## Completed Tasks` (`- [x]`) for Notion, Obsidian, and GitHub.
- **Calendar (`.ics`):** Standard RFC 5545 iCalendar file supporting Google Calendar, Apple Calendar, and Microsoft Outlook. Date-only deadlines become all-day events, while timed events use UTC timestamps—no false times are invented.

*Export strictly respects current filters (Pending vs. Completed, Category, Search) as well as multi-select mode.*

---

## Note on OCR (Future Scope)

> **Experimental Feature Notice:**  
> Optical Character Recognition (OCR) for scanned, photographed, or image-only documents is a **planned future scope** of Doc2Action. An experimental prototype utilizing the **Sarvam AI API** with an offline **Tesseract.js** fallback was explored on a separate development branch (`feature/ai`).  
> Because it is still experimental and not yet stable, **it is not merged into `main` and is not part of the production deployment**. The `main` branch represents the official, stable submission and processes digital text documents (PDF, DOCX, TXT).

---

## Getting Started

### Prerequisites

- **Node.js:** `v18.18+` or `v20+`
- **npm:** `v9+` or `v10+`
- **PostgreSQL:** Local instance or cloud database (Neon, Supabase, Railway, etc.)
- **Groq API Key:** For AI document analysis

### Installation

1. Clone the repository and checkout the `main` branch:
   ```bash
   git clone https://github.com/KrishnaKant333/Doc2Action.git
   cd Doc2Action
   git checkout main
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
   Populate your keys:
   ```env
   # Groq API Key (Required for AI analysis)
   GROQ_API_KEY=gsk_your_groq_api_key_here

   # Groq Model (Optional, defaults to openai/gpt-oss-20b)
   GROQ_MODEL=openai/gpt-oss-20b

   # Groq Reasoning Effort (Optional: low, medium, high - defaults to low)
   GROQ_REASONING_EFFORT=low

   # PostgreSQL Connection String (Required for persistence)
   DATABASE_URL=postgresql://user:password@localhost:5432/doc2action?schema=public
   ```

4. Run Prisma database migrations:
   ```bash
   npx prisma db push
   # or: npx prisma migrate dev --name init
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Current MVP Boundaries & Limitations

- **Text-Layer Requirement:** The production/main application processes documents with embedded text streams (digital PDFs, DOCX, TXT). Scanned documents without text layers are part of the future OCR scope.
- **Anonymous Workspaces:** Workspaces are tied to browser session identifiers; clearing browser storage initiates a fresh workspace. Traditional email/password authentication is intentionally out of scope for the MVP.
- **Document Retention:** Workspaces retain the 20 most recent documents to prevent unbounded database growth.

---

## License

This project was developed for the WCC Launchpad 30 Hackathon. All rights reserved.
