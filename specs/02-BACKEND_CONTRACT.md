# Specification 02: Backend Contract

**Project:** Document → Action Automator  
**Status:** Conceptual Contract (Specific endpoints marked TBD)  

---

## 1. Overview

This contract establishes the conceptual boundary between the Frontend client and the Backend / Document Processing service. 

To maintain velocity, the frontend is built against this conceptual contract using a mock adapter. When the backend service is deployed, only the communication layer will require configuration.

---

## 2. Conceptual Boundary

```
[ Frontend Client ] ────── (1) Document / File Payload ──────► [ Backend Service ]
                    ◄───── (2) Structured Analysis Result ────
```

### Input
- **Payload:** User-uploaded document (binary file or multipart form data).
- **Metadata (Optional):** Original filename, MIME type, file size in bytes.

### Processing
- Text extraction / OCR.
- Semantic extraction of actionable entities.
- Rule / LLM-based parsing of dates, deadlines, and urgency.

### Output
A structured document analysis object capable of representing:
- **Document Metadata:** Document ID, original name, page count/size, processed timestamp.
- **Action Items:** List of discrete actionable tasks with title, description, deadline, priority, and category.
- **Deadlines:** Explicit list or mapping of hard due dates.
- **Events:** Calendar/schedule items, meeting dates, or webinars found in the text.
- **Important Information:** Critical notes, guidelines, or warnings.
- **Processing Status:** Success / partial failure indicator.
- **Errors:** Diagnostic error message if parsing or extraction fails.

---

## 3. Specifications (To Be Finalized by Backend Team)

The following technical implementation details are currently **TBD**:

| Specification Item | Current Status | Notes / Options |
|---|---|---|
| **API Endpoint URL** | **TBD** | E.g. `POST /api/v1/analyze` or Next.js Route Handler |
| **Upload Mechanism** | **TBD** | `multipart/form-data` vs presigned S3/storage URL vs direct stream |
| **Authentication** | **TBD** | None required for hackathon MVP |
| **Max File Size** | **TBD** | Recommended: 10MB |
| **Supported MIME Types** | **TBD** | Target: `application/pdf`, `text/plain`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document` |
| **Asynchronous vs Synchronous** | **TBD** | Direct request-response vs Job ID polling (`/api/v1/jobs/:id`) |
| **Exact JSON Response Schema** | **TBD** | Will follow the domain models in [specs/04-DATA_MODEL.md](04-DATA_MODEL.md) |

---

## 4. Maintenance

This document must be updated and signed off collaboratively by frontend and backend engineers once backend architecture choices are finalized.
