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

  return (
    <div className={`space-y-8 animate-fade-in ${className}`}>
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

      {/* 3. Empty State */}
      {!hasAny ? (
        <Card className="p-10 text-center space-y-4 max-w-lg mx-auto border-[rgba(140,170,120,0.14)] bg-[#0c150e]/80">
          <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-xl bg-[#0e1911] text-zinc-300 border border-[rgba(140,170,120,0.15)]">
            <CheckCircleIcon size={24} />
          </div>
          <div className="space-y-1">
            <h2 className="text-base sm:text-lg font-serif font-normal text-zinc-100">
              No Actions Recorded Yet
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-sm mx-auto">
              Upload a college notice, syllabus, or circular to automatically extract your tasks.
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
        /* 4. Categorized Action Sections */
        <div className="space-y-6">
          {/* Overdue */}
          {groups.overdue.length > 0 && (
            <ActionSection
              title="Overdue"
              icon={<AlertCircleIcon size={16} className="text-rose-400" />}
              badgeVariant="danger"
              items={groups.overdue}
              onToggle={handleToggle}
            />
          )}

          {/* Due Soon */}
          {groups.dueSoon.length > 0 && (
            <ActionSection
              title="Due Soon"
              icon={<ClockIcon size={16} className="text-amber-400" />}
              badgeVariant="warning"
              items={groups.dueSoon}
              onToggle={handleToggle}
            />
          )}

          {/* Upcoming */}
          {groups.upcoming.length > 0 && (
            <ActionSection
              title="Upcoming & General"
              icon={<CalendarIcon size={16} className="text-zinc-400" />}
              items={groups.upcoming}
              onToggle={handleToggle}
            />
          )}

          {/* Completed */}
          {groups.completed.length > 0 && (
            <ActionSection
              title="Completed"
              icon={<CheckCircleIcon size={16} className="text-emerald-400" />}
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
        {items.map((item) => (
          <article
            key={item.id}
            className={`p-4 sm:p-5 rounded-xl border border-[rgba(140,170,120,0.14)] bg-[#0e1911] hover:bg-[#111d14] hover:border-[rgba(140,170,120,0.28)] shadow-xs flex items-start gap-3.5 transition-all ${
              isCompletedSection ? "opacity-55 bg-[#0c150e]/60 border-[rgba(140,170,120,0.1)]" : ""
            }`}
          >
            <input
              type="checkbox"
              checked={item.status === "completed"}
              onChange={() => onToggle(item)}
              aria-label={`Mark "${item.title}" as ${
                item.status === "completed" ? "pending" : "completed"
              }`}
              className="mt-1 h-4 w-4 rounded border-[rgba(140,170,120,0.3)] bg-[#0c150e] text-[#e8ff47] accent-[#e8ff47] focus:ring-[#e8ff47] cursor-pointer"
            />
            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <h3
                  className={`text-sm sm:text-base font-semibold text-zinc-100 ${
                    item.status === "completed" ? "line-through text-zinc-400" : ""
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
                <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                  {item.description}
                </p>
              )}

              <div className="flex items-center gap-3 text-xs text-zinc-400 pt-1 flex-wrap">
                {item.deadline && (
                  <span className="inline-flex items-center gap-1">
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
        ))}
      </div>
    </section>
  );
}
