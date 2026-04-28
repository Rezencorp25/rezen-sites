import { NextResponse } from "next/server";
import { authenticate, requireScope } from "@/lib/api/auth";
import { MOCK_PROJECTS } from "@/lib/mocks/projects";

export const runtime = "nodejs";

/**
 * GET /api/public/v1/projects
 * List projects accessible by API key.
 */
export async function GET(req: Request) {
  const auth = authenticate(req);
  if (auth instanceof NextResponse) return auth;
  const scopeErr = requireScope(auth, "read:projects");
  if (scopeErr) return scopeErr;

  return NextResponse.json({
    data: MOCK_PROJECTS.map((p) => ({
      id: p.id,
      name: p.name,
      domain: p.domain,
      status: p.status,
      kpis: p.kpis,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    })),
    meta: { count: MOCK_PROJECTS.length, version: "v1" },
  });
}
