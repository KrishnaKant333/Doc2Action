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
} from "../ui/icons";

export interface MyActionsViewProps {
  onGoToUpload?: () => void;
  className?: string;
}

type CategoryFilter = "all" | "upcoming" | "general";

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

  // Bulk selection and category filtering state
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [categoryFilter, setCategoryFilter] = React.useState<CategoryFilter>("all");
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
    // Auto-focus cancel button for safe keyboard accessibility
    setTimeout(() => {
      cancelButtonRef.current?.focus();
    }, 50);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [confirmModal.isOpen]);

  // Recalculates grouped actions and metrics
  const recalculateData = (allTasks: ActionItem[]): MyActionsGrouped => {
    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    const overdue: ActionItem[] = [];
    const dueSoon: ActionItem[] = [];
    const upcoming: ActionItem[] = [];
    const completed: ActionItem[] = [];

    for (const act of allTasks) {
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
        total: allTasks.length,
        pending: allTasks.length - completed.length,
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

  // Toggle individual task selection checkbox
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

  // Single task status toggle (quick action)
  const handleToggleStatus = async (action: ActionItem) => {
    const nextStatus: ActionStatus =
      action.status === "completed" ? "pending" : "completed";

    setData((prev) => {
      if (!prev) return prev;
      const allTasks = [
        ...prev.groups.overdue,
        ...prev.groups.dueSoon,
        ...prev.groups.upcoming,
        ...prev.groups.completed,
      ].map((item) =>
        item.id === action.id ? { ...item, status: nextStatus } : item
      );
      return recalculateData(allTasks);
    });

    if (nextStatus === "completed") {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(action.id);
        return next;
      });
    }

    await updateActionStatus(action.id, nextStatus as "pending" | "completed");
  };

  // All tasks currently represented in state
  const allTasks = React.useMemo(() => {
    if (!data) return [];
    return [
      ...data.groups.overdue,
      ...data.groups.dueSoon,
      ...data.groups.upcoming,
      ...data.groups.completed,
    ];
  }, [data]);

  // Tasks in current category context
  const getTasksInContext = React.useCallback(
    (tasks: ActionItem[]): ActionItem[] => {
      if (categoryFilter === "all") return tasks;
      if (categoryFilter === "upcoming") {
        return tasks.filter((t) => Boolean(t.deadline));
      }
      if (categoryFilter === "general") {
        return tasks.filter((t) => !t.deadline || t.category === "general");
      }
      return tasks;
    },
    [categoryFilter]
  );

  const contextTasks = React.useMemo(
    () => getTasksInContext(allTasks),
    [allTasks, getTasksInContext]
  );

  const actionableTasksInContext = React.useMemo(
    () => contextTasks.filter((t) => t.status !== "completed"),
    [contextTasks]
  );

  const upcomingCount = React.useMemo(
    () => allTasks.filter((t) => Boolean(t.deadline)).length,
    [allTasks]
  );

  const generalCount = React.useMemo(
    () => allTasks.filter((t) => !t.deadline || t.category === "general").length,
    [allTasks]
  );

  // Bulk Action: Mark Selected as Completed
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

    // Clear selection
    setSelectedIds(new Set());

    // Sync with backend
    await bulkUpdateActionStatus(idsToComplete, "completed");
  };

  // Bulk Action: Mark All in Current Context as Completed
  const handleMarkAllCompleted = async () => {
    if (!data || actionableTasksInContext.length === 0) return;
    const idsToComplete = actionableTasksInContext.map((t) => t.id);
    const idSet = new Set(idsToComplete);

    // Optimistic UI update
    setData((prev) => {
      if (!prev) return prev;
      const updated = allTasks.map((t) =>
        idSet.has(t.id) ? { ...t, status: "completed" as ActionStatus } : t
      );
      return recalculateData(updated);
    });

    // Clear completed items from selection
    setSelectedIds((prev) => {
      const next = new Set(prev);
      idsToComplete.forEach((id) => next.delete(id));
      return next;
    });

    // Sync with backend
    await bulkUpdateActionStatus(idsToComplete, "completed");
  };

  // Bulk Action: Confirm and Delete
  const handleConfirmDelete = async () => {
    if (!data) return;
    let idsToDelete: string[] = [];
    const isDeleteAll = confirmModal.type === "delete-all";

    if (isDeleteAll) {
      idsToDelete = contextTasks.map((t) => t.id);
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

    // Clear deleted IDs from selection
    setSelectedIds((prev) => {
      const next = new Set(prev);
      idsToDelete.forEach((id) => next.delete(id));
      return next;
    });

    setConfirmModal({ isOpen: false, type: "delete-selected" });

    // Sync with backend
    await bulkDeleteActions(idsToDelete, isDeleteAll && categoryFilter === "all");
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

  const { metrics, groups } = data;
  const hasAny = metrics.total > 0;
  const selectedCount = selectedIds.size;

  // Filtered sections according to categoryFilter
  const overdueItems = getTasksInContext(groups.overdue);
  const dueSoonItems = getTasksInContext(groups.dueSoon);
  const upcomingItems = getTasksInContext(groups.upcoming);
  const completedItems = getTasksInContext(groups.completed);

  return (
    <div className={`space-y-6 sm:space-y-8 animate-fade-in ${className}`}>
      {/* 1. Header with Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-xl border border-[rgba(140,170,120,0.14)] bg-[#0b120d] shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-serif font-normal tracking-tight text-zinc-100">
            My Actions
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Consolidated tasks and deadlines extracted across your recent documents.
          </p>
        </div>
        {onGoToUpload && (
          <button
            type="button"
            onClick={onGoToUpload}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#e8ff47]/[0.08] hover:bg-[#e8ff47]/[0.16] text-zinc-100 hover:text-white border border-[#e8ff47]/25 hover:border-[#e8ff47]/45 shadow-xs backdrop-blur-md text-xs font-medium transition-all duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#e8ff47] focus-visible:ring-offset-2 focus-visible:ring-offset-[#04040a] self-start sm:self-center shrink-0 active:scale-[0.99]"
          >
            <span>+ Analyze New Document</span>
          </button>
        )}
      </div>

      {/* 2. Metrics Row */}
      <section aria-label="Action status summary" className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <Card className="p-3.5 sm:p-5">
          <span className="text-[11px] sm:text-xs font-medium text-zinc-400 uppercase tracking-wider">
            Total Tasks
          </span>
          <div className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-zinc-100">
            {metrics.total}
          </div>
        </Card>

        <Card className="p-3.5 sm:p-5 border-rose-900/40">
          <span className="text-[11px] sm:text-xs font-medium text-rose-400 uppercase tracking-wider">
            Overdue
          </span>
          <div className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-rose-400">
            {metrics.overdue}
          </div>
        </Card>

        <Card className="p-3.5 sm:p-5 border-amber-900/40">
          <span className="text-[11px] sm:text-xs font-medium text-amber-400 uppercase tracking-wider">
            Due Soon
          </span>
          <div className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-amber-400">
            {metrics.dueSoon}
          </div>
        </Card>

        <Card className="p-3.5 sm:p-5 border-emerald-900/40">
          <span className="text-[11px] sm:text-xs font-medium text-emerald-400 uppercase tracking-wider">
            Completed
          </span>
          <div className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-emerald-400">
            {metrics.completed}
          </div>
        </Card>
      </section>

      {/* 3. Bulk Action Controls Toolbar */}
      {hasAny && (
        <section
          aria-label="Bulk task actions"
          className="p-3.5 sm:p-4 rounded-xl border border-[rgba(140,170,120,0.15)] bg-[#0b120d]/90 backdrop-blur-md shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4"
        >
          {/* Category Filter Tabs: Upcoming & General */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-xs text-zinc-400 font-mono hidden sm:inline">Category:</span>
            <div
              role="tablist"
              aria-label="Filter actions by category"
              className="inline-flex items-center p-1 rounded-xl bg-[#08120c] border border-[rgba(140,170,120,0.15)] text-xs"
            >
              <button
                type="button"
                role="tab"
                aria-selected={categoryFilter === "all"}
                onClick={() => setCategoryFilter("all")}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer font-medium ${
                  categoryFilter === "all"
                    ? "bg-[#0e1911] text-zinc-100 border border-[rgba(140,170,120,0.22)] shadow-2xs font-semibold"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-[#0e1911]/60"
                }`}
              >
                All ({allTasks.length})
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={categoryFilter === "upcoming"}
                onClick={() => setCategoryFilter("upcoming")}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer font-medium ${
                  categoryFilter === "upcoming"
                    ? "bg-[#0e1911] text-zinc-100 border border-[rgba(140,170,120,0.22)] shadow-2xs font-semibold"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-[#0e1911]/60"
                }`}
              >
                Upcoming ({upcomingCount})
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={categoryFilter === "general"}
                onClick={() => setCategoryFilter("general")}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer font-medium ${
                  categoryFilter === "general"
                    ? "bg-[#0e1911] text-zinc-100 border border-[rgba(140,170,120,0.22)] shadow-2xs font-semibold"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-[#0e1911]/60"
                }`}
              >
                General ({generalCount})
              </button>
            </div>

            {/* Selection Counter Pill */}
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono transition-colors ${
                selectedCount > 0
                  ? "bg-[#e8ff47]/10 text-[#e8ff47] border border-[#e8ff47]/25 font-semibold"
                  : "bg-[#0e1911] text-zinc-500 border border-[rgba(140,170,120,0.1)]"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  selectedCount > 0 ? "bg-[#e8ff47]" : "bg-zinc-600"
                }`}
              />
              {selectedCount} selected
            </span>
          </div>

          {/* Action Buttons Toolbar */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Safe / Positive: Complete Selected */}
            <button
              type="button"
              disabled={selectedCount === 0}
              onClick={handleMarkSelectedCompleted}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed bg-[#0e1911] text-emerald-300 hover:text-emerald-100 hover:bg-[#132217] border border-[rgba(140,170,120,0.22)] active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
              aria-label="Mark selected tasks as completed"
            >
              <CheckCircleIcon size={14} className="text-[#e8ff47]" />
              <span>Complete Selected</span>
            </button>

            {/* Safe / Positive: Complete All */}
            <button
              type="button"
              disabled={actionableTasksInContext.length === 0}
              onClick={handleMarkAllCompleted}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed bg-[#0e1911] text-zinc-200 hover:text-white hover:bg-[#132217] border border-[rgba(140,170,120,0.18)] active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
              aria-label="Mark all actionable tasks as completed"
            >
              <CheckCircleIcon size={14} className="text-emerald-400" />
              <span>Complete All</span>
            </button>

            {/* Destructive: Delete Selected */}
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
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed bg-rose-950/20 text-rose-300 hover:text-rose-100 hover:bg-rose-950/40 border border-rose-900/30 hover:border-rose-900/50 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/50"
              aria-label="Delete selected tasks"
            >
              <TrashIcon size={14} />
              <span>Delete Selected</span>
            </button>

            {/* Destructive: Delete All */}
            <button
              type="button"
              disabled={contextTasks.length === 0}
              onClick={() =>
                setConfirmModal({
                  isOpen: true,
                  type: "delete-all",
                  count: contextTasks.length,
                })
              }
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed bg-rose-950/20 text-rose-300 hover:text-rose-100 hover:bg-rose-950/40 border border-rose-900/30 hover:border-rose-900/50 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/50"
              aria-label="Delete all tasks in this view"
            >
              <TrashIcon size={14} />
              <span>Delete All</span>
            </button>
          </div>
        </section>
      )}

      {/* 4. Empty State */}
      {!hasAny || contextTasks.length === 0 ? (
        <Card className="p-10 text-center space-y-4 max-w-lg mx-auto border-[rgba(140,170,120,0.14)] bg-[#0c150e]/80">
          <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-xl bg-[#0e1911] text-zinc-300 border border-[rgba(140,170,120,0.15)]">
            <CheckCircleIcon size={24} />
          </div>
          <div className="space-y-1">
            <h2 className="text-base sm:text-lg font-serif font-normal text-zinc-100">
              No actions yet
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-sm mx-auto">
              Tasks extracted from analyzed documents will appear here.
            </p>
          </div>
          {onGoToUpload && (
            <div className="pt-2">
              <button
                type="button"
                onClick={onGoToUpload}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#e8ff47]/[0.1] hover:bg-[#e8ff47]/[0.2] text-zinc-100 hover:text-white border border-[#e8ff47]/30 hover:border-[#e8ff47]/50 text-xs sm:text-sm font-medium transition-all shadow-xs cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#e8ff47]"
              >
                <span>Upload a Document</span>
              </button>
            </div>
          )}
        </Card>
      ) : (
        /* 5. Categorized Action Sections */
        <div className="space-y-6">
          {/* Overdue */}
          {overdueItems.length > 0 && (
            <ActionSection
              title="Overdue"
              icon={<AlertCircleIcon size={16} className="text-rose-400" />}
              badgeVariant="danger"
              items={overdueItems}
              selectedIds={selectedIds}
              onToggleSelect={handleToggleSelect}
              onToggleStatus={handleToggleStatus}
            />
          )}

          {/* Due Soon */}
          {dueSoonItems.length > 0 && (
            <ActionSection
              title="Due Soon"
              icon={<ClockIcon size={16} className="text-amber-400" />}
              badgeVariant="warning"
              items={dueSoonItems}
              selectedIds={selectedIds}
              onToggleSelect={handleToggleSelect}
              onToggleStatus={handleToggleStatus}
            />
          )}

          {/* Upcoming & General */}
          {upcomingItems.length > 0 && (
            <ActionSection
              title={
                categoryFilter === "general"
                  ? "General Tasks"
                  : categoryFilter === "upcoming"
                  ? "Upcoming Deadlines"
                  : "Upcoming & General"
              }
              icon={<CalendarIcon size={16} className="text-zinc-400" />}
              items={upcomingItems}
              selectedIds={selectedIds}
              onToggleSelect={handleToggleSelect}
              onToggleStatus={handleToggleStatus}
            />
          )}

          {/* Completed */}
          {completedItems.length > 0 && (
            <ActionSection
              title="Completed"
              icon={<CheckCircleIcon size={16} className="text-emerald-400" />}
              badgeVariant="success"
              items={completedItems}
              selectedIds={selectedIds}
              onToggleSelect={handleToggleSelect}
              onToggleStatus={handleToggleStatus}
              isCompletedSection
            />
          )}
        </div>
      )}

      {/* Confirmation Dialog for Destructive Delete Operations */}
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
    </div>
  );
}

function ActionSection({
  title,
  icon,
  items,
  selectedIds,
  onToggleSelect,
  onToggleStatus,
  isCompletedSection = false,
}: {
  title: string;
  icon: React.ReactNode;
  badgeVariant?: string;
  items: ActionItem[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleStatus: (item: ActionItem) => void;
  isCompletedSection?: boolean;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        {icon}
        <h2 className="text-base font-serif font-normal text-zinc-100 tracking-tight">
          {title}
        </h2>
        <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-[#0e1911] text-zinc-300 border border-[rgba(140,170,120,0.15)]">
          {items.length}
        </span>
      </div>

      <div className="space-y-3">
        {items.map((item) => {
          const isSelected = selectedIds.has(item.id);
          const isCompleted = item.status === "completed";

          return (
            <article
              key={item.id}
              className={`p-4 sm:p-5 rounded-xl border transition-all duration-150 flex items-start gap-3.5 ${
                isSelected
                  ? "border-[#e8ff47]/40 bg-[#0e1c12] shadow-[0_0_15px_rgba(232,255,71,0.06)]"
                  : "border-[rgba(140,170,120,0.14)] bg-[#0e1911] hover:bg-[#111d14] hover:border-[rgba(140,170,120,0.28)] shadow-xs"
              } ${isCompletedSection ? "opacity-60 bg-[#0c150e]/60 border-[rgba(140,170,120,0.1)]" : ""}`}
            >
              {/* Selection Checkbox */}
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => onToggleSelect(item.id)}
                aria-label={`Select task: ${item.title}`}
                className="mt-1 h-4 w-4 rounded border-[rgba(140,170,120,0.35)] bg-[#0c150e] text-[#e8ff47] accent-[#e8ff47] focus:ring-[#e8ff47] cursor-pointer shrink-0"
              />

              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2 min-w-0">
                    <h3
                      className={`text-sm sm:text-base font-semibold ${
                        isCompleted
                          ? "line-through text-zinc-400"
                          : "text-zinc-100"
                      }`}
                    >
                      {item.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <PriorityBadge priority={item.priority} />
                    <CategoryBadge category={item.category} />

                    {/* Quick Single Status Toggle Button */}
                    <button
                      type="button"
                      onClick={() => onToggleStatus(item)}
                      aria-label={`Mark "${item.title}" as ${
                        isCompleted ? "pending" : "completed"
                      }`}
                      className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors cursor-pointer border ${
                        isCompleted
                          ? "bg-emerald-950/40 text-emerald-300 border-emerald-800/40 hover:bg-emerald-950/60"
                          : "bg-[#0c150e] text-zinc-400 border-[rgba(140,170,120,0.15)] hover:text-emerald-300 hover:border-emerald-800/40"
                      }`}
                    >
                      {isCompleted ? "✓ Completed" : "Mark Done"}
                    </button>
                  </div>
                </div>

                {item.description && (
                  <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
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
                    <span className="inline-flex items-center gap-1 font-mono text-[11px] bg-[#0c150e] text-zinc-300 border border-[rgba(140,170,120,0.14)] px-2 py-0.5 rounded">
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
