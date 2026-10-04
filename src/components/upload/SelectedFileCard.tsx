"use client";

import * as React from "react";
import { DocumentIcon, XIcon, CheckCircleIcon } from "../ui/icons";
import { Button } from "../ui/button";
import { formatFileSize, getFileTypeLabel } from "./fileValidation";

export interface SelectedFileCardProps {
  file: File;
  onRemove: () => void;
  onReplace: () => void;
  className?: string;
}

export function SelectedFileCard({
  file,
  onRemove,
  onReplace,
  className = "",
}: SelectedFileCardProps) {
  const sizeString = formatFileSize(file.size);
  const typeLabel = getFileTypeLabel(file);

  return (
    <div
      className={`rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 sm:p-6 shadow-xs ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* File Details Group */}
        <div className="flex items-start sm:items-center gap-3.5 min-w-0">
          {/* Document Icon */}
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200 border border-zinc-200/60 dark:border-zinc-700/60">
            <DocumentIcon size={24} />
          </div>

          {/* Metadata */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h4
                className="font-medium text-sm sm:text-base text-zinc-900 dark:text-zinc-100 truncate max-w-[260px] sm:max-w-md"
                title={file.name}
              >
                {file.name}
              </h4>
              <span className="text-[11px] font-medium font-mono px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                {typeLabel}
              </span>
            </div>

            <div className="flex items-center gap-2 mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              <span>{sizeString}</span>
              <span>•</span>
              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                <CheckCircleIcon size={13} /> Ready to analyze
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onReplace}
            className="text-xs"
          >
            Change
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onRemove}
            className="text-xs text-zinc-600 hover:text-red-600 dark:text-zinc-400 dark:hover:text-red-400"
            aria-label={`Remove file ${file.name}`}
          >
            <XIcon size={14} className="mr-1" />
            Remove
          </Button>
        </div>
      </div>
    </div>
  );
}
