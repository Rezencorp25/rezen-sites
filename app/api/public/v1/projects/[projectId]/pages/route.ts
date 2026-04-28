import { NextResponse } from "next/server";
import { authenticate, requireScope } from "@/lib/api/auth";
import { VERUMFLOW_PAGES, CARFI_PAGES, BIO_PAGES } from "@/lib/mocks/pages";

export const runtime = "nodejs";

const PAGES_BY_PROJECT: Record<string, typeof VERUMFLOW_PAGES> = {
  "verumflow-ch": VERUMFLOW_PAGES,
  "impresa-edile-carfi": CARFI_PAGES,
  "consulting-bio": BIO_PAGES,
};

export async function GET(
  req: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const auth = authenticate(req);
  if (auth instanceof NextResponse) return auth;
  const scopeErr = requireScope(auth, "read:pages");
  if (scopeErr) return scopeErr;

  const { projectId } = await params;
  const pages = PAGES_BY_PROJECT[projectId] ?? [];
  return NextResponse.json({
    data: pages.map((p) => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      status: p.status,
      seo: p.seo,
      analytics: p.analytics,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    })),
    meta: { count: pages.length },
  });
}
