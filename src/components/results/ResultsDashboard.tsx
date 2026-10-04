"use client";

import * as React from "react";
import {
  AnalysisResult,
  ActionItem,
  DocumentMetadata,
} from "../../lib/types/action";
import { ActionCard } from "./ActionCard";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  DocumentIcon,
  CheckCircleIcon,
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  AlertCircleIcon,
  ArrowRightIcon,
} from "../ui/icons";
import { formatFileSize, getFileTypeLabel } from "../upload/fileValidation";

export interface ResultsDashboardProps {
  result: AnalysisResult;
  warning?: string;
  onReset: () => void;
  className?: string;
}

export interface DocumentItemGroup<T> {
  documentName: string;
  items: T[];
  isFallback?: boolean;
}

// Backwards-compatible interface for Phase 9
export interface DocumentActionGroup extends DocumentItemGroup<ActionItem> {
  actions: ActionItem[];
}

/**
 * Generic helper that groups domain items (actions, deadlines, events) by their source document,
 * strictly preserving the original upload batch order of `documents`.
 * Items with unknown or missing sourceDocument are safely assigned to an "Other / Unassigned" fallback group.
 */
export function groupItemsByDocument<T extends { sourceDocument?: string }>(
  items: T[],
  documents?: DocumentMetadata[],
  fallbackName = "Other / Unassigned"
): DocumentItemGroup<T>[] {
  const groups: DocumentItemGroup<T>[] = [];
  const assignedItems = new Set<T>();

  if (documents && documents.length > 0) {
    for (const doc of documents) {
      const docItems = items.filter((item) => item.sourceDocument === doc.name);
      docItems.forEach((item) => assignedItems.add(item));
      groups.push({
        documentName: doc.name,
        items: docItems,
      });
    }
  } else {
    // Fallback: derive distinct document names in appearance order
    const seenDocs = new Set<string>();
    for (const item of items) {
      if (item.sourceDocument && !seenDocs.has(item.sourceDocument)) {
        seenDocs.add(item.sourceDocument);
        const docItems = items.filter((i) => i.sourceDocument === item.sourceDocument);
        docItems.forEach((i) => assignedItems.add(i));
        groups.push({
          documentName: item.sourceDocument,
          items: docItems,
        });
      }
    }
  }

  // Capture items without a matching sourceDocument
  const unassignedItems = items.filter((item) => !assignedItems.has(item));
  if (unassignedItems.length > 0) {
    groups.push({
      documentName: fallbackName,
      items: unassignedItems,
      isFallback: true,
    });
  }

  return groups;
}

// Backwards-compatible alias for Phase 9
export const groupActionsByDocument = (
  actions: ActionItem[],
  documents?: DocumentMetadata[]
): DocumentActionGroup[] => {
  const genericGroups = groupItemsByDocument(actions, documents);
  return genericGroups.map((g) => ({
    ...g,
    actions: g.items,
  }));
};

