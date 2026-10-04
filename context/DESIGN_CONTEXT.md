# Design Context & Direction: Document → Action Automator

**Hackathon:** WCC Launchpad 30  
**Project:** Document → Action Automator  

---

## 1. Design Philosophy

The product design is driven by a singular purpose: **helping users turn dense documents into clear, prioritized action as fast as possible.**

Every visual element must serve functional clarity. The product prioritizes legibility, scannability, and high-contrast information hierarchy over decorative trends.

### Core Visual Narrative

```
DOCUMENT (Source) ───► UNDERSTANDING (Transparent Processing) ───► ACTION (Clear Dashboard)
```

---

## 2. Design Characteristics

- **Minimal & Focused:** A clean canvas without visual clutter or overwhelming dashboards.
- **Professional & Purposeful:** Designed like a modern productivity tool (similar to Linear, Notion, or Stripe).
- **Practical & Scannable:** Action titles, deadlines, and priority tags should be readable in seconds.
- **Hackathon-Demo Friendly:** Instant feedback, obvious workflow, and intuitive next actions.
- **Responsive:** Fluid layout adaptable from mobile screens to desktop monitors.

---

## 3. What to Avoid (Anti-Patterns)

- **No oversized marketing landing pages:** The app should jump directly into the core workflow.
- **No excessive gradients or neon glows:** Keep color usage restrained and semantic.
- **No heavy glassmorphism or blurry card layers:** Keep cards crisp with clean borders and subtle depth.
- **No floating-card overload:** Group related information cohesively.
- **No excessive pills/tags:** Use badges strictly for actionable attributes (Priority, Category, Status).
- **No distracting or sluggish animations:** Animations should only indicate state progression (e.g. upload progress, step transitions).
- **No generic "AI Chatbot / Copilot" tropes:** This is a deterministic action extractor, not an open-ended chatbot.

---

## 4. Visual & Component Guidelines

### Color Palette (Semantic & Controlled)
- **Neutral Base:** Clean whites, slate/zinc backgrounds (`zinc-50` to `zinc-900`), and dark high-contrast typography for optimal readability.
- **Accents:** Restrained neutral/indigo or slate accents for active states and primary CTAs.
- **Priority Indicators:**
  - **High Priority:** Amber/Rose with high contrast badge styling.
  - **Medium Priority:** Warm Amber/Yellow badge styling.
  - **Low Priority:** Slate/Zinc badge styling.

### Typography
- Primary Font: Geist Sans (system fallback: `-apple-system, BlinkMacSystemFont, Segoe UI`).
- Hierarchy:
  - Clear Section Headers: Bold, concise labels (`h1` max 28–32px, `h2` 20–24px).
  - Data Labels: 12–14px uppercase tracking for metrics and category badges.
  - Action Titles: 16–18px medium-weight text for immediate scanning.

### Layout & Spacing
- Centered container with max-width (`max-w-5xl`) to prevent sprawling content on wide displays.
- Uniform padding and grid gaps (`gap-4`, `gap-6`).
- Unambiguous primary actions (e.g., "Analyze Document", "Reset / Upload Another").

---

## 5. Accessibility & Readability

- All text meets WCAG AA contrast standards.
- Visual status indicators are paired with descriptive text (never color alone).
- Clean keyboard navigation support for all upload and card actions.
