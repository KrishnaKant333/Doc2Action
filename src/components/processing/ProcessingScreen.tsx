"use client";

import * as React from "react";
import { AnalysisResult, ProcessingStatus } from "../../lib/types/action";
import { simulateDocumentAnalysis, ProgressUpdate } from "../../lib/services/mockAnalysisService";
import { ProgressTimeline } from "../ui/progress-indicator";
import { DocumentIcon, AlertCircleIcon, XIcon, CheckCircleIcon, ArrowLeftIcon } from "../ui/icons";
import { Button } from "../ui/button";
import { formatFileSize, getFileTypeLabel } from "../upload/fileValidation";

export interface ProcessingScreenProps {
  files: File[];
  onComplete: (result: AnalysisResult) => void;
  onCancel: () => void;
  className?: string;
}

export function ProcessingScreen({
  files,
  onComplete,
  onCancel,
  className = "",
}: ProcessingScreenProps) {
  const [currentStatus, setCurrentStatus] = React.useState<ProcessingStatus>("uploading");
  const [progressPercent, setProgressPercent] = React.useState<number>(10);
  const [statusMessage, setStatusMessage] = React.useState<string>(
    files.length > 1
      ? `Preparing ${files.length} documents for analysis...`
      : "Preparing document for analysis..."
  );
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [isCompleted, setIsCompleted] = React.useState<boolean>(false);

  const abortControllerRef = React.useRef<AbortController | null>(null);

  React.useEffect(() => {
    const controller = new AbortController();
    abortControllerRef.current = controller;

    let isMounted = true;

    async function runAnalysis() {
      try {
        const filePayloads = files.map((file) => ({
          name: file.name,
          sizeBytes: file.size,
          mimeType: file.type,
        }));

        const result = await simulateDocumentAnalysis(
          filePayloads,
          (update: ProgressUpdate) => {
            if (!isMounted) return;
            setCurrentStatus(update.status);
            setProgressPercent(update.progressPercent);
            setStatusMessage(update.message);
          },
          650,
          controller.signal
        );

        if (!isMounted) return;
        setIsCompleted(true);
        setCurrentStatus("complete");
        setProgressPercent(100);
        setStatusMessage(
          files.length > 1
            ? `Analysis of ${files.length} documents complete!`
            : "Analysis complete!"
        );

        // Brief delay before triggering onComplete to allow user to register completion
        setTimeout(() => {
          if (isMounted) {
            onComplete(result);
          }
        }, 500);
      } catch (err: unknown) {
        if (!isMounted) return;
        if (controller.signal.aborted) {
          // Handled via onCancel
          return;
        }
        setCurrentStatus("error");
        const msg =
          err instanceof Error
            ? err.message
            : "We couldn't analyze the documents. Please try again with different files.";
        setErrorMessage(msg);
      }
    }

    runAnalysis();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [files, onComplete]);

  const handleCancelClick = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    onCancel();
  };

  const totalSize = files.reduce((acc, f) => acc + f.size, 0);
  const formattedTotalSize = formatFileSize(totalSize);

  return (
    <div className={`w-full max-w-xl mx-auto space-y-6 ${className}`}>
      {/* Back to Upload Navigation Button */}
      <div className="flex items-center justify-start">
        <button
          type="button"
          onClick={handleCancelClick}
          aria-label="Back to Upload"
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#08120c]/85 hover:bg-[#0e1911]/95 text-zinc-400 hover:text-zinc-100 backdrop-blur-md border border-[rgba(120,160,100,0.15)] hover:border-[rgba(140,170,120,0.25)] shadow-xs text-xs sm:text-sm font-medium transition-all duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#e8ff47] focus-visible:ring-offset-2 focus-visible:ring-offset-[#04040a] group"
        >
          <ArrowLeftIcon size={14} className="transition-transform duration-200 group-hover:-translate-x-0.5" />
          <span>Back to Upload</span>
        </button>
      </div>

      {/* Active Document Header / Batch Summary Card */}
      <div className="p-4 sm:p-5 rounded-xl border border-[rgba(140,170,120,0.14)] bg-[#0b120d] shadow-xs space-y-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#0e1911] text-zinc-200 border border-[rgba(140,170,120,0.15)]">
              <DocumentIcon size={20} />
            </div>
            <div className="min-w-0 flex-1">
              {files.length === 1 ? (
                <>
                  <p
                    className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate"
                    title={files[0].name}
                  >
                    {files[0].name}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {getFileTypeLabel(files[0])} • {formatFileSize(files[0].size)}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    Processing batch ({files.length} documents)
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {files.length} files • {formattedTotalSize} total
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Cancel button if still processing */}
          {!isCompleted && !errorMessage && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleCancelClick}
              className="text-xs text-zinc-500 hover:text-red-600 dark:text-zinc-400 dark:hover:text-red-400 shrink-0"
              aria-label="Cancel analysis"
            >
              <XIcon size={14} className="mr-1" />
              Cancel
            </Button>
          )}
        </div>

        {/* Multi-document badges list if more than 1 file */}
        {files.length > 1 && (
          <div className="pt-2 border-t border-[rgba(140,170,120,0.12)] flex flex-wrap gap-1.5">
            {files.map((file, idx) => (
              <span
                key={`${file.name}-${idx}`}
                className="inline-flex items-center text-[11px] font-mono px-2 py-0.5 rounded bg-[#0e1911] text-zinc-300 border border-[rgba(140,170,120,0.15)] max-w-[200px] truncate"
                title={file.name}
              >
                {file.name}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Main Processing Display or Error View */}
      {errorMessage ? (
        <div className="rounded-xl border border-red-200 bg-red-50 dark:border-red-900/60 dark:bg-red-950/40 p-6 text-center space-y-4">
          <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-300">
            <AlertCircleIcon size={24} />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-red-900 dark:text-red-200">
              Analysis Failed
            </h3>
            <p className="text-xs sm:text-sm text-red-700 dark:text-red-300 max-w-md mx-auto">
              {errorMessage}
            </p>
          </div>
          <div className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onCancel}
              className="border-red-300 hover:bg-red-100 dark:border-red-800 dark:hover:bg-red-900/50 text-red-800 dark:text-red-200"
            >
              Return to Upload
            </Button>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-[rgba(140,170,120,0.14)] bg-[#0b120d] p-6 sm:p-8 space-y-6 shadow-xs">
          {/* Status Title & Accessible Aria Live Region */}
          <div className="space-y-1 text-center">
            <h2 className="text-lg sm:text-xl font-serif font-normal text-zinc-900 dark:text-zinc-100 tracking-tight">
              {isCompleted
                ? files.length > 1
                  ? "Batch Analysis Complete"
                  : "Analysis Complete"
                : files.length > 1
                ? `Analyzing ${files.length} Documents`
                : "Analyzing Document"}
            </h2>
            <div
              role="status"
              aria-live="polite"
              className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400"
            >
              {statusMessage}
            </div>
          </div>

          {/* Progress Timeline Component */}
          <ProgressTimeline
            currentStatus={currentStatus}
            progressPercent={progressPercent}
            statusMessage={statusMessage}
          />

          {/* Completion Callout */}
          {isCompleted && (
            <div className="flex items-center justify-center gap-2 text-xs font-medium text-emerald-600 dark:text-emerald-400 pt-2 animate-fade-in">
              <CheckCircleIcon size={16} />
              <span>
                {files.length > 1
                  ? `Actions and deadlines extracted across ${files.length} documents!`
                  : "Actions and deadlines identified successfully!"}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
