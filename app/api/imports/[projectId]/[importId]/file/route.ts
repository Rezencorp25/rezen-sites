import { NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";

export const runtime = "nodejs";
export const maxDuration = 30;

const TEXT_EXT = new Set([
  ".html",
  ".htm",
  ".css",
  ".js",
  ".mjs",
  ".jsx",
  ".tsx",
  ".ts",
  ".json",
  ".xml",
  ".txt",
  ".svg",
  ".md",
]);

const MAX_FILE_BYTES = 1 * 1024 * 1024; // 1 MB per single file edit

function safeResolve(
  projectId: string,
  importId: string,
  relPath: string,
): string | null {
  if (
    !/^[a-z0-9-]+$/.test(projectId) ||
    !/^[a-z0-9-]+$/.test(importId)
  ) {
    return null;
  }
  if (!relPath || relPath.includes("..") || relPath.startsWith("/")) {
    return null;
  }
  const baseRoot = path.join(
    process.cwd(),
    "public",
    "imports",
    projectId,
    importId,
  );
  const candidate = path.resolve(path.join(baseRoot, relPath));
  if (!candidate.startsWith(path.resolve(baseRoot))) return null;
  return candidate;
}

function isEditable(filePath: string): boolean {
  return TEXT_EXT.has(path.extname(filePath).toLowerCase());
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ projectId: string; importId: string }> },
) {
  const { projectId, importId } = await params;
  const url = new URL(req.url);
  const relPath = url.searchParams.get("path") ?? "";
  const file = safeResolve(projectId, importId, relPath);
  if (!file) {
    return NextResponse.json({ error: "invalid path" }, { status: 400 });
  }
  if (!isEditable(file)) {
    return NextResponse.json(
      { error: "extension non editabile" },
      { status: 400 },
    );
  }
  try {
    const stat = await fs.stat(file);
    if (stat.size > MAX_FILE_BYTES) {
      return NextResponse.json(
        { error: `file troppo grande (${stat.size} > ${MAX_FILE_BYTES})` },
        { status: 413 },
      );
    }
    const content = await fs.readFile(file, "utf-8");
    return NextResponse.json({
      path: relPath,
      content,
      size: stat.size,
      ext: path.extname(file).toLowerCase(),
    });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message ?? "read failed" },
      { status: 404 },
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ projectId: string; importId: string }> },
) {
  const { projectId, importId } = await params;
  const url = new URL(req.url);
  const relPath = url.searchParams.get("path") ?? "";
  const file = safeResolve(projectId, importId, relPath);
  if (!file) {
    return NextResponse.json({ error: "invalid path" }, { status: 400 });
  }
  if (!isEditable(file)) {
    return NextResponse.json(
      { error: "extension non editabile" },
      { status: 400 },
    );
  }
  const body = (await req.json()) as { content?: string };
  if (typeof body.content !== "string") {
    return NextResponse.json(
      { error: "content (string) richiesto" },
      { status: 400 },
    );
  }
  if (Buffer.byteLength(body.content, "utf-8") > MAX_FILE_BYTES) {
    return NextResponse.json(
      { error: `contenuto troppo grande (max ${MAX_FILE_BYTES} bytes)` },
      { status: 413 },
    );
  }
  try {
    // Ensure file existed before we wrote: prevent CREATE of new files via this
    // endpoint (only edit existing assets from the import).
    await fs.stat(file);
    await fs.writeFile(file, body.content, "utf-8");
    const stat = await fs.stat(file);
    return NextResponse.json({
      path: relPath,
      size: stat.size,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message ?? "write failed" },
      { status: 404 },
    );
  }
}
