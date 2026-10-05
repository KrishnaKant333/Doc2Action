# Specification 06: Git Workflow & Branch Taxonomy

**Project:** Doc2Action (Document → Action Automator)  
**Status:** Approved & Finalized  

---

## 1. Branch Taxonomy & Roles

```
origin/main (Production / Stable / Official Hackathon Submission)
 │
 ├──► frontend/yash       (Frontend UI components & mock service)
 ├──► integration         (Full-stack API & Prisma database integration)
 └──► feature/ai          (EXPERIMENTAL: Sarvam AI & Tesseract OCR prototype - UNMERGED)
```

### The `main` Branch (Production / Stable)
- The official, verified submission for hackathon evaluation and production deployment.
- Contains the complete, working Document $\rightarrow$ Action pipeline:
  - Document text extraction (PDF, DOCX, TXT).
  - Groq AI extraction (`openai/gpt-oss-20b`, low reasoning, structured JSON).
  - PostgreSQL database persistence via Prisma ORM.
  - Consolidated "My Actions" task manager and multi-select batch controls.
  - Client-side export engine (PDF, CSV, Markdown, ICS).
- Guaranteed to pass `npm run build`, `npm run lint`, and TypeScript compilation cleanly.

### The `feature/ai` Branch (Experimental / Unmerged)
- Development branch containing experimental OCR exploration authored by Prathik.
- Prototypes image/scanned document processing using the **Sarvam AI Vision API** with an offline **Tesseract.js** fallback.
- **Strictly unmerged from `main`** to avoid introducing experimental dependencies or breaking the stable evaluation pipeline.

---

## 2. Collaboration & Submission Standards

1. **Production Sanctity:** The `main` branch is the sole evaluation baseline for hackathon judges.
2. **Feature Isolation:** Unstable or experimental prototypes remain quarantined on feature branches.
3. **Clean Build Guarantee:** Any commit on `main` must compile cleanly without TypeScript or ESLint errors:
   ```bash
   npm run lint
   npm run build
   ```
4. **No Secret Commits:** `.env.local` is git-ignored. API keys and connection strings are strictly kept out of version control.