export function ResultsDashboard({
  result,
  warning,
  onReset,
  className = "",
}: ResultsDashboardProps) {
  const { document, metrics, actions, deadlines, events, importantNotes, documents } = result;
  const isBatch = Boolean(documents && documents.length > 1);
  const docCount = documents?.length || 1;
  const fileSizeFormatted = formatFileSize(document.sizeBytes);
  const typeLabel = getFileTypeLabel({
    name: document.name,
    type: document.mimeType,
  });

  const hasActions = actions && actions.length > 0;
  const hasDeadlines = deadlines && deadlines.length > 0;
  const hasEvents = events && events.length > 0;
  const hasNotes = importantNotes && importantNotes.length > 0;

  // Group actions, deadlines, and events by source document when in batch mode
  const documentGroups: DocumentActionGroup[] = React.useMemo(
    () => (isBatch ? groupActionsByDocument(actions, documents) : []),
    [actions, documents, isBatch]
  );

  const deadlineGroups = React.useMemo(
    () => (isBatch ? groupItemsByDocument(deadlines, documents) : []),
    [deadlines, documents, isBatch]
  );

  const eventGroups = React.useMemo(
    () => (isBatch ? groupItemsByDocument(events, documents) : []),
    [events, documents, isBatch]
  );

  return (
    <div className={`space-y-8 animate-fade-in ${className}`}>
      {/* 1. Document Summary & Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
        <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200 border border-zinc-200/60 dark:border-zinc-700/60">
            <DocumentIcon size={22} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1
                className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 truncate max-w-full sm:max-w-md"
                title={isBatch ? `${docCount} Documents analyzed` : document.name}
              >
                {isBatch ? `${docCount} Documents analyzed` : document.name}
              </h1>
              <span className="text-[11px] font-medium font-mono px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 shrink-0">
                {isBatch ? "Batch" : typeLabel}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 mt-1 flex-wrap">
              <span>{fileSizeFormatted}</span>
              <span>•</span>
              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                <CheckCircleIcon size={13} /> Analysis Complete
              </span>
            </div>
            {isBatch && documents && (
              <div className="flex items-center gap-1.5 flex-wrap pt-2 mt-2 border-t border-zinc-100 dark:border-zinc-800/80">
                <span className="text-[11px] text-zinc-400">Sources:</span>
                {documents.map((d) => (
                  <span
                    key={d.id}
                    className="text-[11px] font-mono px-2 py-0.5 rounded bg-zinc-50 dark:bg-zinc-800/60 text-zinc-700 dark:text-zinc-300 border border-zinc-200/60 dark:border-zinc-700/60 truncate max-w-[200px]"
                    title={d.name}
                  >
                    {d.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="self-end sm:self-center shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onReset}
            className="text-xs"
            aria-label="Analyze another document"
          >
            Analyze another document
          </Button>
        </div>
      </div>

      {/* Persistence or system warning banner */}
      {warning && (
        <div
          role="alert"
          className="flex items-center gap-2.5 p-3.5 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/60 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 text-xs sm:text-sm"
        >
          <AlertCircleIcon size={18} className="shrink-0 text-amber-600 dark:text-amber-400" />
          <p>{warning}</p>
        </div>
      )}

      {/* 2. Summary Metrics Row */}
      <section aria-label="Key document metrics" className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="p-3.5 sm:p-5">
          <span className="text-[11px] sm:text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            Total Actions
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              {metrics.totalActions}
            </span>
            <span className="text-xs text-zinc-400">tasks found</span>
          </div>
        </Card>

        <Card className="p-3.5 sm:p-5">
          <span className="text-[11px] sm:text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            Deadlines
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              {metrics.totalDeadlines}
            </span>
            <span className="text-xs text-zinc-400">due dates</span>
          </div>
        </Card>

        <Card className="p-3.5 sm:p-5">
          <span className="text-[11px] sm:text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            Events
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              {metrics.totalEvents}
            </span>
            <span className="text-xs text-zinc-400">sessions</span>
          </div>
        </Card>

        <Card className="p-3.5 sm:p-5">
          <span className="text-[11px] sm:text-xs font-medium text-rose-700 dark:text-rose-400 uppercase tracking-wider">
            High Priority
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-rose-600 dark:text-rose-400">
              {metrics.highPriorityCount}
            </span>
            <span className="text-xs text-rose-500/80">urgent</span>
          </div>
        </Card>
      </section>

      {/* 3. Empty Results State Handling */}
      {!hasActions && !hasDeadlines && !hasEvents ? (
        <Card className="p-8 sm:p-12 text-center space-y-4">
          <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-full bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
            <CheckCircleIcon size={24} />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              No Actionable Items Found
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-md mx-auto">
              This document was analyzed successfully, but no direct tasks, deadlines, or scheduled events were detected.
            </p>
          </div>
          <div className="pt-2">
            <Button type="button" variant="primary" size="md" onClick={onReset}>
              Analyze another document
            </Button>
          </div>
        </Card>
      ) : (
        /* 4. Action Items Section */
        !isBatch ? (
          <section aria-label="Extracted action items" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                  Action Items
                </h2>
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                  {actions.length}
                </span>
              </div>
              <span className="text-xs text-zinc-500 dark:text-zinc-400 hidden sm:inline">
                Sorted by document order
              </span>
            </div>

            <div className="space-y-3">
              {actions.map((action) => (
                <ActionCard key={action.id} action={action} />
              ))}
            </div>
          </section>
        ) : (
          <section aria-label="Action items grouped by document" className="space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-200/80 dark:border-zinc-800/80 pb-3">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                  Action Items by Document
                </h2>
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                  {actions.length} total
                </span>
              </div>
              <span className="text-xs text-zinc-500 dark:text-zinc-400 hidden sm:inline">
                Grouped by source document
              </span>
            </div>

            <div className="space-y-6">
              {documentGroups.map((group, groupIdx) => {
                const headingId = `action-doc-heading-${groupIdx}`;
                const hasGroupActions = group.actions.length > 0;

                return (
                  <section
                    key={`${group.documentName}-${groupIdx}`}
                    aria-labelledby={headingId}
                    className="space-y-3.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/40 p-4 sm:p-5 shadow-2xs"
                  >
                    {/* Document Heading */}
                    <div className="flex items-center justify-between gap-3 flex-wrap border-b border-zinc-200/60 dark:border-zinc-800/60 pb-3">
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200/80 dark:border-zinc-700/80 shadow-2xs">
                          <DocumentIcon size={16} />
                        </div>
                        <h3
                          id={headingId}
                          className="font-semibold text-sm sm:text-base text-zinc-900 dark:text-zinc-100 truncate max-w-xs sm:max-w-md"
                          title={group.documentName}
                        >
                          {group.documentName}
                        </h3>
                      </div>

                      <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200/60 dark:border-zinc-700/60 shrink-0">
                        {hasGroupActions
                          ? `${group.actions.length} action${group.actions.length > 1 ? "s" : ""}`
                          : "0 actions"}
                      </span>
                    </div>

                    {/* Action Cards or Empty Notice */}
                    {hasGroupActions ? (
                      <div className="space-y-3 pt-1">
                        {group.actions.map((action) => (
                          <ActionCard
                            key={action.id}
                            action={action}
                            hideSourceDocument={!group.isFallback}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="py-5 px-4 rounded-lg border border-dashed border-zinc-200 dark:border-zinc-800 text-center text-xs text-zinc-500 dark:text-zinc-400 italic bg-white/40 dark:bg-zinc-900/40">
                        No action items found in this document.
                      </div>
                    )}
                  </section>
                );
              })}
            </div>
          </section>
        )
      )}

      {/* 5. Deadlines & Events Dual Section */}
      {(hasDeadlines || hasEvents) && (
        !isBatch ? (
          <section
            aria-label="Deadlines and events"
            className={`grid gap-6 ${
              hasDeadlines && hasEvents ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"
            }`}
          >
            {/* Upcoming Deadlines (Single Document View) */}
            {hasDeadlines && (
              <Card>
                <CardHeader className="p-4 sm:p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CalendarIcon size={16} className="text-zinc-500" />
                      <CardTitle className="text-base font-semibold">
                        Upcoming Deadlines
                      </CardTitle>
                    </div>
                    <span className="text-xs font-medium text-zinc-500">
                      {deadlines.length}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="p-4 sm:p-5 space-y-3">
                  {deadlines.map((dl) => (
                    <div
                      key={dl.id}
                      className="flex items-start justify-between gap-3 p-3 rounded-lg border border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-800/30 text-xs"
                    >
                      <div className="space-y-0.5 min-w-0">
                        <p className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                          {dl.title}
                        </p>
                        <p className="text-zinc-500 dark:text-zinc-400 font-mono">
                          {dl.dueDate}
                        </p>
                      </div>
                      {dl.isStrict && (
                        <Badge variant="high" className="shrink-0 text-[10px]">
                          Strict
                        </Badge>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Scheduled Events (Single Document View) */}
            {hasEvents && (
              <Card>
                <CardHeader className="p-4 sm:p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ClockIcon size={16} className="text-zinc-500" />
                      <CardTitle className="text-base font-semibold">
                        Key Events & Dates
                      </CardTitle>
                    </div>
                    <span className="text-xs font-medium text-zinc-500">
                      {events.length}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="p-4 sm:p-5 space-y-3">
                  {events.map((ev) => (
                    <div
                      key={ev.id}
                      className="p-3 rounded-lg border border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-800/30 space-y-1 text-xs"
                    >
                      <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                        {ev.title}
                      </p>
                      <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 flex-wrap">
                        <span className="inline-flex items-center gap-1 font-mono">
                          <CalendarIcon size={12} /> {ev.date}
                        </span>
                        {ev.location && (
                          <>
                            <span>•</span>
                            <span className="inline-flex items-center gap-1">
                              <MapPinIcon size={12} /> {ev.location}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </section>
        ) : (
          <section
            aria-label="Deadlines and events grouped by document"
            className={`grid gap-8 ${
              hasDeadlines && hasEvents ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"
            }`}
          >
            {/* Upcoming Deadlines by Document */}
            {hasDeadlines && (
              <section aria-label="Upcoming deadlines grouped by document" className="space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-200/80 dark:border-zinc-800/80 pb-3">
                  <div className="flex items-center gap-2">
                    <CalendarIcon size={18} className="text-zinc-500" />
                    <h2 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                      Upcoming Deadlines by Document
                    </h2>
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                      {deadlines.length} total
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  {deadlineGroups.map((group, idx) => {
                    const headingId = `deadline-doc-heading-${idx}`;
                    const hasItems = group.items.length > 0;

                    return (
                      <section
                        key={`${group.documentName}-${idx}`}
                        aria-labelledby={headingId}
                        className="space-y-3 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/40 p-4 sm:p-5 shadow-2xs"
                      >
                        {/* Document Heading */}
                        <div className="flex items-center justify-between gap-3 flex-wrap border-b border-zinc-200/60 dark:border-zinc-800/60 pb-3">
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200/80 dark:border-zinc-700/80 shadow-2xs">
                              <DocumentIcon size={16} />
                            </div>
                            <h3
                              id={headingId}
                              className="font-semibold text-sm sm:text-base text-zinc-900 dark:text-zinc-100 truncate max-w-xs sm:max-w-md"
                              title={group.documentName}
                            >
                              {group.documentName}
                            </h3>
                          </div>

                          <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200/60 dark:border-zinc-700/60 shrink-0">
                            {hasItems
                              ? `${group.items.length} deadline${group.items.length > 1 ? "s" : ""}`
                              : "0 deadlines"}
                          </span>
                        </div>

                        {/* Items or Empty Note */}
                        {hasItems ? (
                          <div className="space-y-2.5 pt-1">
                            {group.items.map((dl) => (
                              <div
                                key={dl.id}
                                className="flex items-start justify-between gap-3 p-3 rounded-lg border border-zinc-100 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 text-xs shadow-2xs"
                              >
                                <div className="space-y-0.5 min-w-0">
                                  <p className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                                    {dl.title}
                                  </p>
                                  <p className="text-zinc-500 dark:text-zinc-400 font-mono">
                                    {dl.dueDate}
                                  </p>
                                </div>
                                {dl.isStrict && (
                                  <Badge variant="high" className="shrink-0 text-[10px]">
                                    Strict
                                  </Badge>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="py-4 px-3 rounded-lg border border-dashed border-zinc-200 dark:border-zinc-800 text-center text-xs text-zinc-500 dark:text-zinc-400 italic bg-white/40 dark:bg-zinc-900/40">
                            No upcoming deadlines found in this document.
                          </div>
                        )}
                      </section>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Key Events & Dates by Document */}
            {hasEvents && (
              <section aria-label="Key events and dates grouped by document" className="space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-200/80 dark:border-zinc-800/80 pb-3">
                  <div className="flex items-center gap-2">
                    <ClockIcon size={18} className="text-zinc-500" />
                    <h2 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                      Key Events & Dates by Document
                    </h2>
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                      {events.length} total
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  {eventGroups.map((group, idx) => {
                    const headingId = `event-doc-heading-${idx}`;
                    const hasItems = group.items.length > 0;

                    return (
                      <section
                        key={`${group.documentName}-${idx}`}
                        aria-labelledby={headingId}
                        className="space-y-3 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/40 p-4 sm:p-5 shadow-2xs"
                      >
                        {/* Document Heading */}
                        <div className="flex items-center justify-between gap-3 flex-wrap border-b border-zinc-200/60 dark:border-zinc-800/60 pb-3">
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200/80 dark:border-zinc-700/80 shadow-2xs">
                              <DocumentIcon size={16} />
                            </div>
                            <h3
                              id={headingId}
                              className="font-semibold text-sm sm:text-base text-zinc-900 dark:text-zinc-100 truncate max-w-xs sm:max-w-md"
                              title={group.documentName}
                            >
                              {group.documentName}
                            </h3>
                          </div>

                          <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200/60 dark:border-zinc-700/60 shrink-0">
                            {hasItems
                              ? `${group.items.length} event${group.items.length > 1 ? "s" : ""}`
                              : "0 events"}
                          </span>
                        </div>

                        {/* Items or Empty Note */}
                        {hasItems ? (
                          <div className="space-y-2.5 pt-1">
                            {group.items.map((ev) => (
                              <div
                                key={ev.id}
                                className="p-3 rounded-lg border border-zinc-100 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 space-y-1 text-xs shadow-2xs"
                              >
                                <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                                  {ev.title}
                                </p>
                                <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 flex-wrap">
                                  <span className="inline-flex items-center gap-1 font-mono">
                                    <CalendarIcon size={12} /> {ev.date}
                                  </span>
                                  {ev.location && (
                                    <>
                                      <span>•</span>
                                      <span className="inline-flex items-center gap-1">
                                        <MapPinIcon size={12} /> {ev.location}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="py-4 px-3 rounded-lg border border-dashed border-zinc-200 dark:border-zinc-800 text-center text-xs text-zinc-500 dark:text-zinc-400 italic bg-white/40 dark:bg-zinc-900/40">
                            No key events or dates found in this document.
                          </div>
                        )}
                      </section>
                    );
                  })}
                </div>
              </section>
            )}
          </section>
        )
      )}

      {/* 6. Important Notes & Guidelines */}
      {hasNotes && (
        <section aria-label="Important guidelines and notes">
          <Card className="border-amber-200 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/20">
            <CardHeader className="p-4 sm:p-5 border-b border-amber-200/60 dark:border-amber-900/40">
              <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200">
                <AlertCircleIcon size={18} className="shrink-0 text-amber-700 dark:text-amber-400" />
                <CardTitle className="text-base font-semibold">
                  Important Information & Guidelines
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-5">
              <ul className="space-y-2 text-xs sm:text-sm text-amber-900/90 dark:text-amber-200/90 list-disc list-inside leading-relaxed">
                {importantNotes.map((note, index) => (
                  <li key={index}>{note}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </section>
      )}

      {/* 7. Bottom Action Reset Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-zinc-200 dark:border-zinc-800">
        <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center sm:text-left">
          {isBatch
            ? `Extracted ${metrics.totalActions} actions and ${metrics.totalDeadlines} deadlines across ${docCount} documents.`
            : `Extracted ${metrics.totalActions} actions and ${metrics.totalDeadlines} deadlines from ${document.name}.`}
        </p>
        <Button
          type="button"
          variant="primary"
          size="md"
          onClick={onReset}
          className="w-full sm:w-auto"
          aria-label="Analyze another document"
        >
          <span>Analyze another document</span>
          <ArrowRightIcon size={14} className="ml-1.5" />
        </Button>
      </div>
    </div>
  );
}
