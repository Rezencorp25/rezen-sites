import "server-only";

import { SecretManagerServiceClient } from "@google-cloud/secret-manager";
import type { IntegrationProviderId } from "@/lib/integrations/providers";
import { DEFAULT_WORKSPACE_ID, buildSecretName } from "@/lib/integrations/providers";

/**
 * S7.14 sub-A — Next.js-side Secret Manager reader.
 *
 * Mirror runtime di functions/src/integrations/secret-manager.ts: la versione
 * Cloud Functions resta SOT per scrittura (setIntegration callable). Qui
 * leggiamo solo, per servire flow on-demand UI (es. "lista domini GoDaddy"
 * cliccato dall'utente nel modal "Collega dominio").
 *
 * Resolution rule:
 *   1. Se opts.projectId → cerca `proj-{projectId}-{provider}` (override)
 *   2. Fallback su `ws-{workspaceId}-{provider}` (workspace default)
 *
 * Auth in Cloud Run: usa Application Default Credentials → service account
 * del backend `rezen-sites-preview` che ha già `secretmanager.secretAccessor`
 * dato da S13.1 deploy.
 */

let cachedClient: SecretManagerServiceClient | null = null;

function getClient(): SecretManagerServiceClient {
  if (!cachedClient) {
    cachedClient = new SecretManagerServiceClient();
  }
  return cachedClient;
}

function getProjectId(): string {
  const id =
    process.env.GCLOUD_PROJECT ??
    process.env.GCP_PROJECT ??
    process.env.GOOGLE_CLOUD_PROJECT ??
    process.env.FIREBASE_PROJECT_ID ??
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!id) {
    throw new Error(
      "Cannot resolve GCP project id — set GCLOUD_PROJECT or FIREBASE_PROJECT_ID",
    );
  }
  return id;
}

function latestVersionPath(name: string): string {
  return `projects/${getProjectId()}/secrets/${name}/versions/latest`;
}

async function readSecret(name: string): Promise<string | null> {
  try {
    const [resp] = await getClient().accessSecretVersion({
      name: latestVersionPath(name),
    });
    const data = resp.payload?.data;
    if (!data) return null;
    return typeof data === "string" ? data : Buffer.from(data).toString("utf8");
  } catch (err) {
    const code = (err as { code?: number }).code;
    if (code === 5) return null; // NOT_FOUND
    if (code === 9) return null; // FAILED_PRECONDITION (disabled)
    throw err;
  }
}

export type ResolvedSecret<T = Record<string, string>> = {
  fields: T;
  source: "project" | "workspace";
  scopeId: string;
};

/**
 * Risolve i field di un provider con override-then-default. Ritorna null se
 * non c'è nessuna integrazione configurata.
 */
export async function resolveProviderSecret<
  T = Record<string, string>,
>(opts: {
  provider: IntegrationProviderId;
  projectId?: string;
  workspaceId?: string;
}): Promise<ResolvedSecret<T> | null> {
  if (opts.projectId) {
    const projSecretName = buildSecretName({
      scope: "project",
      scopeId: opts.projectId,
      provider: opts.provider,
    });
    const projRaw = await readSecret(projSecretName);
    if (projRaw) {
      const parsed = safeParse<T>(projRaw);
      if (parsed) {
        return { fields: parsed, source: "project", scopeId: opts.projectId };
      }
    }
  }
  const wsId = opts.workspaceId ?? DEFAULT_WORKSPACE_ID;
  const wsSecretName = buildSecretName({
    scope: "workspace",
    scopeId: wsId,
    provider: opts.provider,
  });
  const wsRaw = await readSecret(wsSecretName);
  if (!wsRaw) return null;
  const parsed = safeParse<T>(wsRaw);
  if (!parsed) return null;
  return { fields: parsed, source: "workspace", scopeId: wsId };
}

function safeParse<T>(raw: string): T | null {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}
