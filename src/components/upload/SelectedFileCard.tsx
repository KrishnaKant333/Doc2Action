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
      className={`rounded-xl border border-[rgba(140,170,120,0.14)] bg-[#0b120d] p-4 sm:p-6 shadow-xs ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* File Details Group */}
        <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
          {/* Document Icon */}
          <div className="flex h-11 w-11 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl bg-[#0e1911] text-zinc-200 border border-[rgba(140,170,120,0.15)]">
            <DocumentIcon size={22} />
          </div>

          {/* Metadata */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3
                className="font-medium text-sm sm:text-base text-zinc-900 dark:text-zinc-100 truncate max-w-full sm:max-w-md"
                title={file.name}
              >
                {file.name}
              </h3>
              <span className="text-[11px] font-medium font-mono px-1.5 py-0.5 rounded bg-[#0e1911] text-zinc-400 border border-[rgba(140,170,120,0.15)] shrink-0">
                {typeLabel}
              </span>
            </div>

            <div className="flex items-center gap-2 mt-1 text-xs text-zinc-500 dark:text-zinc-400 flex-wrap">
              <span>{sizeString}</span>
              <span>•</span>
              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                <CheckCircleIcon size={13} /> Ready to analyze
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-end gap-2 shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-zinc-100 dark:border-zinc-800/80">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onReplace}
            className="text-xs"
            aria-label={`Change file ${file.name}`}
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
