import { prisma } from "../prisma";

export const WORKSPACE_COOKIE_NAME = "doc2action_workspace_id";
export const WORKSPACE_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days in seconds

/**
 * Extracts the workspace ID from request cookies or returns null.
 */
export function getWorkspaceIdFromRequest(request: Request): string | null {
  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(";").map((c) => c.trim());
  const match = cookies.find((c) => c.startsWith(`${WORKSPACE_COOKIE_NAME}=`));
  if (!match) return null;

  const val = match.split("=")[1];
  return val ? decodeURIComponent(val) : null;
}

/**
 * Resolves or creates an anonymous workspace.
 * If the workspace does not exist in the database, it creates one.
 * If database is unavailable, returns a generated workspace ID gracefully.
 */
export async function resolveWorkspace(request: Request): Promise<{
  workspaceId: string;
  isNew: boolean;
}> {
  let existingId = getWorkspaceIdFromRequest(request);
  let isNew = false;

  if (!existingId) {
    existingId = `ws_${crypto.randomUUID().replace(/-/g, "")}`;
    isNew = true;
  }

  // Attempt to ensure workspace exists in database
  try {
    if (process.env.DATABASE_URL) {
      const existing = await prisma.workspace.findUnique({
        where: { id: existingId },
      });

      if (!existing) {
        await prisma.workspace.create({
          data: {
            id: existingId,
          },
        });
        isNew = true;
      }
    }
  } catch (error) {
    console.warn("Could not verify or create workspace in database:", error);
    // Non-blocking: workspaceId is still returned so in-memory processing continues
  }

  return { workspaceId: existingId, isNew };
}

/**
 * Attaches the workspace ID cookie to an HTTP response.
 */
export function attachWorkspaceCookie(
  response: Response,
  workspaceId: string
): Response {
  const cookieValue = `${WORKSPACE_COOKIE_NAME}=${encodeURIComponent(
    workspaceId
  )}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${WORKSPACE_COOKIE_MAX_AGE}`;

  response.headers.append("Set-Cookie", cookieValue);
  return response;
}
