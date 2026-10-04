"use client";

import * as React from "react";
import { UploadDropzone } from "./UploadDropzone";
import { SelectedFileCard } from "./SelectedFileCard";
import { Button } from "../ui/button";
import { AlertCircleIcon, ArrowRightIcon, XIcon } from "../ui/icons";
import { validateFile, SUPPORTED_EXTENSIONS, SUPPORTED_MIME_TYPES } from "./fileValidation";

export interface UploadWorkflowProps {
  onStartAnalysis: (file: File) => void;
  className?: string;
}

export function UploadWorkflow({
  onStartAnalysis,
  className = "",
}: UploadWorkflowProps) {
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const replaceFileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    const result = validateFile(file);
    if (!result.isValid && result.error) {
      setErrorMessage(result.error);
      setSelectedFile(null);
    } else {
      setSelectedFile(file);
      setErrorMessage(null);
    }
  };

  const handleRemove = () => {
    setSelectedFile(null);
    setErrorMessage(null);
  };

  const handleReplaceClick = () => {
    replaceFileInputRef.current?.click();
  };

  const handleReplaceInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelect(e.target.files[0]);
    }
    if (replaceFileInputRef.current) {
      replaceFileInputRef.current.value = "";
    }
  };

  const handleAnalyzeClick = () => {
    if (selectedFile) {
      onStartAnalysis(selectedFile);
    }
  };

  const acceptedTypesString = `${SUPPORTED_EXTENSIONS.join(
    ","
  )},${SUPPORTED_MIME_TYPES.join(",")}`;

  return (
    <div className={`w-full max-w-2xl mx-auto space-y-8 ${className}`}>
      {/* Hidden file input for Replace File action */}
      <input
        ref={replaceFileInputRef}
        type="file"
        tabIndex={-1}
        aria-hidden="true"
        accept={acceptedTypesString}
        onChange={handleReplaceInputChange}
        className="sr-only"
      />

      {/* Header / Intro */}
      <div className="space-y-2 text-center sm:text-left">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Upload Document
        </h1>
        <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-xl">
          Upload a notice, circular, syllabus, or administrative document to extract actionable tasks, deadlines, and dates.
        </p>
      </div>

      {/* Error Alert Banner */}
      {errorMessage && (
        <div
          role="alert"
          aria-live="polite"
          className="flex items-start justify-between gap-3 p-4 rounded-xl border border-red-200 bg-red-50 text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300 text-sm"
        >
          <div className="flex items-start gap-2.5">
            <AlertCircleIcon size={18} className="shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
            <p className="leading-snug">{errorMessage}</p>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200 p-0.5 rounded focus:outline-none focus:ring-2 focus:ring-red-500"
            aria-label="Dismiss error notice"
          >
            <XIcon size={16} />
          </button>
        </div>
      )}

      {/* Upload Zone or Selected File View */}
      <div className="space-y-6">
        {!selectedFile ? (
          <UploadDropzone
            onFileSelect={handleFileSelect}
            onError={(msg) => setErrorMessage(msg)}
          />
        ) : (
          <SelectedFileCard
            file={selectedFile}
            onRemove={handleRemove}
            onReplace={handleReplaceClick}
          />
        )}

        {/* Primary Action Button Bar */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-zinc-200 dark:border-zinc-800">
          <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center sm:text-left">
            {selectedFile
              ? "Ready to extract actions and deadlines from this document."
              : "Supported formats: PDF, DOCX, TXT up to 10 MB."}
          </p>

          <Button
            type="button"
            variant="primary"
            size="lg"
            disabled={!selectedFile}
            onClick={handleAnalyzeClick}
            className="w-full sm:w-auto min-w-[200px]"
            aria-label="Analyze Document"
          >
            <span>Analyze Document</span>
            <ArrowRightIcon size={16} className="ml-1.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
