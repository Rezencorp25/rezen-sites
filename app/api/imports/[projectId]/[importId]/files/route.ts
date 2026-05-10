import { NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";

export const runtime = "nodejs";

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

type FileNode = {
  name: string;
  path: string;
  size: number;
  ext: string;
  editable: boolean;
};

async function walk(
  baseDir: string,
  rel = "",
  out: FileNode[] = [],
): Promise<FileNode[]> {
  const dir = path.join(baseDir, rel);
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const childRel = rel ? `${rel}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      await walk(baseDir, childRel, out);
    } else if (entry.isFile()) {
      const stat = await fs.stat(path.join(dir, entry.name));
      const ext = path.extname(entry.name).toLowerCase();
      out.push({
        name: entry.name,
        path: childRel,
        size: stat.size,
        ext,
        editable: TEXT_EXT.has(ext),
      });
    }
  }
  return out;
}

function resolveImportDir(projectId: string, importId: string): string | null {
  if (
    !/^[a-z0-9-]+$/.test(projectId) ||
    !/^[a-z0-9-]+$/.test(importId)
  ) {
    return null;
  }
  const baseRoot = path.join(process.cwd(), "public", "imports");
  const target = path.join(baseRoot, projectId, importId);
  const resolved = path.resolve(target);
  if (!resolved.startsWith(path.resolve(baseRoot))) return null;
  return resolved;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ projectId: string; importId: string }> },
) {
  const { projectId, importId } = await params;
  const dir = resolveImportDir(projectId, importId);
  if (!dir) {
    return NextResponse.json({ error: "invalid path" }, { status: 400 });
  }
  try {
    const files = await walk(dir);
    files.sort((a, b) => a.path.localeCompare(b.path));
    return NextResponse.json({ projectId, importId, files });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message ?? "list failed" },
      { status: 404 },
    );
  }
}
