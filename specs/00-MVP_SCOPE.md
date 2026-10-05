# Specification 00: MVP Scope

**Project:** Doc2Action (Document → Action Automator)  
**Hackathon:** WCC Launchpad 30  
**Track:** Everyday Automation  
**Status:** Implemented & Verified on `main`  

---

## 1. Hackathon Objective

The primary goal for the WCC Launchpad 30 hackathon is to demonstrate a reliable, high-value, end-to-end workflow:
$$\text{Upload Document} \longrightarrow \text{Extract Text} \longrightarrow \text{AI Extraction} \longrightarrow \text{Database Persistence} \longrightarrow \text{Action Workspace} \longrightarrow \text{Export}$$

---

## 2. In-Scope (Implemented & Delivered on `main`)

| # | Feature / Capability | Description | Status |
|---|---|---|:---:|
| **1** | **Document Upload** | Drag-and-drop zone and native file picker supporting single & multi-file batches (up to 5 files, 10MB each). | **Delivered** |
| **2** | **Document Parsing** | Native text extraction for `.pdf` (`pdf-parse`), `.docx`/`.doc` (`mammoth`), and `.txt` files. | **Delivered** |
| **3** | **Processing State Machine** | 4-stage visual progress timeline (`Uploading` $\rightarrow$ `Extracting` $\rightarrow$ `Analyzing` $\rightarrow$ `Generating Actions`). | **Delivered** |
| **4** | **AI Action Extraction** | High-speed semantic extraction via Groq (`openai/gpt-oss-20b`) with low reasoning mode and strict JSON schema. | **Delivered** |
| **5** | **Deadlines & Events** | Detection of explicit due dates (`is_strict` flags) and scheduled events/meetings with location data. | **Delivered** |
| **6** | **Important Notes** | Extraction of non-actionable prerequisites, technical requirements, and policy notices. | **Delivered** |
| **7** | **Priority & Categorization** | Classification of tasks by priority (`High`, `Medium`, `Low`) and domain category (`Academic`, `Administrative`, `Finance`, `Event`, `General`). | **Delivered** |
| **8** | **Deterministic Deduplication**| Elimination of duplicate tasks across document chunks and batches based on normalized title and date matching. | **Delivered** |
| **9** | **Results Dashboard** | Summary metric counters, categorized action cards, deadlines timeline, and important note cards. | **Delivered** |
| **10** | **Database Persistence** | Relational persistence in PostgreSQL via Prisma ORM for workspaces, documents, actions, deadlines, events, and notes. | **Delivered** |
| **11** | **Anonymous Workspace** | Zero-friction browser session tracking using unique workspace IDs (no mandatory login). | **Delivered** |
| **12** | **"My Actions" Manager** | Consolidated task workspace with status toggles (Completed / Pending), urgency/priority sorting, and category filters. | **Delivered** |
| **13** | **Multi-Select Batch Actions** | Multi-select mode allowing batch completion, batch re-opening, and bulk deletion of tasks. | **Delivered** |
| **14** | **Document History** | Chronological record of previously analyzed documents with one-click reloading and bounded retention (20 documents). | **Delivered** |
| **15** | **Export Capabilities** | Client-side export to PDF Checklist (jsPDF vector document), CSV Spreadsheet (Excel UTF-8 BOM), Markdown Checklist, and Calendar (`.ics` RFC 5545). | **Delivered** |
| **16** | **Rate Limiting & Safety** | Rolling 60s TPM limiter, daily token quota detection, and safe error normalization (zero provider error leakage). | **Delivered** |

---

## 3. Out-of-Scope & Future Roadmap

To ensure hackathon execution discipline, the following were intentionally excluded from `main`:

- **OCR for Scanned Documents (Future Scope / Experimental):** An experimental prototype using Sarvam AI API with Tesseract fallback was explored on the `feature/ai` branch, but is **not merged into `main`** and is not part of the production deployment.
- **Traditional User Accounts & Auth:** No email/password registration or OAuth logins; the anonymous workspace model provides instant evaluation without onboarding friction.
- **Direct 2-Way Calendar Sync:** Direct OAuth integrations with Google Calendar or Microsoft Graph APIs (portable `.ics` calendar files are provided instead).
- **Automated Messaging & Webhooks:** No automatic WhatsApp dispatch, SMS, or Slack webhooks.
- **Billing & Subscriptions:** No payment gates or Stripe integration.
