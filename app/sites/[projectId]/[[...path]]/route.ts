import { NextResponse } from "next/server";
import { getAdmin } from "@/lib/firebase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * S7.10 — Proxy pubblico per siti pubblicati su Firebase Storage.
 *
 * GET /sites/{projectId}/[...path] → fetch da gs://bucket/sites/{projectId}/[path]
 *
 * Vantaggi vs URL Storage diretta:
 *  - URL bella e brandable per il cliente
 *  - Niente ACL pubblico (uniform bucket-level access OK)
 *  - Possibilità futura di aggiungere custom domain (verumflow.ch → /sites/verumflow-ch/)
 *  - Cache headers controllati
 *
 * Trade-off: ogni richiesta passa per Cloud Run (latenza vs CDN diretto).
 *  Per ottimizzare in futuro: Cache-Control aggressivi + edge caching.
 */

const MIME_BY_EXT: Record<string, string> = {
  html: "text/html; charset=utf-8",
  htm: "text/html; charset=utf-8",
  css: "text/css; charset=utf-8",
  js: "application/javascript; charset=utf-8",
  mjs: "application/javascript; charset=utf-8",
  jsx: "application/javascript; charset=utf-8",
  tsx: "application/javascript; charset=utf-8",
  ts: "application/javascript; charset=utf-8",
  json: "application/json; charset=utf-8",
  xml: "application/xml; charset=utf-8",
  txt: "text/plain; charset=utf-8",
  svg: "image/svg+xml",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  ico: "image/x-icon",
  woff: "font/woff",
  woff2: "font/woff2",
  ttf: "font/ttf",
  otf: "font/otf",
};

function safeProjectId(s: string): boolean {
  return /^[a-z0-9-]+$/.test(s);
}

export async function GET(
  _req: Request,
  {
    params,
  }: {
    params: Promise<{ projectId: string; path?: string[] }>;
  },
) {
  const { projectId, path: pathSegments = [] } = await params;
  if (!safeProjectId(projectId)) {
    return new NextResponse("invalid projectId", { status: 400 });
  }

  // Default to index.html when path is empty or ends with "/"
  const relPath = pathSegments.length === 0 ? "index.html" : pathSegments.join("/");
  // Reject path traversal attempts
  if (relPath.includes("..") || relPath.startsWith("/")) {
    return new NextResponse("invalid path", { status: 400 });
  }

  const ext = relPath.includes(".")
    ? relPath.slice(relPath.lastIndexOf(".") + 1).toLowerCase()
    : "";
  const contentType = MIME_BY_EXT[ext] ?? "application/octet-stream";

  try {
    const { storage, bucketName } = getAdmin();
    const bucket = storage.bucket(bucketName);
    const file = bucket.file(`sites/${projectId}/${relPath}`);
    const [exists] = await file.exists();
    if (!exists) {
      // If client asked for a directory-style path without trailing index.html,
      // try the index.html fallback automatically.
      if (!relPath.endsWith(".html") && !relPath.endsWith(".htm")) {
        const fallback = bucket.file(`sites/${projectId}/${relPath.replace(/\/?$/, "/index.html")}`);
        const [fbExists] = await fallback.exists();
        if (fbExists) {
          const [data] = await fallback.download();
          return new NextResponse(new Uint8Array(data), {
            status: 200,
            headers: {
              "content-type": "text/html; charset=utf-8",
              "cache-control": "public, max-age=60",
            },
          });
        }
      }
      return new NextResponse(`File not found: ${relPath}`, { status: 404 });
    }

    const [data] = await file.download();
    const isHtml = ext === "html" || ext === "htm";
    return new NextResponse(new Uint8Array(data), {
      status: 200,
      headers: {
        "content-type": contentType,
        "cache-control": isHtml
          ? "public, max-age=60"
          : "public, max-age=3600, immutable",
      },
    });
  } catch (err) {
    return new NextResponse(
      `Sites proxy error: ${(err as Error).message}`,
      { status: 500 },
    );
  }
}
