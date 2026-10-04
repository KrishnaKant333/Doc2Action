"use client";

import * as React from "react";
import {
  fetchRecentDocuments,
  fetchDocumentById,
  RecentDocumentItem,
} from "@/lib/services/apiAnalysisService";
import type { AnalysisResult } from "@/lib/types/action";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { DocumentIcon, CalendarIcon, ArrowRightIcon, AlertCircleIcon } from "../ui/icons";
import { formatFileSize, getFileTypeLabel } from "../upload/fileValidation";

export interface RecentDocumentsViewProps {
  onSelectDocument: (result: AnalysisResult) => void;
  onGoToUpload?: () => void;
  className?: string;
}

export function RecentDocumentsView({
  onSelectDocument,
  onGoToUpload,
  className = "",
}: RecentDocumentsViewProps) {
  const [documents, setDocuments] = React.useState<RecentDocumentItem[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [loadingDocId, setLoadingDocId] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const loadDocs = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const docs = await fetchRecentDocuments();
      setDocuments(docs);
    } catch {
      setError("Failed to load recent documents.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadDocs();
  }, [loadDocs]);

  const handleDocumentClick = async (docId: string) => {
    setLoadingDocId(docId);
    try {
      const result = await fetchDocumentById(docId);
      if (result) {
        onSelectDocument(result);
      } else {
        alert("Could not load details for this document.");
      }
    } catch {
      alert("Failed to fetch document analysis.");
    } finally {
      setLoadingDocId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900 dark:border-zinc-700 dark:border-t-zinc-100" />
        <p className="text-xs text-zinc-500 font-medium">Loading recent documents...</p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 animate-fade-in ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-zinc-100">
            Recent Documents
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
            Access recent circulars, notices, and action plans analyzed in your browser.
          </p>
        </div>
        {onGoToUpload && (
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={onGoToUpload}
            className="text-xs self-start sm:self-center"
          >
            + Upload New Document
          </Button>
        )}
      </div>

      {error ? (
        <Card className="p-8 text-center space-y-3 max-w-lg mx-auto">
          <AlertCircleIcon size={24} className="mx-auto text-amber-600" />
          <p className="text-sm text-zinc-700 dark:text-zinc-300">{error}</p>
          <Button variant="outline" size="sm" onClick={loadDocs}>
            Retry
          </Button>
        </Card>
      ) : documents.length === 0 ? (
        <Card className="p-10 text-center space-y-4 max-w-lg mx-auto">
          <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
            <DocumentIcon size={24} />
          </div>
          <div>
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              No Documents in History
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Documents you process will be retained here for easy access.
            </p>
          </div>
          {onGoToUpload && (
            <Button variant="primary" size="sm" onClick={onGoToUpload}>
              Analyze a Document
            </Button>
          )}
        </Card>
      ) : (
        <div className="space-y-3">
          {documents.map((doc) => {
            const isLoadingThis = loadingDocId === doc.id;
            const formattedDate = new Date(doc.uploadedAt).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <article
                key={doc.id}
                className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors hover:border-zinc-300 dark:hover:border-zinc-700"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border border-zinc-200/60 dark:border-zinc-700/60">
                    <DocumentIcon size={20} />
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate" title={doc.name}>
                      {doc.name}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 flex-wrap">
                      <span>{getFileTypeLabel({ name: doc.name, type: doc.mimeType })}</span>
                      <span>•</span>
                      <span>{formatFileSize(doc.sizeBytes)}</span>
                      <span>•</span>
                      <span className="inline-flex items-center gap-1">
                        <CalendarIcon size={12} /> {formattedDate}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 pt-1 flex-wrap">
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                        {doc.actionCount} task{doc.actionCount === 1 ? "" : "s"}
                      </span>
                      {doc.deadlineCount > 0 && (
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-900/40">
                          {doc.deadlineCount} deadline{doc.deadlineCount === 1 ? "" : "s"}
                        </span>
                      )}
                      {doc.eventCount > 0 && (
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-900/40">
                          {doc.eventCount} event{doc.eventCount === 1 ? "" : "s"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isLoadingThis}
                  onClick={() => handleDocumentClick(doc.id)}
                  className="text-xs shrink-0 self-end sm:self-center"
                >
                  {isLoadingThis ? "Loading..." : "View Results"}
                  <ArrowRightIcon size={13} className="ml-1.5" />
                </Button>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
