import { jsPDF } from "jspdf";
import type { ActionItem } from "../types/action";

export interface ExportOptions {
  scopeLabel?: string; // e.g. "All Tasks", "Pending (Academic)", "3 Selected Tasks"
  filenamePrefix?: string;
}

/**
 * Triggers a browser file download using a Blob and anchor element.
 */
function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Formats a clean date string for file naming (e.g., "2026-10-05").
 */
function getFileDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Formats a human-readable timestamp (e.g., "October 5, 2026 at 01:45 AM").
 */
function getReadableTimestamp(): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date());
}

/**
 * 1. CSV SPREADSHEET EXPORT
 * Standard CSV with UTF-8 BOM, escaped values, and clean tabular layout.
 */
export function exportToCsv(
  actions: ActionItem[],
  options?: ExportOptions
): { success: boolean; count: number; error?: string } {
  if (actions.length === 0) {
    return { success: false, count: 0, error: "No actions available to export." };
  }

  const escapeCsv = (val: string | null | undefined): string => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const headers = [
    "Title",
    "Description",
    "Status",
    "Priority",
    "Category",
    "Deadline",
    "Source Document",
  ];

  const rows = actions.map((item) => [
    escapeCsv(item.title),
    escapeCsv(item.description),
    escapeCsv(item.status === "completed" ? "Completed" : "Pending"),
    escapeCsv(item.priority.toUpperCase()),
    escapeCsv(item.category),
    escapeCsv(item.deadline || "None"),
    escapeCsv(item.sourceDocument || "N/A"),
  ]);

  const csvContent =
    "\uFEFF" + // UTF-8 Byte Order Mark for Excel compatibility
    headers.join(",") +
    "\r\n" +
    rows.map((r) => r.join(",")).join("\r\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const filename = `${options?.filenamePrefix || "Doc2Action_Actions"}_${getFileDateString()}.csv`;
  downloadBlob(blob, filename);

  return { success: true, count: actions.length };
}

/**
 * 2. MARKDOWN CHECKLIST EXPORT
 * Clean, portable checklist suitable for Obsidian, Notion, GitHub, and text editors.
 */
export function exportToMarkdown(
  actions: ActionItem[],
  options?: ExportOptions
): { success: boolean; count: number; error?: string } {
  if (actions.length === 0) {
    return { success: false, count: 0, error: "No actions available to export." };
  }

  const pending = actions.filter((a) => a.status !== "completed");
  const completed = actions.filter((a) => a.status === "completed");

  const lines: string[] = [];
  lines.push("# Doc2Action — Action Plan");
  lines.push("");
  lines.push(`**Generated:** ${getReadableTimestamp()}`);
  if (options?.scopeLabel) {
    lines.push(`**Export Scope:** ${options.scopeLabel}`);
  }
  lines.push(
    `**Total Tasks:** ${actions.length} (${pending.length} Pending, ${completed.length} Completed)`
  );
  lines.push("");
  lines.push("---");
  lines.push("");

  if (pending.length > 0) {
    lines.push(`## Pending Obligations (${pending.length})`);
    lines.push("");
    for (const item of pending) {
      lines.push(`- [ ] **${item.title}**`);
      if (item.priority) {
        lines.push(`  - **Priority:** ${item.priority.toUpperCase()}`);
      }
      if (item.category) {
        lines.push(`  - **Category:** ${item.category}`);
      }
      if (item.deadline) {
        lines.push(`  - **Deadline:** ${item.deadline}`);
      }
      if (item.sourceDocument) {
        lines.push(`  - **Source:** ${item.sourceDocument}`);
      }
      if (item.description) {
        lines.push(`  - **Details:** ${item.description}`);
      }
      lines.push("");
    }
  }

  if (completed.length > 0) {
    lines.push(`## Completed Tasks (${completed.length})`);
    lines.push("");
    for (const item of completed) {
      lines.push(`- [x] **${item.title}**`);
      if (item.priority) {
        lines.push(`  - **Priority:** ${item.priority.toUpperCase()}`);
      }
      if (item.category) {
        lines.push(`  - **Category:** ${item.category}`);
      }
      if (item.deadline) {
        lines.push(`  - **Deadline:** ${item.deadline}`);
      }
      if (item.sourceDocument) {
        lines.push(`  - **Source:** ${item.sourceDocument}`);
      }
      if (item.description) {
        lines.push(`  - **Details:** ${item.description}`);
      }
      lines.push("");
    }
  }

  const blob = new Blob([lines.join("\n")], {
    type: "text/markdown;charset=utf-8;",
  });
  const filename = `${options?.filenamePrefix || "Doc2Action_Actions"}_${getFileDateString()}.md`;
  downloadBlob(blob, filename);

  return { success: true, count: actions.length };
}

/**
 * 3. PDF CHECKLIST / REPORT EXPORT
 * Professional, vector-crisp PDF document with page-break handling, checkboxes, and metadata.
 */
export function exportToPdf(
  actions: ActionItem[],
  options?: ExportOptions
): { success: boolean; count: number; error?: string } {
  if (actions.length === 0) {
    return { success: false, count: 0, error: "No actions available to export." };
  }

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let y = 18;

  // Header Helper
  const printHeader = (isFirstPage: boolean) => {
    if (isFirstPage) {
      // Primary Title
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.setTextColor(15, 23, 42); // slate-900
      doc.text("Doc2Action — Action Plan", margin, y);
      y += 6;

      // Subtitle
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(71, 85, 105); // slate-600
      doc.text("Document → Action Automator Checklist & Obligations Report", margin, y);
      y += 6;

      // Metadata summary bar
      const pendingCount = actions.filter((a) => a.status !== "completed").length;
      const completedCount = actions.filter((a) => a.status === "completed").length;
      const metaText = `Generated: ${getReadableTimestamp()}  |  Scope: ${
        options?.scopeLabel || "All Visible Tasks"
      }  |  Total: ${actions.length} (${pendingCount} Pending, ${completedCount} Completed)`;

      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139); // slate-500
      doc.text(metaText, margin, y);
      y += 4;

      // Divider line
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.setLineWidth(0.4);
      doc.line(margin, y, pageWidth - margin, y);
      y += 8;
    } else {
      // Running header on page 2+
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text("Doc2Action — Action Plan (Continued)", margin, 12);
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.2);
      doc.line(margin, 14, pageWidth - margin, 14);
      y = 20;
    }
  };

  printHeader(true);

  // Group actions: Pending first, then Completed
  const pendingActions = actions.filter((a) => a.status !== "completed");
  const completedActions = actions.filter((a) => a.status === "completed");

  const groups = [
    { title: "Pending Obligations", items: pendingActions, isCompleted: false },
    { title: "Completed Tasks", items: completedActions, isCompleted: true },
  ];

  for (const group of groups) {
    if (group.items.length === 0) continue;

    // Check if section header fits on page
    if (y + 12 > pageHeight - margin) {
      doc.addPage();
      printHeader(false);
    }

    // Section Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    if (group.isCompleted) {
      doc.setTextColor(4, 120, 87); // emerald-700
    } else {
      doc.setTextColor(180, 83, 9); // amber-700
    }
    doc.text(`${group.title} (${group.items.length})`, margin, y);
    y += 6;

    // Render items in this section
    for (const item of group.items) {
      // Estimate card height to prevent broken/cut-off content across page boundaries
      const titleLines = doc.splitTextToSize(item.title, contentWidth - 12);
      const descLines = item.description
        ? doc.splitTextToSize(item.description, contentWidth - 12)
        : [];
      
      const itemHeight =
        6 +
        titleLines.length * 4.5 +
        (descLines.length > 0 ? descLines.length * 3.8 + 2 : 0) +
        4; // tags row + padding

      // If item doesn't fit on current page, cleanly wrap to next page
      if (y + itemHeight > pageHeight - margin) {
        doc.addPage();
        printHeader(false);
      }

      // Draw Checkbox
      const boxSize = 3.6;
      doc.setDrawColor(148, 163, 184); // slate-400
      doc.setLineWidth(0.3);
      if (group.isCompleted) {
        // Filled checkbox with checkmark
        doc.setFillColor(16, 185, 129); // emerald-500
        doc.rect(margin, y - 3.2, boxSize, boxSize, "FD");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(7);
        doc.text("v", margin + 0.9, y - 0.7);
      } else {
        // Open checkbox
        doc.setFillColor(255, 255, 255);
        doc.rect(margin, y - 3.2, boxSize, boxSize, "D");
      }

      // Action Title
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      if (group.isCompleted) {
        doc.setTextColor(100, 116, 139); // slate-500
      } else {
        doc.setTextColor(15, 23, 42); // slate-900
      }
      doc.text(titleLines, margin + 6, y);
      y += titleLines.length * 4.5;

      // Metadata Tags Row (Priority, Category, Deadline, Source)
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);

      let tagX = margin + 6;

      // Priority tag
      const prio = (item.priority || "medium").toUpperCase();
      if (prio === "HIGH") {
        doc.setTextColor(185, 28, 28); // red-700
      } else if (prio === "MEDIUM") {
        doc.setTextColor(180, 83, 9); // amber-700
      } else {
        doc.setTextColor(4, 120, 87); // emerald-700
      }
      doc.text(`[${prio}]`, tagX, y);
      tagX += doc.getTextWidth(`[${prio}]`) + 3;

      // Category tag
      doc.setTextColor(71, 85, 105);
      const cat = item.category ? `Category: ${item.category}` : "";
      if (cat) {
        doc.text(cat, tagX, y);
        tagX += doc.getTextWidth(cat) + 3;
      }

      // Deadline tag
      if (item.deadline) {
        doc.setTextColor(180, 83, 9);
        const dl = `Due: ${item.deadline}`;
        doc.text(dl, tagX, y);
        tagX += doc.getTextWidth(dl) + 3;
      }

      // Source Document tag
      if (item.sourceDocument) {
        doc.setTextColor(100, 116, 139);
        const src = `Source: ${item.sourceDocument}`;
        doc.text(src, tagX, y);
      }

      y += 4;

      // Description text (if present)
      if (descLines.length > 0) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        doc.setTextColor(71, 85, 105); // slate-600
        doc.text(descLines, margin + 6, y);
        y += descLines.length * 3.8 + 1;
      }

      y += 3; // Space between cards
    }

    y += 4; // Space between sections
  }

  // Print Page Numbers in Footer across all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text(
      `Doc2Action · Page ${i} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 8,
      { align: "center" }
    );
  }

  const filename = `${options?.filenamePrefix || "Doc2Action_Actions"}_${getFileDateString()}.pdf`;
  doc.save(filename);

  return { success: true, count: actions.length };
}

/**
 * 4. CALENDAR (.ICS) EXPORT (Bonus)
 * Standard iCalendar RFC 5545 file with exact deadlines / all-day events.
 * Never invents times that were not present in the extracted data.
 */
export function exportToIcs(
  actions: ActionItem[],
  options?: ExportOptions
): { success: boolean; count: number; error?: string } {
  // Filter actions that have deadlines
  const itemsWithDeadlines = actions.filter((a) => Boolean(a.deadline));

  if (itemsWithDeadlines.length === 0) {
    return {
      success: false,
      count: 0,
      error: "No actions with explicit deadlines found to export to Calendar.",
    };
  }

  const pad = (n: number) => String(n).padStart(2, "0");

  const icsLines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Doc2Action//Action Automator//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ];

  for (const item of itemsWithDeadlines) {
    const rawDeadline = (item.deadline || "").trim();
    if (!rawDeadline) continue;

    // Check if deadline is date-only (e.g. "2026-10-15" or "2026/10/15")
    const isDateOnly =
      /^\d{4}[-/.]\d{2}[-/.]\d{2}$/.test(rawDeadline) ||
      !/(T|\d{1,2}:\d{2}|AM|PM)/i.test(rawDeadline);

    const parsedDate = new Date(rawDeadline);
    const isValid = !isNaN(parsedDate.getTime());

    let dtStartLine = "";
    let dtEndLine = "";

    if (isValid && isDateOnly) {
      // All-day event: DTSTART;VALUE=DATE:YYYYMMDD
      const y = parsedDate.getFullYear();
      const m = pad(parsedDate.getMonth() + 1);
      const d = pad(parsedDate.getDate());
      const nextDay = new Date(parsedDate.getTime() + 24 * 60 * 60 * 1000);
      const ey = nextDay.getFullYear();
      const em = pad(nextDay.getMonth() + 1);
      const ed = pad(nextDay.getDate());

      dtStartLine = `DTSTART;VALUE=DATE:${y}${m}${d}`;
      dtEndLine = `DTEND;VALUE=DATE:${ey}${em}${ed}`;
    } else if (isValid) {
      // Timestamped event with exact time
      const y = parsedDate.getUTCFullYear();
      const m = pad(parsedDate.getUTCMonth() + 1);
      const d = pad(parsedDate.getUTCDate());
      const hh = pad(parsedDate.getUTCHours());
      const mm = pad(parsedDate.getUTCMinutes());
      const ss = pad(parsedDate.getUTCSeconds());

      dtStartLine = `DTSTART:${y}${m}${d}T${hh}${mm}${ss}Z`;
      // Default 1 hour duration
      const end = new Date(parsedDate.getTime() + 60 * 60 * 1000);
      const ey = end.getUTCFullYear();
      const em = pad(end.getUTCMonth() + 1);
      const ed = pad(end.getUTCDate());
      const ehh = pad(end.getUTCHours());
      const emm = pad(end.getUTCMinutes());
      const ess = pad(end.getUTCSeconds());
      dtEndLine = `DTEND:${ey}${em}${ed}T${ehh}${emm}${ess}Z`;
    } else {
      // Fallback: Skip unparseable dates to avoid corrupting calendar
      continue;
    }

    const uid = `${item.id}@doc2action.local`;
    const cleanSummary = item.title.replace(/[\r\n]/g, " ");
    const cleanDescription = (
      (item.description || "") +
      (item.sourceDocument ? `\\nSource: ${item.sourceDocument}` : "")
    ).replace(/[\r\n]+/g, "\\n");

    const priorityMap = { high: "1", medium: "5", low: "9" };
    const priority = priorityMap[item.priority] || "5";
    const status = item.status === "completed" ? "COMPLETED" : "NEEDS-ACTION";

    icsLines.push("BEGIN:VEVENT");
    icsLines.push(`UID:${uid}`);
    icsLines.push(`SUMMARY:${cleanSummary}`);
    if (cleanDescription) {
      icsLines.push(`DESCRIPTION:${cleanDescription}`);
    }
    icsLines.push(dtStartLine);
    icsLines.push(dtEndLine);
    icsLines.push(`PRIORITY:${priority}`);
    icsLines.push(`STATUS:${status}`);
    if (item.category) {
      icsLines.push(`CATEGORIES:${item.category.toUpperCase()}`);
    }
    icsLines.push("END:VEVENT");
  }

  icsLines.push("END:VCALENDAR");

  const icsContent = icsLines.join("\r\n");
  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8;" });
  const filename = `${options?.filenamePrefix || "Doc2Action_Deadlines"}_${getFileDateString()}.ics`;
  downloadBlob(blob, filename);

  return { success: true, count: itemsWithDeadlines.length };
}
