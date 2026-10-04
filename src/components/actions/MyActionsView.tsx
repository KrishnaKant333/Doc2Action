"use client";

import * as React from "react";
import {
  fetchMyActions,
  updateActionStatus,
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
} from "../ui/icons";

export interface MyActionsViewProps {
  onGoToUpload?: () => void;
  className?: string;
}

export function MyActionsView({
  onGoToUpload,
  className = "",
}: MyActionsViewProps) {
  const [data, setData] = React.useState<MyActionsGrouped | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  const loadActions = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchMyActions();
      setData(res);
    } catch {
      setError("Failed to load your actions. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadActions();
  }, [loadActions]);

  const handleToggle = async (action: ActionItem) => {
    const nextStatus: ActionStatus = action.status === "completed" ? "pending" : "completed";

    // Optimistic UI update
    setData((prev) => {
      if (!prev) return prev;
      const updateList = (list: ActionItem[]) =>
        list.map((item) =>
          item.id === action.id ? { ...item, status: nextStatus } : item
        );

      const all = [
        ...prev.groups.overdue,
        ...prev.groups.dueSoon,
        ...prev.groups.upcoming,
        ...prev.groups.completed,
      ].map((item) =>
        item.id === action.id ? { ...item, status: nextStatus } : item
      );

      const completed = all.filter((a) => a.status === "completed");
      const pending = all.filter((a) => a.status !== "completed");

      return {
        ...prev,
        metrics: {
          ...prev.metrics,
          completed: completed.length,
          pending: pending.length,
        },
        groups: {
          overdue: updateList(prev.groups.overdue).filter((a) => a.status !== "completed"),
          dueSoon: updateList(prev.groups.dueSoon).filter((a) => a.status !== "completed"),
          upcoming: updateList(prev.groups.upcoming).filter((a) => a.status !== "completed"),
          completed: all.filter((a) => a.status === "completed"),
        },
      };
    });

    await updateActionStatus(action.id, nextStatus as "pending" | "completed");
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900 dark:border-zinc-700 dark:border-t-zinc-100" />
        <p className="text-xs text-zinc-500 font-medium">Loading workspace actions...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <Card className="p-8 text-center space-y-3 max-w-lg mx-auto">
        <AlertCircleIcon size={24} className="mx-auto text-amber-600" />
        <p className="text-sm text-zinc-700 dark:text-zinc-300">
          {error || "No saved actions found in your workspace."}
        </p>
        <Button variant="outline" size="sm" onClick={loadActions}>
          Retry
        </Button>
      </Card>
    );
  }

  const { metrics, groups } = data;
  const hasAny = metrics.total > 0;

  return (
    <div className={`space-y-8 animate-fade-in ${className}`}>
      {/* 1. Header with Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-zinc-100">
            My Actions
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
            Consolidated tasks and deadlines extracted across your recent documents.
          </p>
        </div>
        {onGoToUpload && (
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={onGoToUpload}
            className="text-xs self-start sm:self-center"
          >
            + Analyze New Document
          </Button>
        )}
      </div>

      {/* 2. Metrics Row */}
      <section aria-label="Action status summary" className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-3 sm:p-4">
          <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">
            Total Tasks
          </span>
          <div className="mt-1 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {metrics.total}
          </div>
        </Card>

        <Card className="p-3 sm:p-4">
          <span className="text-[11px] font-medium text-rose-600 uppercase tracking-wider">
            Overdue
          </span>
          <div className="mt-1 text-2xl font-bold text-rose-600">
            {metrics.overdue}
          </div>
        </Card>

        <Card className="p-3 sm:p-4">
          <span className="text-[11px] font-medium text-amber-600 uppercase tracking-wider">
            Due Soon
          </span>
          <div className="mt-1 text-2xl font-bold text-amber-600">
            {metrics.dueSoon}
          </div>
        </Card>

        <Card className="p-3 sm:p-4">
          <span className="text-[11px] font-medium text-emerald-600 uppercase tracking-wider">
            Completed
          </span>
          <div className="mt-1 text-2xl font-bold text-emerald-600">
            {metrics.completed}
          </div>
        </Card>
      </section>

      {/* 3. Empty State */}
      {!hasAny ? (
        <Card className="p-10 text-center space-y-4 max-w-lg mx-auto">
          <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
            <CheckCircleIcon size={24} />
          </div>
          <div>
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              No Actions Recorded Yet
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-sm mx-auto">
              Upload a college notice, syllabus, or circular to automatically extract your tasks.
            </p>
          </div>
          {onGoToUpload && (
            <Button variant="primary" size="sm" onClick={onGoToUpload}>
              Upload a Document
            </Button>
          )}
        </Card>
      ) : (
        /* 4. Categorized Action Sections */
        <div className="space-y-6">
          {/* Overdue */}
          {groups.overdue.length > 0 && (
            <ActionSection
              title="Overdue"
              icon={<AlertCircleIcon size={16} className="text-rose-600" />}
              badgeVariant="danger"
              items={groups.overdue}
              onToggle={handleToggle}
            />
          )}

          {/* Due Soon */}
          {groups.dueSoon.length > 0 && (
            <ActionSection
              title="Due Soon"
              icon={<ClockIcon size={16} className="text-amber-600" />}
              badgeVariant="warning"
              items={groups.dueSoon}
              onToggle={handleToggle}
            />
          )}

          {/* Upcoming */}
          {groups.upcoming.length > 0 && (
            <ActionSection
              title="Upcoming & General"
              icon={<CalendarIcon size={16} className="text-zinc-500" />}
              items={groups.upcoming}
              onToggle={handleToggle}
            />
          )}

          {/* Completed */}
          {groups.completed.length > 0 && (
            <ActionSection
              title="Completed"
              icon={<CheckCircleIcon size={16} className="text-emerald-600" />}
              badgeVariant="success"
              items={groups.completed}
              onToggle={handleToggle}
              isCompletedSection
            />
          )}
        </div>
      )}
    </div>
  );
}

