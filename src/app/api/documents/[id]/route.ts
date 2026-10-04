import { prisma } from "@/lib/prisma";
import { resolveWorkspace } from "@/lib/services/workspaceService";
import type { AnalysisResult } from "@/lib/types/action";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { workspaceId } = await resolveWorkspace(request);

    if (!process.env.DATABASE_URL) {
      return Response.json(
        { success: false, error: "Database not connected" },
        { status: 404 }
      );
    }

    const doc = await prisma.document.findFirst({
      where: {
        id,
        workspaceId,
      },
      include: {
        actions: true,
        deadlines: true,
        events: true,
        notes: true,
      },
    });

    if (!doc) {
      return Response.json(
        { success: false, error: "Document not found in your workspace" },
        { status: 404 }
      );
    }

    const result: AnalysisResult = {
      document: {
        id: doc.id,
        name: doc.name,
        sizeBytes: doc.sizeBytes,
        mimeType: doc.mimeType,
        uploadedAt: doc.uploadedAt.toISOString(),
      },
      metrics: {
        totalActions: doc.actions.length,
        totalDeadlines: doc.deadlines.length,
        totalEvents: doc.events.length,
        highPriorityCount: doc.actions.filter((a) => a.priority === "high")
          .length,
      },
      actions: doc.actions.map((act) => ({
        id: act.id,
        title: act.title,
        description: act.description,
        deadline: act.deadline,
        priority: act.priority as "high" | "medium" | "low",
        category: act.category as
          | "academic"
          | "administrative"
          | "finance"
          | "event"
          | "general",
        status: act.status as "pending" | "in_progress" | "completed",
        sourceSnippet: act.sourceSnippet ?? undefined,
        sourceDocument: doc.name, // derived from Document relation as requested!
      })),
      deadlines: doc.deadlines.map((dl) => ({
        id: dl.id,
        title: dl.title,
        dueDate: dl.dueDate,
        isStrict: dl.isStrict,
      })),
      events: doc.events.map((ev) => ({
        id: ev.id,
        title: ev.title,
        date: ev.date,
        location: ev.location ?? undefined,
      })),
      importantNotes: doc.notes.map((n) => n.content),
    };

    return Response.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Failed to load document:", error);
    return Response.json(
      { success: false, error: "Failed to load document" },
      { status: 500 }
    );
  }
}
