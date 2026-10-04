import { prisma } from "@/lib/prisma";
import { resolveWorkspace } from "@/lib/services/workspaceService";
import type { ActionItem } from "@/lib/types/action";

export async function GET(request: Request) {
  try {
    const { workspaceId } = await resolveWorkspace(request);

    if (!process.env.DATABASE_URL) {
      return Response.json({
        success: true,
        metrics: {
          total: 0,
          pending: 0,
          completed: 0,
          overdue: 0,
          dueSoon: 0,
        },
        groups: {
          overdue: [],
          dueSoon: [],
          upcoming: [],
          completed: [],
        },
      });
    }

    const items = await prisma.actionItem.findMany({
      where: { workspaceId },
      include: {
        document: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const mappedActions: ActionItem[] = items.map((item) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      deadline: item.deadline,
      priority: item.priority as "high" | "medium" | "low",
      category: item.category as
        | "academic"
        | "administrative"
        | "finance"
        | "event"
        | "general",
      status: item.status as "pending" | "in_progress" | "completed",
      sourceSnippet: item.sourceSnippet ?? undefined,
      sourceDocument: item.document.name, // derived from Document relation as requested
    }));

    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    const overdue: ActionItem[] = [];
    const dueSoon: ActionItem[] = [];
    const upcoming: ActionItem[] = [];
    const completed: ActionItem[] = [];

    for (const act of mappedActions) {
      if (act.status === "completed") {
        completed.push(act);
        continue;
      }

      if (!act.deadline) {
        upcoming.push(act);
        continue;
      }

      // Try parsing date string
      const parsedDate = new Date(act.deadline);
      if (!isNaN(parsedDate.getTime())) {
        if (parsedDate < now) {
          overdue.push(act);
        } else if (parsedDate <= threeDaysFromNow) {
          dueSoon.push(act);
        } else {
          upcoming.push(act);
        }
      } else {
        // Fallback for custom human strings like "15 October 2026"
        upcoming.push(act);
      }
    }

    return Response.json({
      success: true,
      metrics: {
        total: mappedActions.length,
        pending: mappedActions.length - completed.length,
        completed: completed.length,
        overdue: overdue.length,
        dueSoon: dueSoon.length,
      },
      groups: {
        overdue,
        dueSoon,
        upcoming,
        completed,
      },
    });
  } catch (error) {
    console.error("Failed to fetch actions:", error);
    return Response.json(
      { success: false, error: "Failed to retrieve workspace actions." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const { workspaceId } = await resolveWorkspace(request);
    const body = await request.json().catch(() => ({}));
    const { ids, all, status } = body;

    if (!status || !["pending", "completed", "in_progress"].includes(status)) {
      return Response.json({ success: false, error: "Invalid status" }, { status: 400 });
    }

    if (process.env.DATABASE_URL) {
      if (all) {
        await prisma.actionItem.updateMany({
          where: { workspaceId },
          data: {
            status,
            completedAt: status === "completed" ? new Date() : null,
          },
        });
      } else if (Array.isArray(ids) && ids.length > 0) {
        await prisma.actionItem.updateMany({
          where: {
            workspaceId,
            id: { in: ids },
          },
          data: {
            status,
            completedAt: status === "completed" ? new Date() : null,
          },
        });
      }
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("Failed to bulk update actions:", error);
    return Response.json(
      { success: false, error: "Failed to update actions" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { workspaceId } = await resolveWorkspace(request);
    const body = await request.json().catch(() => ({}));
    const { ids, all } = body;

    if (process.env.DATABASE_URL) {
      if (all) {
        await prisma.actionItem.deleteMany({
          where: { workspaceId },
        });
      } else if (Array.isArray(ids) && ids.length > 0) {
        await prisma.actionItem.deleteMany({
          where: {
            workspaceId,
            id: { in: ids },
          },
        });
      }
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("Failed to delete actions:", error);
    return Response.json(
      { success: false, error: "Failed to delete actions" },
      { status: 500 }
    );
  }
}

