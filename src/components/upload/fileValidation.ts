/**
 * File validation utilities for Document -> Action Automator
 * Aligned with specs/01-FRONTEND_SPEC.md and specs/02-BACKEND_CONTRACT.md
 */

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export const MAX_BATCH_FILES = 5; // Maximum documents per batch

export const SUPPORTED_EXTENSIONS = [".pdf", ".docx", ".doc", ".txt"];

export const SUPPORTED_MIME_TYPES = [
  "application/pdf",
  "text/plain",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
];

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Formats byte values into human-readable strings (e.g. 240 KB, 2.4 MB)
 */
export function formatFileSize(bytes: number): string {
  if (bytes <= 0) return "0 Bytes";
  const units = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const formatted = (bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1);
  return `${formatted} ${units[i]}`;
}

/**
 * Returns a clean readable format label based on file name or MIME type
 */
export function getFileTypeLabel(file: { name: string; type?: string }): string {
  const name = file.name.toLowerCase();
  if (name.endsWith(".pdf") || file.type === "application/pdf") return "PDF";
  if (name.endsWith(".docx") || name.endsWith(".doc")) return "DOCX";
  if (name.endsWith(".txt") || file.type === "text/plain") return "TXT";
  return "Document";
}

/**
 * Validates file size, extension, and MIME type
 */
export function validateFile(file: File): FileValidationResult {
  if (!file) {
    return {
      isValid: false,
      error: "No file was selected. Please choose a document to upload.",
    };
  }

  // 1. File size check (Max 10 MB)
  if (file.size > MAX_FILE_SIZE_BYTES) {
    const fileSizeFormatted = formatFileSize(file.size);
    return {
      isValid: false,
      error: `File is too large (${fileSizeFormatted}). The maximum allowed size is 10 MB.`,
    };
  }

  if (file.size === 0) {
    return {
      isValid: false,
      error: "The selected file is empty (0 bytes). Please upload a valid document.",
    };
  }

  // 2. File type check (Extension and MIME)
  const fileName = file.name.toLowerCase();
  const hasSupportedExtension = SUPPORTED_EXTENSIONS.some((ext) =>
    fileName.endsWith(ext)
  );

  const hasSupportedMime =
    !file.type || SUPPORTED_MIME_TYPES.includes(file.type.toLowerCase());

  if (!hasSupportedExtension && !hasSupportedMime) {
    return {
      isValid: false,
      error:
        "That file type isn't supported. Please upload a PDF, DOCX, or TXT file.",
    };
  }

  return { isValid: true };
}