function ActionSection({
  title,
  icon,
  items,
  onToggle,
  isCompletedSection = false,
}: {
  title: string;
  icon: React.ReactNode;
  badgeVariant?: string;
  items: ActionItem[];
  onToggle: (item: ActionItem) => void;
  isCompletedSection?: boolean;
}) {
  return (
    <section className="space-y-2.5">
      <div className="flex items-center gap-2">
        {icon}
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          {title}
        </h2>
        <span className="text-[11px] font-mono px-2 py-0.2 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
          {items.length}
        </span>
      </div>

      <div className="space-y-2">
        {items.map((item) => (
          <article
            key={item.id}
            className={`p-3.5 sm:p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs flex items-start gap-3 transition-colors ${
              isCompletedSection ? "opacity-60 bg-zinc-50/50 dark:bg-zinc-900/40" : ""
            }`}
          >
            <input
              type="checkbox"
              checked={item.status === "completed"}
              onChange={() => onToggle(item)}
              aria-label={`Mark "${item.title}" as ${
                item.status === "completed" ? "pending" : "completed"
              }`}
              className="mt-1 h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 cursor-pointer"
            />
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <h3
                  className={`text-sm font-semibold text-zinc-900 dark:text-zinc-100 ${
                    item.status === "completed" ? "line-through text-zinc-400 dark:text-zinc-500" : ""
                  }`}
                >
                  {item.title}
                </h3>
                <div className="flex items-center gap-1.5 shrink-0">
                  <PriorityBadge priority={item.priority} />
                  <CategoryBadge category={item.category} />
                </div>
              </div>

              {item.description && (
                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                  {item.description}
                </p>
              )}

              <div className="flex items-center gap-3 text-[11px] text-zinc-500 dark:text-zinc-400 pt-1 flex-wrap">
                {item.deadline && (
                  <span className="inline-flex items-center gap-1">
                    <CalendarIcon size={12} /> Due: {item.deadline}
                  </span>
                )}
                {item.sourceDocument && (
                  <span className="inline-flex items-center gap-1 font-mono text-[10px] bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                    <DocumentIcon size={11} /> {item.sourceDocument}
                  </span>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
