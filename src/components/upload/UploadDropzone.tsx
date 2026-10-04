"use client";

import * as React from "react";
import { UploadIcon, DocumentIcon } from "../ui/icons";
import {
  SUPPORTED_EXTENSIONS,
  SUPPORTED_MIME_TYPES,
} from "./fileValidation";

export interface UploadDropzoneProps {
  onFilesSelect: (files: File[]) => void;
  className?: string;
  disabled?: boolean;
}

export function UploadDropzone({
  onFilesSelect,
  className = "",
  disabled = false,
}: UploadDropzoneProps) {
  const [isDragOver, setIsDragOver] = React.useState(false);
  const [isDragInvalid, setIsDragInvalid] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);

    // Inspect drag items if available in the event
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      let hasInvalid = false;
      for (let i = 0; i < e.dataTransfer.items.length; i++) {
        const item = e.dataTransfer.items[i];
        if (item.kind === "file" && item.type) {
          const isSupported = SUPPORTED_MIME_TYPES.includes(
            item.type.toLowerCase()
          );
          if (!isSupported) {
            hasInvalid = true;
            break;
          }
        }
      }
      setIsDragInvalid(hasInvalid);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragOver(false);
    setIsDragInvalid(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    setIsDragInvalid(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      onFilesSelect(files);
    }
  };

  const handleNativeInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      onFilesSelect(files);
    }
    // Reset native input value so selecting the same file again triggers change event
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const triggerBrowse = () => {
    if (disabled) return;
    fileInputRef.current?.click();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
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
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      aria-label="Upload documents dropzone. Press Enter or Space to browse files, or drag and drop documents here."
      aria-describedby="dropzone-instructions dropzone-constraints"
      onClick={triggerBrowse}
      onKeyDown={handleKeyDown}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative group rounded-xl border-2 border-dashed transition-all duration-200 p-6 sm:p-10 text-center select-none outline-none ${
        disabled
          ? "opacity-50 cursor-not-allowed border-[rgba(140,170,120,0.12)] bg-[#0b120d]/50"
          : isDragInvalid
          ? "cursor-pointer border-amber-400 bg-amber-50/40 dark:border-amber-700 dark:bg-amber-950/20"
          : isDragOver
          ? "cursor-pointer border-[#e8ff47]/50 bg-[#0e1911] scale-[1.005]"
          : "cursor-pointer border-[rgba(140,170,120,0.22)] hover:border-[rgba(140,170,120,0.38)] bg-[#0b120d] hover:bg-[#0d160f]"
      } focus-visible:ring-2 focus-visible:ring-[#e8ff47] focus-visible:ring-offset-2 focus-visible:ring-offset-[#04040a] ${className}`}
    >
      {/* Hidden Native File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        tabIndex={-1}
        aria-hidden="true"
        accept={acceptedTypesString}
        onChange={handleNativeInputChange}
        disabled={disabled}
        className="sr-only"
      />

      <div className="flex flex-col items-center justify-center space-y-4 max-w-sm mx-auto pointer-events-none">
        {/* Upload Icon Container */}
        <div
          className={`flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl transition-colors ${
            isDragInvalid
              ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
              : isDragOver
              ? "bg-[#e8ff47]/20 text-[#e8ff47]"
              : "bg-[#0e1911] text-zinc-400 group-hover:bg-[#111d14] group-hover:text-zinc-200 border border-[rgba(140,170,120,0.14)]"
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
              ? "Drop documents here"
              : "Upload documents"}
          </h3>
          <p
            id="dropzone-instructions"
            className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 leading-normal"
          >
            Drag and drop multiple documents here, or{" "}
            <span className="font-medium text-zinc-900 dark:text-zinc-100 underline underline-offset-2">
              browse files
            </span>
          </p>
        </div>

        {/* Supported formats & constraint badge */}
        <div className="pt-2">
          <span
            id="dropzone-constraints"
            className="inline-flex items-center text-[11px] font-medium px-2.5 py-1 rounded-full bg-[#0e1911] text-zinc-400 border border-[rgba(140,170,120,0.14)]"
          >
            PDF • DOCX • TXT &nbsp;|&nbsp; Max 10 MB per file &nbsp;|&nbsp; Up to 5 documents
          </span>
        </div>
      </div>
    </div>
  );
}
