import { NextResponse } from "next/server";
import { initRepoFromBundle } from "@/lib/github/init-repo";

/**
 * POST /api/projects/{projectId}/github-init
 *
 * Triggered when user clicks "Connect to GitHub" on a project that has a
 * filesystem-imported bundle. Body: { importId: string }.
 *
 * Server-side:
 *   1. Walks /public/imports/{projectId}/{importId}/* via Git Data API
 *   2. Creates Rezencorp26/site-{projectId} private repo (idempotent)
 *   3. Pushes single bootstrap commit with the bundle
 *   4. Returns githubRepo metadata for the client to persist on Project
 *
 * Client should then save the result to projects store (Firestore in prod,
 * Zustand+localStorage today) so future saves know to also commit to git.
 */

export const runtime = "nodejs";
export const maxDuration = 60; // GitHub API + bundle walk can take 30-60s

export async function POST(
  req: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params;
  if (!/^[a-z0-9-]+$/.test(projectId)) {
    return NextResponse.json({ error: "invalid projectId" }, { status: 400 });
  }

  let importId: string;
  try {
    const body = (await req.json()) as { importId?: string };
    importId = body.importId ?? "";
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }
  if (!/^[a-z0-9-]+$/.test(importId)) {
    return NextResponse.json({ error: "invalid importId" }, { status: 400 });
  }

  try {
    const result = await initRepoFromBundle(projectId, importId);
    return NextResponse.json({
      ok: true,
      githubRepo: result,
    });
  } catch (err) {
    console.error("[api/projects/github-init] failed", {
      projectId,
      importId,
      err: (err as Error).message,
      stack: (err as Error).stack?.slice(0, 800),
    });
    return NextResponse.json(
      { error: (err as Error).message ?? "github-init failed" },
      { status: 500 },
    );
  }
}
