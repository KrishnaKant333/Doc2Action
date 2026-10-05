# Specification 05: UX Flow & Interaction States

**Project:** Doc2Action (Document → Action Automator)  
**Status:** Implemented & Verified on `main`  

---

## 1. End-to-End User Journeys

Doc2Action provides a cohesive experience centered on turning static files into organized action:

```
[ Primary Intake Flow ]
Upload / Drop Document(s) ──► Processing Progress ──► Results Dashboard ──► My Actions Workspace
                                                                                │
                                                    ┌───────────────────────────┴───────────────────────────┐
                                                    ▼                                                       ▼
                                       Task Completion & Multi-Select                              Client-Side Export
                                       (Toggle, Sort, Filter, Delete)                          (PDF, CSV, Markdown, ICS)
```

---

## 2. Journey Breakdown

### Journey 1: Document Intake & Processing
1. **Empty State:** User arrives at the root route (`/`). A modern dark-mode upload zone presents drag-and-drop feedback, format notices (`.pdf`, `.docx`, `.doc`, `.txt`), file size limits (10MB), and preloaded sample document buttons.
2. **File Selection:** User drops or selects 1–5 files. Selected files appear in a preview list with size, format badge, and remove controls.
3. **Processing:** Clicking "Analyze Document(s)" activates the multi-stage progress screen:
   - `Uploading` $\rightarrow$ `Extracting` $\rightarrow$ `Analyzing` $\rightarrow$ `Generating Actions`.
   - Real-time stage indicators and overall percentage keep the user informed.
4. **Results Presentation:** Results dashboard reveals summary metric counters, categorized action cards with deadline tags and priority badges, scheduled events, and important notes.

---

### Journey 2: Consolidated "My Actions" Workspace
1. **Access:** Accessible anytime via the "My Actions" tab in the top navigation bar.
2. **Metric Filters:** Three interactive cards at the top:
   - **Total Tasks:** Displays all workspace actions.
   - **Not Completed:** Filters strictly for pending obligations.
   - **Completed:** Filters strictly for accomplished tasks.
3. **Category Selector:** Dropdown to isolate actions by domain (Academic, Administrative, Finance, Event, General).
4. **Sorting:** Sort actions by Urgency (due soonest), Priority (High $\rightarrow$ Low), Title (A $\rightarrow$ Z), or Newest Added.
5. **Interactive Checkbox:** Clicking a card's checkbox instantly toggles completion status with optimistic UI updates and immediate PostgreSQL synchronization.

---

### Journey 3: Multi-Select Batch Operations
1. **Activation:** Clicking "Select Tasks" opens multi-select mode.
2. **Sticky Batch Toolbar:** A floating glassmorphism toolbar anchors to the screen showing:
   - Selected count (`X of Y Selected`).
   - "Select All Visible" / "Deselect All" quick toggle.
   - "Mark Completed" batch action.
   - "Mark Not Completed" batch action.
   - "Delete" batch action (opens an accessible confirmation modal).
   - "Export Selected" dropdown menu.
3. **Exit:** Clicking "Done Selecting" or the exit icon cleanly restores standard browsing mode.

---

### Journey 4: Action Export
1. **Toolbar Trigger:** Clicking "Export" in the controls toolbar or batch toolbar opens the export dropdown menu.
2. **Target Scope:** Automatically exports visible tasks (respecting active status and category filters) or selected tasks if in multi-select mode.
3. **Format Options:**
   - **PDF Checklist:** Formatted A4 checklist document with dynamic page breaks and metadata.
   - **CSV Spreadsheet:** RFC 4180 CSV with UTF-8 BOM for Microsoft Excel and Google Sheets.
   - **Markdown Checklist:** Clean checklist with `- [ ]` and `- [x]` syntax for Notion and Obsidian.
   - **Calendar (`.ics`):** RFC 5545 iCalendar schedule with all-day events for date cutoffs and UTC timestamps for meetings.
4. **Feedback:** Instant browser file download accompanied by a non-intrusive, auto-dismissing toast notification.

---

### Journey 5: Document History
1. **Access:** Click the "History" tab in the top navigation.
2. **Chronological Records:** Review previously analyzed documents, upload timestamps, file sizes, and extracted action counts.
3. **Inspection:** Click any document to view its specific action items.
4. **Deletion:** Delete historical documents to remove them and their associated actions from the workspace.
