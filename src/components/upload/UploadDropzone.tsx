"use client";

import * as React from "react";
import { UploadIcon, DocumentIcon } from "../ui/icons";
import {
  validateFile,
  SUPPORTED_EXTENSIONS,
  SUPPORTED_MIME_TYPES,
} from "./fileValidation";

export interface UploadDropzoneProps {
  onFileSelect: (file: File) => void;
  onError: (errorMessage: string) => void;
  className?: string;
}

export function UploadDropzone({
  onFileSelect,
  onError,
  className = "",
}: UploadDropzoneProps) {
  const [isDragOver, setIsDragOver] = React.useState(false);
  const [isDragInvalid, setIsDragInvalid] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);

    // Inspect drag items if available in the event
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      const item = e.dataTransfer.items[0];
      if (item.kind === "file" && item.type) {
        const isSupported = SUPPORTED_MIME_TYPES.includes(
          item.type.toLowerCase()
        );
        setIsDragInvalid(!isSupported);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    // Only reset if dragging out of the container completely
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragOver(false);
    setIsDragInvalid(false);
  };

  const processFile = (file: File) => {
    const validation = validateFile(file);
    if (!validation.isValid && validation.error) {
      onError(validation.error);
    } else {
      onFileSelect(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    setIsDragInvalid(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      processFile(droppedFile);
    }
  };

  const handleNativeInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      processFile(selectedFile);
    }
    // Reset native input value so selecting the same file again triggers change event
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const triggerBrowse = () => {
    fileInputRef.current?.click();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      triggerBrowse();
    }
  };

  const acceptedTypesString = `${SUPPORTED_EXTENSIONS.join(
    ","
  )},${SUPPORTED_MIME_TYPES.join(",")}`;

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Upload document dropzone. Press Enter or Space to browse files, or drag and drop a document here."
      onClick={triggerBrowse}
      onKeyDown={handleKeyDown}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative group cursor-pointer rounded-xl border-2 border-dashed transition-all duration-200 p-8 sm:p-12 text-center select-none outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 dark:focus-visible:ring-zinc-100 focus-visible:ring-offset-2 ${
        isDragInvalid
          ? "border-amber-400 bg-amber-50/40 dark:border-amber-700 dark:bg-amber-950/20"
          : isDragOver
          ? "border-zinc-900 bg-zinc-100/60 dark:border-zinc-100 dark:bg-zinc-800/40 scale-[1.005]"
          : "border-zinc-300 hover:border-zinc-400 dark:border-zinc-700 dark:hover:border-zinc-600 bg-white dark:bg-zinc-900"
      } ${className}`}
    >
      {/* Hidden Native File Input */}
      <input
        ref={fileInputRef}
        type="file"
        tabIndex={-1}
        aria-hidden="true"
        accept={acceptedTypesString}
        onChange={handleNativeInputChange}
        className="sr-only"
      />

      <div className="flex flex-col items-center justify-center space-y-4 max-w-sm mx-auto pointer-events-none">
        {/* Upload Icon Container */}
        <div
          className={`flex h-14 w-14 items-center justify-center rounded-2xl transition-colors ${
            isDragInvalid
              ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
              : isDragOver
              ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
              : "bg-zinc-100 text-zinc-600 group-hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:group-hover:bg-zinc-700"
          }`}
        >
          {isDragInvalid ? <DocumentIcon size={24} /> : <UploadIcon size={24} />}
        </div>

        {/* Text Content */}
        <div className="space-y-1.5">
          <h3 className="font-semibold text-base sm:text-lg text-zinc-900 dark:text-zinc-100 tracking-tight">
            {isDragInvalid
              ? "Unsupported file type detected"
              : isDragOver
              ? "Drop your document here"
              : "Upload a document"}
          </h3>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 leading-normal">
            Drag and drop your document here, or{" "}
            <span className="font-medium text-zinc-900 dark:text-zinc-100 underline underline-offset-2">
              browse files
            </span>
          </p>
        </div>

        {/* Supported formats & constraint badge */}
        <div className="pt-2">
          <span className="inline-flex items-center text-[11px] font-medium px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 border border-zinc-200/80 dark:border-zinc-700/80">
            PDF • DOCX • TXT &nbsp;|&nbsp; Max 10 MB
          </span>
        </div>
      </div>
    </div>
  );
}
