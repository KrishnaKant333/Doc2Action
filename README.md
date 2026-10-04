# Document → Action Automator

> Automated extraction of actionable tasks, deadlines, and events from notices, circulars, and documents.

**Hackathon:** WCC Launchpad 30  
**Current Phase:** Phase 1 — Project Context and Specifications  

---

## Problem & Solution

- **The Problem:** People constantly receive notices, circulars, PDFs, and invoices. Manually reading through pages to find what action is required, who needs to do it, and when the deadline is leads to missed deadlines and manual overhead.
- **The Solution:** An automator that takes documents as input, processes and analyzes the text, and extracts structured, actionable items (tasks, deadlines, priorities, events, and key notices) into an intuitive dashboard.

---

## Core Workflow

```
Upload Document ───► Analyze Document ───► Extract Actions ───► View Results
```

### Example
- **Input Document:** College notice stating: *"Submit the project report by 15 October."*
- **Extracted Action:**
  - **Task:** Submit project report
  - **Deadline:** 15 October
  - **Priority:** High
  - **Category:** Submission / Academic

---

## Tech Stack

- **Framework:** [Next.js](https://nextjs.org/) `16.3.8` (App Router, Turbopack)
- **UI Library:** [React](https://react.dev/) `19.2.8`
- **Language:** [TypeScript](https://www.typescriptlang.org/) `^5` (strict mode, `@/*` alias)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) `v4` (`@tailwindcss/postcss`)
- **Linter:** ESLint `^9` (`eslint-config-next`)

---

## Repository Structure

```text
Doc2Action/
├── context/                   # Project, team, and design context
│   ├── PROJECT_CONTEXT.md
│   ├── TEAM_CONTEXT.md
│   └── DESIGN_CONTEXT.md
├── specs/                     # Architecture, specifications, and contracts
│   ├── 00-MVP_SCOPE.md
│   ├── 01-FRONTEND_SPEC.md
│   ├── 02-BACKEND_CONTRACT.md
│   ├── 03-DOCUMENT_PROCESSING_CONTRACT.md
│   ├── 04-DATA_MODEL.md
│   ├── 05-UX_FLOW.md
│   ├── 06-GIT_WORKFLOW.md
│   └── 07-IMPLEMENTATION_PLAN.md
├── public/                    # Static assets
├── src/
│   └── app/                   # App Router pages and global styles
│       ├── globals.css
│       ├── layout.tsx
│       └── page.tsx
├── package.json
└── tsconfig.json
```

---

## Development Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run linting
npm run lint

# Create production build
npm run build
```

The application runs on `http://localhost:3000`.

---

## Project Documentation Index

- **Context:**
  - [PROJECT_CONTEXT.md](context/PROJECT_CONTEXT.md) — Core problem, target users, constraints, and MVP boundary
  - [TEAM_CONTEXT.md](context/TEAM_CONTEXT.md) — Roles, collaboration principles, and responsibilities
  - [DESIGN_CONTEXT.md](context/DESIGN_CONTEXT.md) — Design system, aesthetics, and usability guidelines
- **Specifications:**
  - [00-MVP_SCOPE.md](specs/00-MVP_SCOPE.md) — In-scope vs out-of-scope boundaries
  - [01-FRONTEND_SPEC.md](specs/01-FRONTEND_SPEC.md) — Screen requirements and frontend architecture
  - [02-BACKEND_CONTRACT.md](specs/02-BACKEND_CONTRACT.md) — Conceptual frontend/backend communication contract
  - [03-DOCUMENT_PROCESSING_CONTRACT.md](specs/03-DOCUMENT_PROCESSING_CONTRACT.md) — Extraction and parsing pipeline
  - [04-DATA_MODEL.md](specs/04-DATA_MODEL.md) — Domain types and interfaces
  - [05-UX_FLOW.md](specs/05-UX_FLOW.md) — User journey and interaction states
  - [06-GIT_WORKFLOW.md](specs/06-GIT_WORKFLOW.md) — Branching, commits, and PR standards
  - [07-IMPLEMENTATION_PLAN.md](specs/07-IMPLEMENTATION_PLAN.md) — Phased roadmap and status

---

## Development Principles

1. **Feature Branching:** Never commit directly to `main`. Work on `frontend/<name>` or `backend/<name>`.
2. **Backend Decoupling:** Build frontend components around domain contracts, allowing mock services to be swapped with live APIs without component refactoring.
3. **Clean Code & Strict TypeScript:** Keep components small, reusable, and free of unnecessary third-party dependencies.
4. **MVP Focus:** Adhere strictly to [00-MVP_SCOPE.md](specs/00-MVP_SCOPE.md). Avoid premature optimizations or out-of-scope features.
