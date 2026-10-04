import { prisma } from "@/lib/prisma";
import { resolveWorkspace } from "@/lib/services/workspaceService";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { workspaceId } = await resolveWorkspace(request);
    const body = await request.json();

    const { status } = body;
    if (!status || !["pending", "in_progress", "completed"].includes(status)) {
      return Response.json(
        { success: false, error: "Invalid status value" },
        { status: 400 }
      );
    }

    if (!process.env.DATABASE_URL) {
      // In stateless fallback mode, simulate success
      return Response.json({
        success: true,
        action: { id, status },
      });
    }

    // Verify ownership via workspaceId
    const existing = await prisma.actionItem.findFirst({
      where: { id, workspaceId },
    });

    if (!existing) {
      return Response.json(
        { success: false, error: "Action item not found in your workspace" },
        { status: 404 }
      );
    }

    const updated = await prisma.actionItem.update({
      where: { id },
      data: {
        status,
        completedAt: status === "completed" ? new Date() : null,
      },
    });

    return Response.json({
      success: true,
      action: updated,
    });
  } catch (error) {
    console.error("Failed to update action status:", error);
    return Response.json(
      { success: false, error: "Failed to update action status" },
      { status: 500 }
    );
  }
}
