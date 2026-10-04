# Specification 01: Frontend Specification

**Project:** Document → Action Automator  
**Status:** Approved Specification  

---

## 1. Overview

The frontend delivers an accessible, uncluttered, and responsive user experience for the core Document $\rightarrow$ Action workflow. It is built as a single orchestrated user journey with three primary views:

1. **Upload Screen**
2. **Processing Screen**
3. **Results / Action Dashboard**

All components are designed to be backend-independent, consuming typed interfaces defined in [specs/04-DATA_MODEL.md](04-DATA_MODEL.md).

---

## 2. Screen Specifications

### Screen 1: Upload Screen
Provides an immediate, intuitive file submission interface.
- **Drag-and-Drop Area:** Visual dropzone with distinct drag-over hover feedback.
- **Browse Files Button:** Native file input trigger allowing document selection.
- **Supported File Types:** Visual notice displaying accepted formats (e.g., `.pdf`, `.txt`, `.docx` — exact supported formats TBD by backend capability).
- **File Validation & Constraints:** Client-side check for supported format and maximum file size (default limit: 10MB, TBD).
- **Selected File Display / Preview:**
  - File name, file size (formatted in KB/MB), and file type icon.
  - Option to remove or replace the selected file.
- **Primary CTA:** "Analyze Document" button, enabled only when a valid file is selected.
- **Sample Document Quick-Picker (Demo Booster):** Ability to pick a preloaded sample document (e.g. "College Notice PDF", "Project Brief") to speed up demonstrations.

---

### Screen 2: Processing Screen
Maintains user engagement and transparency while the document is analyzed.
- **Multi-Step Progress Indicator:**
  1. `Uploading` — Document payload transfer
  2. `Extracting` — Document text parsing / OCR
  3. `Analyzing` — Semantic parsing of dates, requirements, and directives
  4. `Generating Actions` — Formatting actions, deadlines, priorities, and events
- **Visual Feedback:** Active step pulse, completed step checks, and clear textual descriptions.
- **Error Handling State:** Clear error message with retry or upload-different-file button if processing fails.

---

### Screen 3: Results / Action Dashboard
Displays extracted actionable items with clear visual hierarchy.

#### Summary Metrics Row
Three distinct counter cards:
- **Total Actions Detected**
- **Total Deadlines Detected**
- **Total Events Detected**

#### Action Items List / Cards
Each extracted action item displays:
- **Title:** Crisp, imperative action statement (e.g., *"Submit project report"*).
- **Description:** Contextual explanation and details extracted from the document.
- **Deadline:** Explicit due date/time with visual urgency indicator.
- **Priority Badge:** High (urgent/strict penalty), Medium (normal obligation), Low (optional/informational).
- **Category Badge:** Contextual grouping (e.g., Academic, Administrative, Financial, Event).
- **Status:** Initial status (e.g., Pending, In Progress, Completed).

#### Dashboard Controls
- **Filter / Tab Controls:** Quick filter by priority (All, High, Medium, Low) or category.
- **Reset / Analyze Another Document CTA:** Allows user to return smoothly to the Upload Screen.

---

## 3. Architecture Principles

1. **State Independence:** The UI flow (`upload` $\rightarrow$ `processing` $\rightarrow$ `dashboard`) is driven by state machine props, making it decoupled from whether the source data comes from a mock adapter or a real HTTP endpoint.
2. **Atomic UI Primitives:** Reusable components (Card, Badge, Button, ProgressIndicator, Modal) reside under `src/components/ui/`.
3. **Pure Presentation:** Components do not embed hardcoded API fetch calls; they receive data and callbacks via props or dedicated service hooks.
