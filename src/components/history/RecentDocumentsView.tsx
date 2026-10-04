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
    let isMounted = true;
    fetchRecentDocuments()
      .then((docs) => {
        if (isMounted) {
          setDocuments(docs);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setError("Failed to load recent documents.");
          setLoading(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, []);

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
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[rgba(140,170,120,0.2)] border-t-[#e8ff47]" />
        <p className="text-xs text-zinc-400 font-medium">Loading recent documents...</p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 animate-fade-in ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-xl border border-[rgba(140,170,120,0.14)] bg-[#0b120d] shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-serif font-normal tracking-tight text-zinc-100">
            Recent Documents
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Access recent circulars, notices, and action plans analyzed in your browser.
          </p>
        </div>
        {onGoToUpload && (
          <button
            type="button"
            onClick={onGoToUpload}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#e8ff47]/[0.08] hover:bg-[#e8ff47]/[0.16] text-zinc-100 hover:text-white border border-[#e8ff47]/25 hover:border-[#e8ff47]/45 shadow-xs backdrop-blur-md text-xs font-medium transition-all duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#e8ff47] focus-visible:ring-offset-2 focus-visible:ring-offset-[#04040a] self-start sm:self-center shrink-0 active:scale-[0.99]"
          >
            <span>+ Upload New Document</span>
          </button>
        )}
      </div>

      {error ? (
        <Card className="p-8 text-center space-y-3 max-w-lg mx-auto border-[rgba(140,170,120,0.14)] bg-[#0c150e]/80">
          <AlertCircleIcon size={24} className="mx-auto text-amber-500" />
          <p className="text-sm text-zinc-300">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={loadDocs}
            className="border-[rgba(140,170,120,0.2)] text-zinc-200 hover:bg-[#0e1911]"
          >
            Retry
          </Button>
        </Card>
      ) : documents.length === 0 ? (
        <Card className="p-10 text-center space-y-4 max-w-lg mx-auto border-[rgba(140,170,120,0.14)] bg-[#0c150e]/80">
          <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-xl bg-[#0e1911] text-zinc-300 border border-[rgba(140,170,120,0.15)]">
            <DocumentIcon size={24} />
          </div>
          <div className="space-y-1">
            <h2 className="text-base sm:text-lg font-serif font-normal text-zinc-100">
              No Documents in History
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-sm mx-auto">
              Documents you process will be retained here for easy access.
            </p>
          </div>
          {onGoToUpload && (
            <div className="pt-2">
              <button
                type="button"
                onClick={onGoToUpload}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#e8ff47]/[0.1] hover:bg-[#e8ff47]/[0.2] text-zinc-100 hover:text-white border border-[#e8ff47]/30 hover:border-[#e8ff47]/50 text-xs sm:text-sm font-medium transition-all shadow-xs cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#e8ff47]"
              >
                <span>Analyze a Document</span>
              </button>
            </div>
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
                className="p-4 sm:p-5 rounded-xl border border-[rgba(140,170,120,0.14)] bg-[#0e1911] hover:bg-[#111d14] hover:border-[rgba(140,170,120,0.28)] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all"
              >
                <div className="flex items-start gap-3.5 min-w-0 flex-1">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0c150e] text-zinc-200 border border-[rgba(140,170,120,0.15)]">
                    <DocumentIcon size={20} />
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <h3 className="text-sm sm:text-base font-semibold text-zinc-100 truncate" title={doc.name}>
                      {doc.name}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-zinc-400 flex-wrap">
                      <span>{getFileTypeLabel({ name: doc.name, type: doc.mimeType })}</span>
                      <span>•</span>
                      <span>{formatFileSize(doc.sizeBytes)}</span>
                      <span>•</span>
                      <span className="inline-flex items-center gap-1 font-mono">
                        <CalendarIcon size={12} className="text-zinc-500" /> {formattedDate}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 pt-1 flex-wrap">
                      <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded bg-[#0c150e] text-zinc-300 border border-[rgba(140,170,120,0.14)]">
                        {doc.actionCount} task{doc.actionCount === 1 ? "" : "s"}
                      </span>
                      {doc.deadlineCount > 0 && (
                        <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded bg-amber-950/40 text-amber-300 border border-amber-900/40">
                          {doc.deadlineCount} deadline{doc.deadlineCount === 1 ? "" : "s"}
                        </span>
                      )}
                      {doc.eventCount > 0 && (
                        <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded bg-blue-950/40 text-blue-300 border border-blue-900/40">
                          {doc.eventCount} event{doc.eventCount === 1 ? "" : "s"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={isLoadingThis}
                  onClick={() => handleDocumentClick(doc.id)}
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#e8ff47]/[0.08] hover:bg-[#e8ff47]/[0.18] text-zinc-200 hover:text-white border border-[#e8ff47]/20 hover:border-[#e8ff47]/45 text-xs font-medium transition-all group shrink-0 self-end sm:self-center cursor-pointer disabled:opacity-50"
                >
                  <span>{isLoadingThis ? "Loading..." : "View Results"}</span>
                  <ArrowRightIcon size={13} className="text-[#e8ff47] transition-transform group-hover:translate-x-0.5" />
                </button>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
