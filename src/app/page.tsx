"use client";

import * as React from "react";
import { useNavigation } from "@/context/NavigationContext";
import { UploadWorkflow } from "@/components/upload/UploadWorkflow";
import { ProcessingScreen } from "@/components/processing/ProcessingScreen";
import { ResultsDashboard } from "@/components/results/ResultsDashboard";
import { MyActionsView } from "@/components/actions/MyActionsView";
import { RecentDocumentsView } from "@/components/history/RecentDocumentsView";
import { AnalysisResult } from "@/lib/types/action";

type WorkflowStage = "upload" | "processing" | "results";

export default function Home() {
  const { activeTab, setActiveTab } = useNavigation();
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
    <div className="py-4 sm:py-6 space-y-6">

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
