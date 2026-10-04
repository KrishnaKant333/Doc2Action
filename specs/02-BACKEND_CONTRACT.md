# Specification 02: Backend Contract

**Project:** Document → Action Automator  
**Status:** Conceptual Contract (Audit confirmed: Backend not yet implemented in repo)  

---

## 1. Overview

This contract establishes the boundary between the Frontend client and the Backend / Document Processing service. 

As confirmed during the Phase 6 repository audit, **no backend API implementation, route handlers, or server files currently exist in the repository.** The frontend operates reliably using the mock simulation adapter ([src/lib/services/mockAnalysisService.ts](../src/lib/services/mockAnalysisService.ts)), ensuring the complete user flow (`Upload` $\rightarrow$ `Processing` $\rightarrow$ `Results Dashboard`) works end-to-end.

---

## 2. Conceptual Boundary

```
[ Frontend Client ] ────── (1) Document / File Payload ──────► [ Backend Service ]
                    ◄───── (2) Structured Analysis Result ────
```

### Input
- **Payload:** User-uploaded document (binary file sent via `multipart/form-data`).
- **Metadata (Optional):** Original filename, MIME type, file size in bytes.

### Processing
- Text extraction / OCR.
- Semantic extraction of actionable entities.
- Rule / LLM-based parsing of dates, deadlines, and urgency.

### Output
A structured document analysis object matching the domain models in [specs/04-DATA_MODEL.md](04-DATA_MODEL.md):
- **Document Metadata:** Document ID, original name, page count/size, processed timestamp.
- **Action Items:** List of discrete actionable tasks with title, description, deadline, priority, and category.
- **Deadlines:** Explicit list or mapping of hard due dates.
- **Events:** Calendar/schedule items, meeting dates, or webinars found in the text.
- **Important Information:** Critical notes, guidelines, or warnings.
- **Processing Status:** Success / partial failure indicator.
- **Errors:** Diagnostic error message if parsing or extraction fails.

---

## 3. Specifications Audit Status (Phase 6 Findings)

| Specification Item | Current Repo Status | Technical Recommendation / Notes |
|---|---|---|
| **API Endpoint URL** | **TBD (Not implemented)** | Recommended: `POST /api/analyze` (Next.js Route Handler or external service) |
| **Upload Mechanism** | **TBD (Not implemented)** | Recommended: `multipart/form-data` with field name `file` |
| **Authentication** | **TBD (Not implemented)** | None required for hackathon MVP |
| **Max File Size** | **Enforced on Client** | 10 MB client-side limit enforced in `src/components/upload/fileValidation.ts` |
| **Supported MIME Types** | **Enforced on Client** | PDF, DOCX, TXT enforced in `fileValidation.ts` |
| **Asynchronous vs Synchronous** | **TBD (Not implemented)** | Direct synchronous request-response recommended for MVP velocity |
| **JSON Response Schema** | **TBD (Not implemented)** | Must map to `AnalysisResult` in `src/lib/types/action.ts` |
| **Error Format** | **TBD (Not implemented)** | Recommended: `{ error: string }` with appropriate 4xx/5xx HTTP status code |
| **Environment Variables** | **None present in repo** | E.g., `NEXT_PUBLIC_API_URL` if external server is deployed |

---

## 4. Domain Compatibility & Transformation

The frontend is built to consume the TypeScript interface `AnalysisResult` directly:
- If the backend returns camelCase keys matching `AnalysisResult`, **zero transformation is required**.
- If the backend returns snake_case keys (e.g. `due_date`, `action_items`), a lightweight adapter mapping will convert them to `AnalysisResult` without modifying any UI components.

---

## 5. Maintenance & Next Steps

Once the backend team commits API routes or documentation:
1. Update Section 3 with the confirmed URL, HTTP method, and payload schema.
2. Implement the API client in the frontend service layer without altering UI components.
3. Test end-to-end integration with mock fallback.
