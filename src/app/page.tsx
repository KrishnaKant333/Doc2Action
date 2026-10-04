"use client";

import * as React from "react";
import { UploadWorkflow } from "@/components/upload/UploadWorkflow";
import { ProcessingScreen } from "@/components/processing/ProcessingScreen";
import { ResultsDashboard } from "@/components/results/ResultsDashboard";
import { AnalysisResult } from "@/lib/types/action";

type WorkflowStage = "upload" | "processing" | "results";

export default function Home() {
  const [stage, setStage] = React.useState<WorkflowStage>("upload");
  const [activeFiles, setActiveFiles] = React.useState<File[]>([]);
  const [analysisResult, setAnalysisResult] = React.useState<AnalysisResult | null>(null);

  // Triggered from UploadWorkflow
  const handleStartAnalysis = (files: File[]) => {
    setActiveFiles(files);
    setAnalysisResult(null);
    setStage("processing");
  };

  // Triggered from ProcessingScreen on completion
  const handleProcessingComplete = React.useCallback((result: AnalysisResult) => {
    setAnalysisResult(result);
    setStage("results");
  }, []);

  // Reset workflow back to empty Upload state
  const handleReset = () => {
    setActiveFiles([]);
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
      {stage === "processing" && activeFiles.length > 0 && (
        <ProcessingScreen
          files={activeFiles}
          onComplete={handleProcessingComplete}
          onCancel={handleReset}
        />
      )}

      {/* 3. Results Dashboard Stage */}
      {stage === "results" && analysisResult && (
        <ResultsDashboard
          result={analysisResult}
          onReset={handleReset}
        />
      )}
    </div>
  );
}
