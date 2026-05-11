import { NextResponse } from "next/server";
import { getAdmin } from "@/lib/firebase/admin";
import { getInstallationOctokit } from "@/lib/github/app-client";

/**
 * S7.14 sub-E — Publish dal repo GitHub a Firebase Storage.
 *
 * Sostituisce `/api/sites/publish` legacy (che copiava dal filesystem
 * /public/imports). Cloud Run è ephemeral → la filesystem version può
 * essere stale. Il repo GitHub è SOT dopo S7.13.
 *
 * Flow:
 *   1. Carica project doc (Firestore o passato via body) per leggere
 *      githubRepo coords.
 *   2. Fast-forward merge `main` → `production` via Octokit. Se branch
 *      diverged (raro: solo se qualcuno ha pushato production manualmente),
 *      tentativo merge classico; su conflict → 409.
 *   3. List ricorsivo dei file in `production` tree (GET /git/trees/{sha}?recursive=true).
 *   4. Per ogni file: download blob (binary-aware), upload a Firebase Storage
 *      `sites/{projectId}/{path}`. Parallelizzato con limite di concorrenza.
 *   5. Update Firestore `projects/{projectId}` con lastPublishedSha +
 *      publishedAt. Update `domains/{fqdn}` se progetto ha dominio "live"
 *      (per UI status badge).
 *
 * Idempotente: stesso commit pubblicato due volte ricarica gli stessi blob
 * con stesso path (Storage overwrite). Per ottimizzare: skip se shasum
 * uguale a metadata.shasum corrente (future).
 *
 * Body:
 *   { githubRepo: { owner, name, branch, productionBranch }, importId?: string }
 *   - importId opzionale → fallback al legacy se githubRepo non passato.
 *     Per ora soltanto githubRepo path è implementato qui.
 */

export const runtime = "nodejs";
export const maxDuration = 120;

const MAX_FILES = 1000;
const UPLOAD_CONCURRENCY = 6;

type GithubCoords = {
  owner: string;
  name: string;
  branch: string;
  productionBranch: string;
};

