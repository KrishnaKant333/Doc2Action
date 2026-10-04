"use client";

import * as React from "react";
import { UploadWorkflow } from "@/components/upload/UploadWorkflow";
import { CheckCircleIcon } from "@/components/ui/icons";

export default function Home() {
  const [analysisFileTriggered, setAnalysisFileTriggered] = React.useState<File | null>(null);

  const handleStartAnalysis = (file: File) => {
    // Defined callback interface ready to trigger Phase 4 Processing Workflow
    setAnalysisFileTriggered(file);
  };

  return (
    <div className="py-6 sm:py-10 space-y-8">
      {/* Ready callback banner (Shown when Analyze Document is triggered in Phase 3) */}
      {analysisFileTriggered && (
        <div
          role="status"
          aria-live="polite"
          className="max-w-2xl mx-auto p-4 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300 text-sm flex items-start justify-between gap-3 animate-fade-in"
        >
          <div className="flex items-start gap-2.5">
            <CheckCircleIcon size={18} className="shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
            <div>
              <p className="font-medium">
                Analysis initiated for: <span className="font-semibold">{analysisFileTriggered.name}</span>
              </p>
              <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">
                Callback verified. Ready to be connected to the Phase 4 Processing Screen.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setAnalysisFileTriggered(null)}
            className="text-xs font-medium underline text-emerald-800 dark:text-emerald-300 hover:text-emerald-950"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Upload Workflow */}
      <UploadWorkflow onStartAnalysis={handleStartAnalysis} />
    </div>
  );
}
