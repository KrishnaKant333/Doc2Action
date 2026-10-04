"use client";

import * as React from "react";
import { AnalysisResult, ProcessingStatus } from "../../lib/types/action";
import { simulateDocumentAnalysis, ProgressUpdate } from "../../lib/services/mockAnalysisService";
import { ProgressTimeline } from "../ui/progress-indicator";
import { DocumentIcon, AlertCircleIcon, XIcon, CheckCircleIcon } from "../ui/icons";
import { Button } from "../ui/button";
import { formatFileSize, getFileTypeLabel } from "../upload/fileValidation";

export interface ProcessingScreenProps {
  file: File;
  onComplete: (result: AnalysisResult) => void;
  onCancel: () => void;
  className?: string;
}

export function ProcessingScreen({
  file,
  onComplete,
  onCancel,
  className = "",
}: ProcessingScreenProps) {
  const [currentStatus, setCurrentStatus] = React.useState<ProcessingStatus>("uploading");
  const [progressPercent, setProgressPercent] = React.useState<number>(10);
  const [statusMessage, setStatusMessage] = React.useState<string>("Preparing document for analysis...");
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [isCompleted, setIsCompleted] = React.useState<boolean>(false);

  const abortControllerRef = React.useRef<AbortController | null>(null);

  React.useEffect(() => {
    const controller = new AbortController();
    abortControllerRef.current = controller;

    let isMounted = true;

    async function runAnalysis() {
      try {
        const result = await simulateDocumentAnalysis(
          {
            name: file.name,
            sizeBytes: file.size,
            mimeType: file.type,
          },
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
        setStatusMessage("Analysis complete!");

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
            : "We couldn't analyze this document. Please try again with another file.";
        setErrorMessage(msg);
      }
    }

    runAnalysis();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [file, onComplete]);

  const handleCancelClick = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    onCancel();
  };

  const formattedSize = formatFileSize(file.size);
  const typeLabel = getFileTypeLabel(file);

  return (
    <div className={`w-full max-w-xl mx-auto space-y-8 ${className}`}>
      {/* Active Document Header */}
      <div className="flex items-center justify-between p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border border-zinc-200/60 dark:border-zinc-700/60">
            <DocumentIcon size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <p
              className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate"
              title={file.name}
            >
              {file.name}
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {typeLabel} • {formattedSize}
            </p>
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
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 sm:p-8 space-y-6 shadow-xs">
          {/* Status Title & Accessible Aria Live Region */}
          <div className="space-y-1 text-center">
            <h2 className="text-lg sm:text-xl font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
              {isCompleted ? "Analysis Complete" : "Analyzing Document"}
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
              <span>Actions and deadlines identified successfully!</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