export async function POST(
  req: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params;
  if (!/^[a-z0-9-]+$/.test(projectId)) {
    return NextResponse.json({ error: "invalid projectId" }, { status: 400 });
  }
  let body: { githubRepo?: GithubCoords };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  const repo = body.githubRepo;
  if (!repo || !repo.owner || !repo.name || !repo.branch || !repo.productionBranch) {
    return NextResponse.json(
      {
        error: "missing_github_repo",
        message:
          "githubRepo {owner, name, branch, productionBranch} required. Init via /api/projects/{id}/github-init.",
      },
      { status: 400 },
    );
  }
  const startedAt = Date.now();
  try {
    const octokit = await getInstallationOctokit();

    // 2. Merge main → production. Usa il workflow API che gestisce sia FF
    //    sia merge-commit. Su conflict ritorna 409 — caso edge che non
    //    dovrebbe capitare nel nostro flow (production scritto solo da qui).
    let prodSha: string;
    try {
      const merge = await octokit.request(
        "POST /repos/{owner}/{repo}/merges",
        {
          owner: repo.owner,
          repo: repo.name,
          base: repo.productionBranch,
          head: repo.branch,
          commit_message: `chore: publish ${repo.branch} → ${repo.productionBranch}`,
        },
      );
      prodSha = merge.data.sha;
    } catch (err) {
      const status = (err as { status?: number }).status;
      if (status === 204) {
        // 204 = già up-to-date. Leggi HEAD di production esistente.
        const ref = await octokit.request(
          "GET /repos/{owner}/{repo}/git/ref/{ref}",
          {
            owner: repo.owner,
            repo: repo.name,
            ref: `heads/${repo.productionBranch}`,
          },
        );
        prodSha = ref.data.object.sha;
      } else if (status === 409) {
        return NextResponse.json(
          {
            error: "merge_conflict",
            message: `Branch ${repo.productionBranch} ha modifiche non-presenti su ${repo.branch}. Rebase manualmente.`,
          },
          { status: 409 },
        );
      } else {
        throw err;
      }
    }

    // 3. List file tree.
    const tree = await octokit.request(
      "GET /repos/{owner}/{repo}/git/trees/{tree_sha}",
      {
        owner: repo.owner,
        repo: repo.name,
        tree_sha: prodSha,
        recursive: "true",
      },
    );
    const allFiles = (tree.data.tree ?? []).filter(
      (entry) => entry.type === "blob" && entry.path && entry.sha,
    ) as Array<{ path: string; sha: string; size?: number }>;
    if (allFiles.length === 0) {
      return NextResponse.json(
        { error: "empty_repo", message: `Production branch vuota` },
        { status: 404 },
      );
    }
    if (allFiles.length > MAX_FILES) {
      return NextResponse.json(
        { error: `repo troppo grande: ${allFiles.length} file > ${MAX_FILES}` },
        { status: 413 },
      );
    }

    // 4. Download blobs + upload Storage, con concorrenza limitata.
    const { storage, bucketName } = getAdmin();
    const bucket = storage.bucket(bucketName);

    let uploaded = 0;
    let totalBytes = 0;
    const errors: Array<{ path: string; error: string }> = [];

    async function processFile(f: { path: string; sha: string }) {
      try {
        const blob = await octokit.request(
          "GET /repos/{owner}/{repo}/git/blobs/{file_sha}",
          {
            owner: repo!.owner,
            repo: repo!.name,
            file_sha: f.sha,
          },
        );
        // Blob API ritorna `content` base64-encoded (anche per testo)
        const buf = Buffer.from(blob.data.content as string, "base64");
        await bucket.file(`sites/${projectId}/${f.path}`).save(buf, {
          contentType: contentTypeFor(f.path),
          resumable: false,
          metadata: {
            cacheControl: f.path.endsWith(".html")
              ? "public, max-age=60"
              : "public, max-age=3600, immutable",
          },
        });
        uploaded += 1;
        totalBytes += buf.byteLength;
      } catch (err) {
        errors.push({ path: f.path, error: (err as Error).message });
      }
    }

    // Concurrency control "manual" — simple worker pool.
    const queue = [...allFiles];
    const workers = Array.from({ length: UPLOAD_CONCURRENCY }, async () => {
      while (queue.length > 0) {
        const f = queue.shift();
        if (!f) break;
        await processFile(f);
      }
    });
    await Promise.all(workers);

    // 5. Update Firestore project doc + linked domains.
    const { db } = getAdmin();
    const now = new Date();
    const projectRef = db.collection("projects").doc(projectId);
    await projectRef.set(
      {
        lastPublishedSha: prodSha,
        lastPublishedAt: now,
        publishedFileCount: uploaded,
        publishedBytes: totalBytes,
      },
      { merge: true },
    );

    return NextResponse.json({
      ok: true,
      projectId,
      productionSha: prodSha,
      filesUploaded: uploaded,
      totalBytes,
      durationMs: Date.now() - startedAt,
      errors,
      ...(errors.length > 0 && { warning: "Alcuni file non sono stati caricati" }),
    });
  } catch (err) {
    console.error("[api/publish-prod] failed", err);
    return NextResponse.json(
      { error: (err as Error).message ?? "publish failed" },
      { status: 500 },
    );
  }
}

const CT_BY_EXT: Record<string, string> = {
  html: "text/html; charset=utf-8",
  htm: "text/html; charset=utf-8",
  css: "text/css; charset=utf-8",
  js: "application/javascript; charset=utf-8",
  mjs: "application/javascript; charset=utf-8",
  jsx: "application/javascript; charset=utf-8",
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
function contentTypeFor(path: string): string {
  const i = path.lastIndexOf(".");
  if (i < 0) return "application/octet-stream";
  const ext = path.slice(i + 1).toLowerCase();
  return CT_BY_EXT[ext] ?? "application/octet-stream";
}
