import * as React from "react";
import { Priority, Category, ActionStatus } from "../../lib/types/action";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "neutral" | "high" | "medium" | "low" | "outline";
}

export function Badge({
  className = "",
  variant = "neutral",
  children,
  ...props
}: BadgeProps) {
  const variantStyles: Record<NonNullable<BadgeProps["variant"]>, string> = {
    neutral:
      "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700/60",
    high:
      "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60",
    medium:
      "bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-900/60",
    low:
      "bg-slate-100 text-slate-700 dark:bg-slate-800/80 dark:text-slate-300 border border-slate-200 dark:border-slate-700/60",
    outline:
      "bg-transparent text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700",
  };

  return (
    <span
      className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-md tracking-tight ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}

/**
 * Dedicated semantic badge for task Priority
 */
export function PriorityBadge({ priority }: { priority: Priority }) {
  const labels: Record<Priority, string> = {
    high: "High Priority",
    medium: "Medium Priority",
    low: "Low Priority",
  };

  return <Badge variant={priority}>{labels[priority]}</Badge>;
}

/**
 * Dedicated semantic badge for Category
 */
export function CategoryBadge({ category }: { category: Category }) {
  const categoryStyles: Record<Category, string> = {
    academic:
      "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-900/60",
    administrative:
      "bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-900/60",
    finance:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/60",
    event:
      "bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300 border border-teal-200 dark:border-teal-900/60",
    general:
      "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700/60",
  };

  const labels: Record<Category, string> = {
    academic: "Academic",
    administrative: "Administrative",
    finance: "Finance / Billing",
    event: "Event",
    general: "General",
  };

  return (
    <span
      className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-md capitalize ${categoryStyles[category]}`}
    >
      {labels[category] || category}
    </span>
  );
}

/**
 * Dedicated status badge for ActionStatus
 */
export function ActionStatusBadge({ status }: { status: ActionStatus }) {
  const statusStyles: Record<ActionStatus, string> = {
    pending:
      "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700",
    in_progress:
      "bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-200 dark:border-sky-900/60",
    completed:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/60",
  };

  const labels: Record<ActionStatus, string> = {
    pending: "Pending",
    in_progress: "In Progress",
    completed: "Completed",
  };

  return (
    <span
      className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-md ${statusStyles[status]}`}
    >
      {labels[status]}
    </span>
  );
}
