import * as React from "react";
import { ProcessingStatus } from "../../lib/types/action";
import { PROCESSING_STEPS } from "../../lib/services/mockAnalysisService";
import { CheckCircleIcon, ClockIcon } from "./icons";

export interface ProgressTimelineProps {
  currentStatus: ProcessingStatus;
  progressPercent?: number;
  statusMessage?: string;
  className?: string;
}

export function ProgressTimeline({
  currentStatus,
  progressPercent = 0,
  statusMessage,
  className = "",
}: ProgressTimelineProps) {
  const stepKeys = PROCESSING_STEPS.map((s) => s.key);
  const currentIndex = stepKeys.indexOf(currentStatus);

  return (
    <div className={`w-full max-w-xl mx-auto space-y-6 ${className}`}>
      {/* Progress Bar & Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-medium text-zinc-500 dark:text-zinc-400">
          <span>{statusMessage || "Processing document..."}</span>
          <span className="font-mono">{Math.round(progressPercent)}%</span>
        </div>
        <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-zinc-900 dark:bg-zinc-100 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
          />
        </div>
      </div>

      {/* Steps List */}
      <div className="space-y-3">
        {PROCESSING_STEPS.map((step, idx) => {
          const isCompleted =
            currentStatus === "complete" || (currentIndex !== -1 && idx < currentIndex);
          const isCurrent = currentStatus === step.key;

          return (
            <div
              key={step.key}
              className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                isCurrent
                  ? "bg-zinc-50 dark:bg-zinc-800/60 border-zinc-300 dark:border-zinc-700"
                  : isCompleted
                  ? "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400"
                  : "bg-transparent border-transparent opacity-50"
              }`}
            >
              {/* Step Status Icon */}
              <div className="mt-0.5 shrink-0">
                {isCompleted ? (
                  <CheckCircleIcon size={18} className="text-emerald-600 dark:text-emerald-400" />
                ) : isCurrent ? (
                  <span className="relative flex h-4 w-4 m-0.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-zinc-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-zinc-900 dark:bg-zinc-100"></span>
                  </span>
                ) : (
                  <ClockIcon size={18} className="text-zinc-400 dark:text-zinc-600" />
                )}
              </div>

              {/* Step Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4
                    className={`text-sm font-medium ${
                      isCurrent
                        ? "text-zinc-900 dark:text-zinc-100"
                        : isCompleted
                        ? "text-zinc-700 dark:text-zinc-300"
                        : "text-zinc-400 dark:text-zinc-600"
                    }`}
                  >
                    {step.label}
                  </h4>
                  {isCompleted && (
                    <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                      Done
                    </span>
                  )}
                  {isCurrent && (
                    <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 animate-pulse">
                      In progress...
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 line-clamp-1">
                  {step.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
