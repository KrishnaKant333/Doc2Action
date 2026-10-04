# Specification 00: MVP Scope

**Project:** Document → Action Automator  
**Hackathon:** WCC Launchpad 30  
**Status:** Approved Specification  

---

## 1. Hackathon Objective

The primary goal for the WCC Launchpad 30 hackathon is to demonstrate a **rock-solid, end-to-end working workflow**:
$$\text{Upload Document} \longrightarrow \text{Process / Analyze} \longrightarrow \text{Extract Actionable Info} \longrightarrow \text{Display Action Dashboard}$$

Completing this core loop reliably takes total precedence over adding secondary or tangential features.

---

## 2. In-Scope (MVP Requirements)

The following features constitute the core MVP:

| # | Feature / Capability | Description |
|---|---|---|
| **1** | **Document Upload** | Clean drag-and-drop zone and native file picker for user documents. |
| **2** | **Supported Document Handling** | Client-side file type and file size validation (PDF, TXT, DOCX/image as supported). |
| **3** | **Processing State** | Multi-step visual progress feedback (`Uploading` $\rightarrow$ `Extracting` $\rightarrow$ `Analyzing` $\rightarrow$ `Generating Actions`). |
| **4** | **Action Extraction** | Automated identification of discrete tasks and requirements within the document. |
| **5** | **Deadline Detection** | Extraction of associated due dates and explicit deadlines for each task. |
| **6** | **Event Extraction** | Identification of dates, meetings, seminars, or scheduled sessions mentioned in the document. |
| **7** | **Important Information** | Highlighting critical instructions, prerequisites, or policies. |
| **8** | **Priority & Categorization** | Classification of items by urgency (High, Medium, Low) and category (Academic, Admin, Finance, etc.). |
| **9** | **Results Dashboard** | Summary metric counts (total actions, deadlines, events) and structured action cards. |
| **10** | **Responsive Design** | Functional and visually coherent experience across mobile, tablet, and desktop viewports. |

---

## 3. Out-of-Scope (Strictly Excluded for MVP)

To avoid scope creep and ensure hackathon delivery, the following are **not included** unless explicitly approved:

- **User Accounts & Authentication:** No sign-up, login, password reset, or session management.
- **Persistent Multi-Tenant Database:** No cross-session user data storage or cloud user profiles.
- **Direct Calendar Integrations:** No direct OAuth sync to Google Calendar, Outlook, or Apple Calendar.
- **Automated Messaging & Notifications:** No automated WhatsApp dispatch, SMS, Slack webhooks, or automated emails.
- **Monetization & Billing:** No Stripe, payment gates, or subscription tiers.
- **Advanced Analytics & Historical Trends:** No historical charts or cross-document analytics.
- **Collaboration Features:** No multi-user editing, commenting, or sharing permissions.
- **Large Marketing Website:** No multi-page marketing site or bloated landing pages.
- **Unnecessary AI Features:** No open-ended conversational chatbots or unconstrained generative writing.

---

## 4. MVP Success Criteria

1. A user can select or drop a sample document (e.g., college notice).
2. The user sees clear, reassuring visual feedback as the system processes the document.
3. The user receives a clean, prioritized list of actionable items with deadlines and priority badges within seconds.
4. The user can easily understand what actions they must take next.
