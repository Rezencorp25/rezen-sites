import "server-only";

import { promises as fs } from "node:fs";
import path from "node:path";
import { getInstallationOctokit } from "./app-client";

/**
 * S7.13 — Bootstrap a GitHub repo from a freshly-imported site bundle.
 *
 * Flow:
 *   1. Create empty private repo `Rezencorp26/site-{projectId}` (idempotent —
 *      reuse if it already exists)
 *   2. Walk the bundle directory at /public/imports/{projectId}/{importId}/
 *      and build a single tree+commit via Git Data API. Single commit means
 *      atomic — repo never lands in half-pushed state.
 *   3. Create branches `main` and `production` pointing at the bootstrap
 *      commit. `main` = workspace (live edit), `production` = published.
 *
 * Returns { owner, name, branch, productionBranch, lastSha } to persist on
 * the Project entity.
 */

const ORG = "Rezencorp26";
const MAIN_BRANCH = "main";
const PRODUCTION_BRANCH = "production";

type InitRepoResult = {
  owner: string;
  name: string;
  branch: string;
  productionBranch: string;
  lastSha: string;
  initializedAt: string;
};

async function walkBundle(
  rootDir: string,
  rel = "",
): Promise<Array<{ path: string; content: Buffer }>> {
  const out: Array<{ path: string; content: Buffer }> = [];
  const here = path.join(rootDir, rel);
  const entries = await fs.readdir(here, { withFileTypes: true });
  for (const e of entries) {
    const childRel = rel ? `${rel}/${e.name}` : e.name;
    if (e.isDirectory()) {
      out.push(...(await walkBundle(rootDir, childRel)));
    } else if (e.isFile()) {
      const buf = await fs.readFile(path.join(here, e.name));
      out.push({ path: childRel, content: buf });
    }
  }
  return out;
}

