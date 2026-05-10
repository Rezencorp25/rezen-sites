import { NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";
import { getAdmin } from "@/lib/firebase/admin";

export const runtime = "nodejs";
export const maxDuration = 120;

const MIME_BY_EXT: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".htm": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".jsx": "application/javascript; charset=utf-8",
  ".tsx": "application/javascript; charset=utf-8",
  ".ts": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".otf": "font/otf",
};

async function* walk(dir: string, base = dir): AsyncGenerator<string> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walk(full, base);
    } else if (entry.isFile()) {
      yield full;
    }
  }
}

function safeId(s: string): boolean {
  return /^[a-z0-9-]+$/.test(s);
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      projectId?: string;
      importId?: string;
    };
    const { projectId, importId } = body;
    if (!projectId || !importId || !safeId(projectId) || !safeId(importId)) {
      return NextResponse.json(
        { error: "projectId/importId invalidi" },
        { status: 400 },
      );
    }

    const sourceDir = path.join(
      process.cwd(),
      "public",
      "imports",
      projectId,
      importId,
    );
    try {
      await fs.access(sourceDir);
    } catch {
      return NextResponse.json(
        { error: `cartella import non trovata: imports/${projectId}/${importId}` },
        { status: 404 },
      );
    }

    const { storage, bucketName } = getAdmin();
    const bucket = storage.bucket(bucketName);

    // Verify bucket exists. If not, return a clear error so the user knows
    // they need to initialize Firebase Storage in the console first.
    const [exists] = await bucket.exists();
    if (!exists) {
      return NextResponse.json(
        {
          error: `Bucket Storage "${bucketName}" non inizializzato. Vai su Firebase Console → Storage → Get Started e seleziona regione eur3.`,
        },
        { status: 503 },
      );
    }

    // Wipe existing site files for this project before uploading new version.
    // This avoids stale files left over from a previous publish.
    const sitePrefix = `sites/${projectId}/`;
    const [existingFiles] = await bucket.getFiles({ prefix: sitePrefix });
    if (existingFiles.length > 0) {
      await Promise.all(existingFiles.map((f) => f.delete().catch(() => {})));
    }

    // Upload all files in parallel batches.
    const uploaded: { path: string; size: number }[] = [];
    const BATCH = 8;
    const queue: string[] = [];
    for await (const fp of walk(sourceDir)) queue.push(fp);

    for (let i = 0; i < queue.length; i += BATCH) {
      const slice = queue.slice(i, i + BATCH);
      await Promise.all(
        slice.map(async (filePath) => {
          const rel = path.relative(sourceDir, filePath).split(path.sep).join("/");
          const ext = path.extname(filePath).toLowerCase();
          const data = await fs.readFile(filePath);
          const dest = bucket.file(`${sitePrefix}${rel}`);
          await dest.save(data, {
            contentType: MIME_BY_EXT[ext] ?? "application/octet-stream",
            metadata: {
              cacheControl:
                ext === ".html" || ext === ".htm"
                  ? "public, max-age=60"
                  : "public, max-age=3600",
            },
            resumable: false,
          });
          // Files are served via Next proxy route /sites/{projectId}/[...path]
          // which uses Admin SDK to fetch — no need for ACL makePublic
          // (incompatible with uniform bucket-level access).
          uploaded.push({ path: rel, size: data.length });
        }),
      );
    }

    // Public URL via Next proxy route (no auth required, bypasses /login).
    const reqUrl = new URL(req.url);
    const origin = reqUrl.origin;
    const indexUrl = `${origin}/sites/${projectId}/`;
    const totalBytes = uploaded.reduce((acc, f) => acc + f.size, 0);

    return NextResponse.json({
      ok: true,
      projectId,
      importId,
      bucket: bucketName,
      url: indexUrl,
      filesUploaded: uploaded.length,
      totalBytes,
      publishedAt: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message ?? "publish failed" },
      { status: 500 },
    );
  }
}
