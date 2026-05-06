/**
 * S13 — Secret resolver per CF schedulate.
 *
 * Risolve quale secret leggere per un dato project+provider, applicando la
 * logica workspace+override:
 *  1. Leggi `projects/{projectId}` da Firestore
 *  2. Se `integrations.apiOverrides.{provider}.useOverride === true` →
 *     `proj-{projectId}-{provider}`
 *  3. Altrimenti `ws-{workspaceId}-{provider}` (workspaceId = "default" se assente)
 *
 * Output: parsed field map (es. `{apiKey: "sk-..."}`) o null se non
 * configurato. Mai logga il valore.
 */

import { getFirestore } from "firebase-admin/firestore";
import { logger } from "firebase-functions";
import {
  getSecretValue,
  parseSecretJson,
} from "./secret-manager";

const DEFAULT_WORKSPACE_ID = "default";

export type ResolvedSecret = {
  scope: "workspace" | "project";
  scopeId: string;
  fields: Record<string, string>;
};

export async function resolveProjectSecret(
  projectId: string,
  provider: string,
): Promise<ResolvedSecret | null> {
  const db = getFirestore();
  const projectSnap = await db.doc(`projects/${projectId}`).get();
  if (!projectSnap.exists) {
    logger.warn(`resolveProjectSecret: project ${projectId} not found`);
    return null;
  }

  const project = projectSnap.data() ?? {};
  const overrides =
    (project.integrations?.apiOverrides ?? {}) as Record<
      string,
      { useOverride?: boolean }
    >;
  const useOverride = overrides[provider]?.useOverride === true;

  if (useOverride) {
    const name = `proj-${projectId}-${provider}`;
    const raw = await getSecretValue(name);
    const fields = parseSecretJson<Record<string, string>>(raw);
    if (!fields) {
      logger.warn(
        `resolveProjectSecret: override flag true but secret ${name} missing/invalid`,
      );
      return null;
    }
    return { scope: "project", scopeId: projectId, fields };
  }

  const workspaceId = project.workspaceId ?? DEFAULT_WORKSPACE_ID;
  const name = `ws-${workspaceId}-${provider}`;
  const raw = await getSecretValue(name);
  const fields = parseSecretJson<Record<string, string>>(raw);
  if (!fields) return null;
  return { scope: "workspace", scopeId: workspaceId, fields };
}

/**
 * Helper "live mode attivo per questo provider su questo project?"
 * Ritorna true se esiste un secret valido (workspace o override).
 */
export async function isProviderLive(
  projectId: string,
  provider: string,
): Promise<boolean> {
  const resolved = await resolveProjectSecret(projectId, provider);
  return resolved !== null;
}

/**
 * Logga la lista provider con secret configurato per un dato project.
 * Usato da CF schedulate per audit + readiness check pre live-mode.
 *
 * Non logga MAI valori — solo presenza + scope.
 */
export async function logActiveProviders(
  projectId: string,
  providers: string[],
  ctx: string,
): Promise<{ provider: string; scope: "workspace" | "project" }[]> {
  const active: { provider: string; scope: "workspace" | "project" }[] = [];
  for (const p of providers) {
    const r = await resolveProjectSecret(projectId, p);
    if (r) active.push({ provider: p, scope: r.scope });
  }
  if (active.length > 0) {
    logger.info(`${ctx}:liveSecretsAvailable`, { projectId, active });
  }
  return active;
}
