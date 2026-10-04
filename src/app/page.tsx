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
      <div className="flex items-center justify-between border-b border-[rgba(140,170,120,0.14)] pb-4 gap-4 flex-wrap">
        <nav
          aria-label="Workspace tabs"
          className="inline-flex items-center p-1 rounded-xl bg-[#0b120d]/90 backdrop-blur-md border border-[rgba(140,170,120,0.15)] shadow-xs text-xs font-medium"
        >
          <button
            type="button"
            onClick={() => setActiveTab("analyzer")}
            className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === "analyzer"
                ? "bg-[#0e1911] text-zinc-100 border border-[rgba(140,170,120,0.22)] shadow-xs font-semibold"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-[#0e1911]/60"
            }`}
          >
            Document Analyzer
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("actions")}
            className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === "actions"
                ? "bg-[#0e1911] text-zinc-100 border border-[rgba(140,170,120,0.22)] shadow-xs font-semibold"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-[#0e1911]/60"
            }`}
          >
            My Actions
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("history")}
            className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === "history"
                ? "bg-[#0e1911] text-zinc-100 border border-[rgba(140,170,120,0.22)] shadow-xs font-semibold"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-[#0e1911]/60"
            }`}
          >
            Recent Documents
          </button>
        </nav>

        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#0e1911] text-zinc-400 border border-[rgba(140,170,120,0.14)] text-[11px] font-mono hidden sm:inline-flex">
          <span className="h-1.5 w-1.5 rounded-full bg-[#e8ff47]/70"></span>
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
