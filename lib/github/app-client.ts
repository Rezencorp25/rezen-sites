import "server-only";

import { App } from "@octokit/app";
import { Octokit } from "@octokit/rest";

/**
 * S7.13 — GitHub App authentication.
 *
 * We use a GitHub App (not a PAT) so commits land under the rezen-sites-bot
 * identity, support per-installation scoping, and let us rotate the private
 * key without touching user accounts.
 *
 * Three secrets required (configured as Firebase Secrets in App Hosting):
 *   GITHUB_APP_ID            — app numeric id from github.com/.../apps
 *   GITHUB_APP_PRIVATE_KEY   — full PEM content (multi-line, starts with
 *                              -----BEGIN RSA PRIVATE KEY-----)
 *   GITHUB_INSTALLATION_ID   — installation id after the app was installed
 *                              on the Rezencorp26 org (the URL ends with
 *                              /installations/{ID})
 *
 * All callers must run in Node.js runtime (not edge) because the JWT signing
 * needs Node crypto.
 */

function readEnv(name: string): string {
  const v = process.env[name];
  if (!v) {
    throw new Error(
      `[github/app-client] missing env ${name}. Set as Firebase Secret + bind to App Hosting backend.`,
    );
  }
  return v;
}

let cachedInstallationOctokit: { octokit: Octokit; expiresAt: number } | null = null;

/**
 * Returns an authenticated Octokit client scoped to the installation on the
 * Rezencorp26 org. Installation tokens last ~1h; we cache and refresh on
 * demand. Single installation singleton — multi-tenant support would key
 * the cache by installationId.
 */
export async function getInstallationOctokit(): Promise<Octokit> {
  const now = Date.now();
  if (
    cachedInstallationOctokit &&
    cachedInstallationOctokit.expiresAt > now + 60_000 // 60s leeway
  ) {
    return cachedInstallationOctokit.octokit;
  }

  const appId = Number(readEnv("GITHUB_APP_ID"));
  const privateKey = readEnv("GITHUB_APP_PRIVATE_KEY")
    // Firebase Secret Manager preserves newlines but some tools encode them
    // as literal "\n" on env injection. Normalize either way.
    .replace(/\\n/g, "\n");
  const installationId = Number(readEnv("GITHUB_INSTALLATION_ID"));

  const app = new App({ appId, privateKey });
  const octokit = await app.getInstallationOctokit(installationId);

  // Installation tokens last 1h. Cache for ~50min.
  cachedInstallationOctokit = {
    octokit: octokit as unknown as Octokit,
    expiresAt: now + 50 * 60_000,
  };
  return octokit as unknown as Octokit;
}

/**
 * Convenience: tests the GitHub App auth by hitting /app endpoint.
 * Returns { ok, appName, error? } for diagnostic UI.
 */
export async function pingGithubApp(): Promise<{
  ok: boolean;
  appName?: string;
  installationLogin?: string;
  error?: string;
}> {
  try {
    const octokit = await getInstallationOctokit();
    // /installation/repositories works with installation tokens, /app does not
    const repos = await octokit.request("GET /installation/repositories", {
      per_page: 1,
    });
    return {
      ok: true,
      appName: "rezen-sites-bot",
      installationLogin:
        repos.data.repositories?.[0]?.owner?.login ?? "(no repos yet)",
    };
  } catch (err) {
    return {
      ok: false,
      error: (err as Error).message,
    };
  }
}
