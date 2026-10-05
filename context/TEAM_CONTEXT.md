# Team Context & Collaboration: Doc2Action

**Hackathon:** WCC Launchpad 30  
**Project:** Doc2Action (Document → Action Automator)  
**Track:** Everyday Automation  

---

## 1. Project Roles & Final Ownership

| Role | Team Member | Implemented Scope / Responsibilities |
|---|---|---|
| **Frontend Engineering & UX** | Yash (`frontend/yash`) | Upload interface, multi-file validation, processing state machine, dashboard UI, domain types, client-side services |
| **Backend & Persistence** | Krishna Kant (`main`, `integration`) | Next.js App Router API endpoints (`/api/analyze`, `/api/actions`, `/api/history`, `/api/documents`), Prisma ORM schema & migrations, PostgreSQL database integration |
| **AI Pipeline & Extraction** | Krishna Kant / Team | Groq SDK integration (`openai/gpt-oss-20b`), prompt engineering with strict JSON schema, chunking engine, token budget rate limiter, entity normalization & deduplication |
| **Task Management & Export** | Krishna Kant (`main`) | Consolidated "My Actions" workspace, status toggles, urgency sorting, multi-select batch controls, client-side export engine (PDF, CSV, MD, ICS) |
| **Experimental OCR** | Prathik (`feature/ai`) | Exploration and prototyping of Sarvam AI API and Tesseract OCR fallback for scanned/image documents (experimental, unmerged branch) |

---

## 2. Area Boundaries & Verification

### Stable Main Branch (`main`)
- Represents the official hackathon submission and live deployment.
- Contains the fully verified end-to-end flow: Document Upload $\rightarrow$ Text Extraction $\rightarrow$ Groq AI Analysis $\rightarrow$ Prisma/PostgreSQL Persistence $\rightarrow$ Dashboard / My Actions $\rightarrow$ Export.
- Processes digital documents (PDF, DOCX, TXT) natively.

### Experimental AI Branch (`feature/ai`)
- Contains experimental work on OCR pipelines for scanned/image files using Sarvam AI and Tesseract.
- Kept strictly separate from `main` to preserve production stability during judge evaluations.

---

## 3. Team Collaboration Principles

1. **Feature Isolation:** Experimental and unvalidated features remain on dedicated branches until thoroughly verified.
2. **Stable `main`:** The `main` branch is always kept build-clean and deployable.
3. **Decoupled Architecture:** Client-side components consume typed domain interfaces (`src/lib/types/action.ts`), isolating UI presentation from underlying API protocols.
4. **Security Discipline:** API keys and database credentials are kept exclusively in environment variables and never committed to source control.
