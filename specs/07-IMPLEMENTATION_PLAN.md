# Specification 07: Implementation Roadmap & Status

**Project:** Doc2Action (Document → Action Automator)  
**Hackathon:** WCC Launchpad 30  
**Status:** MVP Fully Implemented on `main`  

---

## 1. Development Matrix & Status

| Phase | Milestone | Status | Deliverables & Verified Scope |
|---|---|:---:|---|
| **Phase 0** | Repository Inspection | **COMPLETE** | Audited Next.js 16, React 19, TypeScript strict setup, Tailwind v4. |
| **Phase 1** | Context & Specifications | **COMPLETE** | Authored initial specifications and architecture contracts. |
| **Phase 2** | Frontend Foundation & Types | **COMPLETE** | Domain models (`src/lib/types/action.ts`), UI primitives (`Card`, `Badge`, `Button`, `icons`). |
| **Phase 3** | Upload Workflow UI | **COMPLETE** | Drag-and-drop dropzone, batch support (up to 5 files), validation (10MB limit), sample picker. |
| **Phase 4** | Processing Progress UI | **COMPLETE** | 4-stage animated timeline (`Uploading` $\rightarrow$ `Extracting` $\rightarrow$ `Analyzing` $\rightarrow$ `Generating Actions`). |
| **Phase 5** | Results & Action Dashboard | **COMPLETE** | Metrics summary row, categorized action cards, deadlines timeline, and important note cards. |
| **Phase 6** | Backend & Database Persistence | **COMPLETE** | Next.js API route handlers (`/api/analyze`, `/api/actions`, `/api/history`, `/api/documents`), Prisma ORM, PostgreSQL schema. |
| **Phase 7** | Task Management ("My Actions") | **COMPLETE** | Consolidated workspace task manager, status toggles, urgency sorting, category filtering, and multi-select batch controls. |
| **Phase 8** | Client-Side Export Engine | **COMPLETE** | Vector PDF Checklist (`jspdf` with page breaks), CSV Spreadsheet (Excel UTF-8 BOM), Markdown Checklist, Calendar (`.ics` RFC 5545). |
| **Phase 9** | AI Optimization & Rate Limiting | **COMPLETE** | Groq SDK (`openai/gpt-oss-20b`, low reasoning, 1200 token ceiling), rolling TPM token limiter, daily token quota detection, error normalization. |
| **Phase 10** | Final Documentation & Packaging | **COMPLETE** | Judge-facing README, updated context files, verified clean build, OCR future-scope documentation. |

---

## 2. Post-MVP Roadmap (Future Scope)

The following capabilities are planned for post-hackathon development increments:

### Phase 11: Production OCR Integration (Future Scope)
- **Objective:** Support scanned, photographed, and non-selectable PDF/image circulars.
- **Reference Implementation:** An experimental prototype on the `feature/ai` branch integrates Sarvam AI's vision API with an offline Tesseract.js fallback.
- **Goal:** Stabilize error handling, manage latency, and merge into production.

### Phase 12: User Authentication & Multi-Tenancy (Future Scope)
- **Objective:** Add email/password and OAuth sign-in (e.g. NextAuth / Supabase Auth).
- **Goal:** Enable persistent user accounts across multiple browser devices and teams.

### Phase 13: Direct Calendar & Messaging Integrations (Future Scope)
- **Objective:** 2-way calendar sync via Google Calendar and Microsoft Graph APIs.
- **Goal:** Automatically push deadline alerts directly to calendar schedules and messaging webhooks (Slack / WhatsApp).
