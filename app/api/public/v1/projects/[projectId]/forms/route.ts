import { NextResponse } from "next/server";
import { authenticate, requireScope } from "@/lib/api/auth";
import { generateFormSubmissions } from "@/lib/mocks/forms";

export const runtime = "nodejs";

const COUNT: Record<string, number> = {
  "verumflow-ch": 48,
  "impresa-edile-carfi": 12,
  "consulting-bio": 0,
};

export async function GET(
  req: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const auth = authenticate(req);
  if (auth instanceof NextResponse) return auth;
  const scopeErr = requireScope(auth, "read:forms");
  if (scopeErr) return scopeErr;

  const { projectId } = await params;
  const url = new URL(req.url);
  const limit = parseInt(url.searchParams.get("limit") ?? "50", 10);
  const subs = generateFormSubmissions(projectId, COUNT[projectId] ?? 0).slice(0, limit);

  return NextResponse.json({
    data: subs,
    meta: { count: subs.length, limit },
  });
}
