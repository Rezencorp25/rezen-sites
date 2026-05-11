import "server-only";

import { getInstallationOctokit } from "./app-client";

/**
 * S7.13 — Atomic multi-file commit to a project's GitHub repo. Used by the
 * inline-edit save endpoints (`/file/patch` and `/file/jsx-patch`) to push
 * the edited files alongside the local filesystem write, so the repo stays
 * authoritative even after Cloud Run instances scale down and reset the
 * ephemeral filesystem.
 *
 * Strategy:
 *   1. Read current branch HEAD sha (parent)
 *   2. Create one blob per file (utf-8 for text, base64 for binary)
 *   3. Create a tree based on parent's tree, overriding the modified paths
 *      (base_tree preserves untouched files)
 *   4. Create commit with parent=HEAD, our tree
 *   5. updateRef branch → new commit sha (fast-forward)
 *
 * Returns the new commit sha so the caller can update `project.githubRepo.lastSha`.
 */

export type FileChange = {
  /** Path inside the repo (no leading slash). */
  path: string;
  /** New content. Strings are committed as utf-8, Buffers as base64. */
  content: string | Buffer;
};

const TEXT_EXT_RE = /\.(html?|css|js|jsx|ts|tsx|json|md|svg|txt|map|xml|yml|yaml)$/i;

export async function commitFiles(opts: {
  owner: string;
  repo: string;
  branch: string;
  message: string;
  files: FileChange[];
}): Promise<{ sha: string }> {
  const { owner, repo, branch, message, files } = opts;
  if (files.length === 0) {
    throw new Error("commitFiles: no files");
  }
  const octokit = await getInstallationOctokit();

  // 1. Branch HEAD
  const ref = await octokit.request(
    "GET /repos/{owner}/{repo}/git/ref/{ref}",
    { owner, repo, ref: `heads/${branch}` },
  );
  const parentCommitSha = ref.data.object.sha;

  // Get the tree sha of the parent commit (needed as base_tree)
  const parentCommit = await octokit.request(
    "GET /repos/{owner}/{repo}/git/commits/{commit_sha}",
    { owner, repo, commit_sha: parentCommitSha },
  );
  const baseTreeSha = parentCommit.data.tree.sha;

  // 2. Create blobs in parallel
  const blobShas = await Promise.all(
    files.map(async (f) => {
      const isText =
        typeof f.content === "string" ||
        (f.content instanceof Buffer && TEXT_EXT_RE.test(f.path));
      const content =
        typeof f.content === "string"
          ? f.content
          : isText
            ? f.content.toString("utf-8")
            : f.content.toString("base64");
      const blob = await octokit.request(
        "POST /repos/{owner}/{repo}/git/blobs",
        {
          owner,
          repo,
          content,
          encoding: isText ? "utf-8" : "base64",
        },
      );
      return { path: f.path, sha: blob.data.sha };
    }),
  );

  // 3. Create tree based on parent tree + overridden paths
  const tree = await octokit.request(
    "POST /repos/{owner}/{repo}/git/trees",
    {
      owner,
      repo,
      base_tree: baseTreeSha,
      tree: blobShas.map((b) => ({
        path: b.path,
        mode: "100644" as const,
        type: "blob" as const,
        sha: b.sha,
      })),
    },
  );

  // 4. Create commit
  const commit = await octokit.request(
    "POST /repos/{owner}/{repo}/git/commits",
    {
      owner,
      repo,
      message,
      tree: tree.data.sha,
      parents: [parentCommitSha],
    },
  );

  // 5. Update ref (fast-forward)
  await octokit.request("PATCH /repos/{owner}/{repo}/git/refs/{ref}", {
    owner,
    repo,
    ref: `heads/${branch}`,
    sha: commit.data.sha,
    force: false, // strict fast-forward; concurrent edits → 422 retry
  });

  return { sha: commit.data.sha };
}
