"use client";

import * as React from "react";
import {
  fetchMyActions,
  updateActionStatus,
  bulkUpdateActionStatus,
  bulkDeleteActions,
  MyActionsGrouped,
} from "@/lib/services/apiAnalysisService";
import type { ActionItem, ActionStatus } from "@/lib/types/action";
import { PriorityBadge, CategoryBadge } from "../ui/badge";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import {
  CalendarIcon,
  DocumentIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  ClockIcon,
  TrashIcon,
  XIcon,
  CheckIcon,
  CheckSquareIcon,
  SortAscIcon,
  DownloadIcon,
  ChevronDownIcon,
  TableIcon,
} from "../ui/icons";
import {
  exportToPdf,
  exportToCsv,
  exportToMarkdown,
  exportToIcs,
} from "@/lib/export/exportActions";

export interface MyActionsViewProps {
  onGoToUpload?: () => void;
  className?: string;
}

export type StatusFilter = "all" | "not_completed" | "completed";
export type SortOption = "urgency" | "priority" | "title" | "newest";
export type CategoryFilter = "all" | "academic" | "administrative" | "finance" | "event" | "general";

interface ConfirmModalState {
  isOpen: boolean;
  type: "delete-selected" | "delete-all";
  count?: number;
}

export function MyActionsView({
  onGoToUpload,
  className = "",
}: MyActionsViewProps) {
  const [data, setData] = React.useState<MyActionsGrouped | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  // Status, sorting, and category filters
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>("all");
  const [categoryFilter, setCategoryFilter] = React.useState<CategoryFilter>("all");
  const [sortBy, setSortBy] = React.useState<SortOption>("urgency");

  // Multi-select state
  const [isSelectMode, setIsSelectMode] = React.useState<boolean>(false);
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());

  // Export dropdown & notifications
  const [isExportOpen, setIsExportOpen] = React.useState<boolean>(false);
  const [isBatchExportOpen, setIsBatchExportOpen] = React.useState<boolean>(false);
  const [exportScope, setExportScope] = React.useState<"selected" | "visible">("visible");
  const [exportLoadingFormat, setExportLoadingFormat] = React.useState<string | null>(null);
  const [toast, setToast] = React.useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);

  const exportDropdownRef = React.useRef<HTMLDivElement | null>(null);
  const batchExportDropdownRef = React.useRef<HTMLDivElement | null>(null);

  // Delete confirmation modal
  const [confirmModal, setConfirmModal] = React.useState<ConfirmModalState>({
    isOpen: false,
    type: "delete-selected",
  });

  const cancelButtonRef = React.useRef<HTMLButtonElement | null>(null);

  const loadActions = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchMyActions();
      setData(res);
      setSelectedIds(new Set());
    } catch {
      setError("Failed to load your actions. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    let isMounted = true;
    fetchMyActions()
      .then((res) => {
        if (isMounted) {
          setData(res);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setError("Failed to load your actions. Please try again.");
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Modal accessibility: Escape key to close & focus management
  React.useEffect(() => {
    if (!confirmModal.isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    setTimeout(() => {
      cancelButtonRef.current?.focus();
    }, 50);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [confirmModal.isOpen]);

  // Recalculates grouped actions and metrics
  const recalculateData = (allTasksList: ActionItem[]): MyActionsGrouped => {
    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    const overdue: ActionItem[] = [];
    const dueSoon: ActionItem[] = [];
    const upcoming: ActionItem[] = [];
    const completed: ActionItem[] = [];

    for (const act of allTasksList) {
      if (act.status === "completed") {
        completed.push(act);
        continue;
      }

      if (!act.deadline) {
        upcoming.push(act);
        continue;
      }

      const parsedDate = new Date(act.deadline);
      if (!isNaN(parsedDate.getTime())) {
        if (parsedDate < now) {
          overdue.push(act);
        } else if (parsedDate <= threeDaysFromNow) {
          dueSoon.push(act);
        } else {
          upcoming.push(act);
        }
      } else {
        upcoming.push(act);
      }
    }

    return {
      metrics: {
        total: allTasksList.length,
        pending: allTasksList.length - completed.length,
        completed: completed.length,
        overdue: overdue.length,
        dueSoon: dueSoon.length,
      },
      groups: {
        overdue,
        dueSoon,
        upcoming,
        completed,
      },
    };
  };

  // All tasks in state
  const allTasks = React.useMemo(() => {
    if (!data) return [];
    return [
      ...data.groups.overdue,
      ...data.groups.dueSoon,
      ...data.groups.upcoming,
      ...data.groups.completed,
    ];
  }, [data]);

  // Priority ranking helper
  const priorityRank = (priority: string) => {
    if (priority === "high") return 3;
    if (priority === "medium") return 2;
    return 1;
  };

  // Sort tasks helper
  const sortTasks = React.useCallback(
    (tasks: ActionItem[]): ActionItem[] => {
      const copy = [...tasks];
      if (sortBy === "priority") {
        return copy.sort(
          (a, b) => priorityRank(b.priority) - priorityRank(a.priority)
        );
      }
      if (sortBy === "title") {
        return copy.sort((a, b) => a.title.localeCompare(b.title));
      }
      if (sortBy === "newest") {
        return copy.reverse();
      }
      // "urgency" default: earliest deadline first, then undated
      return copy.sort((a, b) => {
        if (!a.deadline && !b.deadline) return 0;
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      });
    },
    [sortBy]
  );

  // Filter tasks by status and category
  const filterTasks = React.useCallback(
    (tasks: ActionItem[]): ActionItem[] => {
      return tasks.filter((t) => {
        // Status filter
        if (statusFilter === "not_completed" && t.status === "completed") {
          return false;
        }
        if (statusFilter === "completed" && t.status !== "completed") {
          return false;
        }

        // Category filter
        if (categoryFilter !== "all" && t.category !== categoryFilter) {
          return false;
        }

        return true;
      });
    },
    [statusFilter, categoryFilter]
  );

  // Filtered and sorted tasks for the current view
  const visibleTasks = React.useMemo(() => {
    return sortTasks(filterTasks(allTasks));
  }, [allTasks, filterTasks, sortTasks]);

  // Separate pending (not completed) and completed items within visible set
  const visibleNotCompleted = React.useMemo(() => {
    return visibleTasks.filter((t) => t.status !== "completed");
  }, [visibleTasks]);

  const visibleCompleted = React.useMemo(() => {
    return visibleTasks.filter((t) => t.status === "completed");
  }, [visibleTasks]);

  // Breakdown of visible pending tasks by urgency for structured display
  const overduePending = React.useMemo(() => {
    const now = new Date();
    return visibleNotCompleted.filter((t) => {
      if (!t.deadline) return false;
      const d = new Date(t.deadline);
      return !isNaN(d.getTime()) && d < now;
    });
  }, [visibleNotCompleted]);

  const dueSoonPending = React.useMemo(() => {
    const now = new Date();
    const threeDays = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    return visibleNotCompleted.filter((t) => {
      if (!t.deadline) return false;
      const d = new Date(t.deadline);
      return !isNaN(d.getTime()) && d >= now && d <= threeDays;
    });
  }, [visibleNotCompleted]);

  const upcomingPending = React.useMemo(() => {
    const now = new Date();
    const threeDays = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    return visibleNotCompleted.filter((t) => {
      if (!t.deadline) return true;
      const d = new Date(t.deadline);
      return isNaN(d.getTime()) || d > threeDays;
    });
  }, [visibleNotCompleted]);

  // Checkbox toggle: Completed <-> Not Completed (Direct 1-Click Action)
  const handleToggleStatus = async (action: ActionItem) => {
    const nextStatus: ActionStatus =
      action.status === "completed" ? "pending" : "completed";

    // Optimistic UI update
    setData((prev) => {
      if (!prev) return prev;
      const updated = allTasks.map((item) =>
        item.id === action.id ? { ...item, status: nextStatus } : item
      );
      return recalculateData(updated);
    });

    // Sync with backend
    await updateActionStatus(action.id, nextStatus as "pending" | "completed");
  };

  // Multi-Select: Toggle individual item
  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Multi-Select: Select All Visible
  const handleSelectAllVisible = () => {
    const ids = visibleTasks.map((t) => t.id);
    setSelectedIds(new Set(ids));
    setIsSelectMode(true);
  };

  // Multi-Select: Deselect All
  const handleDeselectAll = () => {
    setSelectedIds(new Set());
  };

  // Multi-Select: Exit Selection Mode
  const handleExitSelectMode = () => {
    setIsSelectMode(false);
    setSelectedIds(new Set());
  };

  // Batch Action: Mark Selected as Completed
  const handleMarkSelectedCompleted = async () => {
    if (selectedIds.size === 0 || !data) return;
    const idsToComplete = Array.from(selectedIds);

    // Optimistic UI update
    setData((prev) => {
      if (!prev) return prev;
      const updated = allTasks.map((t) =>
        selectedIds.has(t.id) ? { ...t, status: "completed" as ActionStatus } : t
      );
      return recalculateData(updated);
    });

    setSelectedIds(new Set());

    // Sync with backend
    await bulkUpdateActionStatus(idsToComplete, "completed");
  };

  // Batch Action: Mark Selected as Not Completed (Pending)
  const handleMarkSelectedPending = async () => {
    if (selectedIds.size === 0 || !data) return;
    const idsToPending = Array.from(selectedIds);

    // Optimistic UI update
    setData((prev) => {
      if (!prev) return prev;
      const updated = allTasks.map((t) =>
        selectedIds.has(t.id) ? { ...t, status: "pending" as ActionStatus } : t
      );
      return recalculateData(updated);
    });

    setSelectedIds(new Set());

    // Sync with backend
    await bulkUpdateActionStatus(idsToPending, "pending");
  };

  // Batch Action: Confirm and Delete
  const handleConfirmDelete = async () => {
    if (!data) return;
    let idsToDelete: string[] = [];
    const isDeleteAll = confirmModal.type === "delete-all";

    if (isDeleteAll) {
      idsToDelete = visibleTasks.map((t) => t.id);
    } else {
      idsToDelete = Array.from(selectedIds);
    }

    if (idsToDelete.length === 0) {
      setConfirmModal({ isOpen: false, type: "delete-selected" });
      return;
    }

    const deleteSet = new Set(idsToDelete);

    // Optimistic UI update
    setData((prev) => {
      if (!prev) return prev;
      const remaining = allTasks.filter((t) => !deleteSet.has(t.id));
      return recalculateData(remaining);
    });

    setSelectedIds((prev) => {
      const next = new Set(prev);
      idsToDelete.forEach((id) => next.delete(id));
      return next;
    });

    setConfirmModal({ isOpen: false, type: "delete-selected" });

    // Sync with backend
    await bulkDeleteActions(idsToDelete, isDeleteAll && statusFilter === "all" && categoryFilter === "all");
  };

  // Auto-dismiss toast after 4s
  React.useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      setToast(null);
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  // Click-outside listener for export menus
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        exportDropdownRef.current &&
        !exportDropdownRef.current.contains(e.target as Node)
      ) {
        setIsExportOpen(false);
      }
      if (
        batchExportDropdownRef.current &&
        !batchExportDropdownRef.current.contains(e.target as Node)
      ) {
        setIsBatchExportOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Export trigger handler
  const handleExport = (
    format: "pdf" | "csv" | "md" | "ics",
    targetScope: "selected" | "visible" = "visible"
  ) => {
    let targetActions: ActionItem[] = [];
    let scopeLabel = "";

    if (targetScope === "selected" && isSelectMode && selectedIds.size > 0) {
      targetActions = visibleTasks.filter((t) => selectedIds.has(t.id));
      scopeLabel = `${targetActions.length} Selected Task${targetActions.length === 1 ? "" : "s"}`;
    } else {
      targetActions = visibleTasks;
      if (statusFilter === "not_completed") {
        scopeLabel = categoryFilter === "all" ? "Pending Tasks" : `Pending Tasks (${categoryFilter})`;
      } else if (statusFilter === "completed") {
        scopeLabel = categoryFilter === "all" ? "Completed Tasks" : `Completed Tasks (${categoryFilter})`;
      } else {
        scopeLabel = categoryFilter === "all" ? "All Workspace Tasks" : `${categoryFilter} Tasks`;
      }
    }

    if (targetActions.length === 0) {
      setToast({
        type: "info",
        text: "No actions to export in the current view or selection.",
      });
      setIsExportOpen(false);
      setIsBatchExportOpen(false);
      return;
    }

    setExportLoadingFormat(format);

    // Give browser a frame to paint the loading state
    setTimeout(() => {
      try {
        let result: { success: boolean; count: number; error?: string };
        const opts = { scopeLabel };

        switch (format) {
          case "pdf":
            result = exportToPdf(targetActions, opts);
            break;
          case "csv":
            result = exportToCsv(targetActions, opts);
            break;
          case "md":
            result = exportToMarkdown(targetActions, opts);
            break;
          case "ics":
            result = exportToIcs(targetActions, opts);
            break;
        }

        if (result.success) {
          const names: Record<string, string> = {
            pdf: "PDF Checklist",
            csv: "CSV Spreadsheet",
            md: "Markdown Checklist",
            ics: "Calendar (.ics)",
          };
          setToast({
            type: "success",
            text: `Exported ${result.count} task${result.count === 1 ? "" : "s"} to ${names[format]}.`,
          });
        } else {
          setToast({
            type: "error",
            text: result.error || "Failed to export tasks.",
          });
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to generate export file.";
        setToast({
          type: "error",
          text: msg,
        });
      } finally {
        setExportLoadingFormat(null);
        setIsExportOpen(false);
        setIsBatchExportOpen(false);
      }
    }, 50);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[rgba(140,170,120,0.2)] border-t-[#e8ff47]" />
        <p className="text-xs text-zinc-400 font-medium">Loading workspace actions...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <Card className="p-8 text-center space-y-3 max-w-lg mx-auto border-[rgba(140,170,120,0.14)] bg-[#0c150e]/80">
        <AlertCircleIcon size={24} className="mx-auto text-amber-500" />
        <p className="text-sm text-zinc-300">
          {error || "No saved actions found in your workspace."}
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={loadActions}
          className="border-[rgba(140,170,120,0.2)] text-zinc-200 hover:bg-[#0e1911]"
        >
          Retry
        </Button>
      </Card>
    );
  }

  const { metrics } = data;
  const hasAnyTasks = metrics.total > 0;
  const selectedCount = selectedIds.size;
  const allVisibleSelected =
    visibleTasks.length > 0 && visibleTasks.every((t) => selectedIds.has(t.id));

  return (
    <div className={`space-y-6 animate-fade-in ${className}`}>
      {/* 1. Interactive Metric Cards: Clear Distinction of Total, Not Completed & Completed */}
      <section aria-label="Action status summary" className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Tasks */}
        <button
          type="button"
          onClick={() => setStatusFilter("all")}
          className={`p-3.5 sm:p-5 rounded-2xl border text-left transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e8ff47]/60 ${
            statusFilter === "all"
              ? "bg-[#0e1c12] border-[#e8ff47]/40 shadow-[0_0_15px_rgba(232,255,71,0.08)]"
              : "bg-[#0c150e]/90 border-[rgba(140,170,120,0.14)] hover:border-[rgba(140,170,120,0.3)] hover:bg-[#0e1911]"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-medium text-zinc-400 uppercase tracking-wider">
              Total Tasks
            </span>
            {statusFilter === "all" && (
              <span className="h-1.5 w-1.5 rounded-full bg-[#e8ff47] shadow-[0_0_6px_rgba(232,255,71,0.8)]" />
            )}
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-zinc-100">
            {metrics.total}
          </div>
          <span className="text-[10px] text-zinc-500 mt-1 block">All workspace tasks</span>
        </button>

        {/* Not Completed / Pending */}
        <button
          type="button"
          onClick={() => setStatusFilter("not_completed")}
          className={`p-3.5 sm:p-5 rounded-2xl border text-left transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60 ${
            statusFilter === "not_completed"
              ? "bg-[#18190d] border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.1)]"
              : "bg-[#0c150e]/90 border-amber-900/30 hover:border-amber-700/50 hover:bg-[#12160e]"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-medium text-amber-400 uppercase tracking-wider">
              Not Completed
            </span>
            {statusFilter === "not_completed" && (
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(245,158,11,0.8)]" />
            )}
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-amber-400">
            {metrics.pending}
          </div>
          <span className="text-[10px] text-amber-500/70 mt-1 block">Active obligations</span>
        </button>

        {/* Completed */}
        <button
          type="button"
          onClick={() => setStatusFilter("completed")}
          className={`p-3.5 sm:p-5 rounded-2xl border text-left transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60 ${
            statusFilter === "completed"
              ? "bg-[#0e1e14] border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.1)]"
              : "bg-[#0c150e]/90 border-emerald-900/30 hover:border-emerald-700/50 hover:bg-[#0e1710]"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-medium text-emerald-400 uppercase tracking-wider">
              Completed
            </span>
            {statusFilter === "completed" && (
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.8)]" />
            )}
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-emerald-400">
            {metrics.completed}
          </div>
          <span className="text-[10px] text-emerald-500/70 mt-1 block">Accomplished tasks</span>
        </button>

        {/* Overdue / Due Soon Attention */}
        <button
          type="button"
          onClick={() => {
            setStatusFilter("not_completed");
            setSortBy("urgency");
          }}
          className="p-3.5 sm:p-5 rounded-2xl border bg-[#0c150e]/90 border-rose-900/30 hover:border-rose-700/50 hover:bg-[#160e10] text-left transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/60"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-medium text-rose-400 uppercase tracking-wider">
              Urgent Attention
            </span>
            <AlertCircleIcon size={14} className="text-rose-400" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-rose-400">
            {metrics.overdue + metrics.dueSoon}
          </div>
          <span className="text-[10px] text-rose-400/70 mt-1 block">
            {metrics.overdue} overdue · {metrics.dueSoon} due soon
          </span>
        </button>
      </section>

      {/* 3. Controls Bar: Status Filter Tabs, Sorting, & Multi-Select Trigger */}
      {hasAnyTasks && (
        <section
          aria-label="Filter and sort controls"
          className="p-3.5 sm:p-4 rounded-2xl border border-[rgba(140,170,120,0.16)] bg-[#0b120d]/90 backdrop-blur-md shadow-xs space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between sm:gap-4"
        >
          {/* Primary Status Tabs: All Tasks, Not Completed, Completed */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <div
              role="tablist"
              aria-label="Filter by task status"
              className="inline-flex items-center p-1 rounded-xl bg-[#08120c] border border-[rgba(140,170,120,0.15)] text-xs gap-1"
            >
              <button
                type="button"
                role="tab"
                aria-selected={statusFilter === "all"}
                onClick={() => setStatusFilter("all")}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer font-medium ${
                  statusFilter === "all"
                    ? "bg-[#14261a] text-[#e8ff47] border border-[rgba(140,170,120,0.3)] shadow-2xs font-semibold"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-[#0e1911]"
                }`}
              >
                All Tasks ({metrics.total})
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={statusFilter === "not_completed"}
                onClick={() => setStatusFilter("not_completed")}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer font-medium ${
                  statusFilter === "not_completed"
                    ? "bg-[#18190d] text-amber-300 border border-amber-500/40 shadow-2xs font-semibold"
                    : "text-zinc-400 hover:text-amber-200 hover:bg-[#0e1911]"
                }`}
              >
                Not Completed ({metrics.pending})
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={statusFilter === "completed"}
                onClick={() => setStatusFilter("completed")}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer font-medium ${
                  statusFilter === "completed"
                    ? "bg-[#0e1e14] text-emerald-300 border border-emerald-500/40 shadow-2xs font-semibold"
                    : "text-zinc-400 hover:text-emerald-200 hover:bg-[#0e1911]"
                }`}
              >
                Completed ({metrics.completed})
              </button>
            </div>

            {/* Category Filter Pills (Compact Dropdown/Selector) */}
            <div className="flex items-center gap-1 pl-1">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value as CategoryFilter)}
                className="px-2.5 py-1.5 rounded-xl bg-[#08120c] border border-[rgba(140,170,120,0.18)] text-zinc-300 text-xs cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#e8ff47]/60"
                aria-label="Filter by category"
              >
                <option value="all">All Categories</option>
                <option value="academic">Academic</option>
                <option value="administrative">Administrative</option>
                <option value="finance">Finance</option>
                <option value="event">Event</option>
                <option value="general">General</option>
              </select>
            </div>
          </div>

          {/* Right Side Controls: Sort Selector & Multi-Select Toggle */}
          <div className="flex items-center gap-2 flex-wrap justify-between sm:justify-end">
            {/* Sorting Dropdown */}
            <div className="flex items-center gap-1.5">
              <span className="text-zinc-500 text-xs hidden md:inline">Sort:</span>
              <div className="relative inline-flex items-center">
                <SortAscIcon size={14} className="absolute left-2.5 text-zinc-400 pointer-events-none" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="pl-7 pr-3 py-1.5 rounded-xl bg-[#08120c] border border-[rgba(140,170,120,0.18)] text-zinc-200 text-xs font-medium cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#e8ff47]/60"
                  aria-label="Sort actions"
                >
                  <option value="urgency">Urgency (Due Soonest)</option>
                  <option value="priority">Priority (High → Low)</option>
                  <option value="title">Title (A → Z)</option>
                  <option value="newest">Newest Added</option>
                </select>
              </div>
            </div>

            {/* Export Actions Dropdown */}
            <div className="relative" ref={exportDropdownRef}>
              <button
                type="button"
                onClick={() => setIsExportOpen((prev) => !prev)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-150 cursor-pointer border select-none ${
                  isExportOpen
                    ? "bg-[#132418] text-[#e8ff47] border-[#e8ff47]/50 shadow-[0_0_10px_rgba(232,255,71,0.15)] font-semibold"
                    : "bg-[#08120c] text-zinc-300 hover:text-white hover:bg-[#0e1911] border-[rgba(140,170,120,0.2)]"
                }`}
                aria-label="Export actions menu"
                aria-haspopup="true"
                aria-expanded={isExportOpen}
              >
                <DownloadIcon size={14} className="text-[#e8ff47]" />
                <span>Export</span>
                <ChevronDownIcon
                  size={12}
                  className={`text-zinc-400 transition-transform duration-150 ${
                    isExportOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {isExportOpen && (
                <div
                  role="menu"
                  aria-label="Export options"
                  className="absolute right-0 mt-2 w-72 rounded-2xl bg-[#08130c]/98 border border-[rgba(140,170,120,0.25)] shadow-[0_16px_40px_rgba(0,0,0,0.9)] backdrop-blur-xl z-30 p-2 space-y-1 animate-in fade-in-0 zoom-in-95 duration-100"
                >
                  {/* Scope Selector if in Multi-Select with selections */}
                  {isSelectMode && selectedCount > 0 ? (
                    <div className="p-2 mb-1 bg-[#050e09] rounded-xl border border-[rgba(140,170,120,0.15)]">
                      <div className="text-[10px] uppercase font-semibold tracking-wider text-zinc-400 mb-1.5">
                        Export Target
                      </div>
                      <div className="grid grid-cols-2 gap-1">
                        <button
                          type="button"
                          onClick={() => setExportScope("selected")}
                          className={`px-2 py-1 rounded-lg text-xs font-medium cursor-pointer transition-all ${
                            exportScope === "selected"
                              ? "bg-[#e8ff47]/20 text-[#e8ff47] border border-[#e8ff47]/40 shadow-xs"
                              : "text-zinc-400 hover:text-zinc-200 border border-transparent"
                          }`}
                        >
                          Selected ({selectedCount})
                        </button>
                        <button
                          type="button"
                          onClick={() => setExportScope("visible")}
                          className={`px-2 py-1 rounded-lg text-xs font-medium cursor-pointer transition-all ${
                            exportScope === "visible"
                              ? "bg-[#e8ff47]/20 text-[#e8ff47] border border-[#e8ff47]/40 shadow-xs"
                              : "text-zinc-400 hover:text-zinc-200 border border-transparent"
                          }`}
                        >
                          All Visible ({visibleTasks.length})
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="px-2.5 py-1.5 text-[11px] text-zinc-400 border-b border-[rgba(140,170,120,0.12)] mb-1 flex items-center justify-between">
                      <span className="font-medium text-zinc-300">Export Actions</span>
                      <span className="text-zinc-400 font-mono text-[10px] bg-[#0e1911] px-1.5 py-0.5 rounded border border-[rgba(140,170,120,0.15)]">
                        {visibleTasks.length} visible
                      </span>
                    </div>
                  )}

                  {/* PDF Checklist */}
                  <button
                    type="button"
                    role="menuitem"
                    disabled={Boolean(exportLoadingFormat)}
                    onClick={() => handleExport("pdf", isSelectMode && selectedCount > 0 ? exportScope : "visible")}
                    className="w-full flex items-start gap-2.5 p-2 rounded-xl text-left transition-all duration-150 hover:bg-[#122217] cursor-pointer group disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="p-1.5 rounded-lg bg-[#0e1c12] border border-[#e8ff47]/20 text-[#e8ff47] group-hover:border-[#e8ff47]/50 shrink-0 mt-0.5">
                      {exportLoadingFormat === "pdf" ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-500 border-t-[#e8ff47]" />
                      ) : (
                        <DocumentIcon size={16} />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold text-zinc-200 group-hover:text-white flex items-center justify-between">
                        <span>PDF Checklist</span>
                        <span className="text-[10px] font-mono text-zinc-400 uppercase">.pdf</span>
                      </div>
                      <p className="text-[11px] text-zinc-400 group-hover:text-zinc-300 leading-snug">
                        Printable report with checkboxes & metadata
                      </p>
                    </div>
                  </button>

                  {/* CSV Spreadsheet */}
                  <button
                    type="button"
                    role="menuitem"
                    disabled={Boolean(exportLoadingFormat)}
                    onClick={() => handleExport("csv", isSelectMode && selectedCount > 0 ? exportScope : "visible")}
                    className="w-full flex items-start gap-2.5 p-2 rounded-xl text-left transition-all duration-150 hover:bg-[#122217] cursor-pointer group disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="p-1.5 rounded-lg bg-emerald-950/40 border border-emerald-500/20 text-emerald-400 group-hover:border-emerald-500/50 shrink-0 mt-0.5">
                      {exportLoadingFormat === "csv" ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-500 border-t-emerald-400" />
                      ) : (
                        <TableIcon size={16} />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold text-zinc-200 group-hover:text-white flex items-center justify-between">
                        <span>CSV Spreadsheet</span>
                        <span className="text-[10px] font-mono text-zinc-400 uppercase">.csv</span>
                      </div>
                      <p className="text-[11px] text-zinc-400 group-hover:text-zinc-300 leading-snug">
                        Excel & Google Sheets compatible tabular data
                      </p>
                    </div>
                  </button>

                  {/* Markdown Checklist */}
                  <button
                    type="button"
                    role="menuitem"
                    disabled={Boolean(exportLoadingFormat)}
                    onClick={() => handleExport("md", isSelectMode && selectedCount > 0 ? exportScope : "visible")}
                    className="w-full flex items-start gap-2.5 p-2 rounded-xl text-left transition-all duration-150 hover:bg-[#122217] cursor-pointer group disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="p-1.5 rounded-lg bg-cyan-950/40 border border-cyan-500/20 text-cyan-400 group-hover:border-cyan-500/50 shrink-0 mt-0.5">
                      {exportLoadingFormat === "md" ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-500 border-t-cyan-400" />
                      ) : (
                        <CheckSquareIcon size={16} />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold text-zinc-200 group-hover:text-white flex items-center justify-between">
                        <span>Markdown Checklist</span>
                        <span className="text-[10px] font-mono text-zinc-400 uppercase">.md</span>
                      </div>
                      <p className="text-[11px] text-zinc-400 group-hover:text-zinc-300 leading-snug">
                        Formatted checklist for Notion, Obsidian & GitHub
                      </p>
                    </div>
                  </button>

                  {/* Calendar Events */}
                  <button
                    type="button"
                    role="menuitem"
                    disabled={Boolean(exportLoadingFormat)}
                    onClick={() => handleExport("ics", isSelectMode && selectedCount > 0 ? exportScope : "visible")}
                    className="w-full flex items-start gap-2.5 p-2 rounded-xl text-left transition-all duration-150 hover:bg-[#122217] cursor-pointer group disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="p-1.5 rounded-lg bg-amber-950/40 border border-amber-500/20 text-amber-400 group-hover:border-amber-500/50 shrink-0 mt-0.5">
                      {exportLoadingFormat === "ics" ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-500 border-t-amber-400" />
                      ) : (
                        <CalendarIcon size={16} />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold text-zinc-200 group-hover:text-white flex items-center justify-between">
                        <span>Calendar Events</span>
                        <span className="text-[10px] font-mono text-zinc-400 uppercase">.ics</span>
                      </div>
                      <p className="text-[11px] text-zinc-400 group-hover:text-zinc-300 leading-snug">
                        Deadlines for Apple, Google & Outlook calendars
                      </p>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* Multi-Select Mode Button */}
            <button
              type="button"
              onClick={() => {
                if (isSelectMode) {
                  handleExitSelectMode();
                } else {
                  setIsSelectMode(true);
                }
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-150 cursor-pointer border select-none ${
                isSelectMode
                  ? "bg-[#132418] text-[#e8ff47] border-[#e8ff47]/50 shadow-[0_0_10px_rgba(232,255,71,0.15)] font-semibold"
                  : "bg-[#08120c] text-zinc-300 hover:text-white hover:bg-[#0e1911] border-[rgba(140,170,120,0.2)]"
              }`}
              aria-label={isSelectMode ? "Exit multi-select mode" : "Enter multi-select mode"}
            >
              {isSelectMode ? (
                <>
                  <XIcon size={14} />
                  <span>Done Selecting</span>
                </>
              ) : (
                <>
                  <CheckSquareIcon size={14} className="text-zinc-400" />
                  <span>Select Tasks</span>
                </>
              )}
            </button>

            {/* Quick Upload / Analyze Action */}
            {onGoToUpload && (
              <button
                type="button"
                onClick={onGoToUpload}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-150 cursor-pointer bg-[#e8ff47]/[0.08] hover:bg-[#e8ff47]/[0.18] text-[#e8ff47] hover:text-white border border-[#e8ff47]/25 hover:border-[#e8ff47]/45 shadow-2xs active:scale-[0.98]"
                aria-label="Analyze new document"
              >
                <span>+ Analyze New</span>
              </button>
            )}
          </div>
        </section>
      )}

      {/* 4. Dedicated Multi-Select Floating / Sticky Action Bar */}
      {isSelectMode && (
        <section
          aria-label="Batch actions toolbar"
          className="sticky top-20 z-20 p-3 sm:p-4 rounded-2xl border border-[#e8ff47]/30 bg-[#08130c]/95 backdrop-blur-xl shadow-[0_12px_32px_rgba(0,0,0,0.7)] flex flex-wrap items-center justify-between gap-3 animate-in fade-in-0 slide-in-from-top-2 duration-150"
        >
          {/* Left: Counter & Select All Controls */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-[#e8ff47]/15 text-[#e8ff47] border border-[#e8ff47]/30">
              <span className="h-2 w-2 rounded-full bg-[#e8ff47] shadow-[0_0_6px_rgba(232,255,71,0.8)]" />
              {selectedCount} of {visibleTasks.length} Selected
            </span>

            <button
              type="button"
              onClick={allVisibleSelected ? handleDeselectAll : handleSelectAllVisible}
              className="text-xs text-zinc-300 hover:text-white hover:underline cursor-pointer font-medium ml-1"
            >
              {allVisibleSelected ? "Deselect All" : "Select All Visible"}
            </button>
          </div>

          {/* Right: Batch Execution Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Complete Selected */}
            <button
              type="button"
              disabled={selectedCount === 0}
              onClick={handleMarkSelectedCompleted}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-150 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed bg-emerald-950/40 text-emerald-300 hover:text-emerald-100 hover:bg-emerald-950/70 border border-emerald-700/40 active:scale-[0.98]"
              aria-label="Mark selected as completed"
            >
              <CheckCircleIcon size={14} className="text-emerald-400" />
              <span>Mark Completed</span>
            </button>

            {/* Mark Selected as Incomplete / Pending */}
            <button
              type="button"
              disabled={selectedCount === 0}
              onClick={handleMarkSelectedPending}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-150 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed bg-[#0e1911] text-amber-300 hover:text-amber-100 hover:bg-[#142217] border border-amber-700/40 active:scale-[0.98]"
              aria-label="Mark selected as not completed"
            >
              <ClockIcon size={14} className="text-amber-400" />
              <span>Mark Not Completed</span>
            </button>

            {/* Export Selected Tasks Dropdown */}
            <div className="relative" ref={batchExportDropdownRef}>
              <button
                type="button"
                disabled={selectedCount === 0}
                onClick={() => setIsBatchExportOpen((prev) => !prev)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-150 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed bg-[#08120c] text-zinc-200 hover:text-white hover:bg-[#0e1911] border border-[rgba(140,170,120,0.25)] active:scale-[0.98]"
                aria-label="Export selected tasks"
                aria-haspopup="true"
                aria-expanded={isBatchExportOpen}
              >
                <DownloadIcon size={14} className="text-[#e8ff47]" />
                <span>Export Selected</span>
                <ChevronDownIcon
                  size={12}
                  className={`text-zinc-400 transition-transform duration-150 ${
                    isBatchExportOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {isBatchExportOpen && (
                <div
                  role="menu"
                  aria-label="Export selected tasks menu"
                  className="absolute right-0 mt-2 w-64 rounded-2xl bg-[#08130c]/98 border border-[rgba(140,170,120,0.25)] shadow-[0_16px_40px_rgba(0,0,0,0.9)] backdrop-blur-xl z-30 p-2 space-y-1 animate-in fade-in-0 zoom-in-95 duration-100"
                >
                  <div className="px-2.5 py-1 text-[11px] text-zinc-400 border-b border-[rgba(140,170,120,0.12)] mb-1 flex items-center justify-between">
                    <span className="font-medium text-zinc-300">
                      Export {selectedCount} Selected
                    </span>
                  </div>

                  <button
                    type="button"
                    role="menuitem"
                    disabled={Boolean(exportLoadingFormat)}
                    onClick={() => handleExport("pdf", "selected")}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-left text-xs font-medium text-zinc-200 hover:text-white hover:bg-[#122217] transition-colors cursor-pointer group disabled:opacity-50"
                  >
                    <DocumentIcon size={14} className="text-[#e8ff47]" />
                    <span className="flex-1">PDF Checklist</span>
                    <span className="text-[10px] text-zinc-400 font-mono">.pdf</span>
                  </button>

                  <button
                    type="button"
                    role="menuitem"
                    disabled={Boolean(exportLoadingFormat)}
                    onClick={() => handleExport("csv", "selected")}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-left text-xs font-medium text-zinc-200 hover:text-white hover:bg-[#122217] transition-colors cursor-pointer group disabled:opacity-50"
                  >
                    <TableIcon size={14} className="text-emerald-400" />
                    <span className="flex-1">CSV Spreadsheet</span>
                    <span className="text-[10px] text-zinc-400 font-mono">.csv</span>
                  </button>

                  <button
                    type="button"
                    role="menuitem"
                    disabled={Boolean(exportLoadingFormat)}
                    onClick={() => handleExport("md", "selected")}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-left text-xs font-medium text-zinc-200 hover:text-white hover:bg-[#122217] transition-colors cursor-pointer group disabled:opacity-50"
                  >
                    <CheckSquareIcon size={14} className="text-cyan-400" />
                    <span className="flex-1">Markdown Checklist</span>
                    <span className="text-[10px] text-zinc-400 font-mono">.md</span>
                  </button>

                  <button
                    type="button"
                    role="menuitem"
                    disabled={Boolean(exportLoadingFormat)}
                    onClick={() => handleExport("ics", "selected")}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-left text-xs font-medium text-zinc-200 hover:text-white hover:bg-[#122217] transition-colors cursor-pointer group disabled:opacity-50"
                  >
                    <CalendarIcon size={14} className="text-amber-400" />
                    <span className="flex-1">Calendar Events</span>
                    <span className="text-[10px] text-zinc-400 font-mono">.ics</span>
                  </button>
                </div>
              )}
            </div>

            {/* Delete Selected */}
            <button
              type="button"
              disabled={selectedCount === 0}
              onClick={() =>
                setConfirmModal({
                  isOpen: true,
                  type: "delete-selected",
                  count: selectedCount,
                })
              }
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-150 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed bg-rose-950/30 text-rose-300 hover:text-rose-100 hover:bg-rose-950/60 border border-rose-800/40 active:scale-[0.98]"
              aria-label="Delete selected tasks"
            >
              <TrashIcon size={14} />
              <span>Delete</span>
            </button>

            {/* Exit Multi-Select */}
            <button
              type="button"
              onClick={handleExitSelectMode}
              className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-[#0e1911] cursor-pointer ml-1"
              aria-label="Exit selection mode"
            >
              <XIcon size={16} />
            </button>
          </div>
        </section>
      )}

      {/* 5. Empty State */}
      {!hasAnyTasks || visibleTasks.length === 0 ? (
        <Card className="p-10 text-center space-y-4 max-w-lg mx-auto border-[rgba(140,170,120,0.14)] bg-[#0c150e]/80">
          <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-2xl bg-[#0e1911] text-zinc-300 border border-[rgba(140,170,120,0.18)]">
            <CheckCircleIcon size={24} className="text-[#e8ff47]" />
          </div>
          <div className="space-y-1">
            <h2 className="text-base sm:text-lg font-serif font-normal text-zinc-100">
              {statusFilter === "not_completed"
                ? "All tasks completed!"
                : statusFilter === "completed"
                ? "No completed tasks yet"
                : "No actions found"}
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-sm mx-auto">
              {statusFilter === "not_completed"
                ? "You have no active pending tasks. Switch to All Tasks or Completed to review finished items."
                : statusFilter === "completed"
                ? "Check off tasks from your list as you complete them to see them here."
                : "Upload or analyze a document to automatically extract actionable items."}
            </p>
          </div>

          <div className="flex items-center justify-center gap-2 pt-2">
            {statusFilter !== "all" && (
              <button
                type="button"
                onClick={() => setStatusFilter("all")}
                className="px-3.5 py-1.5 rounded-xl bg-[#0e1911] hover:bg-[#132418] text-zinc-200 text-xs font-medium border border-[rgba(140,170,120,0.2)] cursor-pointer"
              >
                View All Tasks
              </button>
            )}
            {onGoToUpload && (
              <button
                type="button"
                onClick={onGoToUpload}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#e8ff47]/[0.1] hover:bg-[#e8ff47]/[0.2] text-zinc-100 hover:text-white border border-[#e8ff47]/30 hover:border-[#e8ff47]/50 text-xs sm:text-sm font-medium transition-all shadow-xs cursor-pointer"
              >
                <span>Upload a Document</span>
              </button>
            )}
          </div>
        </Card>
      ) : (
        /* 6. Distinguishing Total, Not Completed & Completed in List Display */
        <div className="space-y-8">
          {/* SECTION A: NOT COMPLETED TASKS (When viewing 'all' or 'not_completed') */}
          {(statusFilter === "all" || statusFilter === "not_completed") && visibleNotCompleted.length > 0 && (
            <div className="space-y-6">
              {/* Section Header if viewing 'all' to clearly distinguish active obligations */}
              {statusFilter === "all" && (
                <div className="flex items-center justify-between border-b border-[rgba(140,170,120,0.18)] pb-2.5">
                  <div className="flex items-center gap-2">
                    <ClockIcon size={16} className="text-amber-400" />
                    <h2 className="text-base font-serif font-normal text-zinc-100 tracking-tight">
                      Active Obligations (Not Completed)
                    </h2>
                    <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-amber-950/40 text-amber-300 border border-amber-800/40 font-semibold">
                      {visibleNotCompleted.length}
                    </span>
                  </div>

                  <span className="text-xs text-zinc-500 hidden sm:inline">
                    Click checkbox to complete
                  </span>
                </div>
              )}

              {/* Overdue Items (if any) */}
              {overduePending.length > 0 && (
                <ActionSectionGroup
                  title="Overdue"
                  icon={<AlertCircleIcon size={16} className="text-rose-400" />}
                  badgeVariant="danger"
                  badgeCount={overduePending.length}
                  items={overduePending}
                  isSelectMode={isSelectMode}
                  selectedIds={selectedIds}
                  onToggleSelect={handleToggleSelect}
                  onToggleStatus={handleToggleStatus}
                />
              )}

              {/* Due Soon Items (if any) */}
              {dueSoonPending.length > 0 && (
                <ActionSectionGroup
                  title="Due Soon (Next 3 Days)"
                  icon={<ClockIcon size={16} className="text-amber-400" />}
                  badgeVariant="warning"
                  badgeCount={dueSoonPending.length}
                  items={dueSoonPending}
                  isSelectMode={isSelectMode}
                  selectedIds={selectedIds}
                  onToggleSelect={handleToggleSelect}
                  onToggleStatus={handleToggleStatus}
                />
              )}

              {/* Upcoming & General Items */}
              {upcomingPending.length > 0 && (
                <ActionSectionGroup
                  title={
                    overduePending.length > 0 || dueSoonPending.length > 0
                      ? "Upcoming & General Tasks"
                      : "Pending Tasks"
                  }
                  icon={<CalendarIcon size={16} className="text-[#e8ff47]" />}
                  badgeCount={upcomingPending.length}
                  items={upcomingPending}
                  isSelectMode={isSelectMode}
                  selectedIds={selectedIds}
                  onToggleSelect={handleToggleSelect}
                  onToggleStatus={handleToggleStatus}
                />
              )}
            </div>
          )}

          {/* SECTION B: COMPLETED TASKS (Distinct visual treatment & section) */}
          {(statusFilter === "all" || statusFilter === "completed") && visibleCompleted.length > 0 && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between border-b border-[rgba(140,170,120,0.18)] pb-2.5">
                <div className="flex items-center gap-2">
                  <CheckCircleIcon size={16} className="text-emerald-400" />
                  <h2 className="text-base font-serif font-normal text-zinc-100 tracking-tight">
                    Completed Tasks
                  </h2>
                  <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-emerald-950/40 text-emerald-300 border border-emerald-800/40 font-semibold">
                    {visibleCompleted.length}
                  </span>
                </div>

                <span className="text-xs text-zinc-500 hidden sm:inline">
                  Click checkbox to uncheck / reopen
                </span>
              </div>

              <ActionSectionGroup
                title=""
                icon={null}
                items={visibleCompleted}
                isSelectMode={isSelectMode}
                selectedIds={selectedIds}
                onToggleSelect={handleToggleSelect}
                onToggleStatus={handleToggleStatus}
                isCompletedSection
              />
            </div>
          )}
        </div>
      )}

      {/* Confirmation Dialog for Destructive Operations */}
      {confirmModal.isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-dialog-title"
          aria-describedby="confirm-dialog-desc"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in-0 duration-150"
          onClick={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-[#0b120d] border border-[rgba(140,170,120,0.22)] shadow-[0_24px_50px_rgba(0,0,0,0.85)] p-5 sm:p-6 space-y-4 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-950/40 text-rose-400 border border-rose-900/40 shrink-0">
                  <TrashIcon size={18} />
                </div>
                <h3
                  id="confirm-dialog-title"
                  className="text-base sm:text-lg font-serif font-normal text-zinc-100"
                >
                  {confirmModal.type === "delete-selected"
                    ? `Delete ${confirmModal.count} selected task${
                        confirmModal.count === 1 ? "" : "s"
                      }?`
                    : "Delete all tasks?"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
                className="text-zinc-400 hover:text-zinc-200 p-1 rounded-lg hover:bg-[#0e1911] cursor-pointer"
                aria-label="Close dialog"
              >
                <XIcon size={16} />
              </button>
            </div>

            <p id="confirm-dialog-desc" className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              {confirmModal.type === "delete-selected"
                ? "This action cannot be undone and will permanently remove the selected tasks from your workspace."
                : "This will permanently remove all tasks from My Actions in this view. This action cannot be undone."}
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                ref={cancelButtonRef}
                onClick={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 rounded-xl text-xs sm:text-sm font-medium bg-[#0e1911] text-zinc-300 hover:text-white hover:bg-[#132217] border border-[rgba(140,170,120,0.18)] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl text-xs sm:text-sm font-medium bg-rose-600 hover:bg-rose-500 text-white shadow-xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
              >
                {confirmModal.type === "delete-selected" ? "Delete" : "Delete All"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification for Export & Actions */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-[0_12px_36px_rgba(0,0,0,0.85)] backdrop-blur-xl transition-all duration-300 animate-in fade-in-0 slide-in-from-bottom-3 ${
            toast.type === "success"
              ? "bg-[#09170f]/95 border-emerald-500/50 text-emerald-200"
              : toast.type === "error"
              ? "bg-[#180a0a]/95 border-rose-500/50 text-rose-200"
              : "bg-[#0c1610]/95 border-[#e8ff47]/40 text-[#e8ff47]"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircleIcon size={18} className="text-emerald-400 shrink-0" />
          ) : toast.type === "error" ? (
            <AlertCircleIcon size={18} className="text-rose-400 shrink-0" />
          ) : (
            <DownloadIcon size={18} className="text-[#e8ff47] shrink-0" />
          )}
          <p className="text-xs font-medium">{toast.text}</p>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors ml-1 cursor-pointer"
            aria-label="Dismiss message"
          >
            <XIcon size={14} />
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Renders an organized group of action cards with direct completion checkboxes & multi-select integration.
 */
function ActionSectionGroup({
  title,
  icon,
  badgeVariant,
  badgeCount,
  items,
  isSelectMode,
  selectedIds,
  onToggleSelect,
  onToggleStatus,
  isCompletedSection = false,
}: {
  title?: string;
  icon?: React.ReactNode;
  badgeVariant?: "danger" | "warning" | "default";
  badgeCount?: number;
  items: ActionItem[];
  isSelectMode: boolean;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleStatus: (item: ActionItem) => void;
  isCompletedSection?: boolean;
}) {
  if (items.length === 0) return null;

  return (
    <section className="space-y-3">
      {title && (
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="text-sm font-serif font-normal text-zinc-200 tracking-tight">
            {title}
          </h3>
          {badgeCount !== undefined && (
            <span
              className={`text-[11px] font-mono px-2 py-0.5 rounded-full border ${
                badgeVariant === "danger"
                  ? "bg-rose-950/40 text-rose-300 border-rose-800/40"
                  : badgeVariant === "warning"
                  ? "bg-amber-950/40 text-amber-300 border-amber-800/40"
                  : "bg-[#0e1911] text-zinc-300 border-[rgba(140,170,120,0.15)]"
              }`}
            >
              {badgeCount}
            </span>
          )}
        </div>
      )}

      <div className="space-y-3">
        {items.map((item) => {
          const isSelected = selectedIds.has(item.id);
          const isCompleted = item.status === "completed";

          return (
            <article
              key={item.id}
              onClick={() => {
                if (isSelectMode) {
                  onToggleSelect(item.id);
                }
              }}
              className={`p-4 sm:p-5 rounded-2xl border transition-all duration-200 flex items-start gap-3 sm:gap-3.5 group ${
                isSelectMode ? "cursor-pointer" : ""
              } ${
                isSelected
                  ? "border-[#e8ff47]/60 bg-[#102215] shadow-[0_0_18px_rgba(232,255,71,0.12)]"
                  : isCompleted
                  ? "border-[rgba(140,170,120,0.1)] bg-[#08120c]/60 opacity-70 hover:opacity-90 hover:bg-[#0c160f]"
                  : "border-[rgba(140,170,120,0.16)] bg-[#0c150e] hover:bg-[#0f1b12] hover:border-[rgba(140,170,120,0.3)] shadow-xs"
              }`}
            >
              {/* Checkbox 1: Multi-Select Mode Checkbox (Square checkbox) */}
              {isSelectMode && (
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={isSelected}
                  aria-label={`Select task: ${item.title}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleSelect(item.id);
                  }}
                  className={`flex h-5 w-5 sm:h-5.5 sm:w-5.5 items-center justify-center rounded-md transition-all duration-150 cursor-pointer shrink-0 mt-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e8ff47] ${
                    isSelected
                      ? "bg-[#e8ff47] text-black border border-[#e8ff47] shadow-[0_0_10px_rgba(232,255,71,0.5)] font-bold"
                      : "border-2 border-[rgba(140,170,120,0.45)] bg-[#08120c] hover:border-[#e8ff47] hover:bg-[#132418] text-transparent"
                  }`}
                >
                  <CheckIcon
                    size={13}
                    className={
                      isSelected
                        ? "text-black stroke-[3.5]"
                        : "opacity-0"
                    }
                  />
                </button>
              )}

              {/* Checkbox 2: Direct Task Status Checkbox (Circular toggle: Completed <-> Not Completed) */}
              <button
                type="button"
                role="checkbox"
                aria-checked={isCompleted}
                aria-label={`Mark "${item.title}" as ${
                  isCompleted ? "not completed" : "completed"
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleStatus(item);
                }}
                className={`group/cb flex h-5 w-5 sm:h-5.5 sm:w-5.5 items-center justify-center rounded-full transition-all duration-200 cursor-pointer shrink-0 mt-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e8ff47] ${
                  isCompleted
                    ? "bg-[#e8ff47] text-black border border-[#e8ff47] shadow-[0_0_10px_rgba(232,255,71,0.5)]"
                    : "border-2 border-[rgba(140,170,120,0.35)] bg-[#0c150e] hover:border-[#e8ff47]/80 hover:bg-[#132418] text-transparent hover:text-[#e8ff47]/60"
                }`}
              >
                <CheckIcon
                  size={12}
                  className={
                    isCompleted
                      ? "text-black stroke-[3]"
                      : "transition-opacity opacity-0 group-hover/cb:opacity-100"
                  }
                />
              </button>

              {/* Task Details Content */}
              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <h4
                    className={`text-sm sm:text-base font-semibold transition-all duration-150 ${
                      isCompleted
                        ? "line-through text-zinc-400 font-normal"
                        : "text-zinc-100"
                    }`}
                  >
                    {item.title}
                  </h4>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <PriorityBadge priority={item.priority} />
                    <CategoryBadge category={item.category} />

                    {/* Quick status pill button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleStatus(item);
                      }}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-mono transition-all cursor-pointer border ${
                        isCompleted
                          ? "bg-emerald-950/40 text-emerald-300 border-emerald-800/40 hover:bg-emerald-950/60"
                          : "bg-[#08120c] text-zinc-400 border-[rgba(140,170,120,0.16)] hover:text-emerald-300 hover:border-emerald-800/40"
                      }`}
                    >
                      {isCompleted ? "✓ Completed" : "Mark Done"}
                    </button>
                  </div>
                </div>

                {item.description && (
                  <p
                    className={`text-xs sm:text-sm leading-relaxed ${
                      isCompleted ? "text-zinc-400/80" : "text-zinc-400"
                    }`}
                  >
                    {item.description}
                  </p>
                )}

                <div className="flex items-center gap-3 text-xs text-zinc-400 pt-1 flex-wrap">
                  {item.deadline && (
                    <span className="inline-flex items-center gap-1 font-mono text-[11px]">
                      <CalendarIcon size={12} className="text-zinc-500" /> Due: {item.deadline}
                    </span>
                  )}
                  {item.sourceDocument && (
                    <span className="inline-flex items-center gap-1 font-mono text-[11px] bg-[#08120c] text-zinc-300 border border-[rgba(140,170,120,0.14)] px-2 py-0.5 rounded-md">
                      <DocumentIcon size={12} className="text-zinc-400" /> {item.sourceDocument}
                    </span>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
