"use client";

import * as React from "react";
import { ActionItem } from "../../lib/types/action";
import { PriorityBadge, CategoryBadge, ActionStatusBadge } from "../ui/badge";
import { CalendarIcon } from "../ui/icons";

export interface ActionCardProps {
  action: ActionItem;
  className?: string;
}

export function ActionCard({ action, className = "" }: ActionCardProps) {
  return (
    <article
      className={`rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 sm:p-5 space-y-3 shadow-xs transition-colors hover:border-zinc-300 dark:hover:border-zinc-700 ${className}`}
    >
      {/* Header: Title and Priority Badge */}
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-semibold text-sm sm:text-base text-zinc-900 dark:text-zinc-100 leading-snug tracking-tight">
          {action.title}
        </h3>
        <div className="shrink-0">
          <PriorityBadge priority={action.priority} />
        </div>
      </div>

      {/* Description */}
      <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
        {action.description}
      </p>

      {/* Optional Source Snippet from Document */}
      {action.sourceSnippet && (
        <div className="text-xs text-zinc-500 dark:text-zinc-400/90 italic border-l-2 border-zinc-200 dark:border-zinc-700 pl-2.5 py-0.5">
          &ldquo;{action.sourceSnippet}&rdquo;
        </div>
      )}

      {/* Footer: Deadline & Classification Badges */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-3 border-t border-zinc-100 dark:border-zinc-800/80 text-xs">
        {/* Deadline */}
        <div className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400 font-medium">
          <CalendarIcon size={14} className="text-zinc-400 dark:text-zinc-500 shrink-0" />
          <span>
            {action.deadline ? (
              <>
                <span className="text-zinc-400 dark:text-zinc-500">Due:</span> {action.deadline}
              </>
            ) : (
              <span className="text-zinc-400">No explicit deadline</span>
            )}
          </span>
        </div>

        {/* Category & Status Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <CategoryBadge category={action.category} />
          <ActionStatusBadge status={action.status} />
        </div>
      </div>
    </article>
  );
}
