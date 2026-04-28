import { NextResponse } from "next/server";
import { authenticate, requireScope, jsonError } from "@/lib/api/auth";
import { MOCK_PROJECTS } from "@/lib/mocks/projects";

export const runtime = "nodejs";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const auth = authenticate(req);
  if (auth instanceof NextResponse) return auth;
  const scopeErr = requireScope(auth, "read:projects");
  if (scopeErr) return scopeErr;

  const { projectId } = await params;
  const project = MOCK_PROJECTS.find((p) => p.id === projectId);
  if (!project) {
    return jsonError(404, "project-not-found", `No project with id ${projectId}`);
  }
  return NextResponse.json({ data: project });
}
