"use client";

import * as React from "react";
import { UploadDropzone } from "./UploadDropzone";
import { SelectedFilesList, UploadFileItem } from "./SelectedFilesList";
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
    <div className={`w-full space-y-8 ${className}`}>
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

      {/* Batch Warning / Notice Banner */}
      {batchNotice && (
        <div
          role="alert"
          aria-live="polite"
          className="flex items-start justify-between gap-3 p-4 rounded-xl border border-amber-900/60 bg-amber-950/40 text-amber-200 text-sm"
        >
          <div className="flex items-start gap-2.5">
            <AlertCircleIcon size={18} className="shrink-0 mt-0.5 text-amber-400" />
            <p className="leading-snug">{batchNotice}</p>
          </div>
          <button
            type="button"
            onClick={() => setBatchNotice(null)}
            className="text-amber-300 hover:text-amber-100 p-0.5 rounded focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
            aria-label="Dismiss notice"
          >
            <XIcon size={16} />
          </button>
        </div>
      )}

      {/* Main Responsive 2-Column Hero Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
        {/* Left Column: Heading, Context, and Visual Capabilities Showcase Card */}
        <div className="lg:col-span-5 space-y-6">
          <div className="space-y-3 text-center sm:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0e1911] border border-[rgba(140,170,120,0.18)] text-[11px] font-mono text-zinc-300">
              <span className="h-1.5 w-1.5 rounded-full bg-[#e8ff47] animate-pulse" />
              <span>Autonomous Document Intelligence</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-normal tracking-tight text-zinc-100 leading-[1.12]">
              Upload Documents
            </h1>
            <p className="text-sm sm:text-base text-zinc-400 leading-relaxed max-w-lg">
              Upload notices, circulars, syllabi, or schedules to extract actionable tasks, deadlines, and dates into one unified view.
            </p>
          </div>

          {/* Capabilities Visual Feature Card */}
          <div className="p-5 sm:p-6 rounded-2xl border border-[rgba(140,170,120,0.14)] bg-[#0b120d] shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[rgba(140,170,120,0.12)] pb-3">
              <span className="text-xs font-serif font-normal text-zinc-200">Intelligence Pipeline</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#0e1911] text-[#e8ff47] border border-[#e8ff47]/20">
                Document → Action
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-[#0e1911] border border-[rgba(140,170,120,0.12)]">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#0c150e] text-[#e8ff47] border border-[rgba(140,170,120,0.15)] font-mono font-bold text-[11px]">
                  01
                </div>
                <div className="space-y-0.5">
                  <p className="font-semibold text-zinc-100">Action Item Extraction</p>
                  <p className="text-zinc-400 leading-normal text-[11px]">
                    Identifies actionable requirements, categorized by priority and context citations.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-[#0e1911] border border-[rgba(140,170,120,0.12)]">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#0c150e] text-emerald-400 border border-[rgba(140,170,120,0.15)] font-mono font-bold text-[11px]">
                  02
                </div>
                <div className="space-y-0.5">
                  <p className="font-semibold text-zinc-100">Strict Deadline Mapping</p>
                  <p className="text-zinc-400 leading-normal text-[11px]">
                    Detects hard submission dates and schedules with explicit timeline tagging.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-[#0e1911] border border-[rgba(140,170,120,0.12)]">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#0c150e] text-teal-400 border border-[rgba(140,170,120,0.15)] font-mono font-bold text-[11px]">
                  03
                </div>
                <div className="space-y-0.5">
                  <p className="font-semibold text-zinc-100">Multi-Document Attribution</p>
                  <p className="text-zinc-400 leading-normal text-[11px]">
                    Synthesizes up to 5 documents simultaneously with source-document grouping.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-[rgba(140,170,120,0.12)] flex items-center justify-between text-[11px] text-zinc-400 font-mono flex-wrap gap-2">
              <span>PDF • DOCX • TXT</span>
              <span>Max 10 MB per file</span>
            </div>
          </div>
        </div>

        {/* Right Column: Upload Zone / Selected Files & Primary Action Bar */}
        <div className="lg:col-span-7 space-y-6">
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
          <div className="p-4 sm:p-5 rounded-xl border border-[rgba(140,170,120,0.14)] bg-[#0b120d] flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
            <p className="text-xs text-zinc-400 text-center sm:text-left max-w-sm">
              {invalidItems.length > 0
                ? `Please remove ${invalidItems.length} invalid file${
                    invalidItems.length > 1 ? "s" : ""
                  } before analyzing.`
                : items.length > 0
                ? `Ready to analyze ${validItems.length} document${
                    validItems.length > 1 ? "s" : ""
                  } in one unified batch.`
                : "Select or drop documents above to begin automated extraction."}
            </p>

            <button
              type="button"
              disabled={!canAnalyze}
              onClick={handleAnalyzeClick}
              className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-medium text-xs sm:text-sm transition-all duration-200 cursor-pointer ${
                canAnalyze
                  ? "bg-[#e8ff47] text-zinc-950 hover:bg-[#d8ef37] shadow-[0_0_16px_rgba(232,255,71,0.25)] hover:shadow-[0_0_24px_rgba(232,255,71,0.4)] active:scale-[0.99]"
                  : "bg-[#0e1911] text-zinc-500 border border-[rgba(140,170,120,0.14)] cursor-not-allowed opacity-60"
              }`}
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
              <ArrowRightIcon size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
