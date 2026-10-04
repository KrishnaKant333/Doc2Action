import type { DocumentAnalysis } from "./action";

export interface ProcessDocumentResponse {
  success: boolean;
  filename?: string;
  analysis?: DocumentAnalysis;
  error?: string;
  code?: string;
}