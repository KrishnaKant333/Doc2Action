# Specification 05: UX Flow & Interaction States

**Project:** Document → Action Automator  
**Status:** Approved Specification  

---

## 1. End-to-End User Journey

```
[ Step 1: Open App ]
         │
         ▼
[ Step 2: View Upload Interface ] ◄── (Empty State)
         │
         ▼
[ Step 3 & 4: Select / Drop Document ] ──► (Selected File State)
         │
         ▼
[ Step 5: Click "Analyze Document" ]
         │
         ▼
[ Step 6: Processing & Progress Animation ] ──► (Uploading / Extracting / Analyzing)
         │
         ▼
[ Step 7 & 8: Display Results Dashboard ] ──► (Success State)
         │
         ▼
[ Step 9: User Reviews Actions & Deadlines ]
         │
         ▼
[ Optional: "Upload Another" / Reset ] ──► Return to Step 2
```

---

## 2. Interaction States Breakdown

### 1. Empty State (Initial Load)
- **Visuals:** Prominent upload card with dropzone icon, informative copy, accepted file types, and a preloaded sample document quick-selector.
- **Action:** Primary "Analyze Document" CTA is disabled until a file is selected.

### 2. Selected File State
- **Visuals:** Dropzone transitions to reveal a clean file summary card showing:
  - File name
  - Formatted file size
  - Document icon
  - Remove / Change File button
- **Action:** Primary "Analyze Document" CTA is highlighted and enabled.

### 3. Uploading & Processing State
- **Visuals:** Upload card transitions into a focused progress timeline:
  - Progress bar / percentage or step indicator.
  - Active step with animated pulse:
    - `Uploading` $\rightarrow$ `Extracting` $\rightarrow$ `Analyzing` $\rightarrow$ `Generating Actions`
- **Action:** Background interaction is locked to prevent accidental duplicate submissions.

### 4. Success State (Action Dashboard)
- **Visuals:** Smooth reveal of the dashboard view:
  - Header with document title and timestamp.
  - Summary metrics row (Actions, Deadlines, Events count).
  - Categorized/filtered action card list with priority tags and due dates.
  - Section for important notes or general events.
- **Action:** Ability to filter items, mark items as completed/reviewed, or click "Analyze Another Document" to reset.

### 5. Error State
- **Visuals:** Clean, non-alarming error card detailing the issue (e.g. unsupported format, corrupted file, or processing timeout).
- **Action:** Clear "Try Again" or "Choose Another Document" CTA.

### 6. No Actionable Items Found State
- **Visuals:** Reassuring empty-results card stating that the document was analyzed successfully, but no direct deadlines or urgent tasks were identified.
- **Action:** Quick CTA to upload a different document.
