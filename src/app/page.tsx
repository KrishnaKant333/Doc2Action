"use client";

import * as React from "react";
import { UploadWorkflow } from "@/components/upload/UploadWorkflow";
import { ProcessingScreen } from "@/components/processing/ProcessingScreen";
import { AnalysisResult } from "@/lib/types/action";
import { CheckCircleIcon, DocumentIcon, ArrowRightIcon } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type WorkflowStage = "upload" | "processing" | "complete_handoff";

export default function Home() {
  const [stage, setStage] = React.useState<WorkflowStage>("upload");
  const [activeFile, setActiveFile] = React.useState<File | null>(null);
  const [analysisResult, setAnalysisResult] = React.useState<AnalysisResult | null>(null);

  // Triggered from UploadWorkflow
  const handleStartAnalysis = (file: File) => {
    setActiveFile(file);
    setAnalysisResult(null);
    setStage("processing");
  };

  // Callback interface consumed by Phase 5 (Results Dashboard)
  const handleProcessingComplete = React.useCallback((result: AnalysisResult) => {
    setAnalysisResult(result);
    setStage("complete_handoff");
  }, []);

  // Reset or cancel back to upload
  const handleReset = () => {
    setActiveFile(null);
    setAnalysisResult(null);
    setStage("upload");
  };

  return (
    <div className="py-6 sm:py-10">
      {/* 1. Upload Workflow Stage */}
      {stage === "upload" && (
        <UploadWorkflow onStartAnalysis={handleStartAnalysis} />
      )}

      {/* 2. Processing Screen Stage */}
      {stage === "processing" && activeFile && (
        <ProcessingScreen
          file={activeFile}
          onComplete={handleProcessingComplete}
          onCancel={handleReset}
        />
      )}

      {/* 3. Phase 4 Completion Handoff State (Prepares for Phase 5 Results Dashboard) */}
      {stage === "complete_handoff" && analysisResult && (
        <div className="w-full max-w-xl mx-auto space-y-6 animate-fade-in">
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 sm:p-8 space-y-6 shadow-xs">
            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                <CheckCircleIcon size={24} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                    Analysis Completed Successfully
                  </h2>
                  <Badge variant="high">Phase 4 Ready</Badge>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Extracted actionable payload ready for Phase 5 Results Dashboard.
                </p>
              </div>
            </div>

            {/* Document Info & Extracted Quantities */}
            <div className="p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
                  <DocumentIcon size={16} className="text-zinc-400" />
                  <span className="font-medium truncate max-w-[200px] sm:max-w-xs">
                    {analysisResult.document.name}
                  </span>
                </div>
                <span className="text-zinc-500">
                  {Math.round(analysisResult.document.sizeBytes / 1024)} KB
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-700/60 text-center">
                <div className="p-2 rounded bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-700/60">
                  <span className="block text-base font-bold text-zinc-900 dark:text-zinc-100">
                    {analysisResult.metrics.totalActions}
                  </span>
                  <span className="text-[11px] text-zinc-500">Actions</span>
                </div>
                <div className="p-2 rounded bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-700/60">
                  <span className="block text-base font-bold text-zinc-900 dark:text-zinc-100">
                    {analysisResult.metrics.totalDeadlines}
                  </span>
                  <span className="text-[11px] text-zinc-500">Deadlines</span>
                </div>
                <div className="p-2 rounded bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-700/60">
                  <span className="block text-base font-bold text-zinc-900 dark:text-zinc-100">
                    {analysisResult.metrics.totalEvents}
                  </span>
                  <span className="text-[11px] text-zinc-500">Events</span>
                </div>
              </div>
            </div>

            {/* Note on Phase 5 Boundary */}
            <div className="text-xs text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800/30 p-3 rounded-lg border border-zinc-200/60 dark:border-zinc-800">
              <span className="font-semibold text-zinc-700 dark:text-zinc-300">Phase 4 Scope Check:</span>{" "}
              The data handoff is complete. Detailed Action Cards, filtering, priority badges, and the full Results Dashboard will be implemented in Phase 5.
            </div>

            {/* Reset CTA */}
            <div className="pt-2 flex justify-end">
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={handleReset}
              >
                <span>Upload Another Document</span>
                <ArrowRightIcon size={14} className="ml-1.5" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
