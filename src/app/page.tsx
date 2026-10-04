import * as React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge, PriorityBadge, CategoryBadge, ActionStatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProgressTimeline } from "@/components/ui/progress-indicator";
import { DocumentIcon, ArrowRightIcon, CalendarIcon, CheckCircleIcon } from "@/components/ui/icons";
import { SAMPLE_DOCUMENTS } from "@/lib/mock/sampleData";

export default function Home() {
  const sample = SAMPLE_DOCUMENTS[0]; // College notice sample

  return (
    <div className="space-y-10">
      {/* Workflow Intro Banner */}
      <section className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
          <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
          <span>Phase 2: Frontend Foundation Active</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Document → Action Automator
        </h1>
        <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 max-w-2xl leading-relaxed">
          Extract actionable tasks, hard deadlines, and important event dates from notices, circulars, and administrative documents automatically.
        </p>
      </section>

      {/* Core 3-Stage Pipeline Summary */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-zinc-900 dark:border-l-zinc-100">
          <CardHeader className="p-4 sm:p-5">
            <span className="text-xs font-mono font-semibold text-zinc-500 dark:text-zinc-400">STAGE 1</span>
            <CardTitle className="text-base mt-1">Upload Document</CardTitle>
            <CardDescription className="text-xs">
              Drag-and-drop or select PDF, text, or circular files with client-side validation.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="border-l-4 border-l-zinc-400 dark:border-l-zinc-600">
          <CardHeader className="p-4 sm:p-5">
            <span className="text-xs font-mono font-semibold text-zinc-500 dark:text-zinc-400">STAGE 2</span>
            <CardTitle className="text-base mt-1">Processing Feedback</CardTitle>
            <CardDescription className="text-xs">
              Live multi-step progress indicator tracking extraction, parsing, and action generation.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="border-l-4 border-l-emerald-600 dark:border-l-emerald-400">
          <CardHeader className="p-4 sm:p-5">
            <span className="text-xs font-mono font-semibold text-zinc-500 dark:text-zinc-400">STAGE 3</span>
            <CardTitle className="text-base mt-1">Action Dashboard</CardTitle>
            <CardDescription className="text-xs">
              Instant summary metrics, prioritized task cards, deadlines, and category tags.
            </CardDescription>
          </CardHeader>
        </Card>
      </section>

      {/* Foundation Validation Section */}
      <section className="space-y-6 pt-4 border-t border-zinc-200 dark:border-zinc-800">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
            Foundation Preview & Data Models
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Verified primitives, domain types, and realistic mock records for upcoming screens.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card Primitive with Mock Action Data */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DocumentIcon size={18} className="text-zinc-500" />
                  <span className="text-xs font-mono text-zinc-500">{sample.sampleFile.name}</span>
                </div>
                <Badge variant="neutral">{sample.categoryLabel}</Badge>
              </div>
              <CardTitle className="mt-2 text-base">
                Sample Extracted Action Item
              </CardTitle>
              <CardDescription>
                Demonstrating ActionItem domain schema and priority badge styling
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {sample.result.actions.slice(0, 2).map((action) => (
                <div
                  key={action.id}
                  className="p-3.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/40 space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 leading-snug">
                      {action.title}
                    </h4>
                    <PriorityBadge priority={action.priority} />
                  </div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    {action.description}
                  </p>
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-zinc-200/60 dark:border-zinc-800">
                    <div className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400">
                      <CalendarIcon size={14} />
                      <span>{action.deadline}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CategoryBadge category={action.category} />
                      <ActionStatusBadge status={action.status} />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>

            <CardFooter>
              <span className="text-xs text-zinc-500">
                Metrics: {sample.result.metrics.totalActions} actions, {sample.result.metrics.totalDeadlines} deadlines
              </span>
              <Button size="sm" variant="outline">
                Inspect Schema <ArrowRightIcon size={14} className="ml-1" />
              </Button>
            </CardFooter>
          </Card>

          {/* Processing Timeline Primitive Preview */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-zinc-500">ProcessingTimeline Primitive</span>
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                  <CheckCircleIcon size={14} /> Ready
                </span>
              </div>
              <CardTitle className="mt-2 text-base">
                Multi-Step Progress Visualizer
              </CardTitle>
              <CardDescription>
                Simulated state progression for Uploading → Extracting → Analyzing → Generating Actions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProgressTimeline
                currentStatus="analyzing"
                progressPercent={75}
                statusMessage="Analyzing tasks, deadlines, and urgency..."
              />
            </CardContent>
            <CardFooter>
              <span className="text-xs text-zinc-500">Step 3 of 4 in progress</span>
              <Button size="sm" variant="secondary" disabled>
                Phase 3 Preview
              </Button>
            </CardFooter>
          </Card>
        </div>
      </section>
    </div>
  );
}
