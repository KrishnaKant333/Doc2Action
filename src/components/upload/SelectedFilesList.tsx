"use client";

import * as React from "react";
import { DocumentIcon, XIcon, CheckCircleIcon, AlertCircleIcon, PlusIcon } from "../ui/icons";
import { Button } from "../ui/button";
import { formatFileSize, getFileTypeLabel, MAX_BATCH_FILES } from "./fileValidation";

export interface UploadFileItem {
  id: string;
  file: File;
  isValid: boolean;
  error?: string;
}

export interface SelectedFilesListProps {
  items: UploadFileItem[];
  onRemove: (id: string) => void;
  onAddMore: () => void;
  canAddMore: boolean;
  className?: string;
}

export function SelectedFilesList({
  items,
  onRemove,
  onAddMore,
  canAddMore,
  className = "",
}: SelectedFilesListProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header with counter */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          Selected documents
        </h2>
        <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
          {items.length} of {MAX_BATCH_FILES}
        </span>
      </div>

      {/* Documents Card Container */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs overflow-hidden">
        <ul
          role="list"
          aria-label="Selected documents list"
          className="divide-y divide-zinc-100 dark:divide-zinc-800/80"
        >
          {items.map((item) => {
            const sizeString = formatFileSize(item.file.size);
            const typeLabel = getFileTypeLabel(item.file);

            return (
              <li
                key={item.id}
                className={`p-3.5 sm:p-4 flex items-center justify-between gap-3 transition-colors ${
                  !item.isValid
                    ? "bg-red-50/50 dark:bg-red-950/20"
                    : "hover:bg-zinc-50/60 dark:hover:bg-zinc-800/30"
                }`}
              >
                {/* File Details */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {/* File Icon */}
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${
                      !item.isValid
                        ? "bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-300 border-red-200 dark:border-red-900/60"
                        : "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200 border-zinc-200/60 dark:border-zinc-700/60"
                    }`}
                  >
                    {!item.isValid ? <AlertCircleIcon size={20} /> : <DocumentIcon size={20} />}
                  </div>

                  {/* Metadata and Validation Status */}
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p
                        className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate max-w-full sm:max-w-md"
                        title={item.file.name}
                      >
                        {item.file.name}
                      </p>
                      <span className="text-[10px] font-medium font-mono px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 shrink-0">
                        {typeLabel}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 flex-wrap">
                      <span>{sizeString}</span>
                      <span>•</span>
                      {item.isValid ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium text-[11px]">
                          <CheckCircleIcon size={12} /> Ready
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400 font-medium text-[11px]">
                          <AlertCircleIcon size={12} /> {item.error || "Unsupported"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Remove Action */}
                <div className="shrink-0">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemove(item.id)}
                    className="text-xs text-zinc-500 hover:text-red-600 dark:text-zinc-400 dark:hover:text-red-400"
                    aria-label={`Remove document ${item.file.name}`}
                  >
                    <XIcon size={14} className="mr-1" />
                    <span>Remove</span>
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Add more button or max reached notice */}
      <div className="flex items-center justify-between text-xs">
        {canAddMore ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onAddMore}
            className="text-xs"
            aria-label="Add more documents"
          >
            <PlusIcon size={14} className="mr-1" />
            <span>Add more documents</span>
          </Button>
        ) : (
          <p className="text-zinc-500 dark:text-zinc-400 italic">
            Maximum batch limit reached (5 documents).
          </p>
        )}
      </div>
    </div>
  );
}
