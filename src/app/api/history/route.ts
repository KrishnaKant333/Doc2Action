import { prisma } from "@/lib/prisma";
import {
  resolveWorkspace,
  attachWorkspaceCookie,
} from "@/lib/services/workspaceService";

export async function GET(request: Request) {
  try {
    const { workspaceId } = await resolveWorkspace(request);

    if (!process.env.DATABASE_URL) {
      const resp = Response.json({
        success: true,
        workspaceId,
        documents: [],
      });
      return attachWorkspaceCookie(resp, workspaceId);
    }

    const docs = await prisma.document.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        _count: {
          select: {
            actions: true,
            deadlines: true,
            events: true,
          },
        },
      },
    });

    const documents = docs.map((doc) => ({
      id: doc.id,
      name: doc.name,
      sizeBytes: doc.sizeBytes,
      mimeType: doc.mimeType,
      uploadedAt: doc.uploadedAt.toISOString(),
      actionCount: doc._count.actions,
      deadlineCount: doc._count.deadlines,
      eventCount: doc._count.events,
    }));

    const response = Response.json({
      success: true,
      workspaceId,
      documents,
    });

    return attachWorkspaceCookie(response, workspaceId);
  } catch (error) {
    console.error("Failed to fetch history:", error);
    return Response.json(
      {
        success: false,
        error: "Failed to retrieve document history.",
      },
      { status: 500 }
    );
  }
}
