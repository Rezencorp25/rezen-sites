import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

/**
 * Webhook chiamato dalla Cloud Function `cmsItemOnWrite` (S7.6) quando un item
 * passa lo stato a `published`. Invalida la cache ISR della Collection Page.
 *
 * Auth: header `x-revalidate-secret` deve matchare `REVALIDATE_WEBHOOK_SECRET`
 * in env (settato via Firebase Secret Manager + apphosting.yaml).
 */

export const runtime = "nodejs";

export async function POST(req: Request) {
  const secret = req.headers.get("x-revalidate-secret");
  const expected = process.env.REVALIDATE_WEBHOOK_SECRET;
  if (!expected || secret !== expected) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  let body: {
    projectId?: string;
    collectionId?: string;
    itemSlug?: string;
    collectionSlug?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  const { collectionSlug, itemSlug, projectId } = body;
  if (!itemSlug || !projectId) {
    return NextResponse.json(
      { error: "missing projectId or itemSlug" },
      { status: 400 },
    );
  }
  // Path pattern del preview/produzione (in S7.6 usiamo /preview path).
  // In produzione (S7.7+) sarà domain-rooted: /{collectionSlug}/{itemSlug}.
  const previewPath = `/preview/${projectId}/${collectionSlug ?? "*"}/${itemSlug}`;
  revalidatePath(previewPath);
  return NextResponse.json({ revalidated: true, path: previewPath });
}
