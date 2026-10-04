"use client";

import * as React from "react";
import { UploadDropzone } from "./UploadDropzone";
import { SelectedFilesList, UploadFileItem } from "./SelectedFilesList";
import { Button } from "../ui/button";
import { AlertCircleIcon, ArrowRightIcon, XIcon } from "../ui/icons";
import {
  validateFile,
  SUPPORTED_EXTENSIONS,
  SUPPORTED_MIME_TYPES,
  MAX_BATCH_FILES,
} from "./fileValidation";

export interface UploadWorkflowProps {
  onStartAnalysis: (files: File[]) => void;
  className?: string;
}

export function UploadWorkflow({
  onStartAnalysis,
  className = "",
}: UploadWorkflowProps) {
  const [items, setItems] = React.useState<UploadFileItem[]>([]);
  const [batchNotice, setBatchNotice] = React.useState<string | null>(null);
  const addMoreInputRef = React.useRef<HTMLInputElement>(null);

  const handleFilesAdded = (newFiles: File[]) => {
    if (!newFiles || newFiles.length === 0) return;

    setItems((prevItems) => {
      // 1. Filter out duplicates (same file name and size already present)
      const nonDuplicates: File[] = [];
      let duplicateCount = 0;

      for (const file of newFiles) {
        const isDuplicate = prevItems.some(
          (item) => item.file.name === file.name && item.file.size === file.size
        );
        if (isDuplicate) {
          duplicateCount++;
        } else {
          nonDuplicates.push(file);
        }
      }

      // 2. Check batch limit (Max 5 documents)
      const availableSlots = MAX_BATCH_FILES - prevItems.length;

      if (availableSlots <= 0) {
        setBatchNotice("Maximum batch limit of 5 documents has been reached.");
        return prevItems;
      }

      let filesToProcess = nonDuplicates;
      let limitExceeded = false;

      if (nonDuplicates.length > availableSlots) {
        filesToProcess = nonDuplicates.slice(0, availableSlots);
        limitExceeded = true;
      }

      // Set user notice if any duplicate or limit exceeded
      if (limitExceeded) {
        setBatchNotice(
          `Maximum 5 documents per batch allowed. Only the first ${availableSlots} new document${
            availableSlots > 1 ? "s were" : " was"
          } added.`
        );
      } else if (duplicateCount > 0 && nonDuplicates.length === 0) {
        setBatchNotice("Duplicate documents were ignored.");
      } else if (duplicateCount > 0) {
        setBatchNotice(
          `${duplicateCount} duplicate document${duplicateCount > 1 ? "s were" : " was"} ignored.`
        );
      } else {
        setBatchNotice(null);
      }

      // 3. Validate each non-duplicate file independently
      const newItems: UploadFileItem[] = filesToProcess.map((file) => {
        const validation = validateFile(file);
        return {
          id: `${file.name}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          file,
          isValid: validation.isValid,
          error: validation.error,
        };
      });

      return [...prevItems, ...newItems];
    });
  };

  const handleRemove = (id: string) => {
    setItems((prev) => {
      const remaining = prev.filter((item) => item.id !== id);
      if (remaining.length === 0) {
        setBatchNotice(null);
      }
      return remaining;
    });
  };

  const handleAddMoreClick = () => {
    addMoreInputRef.current?.click();
  };

  const handleAddMoreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFilesAdded(Array.from(e.target.files));
    }
    if (addMoreInputRef.current) {
      addMoreInputRef.current.value = "";
    }
  };

  const validItems = items.filter((item) => item.isValid);
  const invalidItems = items.filter((item) => !item.isValid);

  const canAnalyze = validItems.length > 0 && invalidItems.length === 0;

  const handleAnalyzeClick = () => {
    if (canAnalyze) {
      onStartAnalysis(validItems.map((item) => item.file));
    }
  };

  const acceptedTypesString = `${SUPPORTED_EXTENSIONS.join(
    ","
  )},${SUPPORTED_MIME_TYPES.join(",")}`;

  return (
    <div className={`w-full max-w-2xl mx-auto space-y-8 ${className}`}>
      {/* Hidden file input for "Add more documents" action */}
      <input
        ref={addMoreInputRef}
        type="file"
        multiple
        tabIndex={-1}
        aria-hidden="true"
        accept={acceptedTypesString}
        onChange={handleAddMoreChange}
        className="sr-only"
      />

      {/* Header / Intro */}
      <div className="space-y-2 text-center sm:text-left">
        <h1 className="text-2xl sm:text-3xl font-serif font-normal tracking-tight text-zinc-900 dark:text-zinc-100">
          Upload Documents
        </h1>
        <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-xl">
          Upload notices, circulars, syllabi, or schedules to extract actionable tasks, deadlines, and dates into one unified view.
        </p>
      </div>

      {/* Batch Warning / Notice Banner */}
      {batchNotice && (
        <div
          role="alert"
          aria-live="polite"
          className="flex items-start justify-between gap-3 p-4 rounded-xl border border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200 text-sm"
        >
          <div className="flex items-start gap-2.5">
            <AlertCircleIcon size={18} className="shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
            <p className="leading-snug">{batchNotice}</p>
          </div>
          <button
            type="button"
            onClick={() => setBatchNotice(null)}
            className="text-amber-700 hover:text-amber-900 dark:text-amber-300 dark:hover:text-amber-100 p-0.5 rounded focus:outline-none focus:ring-2 focus:ring-amber-500"
            aria-label="Dismiss notice"
          >
            <XIcon size={16} />
          </button>
        </div>
      )}

      {/* Upload Zone or Selected Files List */}
      <div className="space-y-6">
        {items.length === 0 ? (
          <UploadDropzone onFilesSelect={handleFilesAdded} />
        ) : (
          <SelectedFilesList
            items={items}
            onRemove={handleRemove}
            onAddMore={handleAddMoreClick}
            canAddMore={items.length < MAX_BATCH_FILES}
          />
        )}

        {/* Primary Action Button Bar */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-zinc-200 dark:border-zinc-800">
          <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center sm:text-left">
            {invalidItems.length > 0
              ? `Please remove ${invalidItems.length} invalid file${
                  invalidItems.length > 1 ? "s" : ""
                } before analyzing.`
              : items.length > 0
              ? `Ready to analyze ${validItems.length} document${
                  validItems.length > 1 ? "s" : ""
                } in one batch.`
              : "Supported formats: PDF, DOCX, TXT up to 10 MB per file. Up to 5 documents."}
          </p>

          <Button
            type="button"
            variant="primary"
            size="lg"
            disabled={!canAnalyze}
            onClick={handleAnalyzeClick}
            className="w-full sm:w-auto min-w-[200px]"
            aria-label={
              validItems.length > 0
                ? `Analyze ${validItems.length} document${validItems.length > 1 ? "s" : ""}`
                : "Analyze documents"
            }
          >
            <span>
              {validItems.length <= 1
                ? "Analyze Document"
                : `Analyze ${validItems.length} documents`}
            </span>
            <ArrowRightIcon size={16} className="ml-1.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
