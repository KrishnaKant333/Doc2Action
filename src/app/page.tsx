"use client";

import * as React from "react";
import { UploadWorkflow } from "@/components/upload/UploadWorkflow";
import { ProcessingScreen } from "@/components/processing/ProcessingScreen";
import { ResultsDashboard } from "@/components/results/ResultsDashboard";
import { MyActionsView } from "@/components/actions/MyActionsView";
import { RecentDocumentsView } from "@/components/history/RecentDocumentsView";
import { AnalysisResult } from "@/lib/types/action";

type NavigationTab = "analyzer" | "actions" | "history";
type WorkflowStage = "upload" | "processing" | "results";

export default function Home() {
  const [activeTab, setActiveTab] = React.useState<NavigationTab>("analyzer");
  const [stage, setStage] = React.useState<WorkflowStage>("upload");
  const [activeFiles, setActiveFiles] = React.useState<File[]>([]);
  const [analysisResult, setAnalysisResult] = React.useState<AnalysisResult | null>(null);
  const [persistenceWarning, setPersistenceWarning] = React.useState<string | undefined>(undefined);

  // Triggered from UploadWorkflow
  const handleStartAnalysis = (files: File[]) => {
    setActiveFiles(files);
    setAnalysisResult(null);
    setPersistenceWarning(undefined);
    setStage("processing");
  };

  // Triggered from ProcessingScreen on completion
  const handleProcessingComplete = React.useCallback(
    (result: AnalysisResult, warning?: string) => {
      setAnalysisResult(result);
      setPersistenceWarning(warning);
      setStage("results");
    },
    []
  );

  // Reset workflow back to empty Upload state
  const handleReset = () => {
    setActiveFiles([]);
    setAnalysisResult(null);
    setPersistenceWarning(undefined);
    setStage("upload");
  };

  const handleSelectRecentDoc = (result: AnalysisResult) => {
    setAnalysisResult(result);
    setPersistenceWarning(undefined);
    setActiveTab("analyzer");
    setStage("results");
  };

  return (
    <div className="py-6 sm:py-10 space-y-6">
      {/* Top Workspace Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-zinc-200/80 dark:border-zinc-800/80 pb-3">
        <nav
          aria-label="Workspace tabs"
          className="inline-flex items-center p-1 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200/60 dark:border-zinc-700/60 text-xs font-medium"
        >
          <button
            type="button"
            onClick={() => setActiveTab("analyzer")}
            className={`px-3.5 py-1.5 rounded-lg transition-all ${
              activeTab === "analyzer"
                ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs font-semibold"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
            }`}
          >
            Document Analyzer
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("actions")}
            className={`px-3.5 py-1.5 rounded-lg transition-all ${
              activeTab === "actions"
                ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs font-semibold"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
            }`}
          >
            My Actions
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("history")}
            className={`px-3.5 py-1.5 rounded-lg transition-all ${
              activeTab === "history"
                ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs font-semibold"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
            }`}
          >
            Recent Documents
          </button>
        </nav>

        <span className="text-[11px] font-mono text-zinc-400 dark:text-zinc-500 hidden sm:inline">
          Workspace: Anonymous Session
        </span>
      </div>

      {/* Tab 1: Document Analyzer Workflow */}
      {activeTab === "analyzer" && (
        <>
          {stage === "upload" && (
            <UploadWorkflow onStartAnalysis={handleStartAnalysis} />
          )}

          {stage === "processing" && activeFiles.length > 0 && (
            <ProcessingScreen
              files={activeFiles}
              onComplete={handleProcessingComplete}
              onCancel={handleReset}
            />
          )}

          {stage === "results" && analysisResult && (
            <ResultsDashboard
              result={analysisResult}
              warning={persistenceWarning}
              onReset={handleReset}
            />
          )}
        </>
      )}

      {/* Tab 2: Consolidated My Actions View */}
      {activeTab === "actions" && (
        <MyActionsView
          onGoToUpload={() => {
            setActiveTab("analyzer");
            setStage("upload");
          }}
        />
      )}

      {/* Tab 3: Recent Documents History View */}
      {activeTab === "history" && (
        <RecentDocumentsView
          onSelectDocument={handleSelectRecentDoc}
          onGoToUpload={() => {
            setActiveTab("analyzer");
            setStage("upload");
          }}
        />
      )}
    </div>
  );
}
