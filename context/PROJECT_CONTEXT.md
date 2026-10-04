# Project Context: Document → Action Automator

**Hackathon:** WCC Launchpad 30  
**Project Name:** Document → Action Automator  
**Status:** In Progress (Phase 1 — Specifications)  

---

## 1. Project Overview

Document → Action Automator is an intelligent web application designed to bridge the gap between unstructured documents and everyday action. Users often receive notices, PDFs, circulars, syllabi, meeting minutes, and bills packed with dense text. Finding what needs to be done, when it is due, and what key dates matter is time-consuming and error-prone. 

This application automates document comprehension by extracting actionable tasks, deadlines, events, and essential takeaways into a structured dashboard.

---

## 2. Problem Statement

In academic, corporate, and administrative settings, information is distributed primarily through static documents (PDFs, images, circulars). 
- **Time sink:** Users spend significant time reading paragraphs to locate 1–2 key deadlines.
- **Missed obligations:** Important deadlines and high-priority action items buried in long documents are easily overlooked.
- **Cognitive friction:** Manually converting document text into calendar reminders or to-do list items creates friction.

---

## 3. Target Users

1. **Students & Academics:** Navigating college notices, exam schedules, assignment guidelines, and project submission circulars.
2. **Professionals & Knowledge Workers:** Reviewing memos, policies, compliance notices, and meeting minutes.
3. **General Consumers:** Reviewing bills, renewal notices, and administrative letters.

---

## 4. Core Value Proposition

Convert unstructured document noise into immediate, prioritized clarity:
$$\text{Document (Noise)} \longrightarrow \text{Automated Analysis} \longrightarrow \text{Prioritized Action Items (Clarity)}$$

---

## 5. Core Product Workflow

```
1. Upload Document ──► 2. Process & Analyze ──► 3. Extract Actions ──► 4. Display Results
```

1. **Upload:** User provides a document via drag-and-drop or file selector.
2. **Process:** System extracts text and runs analysis through processing pipeline.
3. **Extract:** System identifies actionable tasks, deadlines, events, priority levels, and categories.
4. **Display:** Results are presented in an organized action dashboard with summary metrics.

---

## 6. MVP Goal

Deliver a seamless, working end-to-end prototype for hackathon demonstration:
- Reliable document upload interface (PDF / text documents).
- Animated, transparent multi-step processing state feedback.
- Clear dashboard presenting extracted:
  - **Tasks / Actions:** What needs to be done.
  - **Deadlines / Dates:** When it is due.
  - **Priority:** High, Medium, Low.
  - **Events:** Relevant dates or meetings mentioned.
  - **Important Information:** Key notices or stipulations.

---

## 7. Non-Goals (Out of Scope for MVP)

To maintain focus during the hackathon, the following features are strictly **excluded** from the MVP:
- User authentication and persistent multi-tenant accounts (TBD for post-MVP).
- Direct calendar sync integrations (Google Calendar, Outlook) (TBD for post-MVP).
- Automated messaging / dispatch (WhatsApp, Slack, Email dispatch) (TBD for post-MVP).
- Payments or subscription gating.
- Collaborative multi-user editing and commenting.
- Complex analytics or history warehousing.

---

## 8. Technology Stack

- **Frontend:** Next.js `16.3.8` (App Router), React `19.2.8`, TypeScript `^5`
- **Styling:** Tailwind CSS `v4` (`@tailwindcss/postcss`)
- **Backend API:** TBD (Endpoints and backend framework to be finalized by backend team)
- **Document Processing / AI:** TBD (OCR and extraction engine specifications to be aligned)

---

## 9. Important Technical Constraints

1. **Dependency Discipline:** No unnecessary third-party libraries; prioritize native Next.js/React features and clean TypeScript.
2. **Backend Independence:** Frontend must interface through typed domain models so that mock analysis can be replaced by real backend APIs without touching UI components.
3. **Demo Readiness:** Responsive, stable, and instant visual feedback during all processing stages.
