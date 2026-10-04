# Team Context & Collaboration: Document → Action Automator

**Hackathon:** WCC Launchpad 30  
**Project:** Document → Action Automator  

---

## 1. Project Roles & Responsibilities

| Role | Lead / Assignee | Core Responsibilities |
|---|---|---|
| **Frontend Engineering** | Yash (`frontend/yash`) | Upload interface, processing state machine, dashboard UI, domain types, client-side validation, mock adapter |
| **Backend Engineering** | TBD | Document ingestion endpoint, payload handling, coordination with processing engine, response schema |
| **Document / AI Processing** | TBD | Document parsing/OCR, LLM prompt engineering / rule-based extraction for tasks, deadlines, and priorities |
| **Integration & QA** | TBD | End-to-end API integration between frontend and backend, demo scenario testing, error handling |

*(Note: Specific team member names and final ownership for backend/AI will be updated as assignments are finalized; marked as TBD).*

---

## 2. Area Responsibilities

### Frontend Responsibility
- Build an intuitive, minimal, and responsive user interface across three states: Upload, Processing, and Results.
- Maintain decoupled UI components that consume strict TypeScript domain types.
- Provide a robust mock analysis service so the frontend can be developed and demonstrated independently before backend completion.
- Ensure smooth transition from mock data to live API integration.

### Backend Responsibility (TBD Details)
- Provide a stable API endpoint for document uploads.
- Handle multipart file uploads, size validation, and temporary storage.
- Orchestrate calls to the document processing / AI pipeline.
- Return structured JSON adhering to the agreed data model ([specs/04-DATA_MODEL.md](../specs/04-DATA_MODEL.md)).

### Document / AI Processing Responsibility (TBD Details)
- Extract text accurately from supported file types (PDF, text, images if applicable).
- Run extraction logic to isolate:
  - Task title and description
  - Due date / deadline
  - Priority level (High, Medium, Low)
  - Category (Academic, Administrative, Finance, Event, etc.)
  - General dates and events
- Return clean structured data to the backend.

### Integration Responsibility
- Align frontend request formats with backend API expectations.
- Validate error responses (invalid files, processing timeouts, empty results).
- Verify end-to-end user flows for the hackathon demo.

---

## 3. Team Collaboration Principles

1. **Feature Branching:**
   - All development must take place on dedicated branches (`frontend/<name>`, `backend/<name>`).
   - Never commit or push directly to `main`.
2. **Focused, Logical Commits:**
   - Write clear, meaningful commit messages (`type: description`).
   - Keep commits scoped to a single logical piece of work.
3. **Integration via Pull Requests:**
   - Merge to `main` only via Pull Requests after testing and validation.
4. **Transparent Contract Communication:**
   - Any modifications to data models, API endpoints, or processing behavior must be updated in `specs/` and communicated to the team before code changes.
5. **Living Documentation:**
   - Keep `context/` and `specs/` synchronized as decisions evolve during the hackathon.
