# Design Context & Direction: Doc2Action

**Hackathon:** WCC Launchpad 30  
**Project:** Doc2Action (Document → Action Automator)  

---

## 1. Design Philosophy

The product design is driven by a singular purpose: **helping users turn dense documents into clear, prioritized action as fast as possible.**

Every visual element serves functional clarity. Doc2Action employs a sleek, modern dark-mode aesthetic with purposeful high-contrast accents, custom iconography, and micro-interactions designed to give users immediate feedback during all processing stages.

### Core Visual Flow

```
DOCUMENT (Source) ───► UNDERSTANDING (Transparent Multi-Step Processing) ───► ACTION (Clear Dashboard / Workspace)
```

---

## 2. Visual Identity & Palette

### Color System
- **Backgrounds:** Deep obsidian and midnight green hues (`#08120c`, `#0c150e`, `#09170f`) providing high contrast and visual depth.
- **Accents:** Neon lime / electric yellow (`#e8ff47`) used selectively for primary interactive elements, active tabs, progress highlights, and branding accents.
- **Surface Borders:** Subtle translucent borders (`border-[rgba(140,170,120,0.18)]`) establishing structural boundaries without visual noise.
- **Semantic Priority Colors:**
  - **High Priority:** Amber/Rose badges (`bg-rose-950/40 text-rose-300 border-rose-800/40`) signaling urgency and strict cutoffs.
  - **Medium Priority:** Warm Amber badges (`bg-amber-950/40 text-amber-300 border-amber-800/40`) for standard obligations.
  - **Low Priority:** Muted Zinc/Green badges (`bg-zinc-800/40 text-zinc-300 border-zinc-700/40`) for informational tasks.
- **Status Indicators:**
  - **Completed:** Emerald green (`text-emerald-400`, `bg-emerald-950/40`).
  - **Pending / In Progress:** Amber (`text-amber-400`).
  - **Overdue:** Rose red (`text-rose-400`).

### Typography
- **Primary Interface Font:** Clean sans-serif typography (`Geist Sans` with fallback to system fonts).
- **Metric Numbers:** Bold, high-visibility tracking numbers for task counts, deadlines, and events.
- **Code & Dates:** Monospace typography for dates, file sizes, and raw format tags (`font-mono text-xs`).

---

## 3. Key Components & Screens

1. **Upload Screen:** Centered drag-and-drop zone with multi-file support, file size/format badges, remove buttons, and a preloaded sample document quick-selector.
2. **Processing Screen:** Multi-stage animated progress card tracking `Uploading`, `Extracting`, `Analyzing`, and `Generating Actions` with stage-dependent progress feedback.
3. **Results Dashboard:** Summary metric cards, action cards with deadline tags and priority badges, calendar event listings, and important note cards.
4. **My Actions View:** Consolidated workspace task manager with status filters (`Total Tasks`, `Not Completed`, `Completed`), category filters, urgency sorting, multi-select mode with sticky batch actions, and export dropdown.
5. **Document History:** Chronological list of previously analyzed documents with one-click reloading and bounded retention.

---

## 4. Accessibility & Polish

- **High Contrast:** All interactive text meets WCAG AA standards against dark surfaces.
- **Interactive Feedback:** Hover animations, subtle scaling effects, loading spinners on export, and auto-dismissing toast notifications.
- **Full Responsiveness:** Layouts adapt smoothly from mobile screens (compact cards and full-width actions) to large desktop viewports.
