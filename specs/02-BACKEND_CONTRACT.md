# Specification 02: Backend API Contract

**Project:** Doc2Action (Document → Action Automator)  
**Status:** Implemented & Verified on `main`  

---

## 1. Overview

The backend subsystem is built directly into Next.js App Router API Route Handlers under `src/app/api/`. It provides endpoints for document ingestion, AI-powered extraction, workspace task querying, batch updates, and history retention. Persistence is handled by **Prisma ORM** connected to a **PostgreSQL** database.

---

## 2. Workspace Session Identification

Doc2Action utilizes an anonymous browser workspace model:
- **Header:** `x-workspace-id: <cuid>`
- **Cookie:** `doc2action_workspace_id=<cuid>`
- **Fallback:** If neither is present, route handlers automatically generate and persist a new `Workspace` record and return the ID via headers/cookies.

---

## 3. Implemented API Endpoints

### 1. Document Analysis (`POST /api/analyze`)
Ingests one or more documents, extracts text, runs chunked AI extraction, deduplicates entities, and persists results to PostgreSQL.

- **Method:** `POST`
- **Content-Type:** `multipart/form-data`
- **Payload:**
  - `files`: One or more binary files (`.pdf`, `.docx`, `.doc`, `.txt`), up to 5 files, 10MB each.
- **Processing Flow:**
  1. Validates file types and sizes.
  2. Extracts text using `pdf-parse` (PDF) or `mammoth` (DOCX).
  3. Splits text into token chunks if length exceeds single-chunk budget (~1,800 tokens).
  4. Calls Groq API (`openai/gpt-oss-20b`) with low reasoning mode and strict JSON schema.
  5. Normalizes and deduplicates actions across chunks.
  6. Persists `Document`, `ActionItem`, `Deadline`, `Event`, and `ImportantNote` records via Prisma.
  7. Enforces workspace bounded retention (prunes documents beyond the 20 most recent).
- **Response (200 OK):**
  ```json
  {
    "document": {
      "id": "doc_clx...",
      "name": "Notice.pdf",
      "sizeBytes": 142050,
      "uploadedAt": "2026-10-05T12:00:00.000Z"
    },
    "metrics": {
      "totalActions": 5,
      "totalDeadlines": 3,
      "totalEvents": 2,
      "highPriorityCount": 2
    },
    "actions": [
      {
        "id": "act_clx...",
        "title": "Submit Project Report",
        "description": "Final deliverable must be submitted to the academic portal.",
        "deadline": "2026-10-15",
        "priority": "high",
        "category": "academic",
        "status": "pending",
        "sourceSnippet": "Students must submit the final project report by October 15, 2026."
      }
    ],
    "deadlines": [
      {
        "id": "dl_clx...",
        "title": "Project Report Submission",
        "dueDate": "2026-10-15",
        "isStrict": true
      }
    ],
    "events": [
      {
        "id": "ev_clx...",
        "title": "Project Defense Viva",
        "date": "2026-10-20",
        "location": "Seminar Hall A"
      }
    ],
    "importantNotes": [
      "Late submissions will incur a 10% penalty per calendar day."
    ]
  }
  ```

---

### 2. Workspace Actions (`GET /api/actions`)
Fetches all active and completed actions for the current workspace, organized into metrics and urgency groups.

- **Method:** `GET`
- **Response (200 OK):**
  ```json
  {
    "metrics": {
      "total": 12,
      "pending": 8,
      "completed": 4,
      "overdue": 1,
      "dueSoon": 3
    },
    "groups": {
      "overdue": [...],
      "dueSoon": [...],
      "upcoming": [...],
      "completed": [...]
    }
  }
  ```

---

### 3. Update Action Status (`PATCH /api/actions/[id]`)
Updates the completion status of a single action item.

- **Method:** `PATCH`
- **Body:** `{ "status": "completed" | "pending" }`
- **Response (200 OK):** Updated `ActionItem` object.

---

### 4. Bulk Update Action Status (`PATCH /api/actions/bulk`)
Batch updates status for multiple action items in a single transaction.

- **Method:** `PATCH`
- **Body:** `{ "ids": ["act_1", "act_2"], "status": "completed" | "pending" }`
- **Response (200 OK):** `{ "success": true, "updatedCount": 2 }`

---

### 5. Bulk Delete Actions (`DELETE /api/actions/bulk`)
Deletes multiple action items or all actions in the workspace.

- **Method:** `DELETE`
- **Body:** `{ "ids": ["act_1", "act_2"], "all": false }`
- **Response (200 OK):** `{ "success": true, "deletedCount": 2 }`

---

### 6. Document History (`GET /api/history`)
Returns chronological list of previously analyzed documents for the workspace.

- **Method:** `GET`
- **Response (200 OK):**
  ```json
  {
    "documents": [
      {
        "id": "doc_1",
        "name": "Notice.pdf",
        "sizeBytes": 104857,
        "uploadedAt": "2026-10-05T10:00:00.000Z",
        "processingStatus": "complete",
        "actionCount": 5
      }
    ],
    "limit": 20
  }
  ```

---

### 7. Document Actions & Delete (`GET / DELETE /api/documents/[id]`)
- **GET:** Returns metadata and all actions, deadlines, events, and notes belonging to a specific document.
- **DELETE:** Deletes the document record and cascades deletion to all associated actions and notes.

---

## 4. Error Handling & Safety

All API endpoints implement domain-safe error normalization:
- Provider errors, API keys, or raw rate-limit headers are logged server-side and **never leaked** to client responses.
- Client responses use consistent JSON: `{ "error": "Human-friendly explanation" }`.
- Standard HTTP status codes:
  - `400 Bad Request` — Missing file, unsupported format, file exceeds 10MB.
  - `429 Too Many Requests` — Daily token quota or temporary rate limit reached.
  - `500 Internal Server Error` — Database or parsing error.
  - `503 Service Unavailable` — AI provider temporary unavailability.