export async function initRepoFromBundle(
  projectId: string,
  importId: string,
): Promise<InitRepoResult> {
  const repoName = `site-${projectId}`;
  const bundleDir = path.join(
    process.cwd(),
    "public",
    "imports",
    projectId,
    importId,
  );

  // Sanity check
  try {
    await fs.stat(bundleDir);
  } catch {
    throw new Error(`bundle non trovato: ${bundleDir}`);
  }

  const octokit = await getInstallationOctokit();

  // 1. Create repo (idempotent — 422 if already exists, treat as ok).
  // auto_init=true creates an initial README commit so the Git Data API
  // (createBlob/createTree/createCommit) has a starting ref to work with —
  // calling createBlob on a totally empty repo returns "Git Repository is
  // empty". We later overwrite main with our own bundle commit.
  let repoExists = false;
  try {
    await octokit.request("POST /orgs/{org}/repos", {
      org: ORG,
      name: repoName,
      private: true,
      auto_init: true,
      description: `Source for REZEN Sites project ${projectId}`,
    });
  } catch (err) {
    const status = (err as { status?: number }).status;
    if (status === 422) {
      repoExists = true;
    } else {
      throw err;
    }
  }

  // 2. Walk the bundle
  const files = await walkBundle(bundleDir);
  if (files.length === 0) {
    throw new Error(`bundle vuoto: ${bundleDir}`);
  }
  if (files.length > 1000) {
    throw new Error(`bundle troppo grande (${files.length} file, max 1000)`);
  }

  // 3. If repo existed BEFORE this call (not just-created), don't clobber
  //    user edits. Return current main HEAD instead. Fresh `auto_init=true`
  //    creates the repo + initial README — that's NOT an "edit", so we
  //    proceed to overwrite below.
  if (repoExists) {
    try {
      const ref = await octokit.request(
        "GET /repos/{owner}/{repo}/git/ref/{ref}",
        {
          owner: ORG,
          repo: repoName,
          ref: `heads/${MAIN_BRANCH}`,
        },
      );
      return {
        owner: ORG,
        name: repoName,
        branch: MAIN_BRANCH,
        productionBranch: PRODUCTION_BRANCH,
        lastSha: ref.data.object.sha,
        initializedAt: new Date().toISOString(),
      };
    } catch {
      // Repo exists but main branch doesn't — fall through to bootstrap
    }
  }

  // Fetch current main HEAD (from auto_init README commit). Required as
  // parent for our bundle commit — using parents:[] on a non-empty repo
  // would create a detached commit GitHub rejects on updateRef.
  let parentSha: string | undefined;
  try {
    const head = await octokit.request(
      "GET /repos/{owner}/{repo}/git/ref/{ref}",
      {
        owner: ORG,
        repo: repoName,
        ref: `heads/${MAIN_BRANCH}`,
      },
    );
    parentSha = head.data.object.sha;
  } catch {
    parentSha = undefined;
  }

  // If repo is totally empty (no main branch, no commits — happens when
  // repo was previously created with auto_init:false), bootstrap it with
  // a placeholder file via PUT /contents. That call automatically creates
  // the first commit + main branch ref, which then makes the Git Data API
  // (createBlob/createTree/createCommit) usable for our bundle.
  if (!parentSha) {
    try {
      const seed = await octokit.request(
        "PUT /repos/{owner}/{repo}/contents/{path}",
        {
          owner: ORG,
          repo: repoName,
          path: ".rezen-bootstrap",
          message: "chore: bootstrap empty repo",
          content: Buffer.from("rezen-sites placeholder\n").toString("base64"),
          branch: MAIN_BRANCH,
        },
      );
      parentSha = seed.data.commit.sha;
    } catch (err) {
      throw new Error(
        `Failed to bootstrap empty repo: ${(err as Error).message}`,
      );
    }
  }

  // 4. Create blobs (one per file). For binary, base64-encode.
  const blobs: Array<{ path: string; sha: string; mode: "100644" }> = [];
  for (const f of files) {
    const isText = /\.(html?|css|js|jsx|ts|tsx|json|md|svg|txt|map)$/i.test(
      f.path,
    );
    const blob = await octokit.request("POST /repos/{owner}/{repo}/git/blobs", {
      owner: ORG,
      repo: repoName,
      content: isText
        ? f.content.toString("utf-8")
        : f.content.toString("base64"),
      encoding: isText ? "utf-8" : "base64",
    });
    blobs.push({ path: f.path, sha: blob.data.sha, mode: "100644" });
  }

  // 5. Create tree from blobs
  const tree = await octokit.request("POST /repos/{owner}/{repo}/git/trees", {
    owner: ORG,
    repo: repoName,
    tree: blobs.map((b) => ({
      path: b.path,
      mode: b.mode,
      type: "blob",
      sha: b.sha,
    })),
  });

  // 6. Create commit pointing at tree. Parent is the auto_init README
  //    commit (if present) so updateRef accepts the fast-forward.
  const commit = await octokit.request(
    "POST /repos/{owner}/{repo}/git/commits",
    {
      owner: ORG,
      repo: repoName,
      message: `chore: bootstrap site from import ${importId}`,
      tree: tree.data.sha,
      parents: parentSha ? [parentSha] : [],
    },
  );

  // 7. Force-update main branch ref to point at our bundle commit. Use
  //    force=true to overwrite the auto_init README (we don't want it).
  if (parentSha) {
    await octokit.request("PATCH /repos/{owner}/{repo}/git/refs/{ref}", {
      owner: ORG,
      repo: repoName,
      ref: `heads/${MAIN_BRANCH}`,
      sha: commit.data.sha,
      force: true,
    });
  } else {
    await octokit.request("POST /repos/{owner}/{repo}/git/refs", {
      owner: ORG,
      repo: repoName,
      ref: `refs/heads/${MAIN_BRANCH}`,
      sha: commit.data.sha,
    });
  }

  // 8. Mirror to production branch (initial state = same as main).
  //    createRef returns 422 if it already exists (e.g. on re-init), in
  //    which case force-update to the new commit.
  try {
    await octokit.request("POST /repos/{owner}/{repo}/git/refs", {
      owner: ORG,
      repo: repoName,
      ref: `refs/heads/${PRODUCTION_BRANCH}`,
      sha: commit.data.sha,
    });
  } catch (err) {
    if ((err as { status?: number }).status === 422) {
      await octokit.request("PATCH /repos/{owner}/{repo}/git/refs/{ref}", {
        owner: ORG,
        repo: repoName,
        ref: `heads/${PRODUCTION_BRANCH}`,
        sha: commit.data.sha,
        force: true,
      });
    } else {
      throw err;
    }
  }

  // 9. Set main as default branch
  try {
    await octokit.request("PATCH /repos/{owner}/{repo}", {
      owner: ORG,
      repo: repoName,
      default_branch: MAIN_BRANCH,
    });
  } catch {
    // Non-fatal if it fails — main is default anyway after first push
  }

  return {
    owner: ORG,
    name: repoName,
    branch: MAIN_BRANCH,
    productionBranch: PRODUCTION_BRANCH,
    lastSha: commit.data.sha,
    initializedAt: new Date().toISOString(),
  };
}
