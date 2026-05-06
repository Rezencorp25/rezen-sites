/**
 * S13 — Wrapper Google Secret Manager API per integrazioni multi-tenant.
 *
 * Naming convention:
 *  - `ws-{workspaceId}-{providerId}`     (workspace-level default)
 *  - `proj-{projectId}-{providerId}`     (project-level override)
 *
 * Il valore di ogni secret è SEMPRE un JSON serializzato dei field provider
 * (anche provider con un solo field), così il consumer fa sempre JSON.parse.
 *
 * Audit log nativo Google Cloud (Secret Manager API logs su Cloud Logging).
 *
 * IAM richiesto sulla service account default delle CF:
 *  - roles/secretmanager.admin sui secret `proj-*` e `ws-*`
 *    (oppure binding al level project con condition resource.name.startsWith).
 */

import { SecretManagerServiceClient } from "@google-cloud/secret-manager";
import { logger } from "firebase-functions";

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
    process.env.FIREBASE_PROJECT_ID;
  if (!id) {
    throw new Error("GCLOUD_PROJECT env not set — cannot resolve Secret Manager parent");
  }
  return id;
}

function parentPath(): string {
  return `projects/${getProjectId()}`;
}

function secretPath(name: string): string {
  return `${parentPath()}/secrets/${name}`;
}

function latestVersionPath(name: string): string {
  return `${secretPath(name)}/versions/latest`;
}

/**
 * Crea il secret "container" se non esiste. Idempotente.
 * Replication: automatic (default; per residency EU specifica vedere TODO sotto).
 *
 * TODO compliance: per residency EU stretta passare a `userManaged` con location
 * `europe-west1`. Default `automatic` replica globalmente. Per ora accettiamo
 * default in linea con apphosting+functions in eu-west.
 */
async function ensureSecretExists(name: string, labels: Record<string, string>): Promise<void> {
  const client = getClient();
  try {
    await client.getSecret({ name: secretPath(name) });
  } catch (err) {
    if (isNotFound(err)) {
      await client.createSecret({
        parent: parentPath(),
        secretId: name,
        secret: {
          replication: { automatic: {} },
          labels,
        },
      });
      logger.info(`Secret ${name} created`);
    } else {
      throw err;
    }
  }
}

function isNotFound(err: unknown): boolean {
  if (typeof err !== "object" || err === null) return false;
  const code = (err as { code?: number }).code;
  return code === 5; // gRPC NOT_FOUND
}

/**
 * Crea o aggiorna (nuova versione) un secret. Le versioni precedenti restano
 * accessibili ma non vengono lette dal `latest` alias.
 *
 * @param name resource id (NON full path)
 * @param value JSON-serialized field map (anche per provider single-field)
 * @param labels metadata indicizzabili (es. `{provider: "anthropic", scope: "workspace"}`)
 * @returns version name (full path della nuova version)
 */
export async function setSecretValue(
  name: string,
  value: string,
  labels: Record<string, string>,
): Promise<string> {
  await ensureSecretExists(name, labels);
  const client = getClient();
  const [version] = await client.addSecretVersion({
    parent: secretPath(name),
    payload: {
      data: Buffer.from(value, "utf8"),
    },
  });
  logger.info(`Secret ${name} version added: ${version.name}`);
  return version.name ?? "";
}

/**
 * Legge il valore latest di un secret. Ritorna null se mancante o disabled.
 */
export async function getSecretValue(name: string): Promise<string | null> {
  const client = getClient();
  try {
    const [response] = await client.accessSecretVersion({
      name: latestVersionPath(name),
    });
    const payload = response.payload?.data;
    if (!payload) return null;
    if (typeof payload === "string") return payload;
    return Buffer.from(payload).toString("utf8");
  } catch (err) {
    if (isNotFound(err)) return null;
    if (isFailedPrecondition(err)) {
      // Disabled / destroyed
      logger.info(`Secret ${name} not accessible (disabled/destroyed)`);
      return null;
    }
    throw err;
  }
}

function isFailedPrecondition(err: unknown): boolean {
  if (typeof err !== "object" || err === null) return false;
  const code = (err as { code?: number }).code;
  return code === 9; // gRPC FAILED_PRECONDITION
}

/**
 * Disabilita TUTTE le versioni del secret. Le richieste di accessSecretVersion
 * fallirono con FAILED_PRECONDITION. Il secret resta nel registry (audit) ma
 * non è più leggibile. Per cancellazione hard, vedi deleteSecret.
 */
export async function disableSecret(name: string): Promise<void> {
  const client = getClient();
  try {
    const iter = client.listSecretVersionsAsync({
      parent: secretPath(name),
    });
    for await (const version of iter) {
      if (version.state === "ENABLED" && version.name) {
        await client.disableSecretVersion({ name: version.name });
      }
    }
    logger.info(`Secret ${name} all versions disabled`);
  } catch (err) {
    if (isNotFound(err)) {
      logger.info(`Secret ${name} not found, nothing to disable`);
      return;
    }
    throw err;
  }
}

/**
 * Esiste e ha almeno una versione attiva?
 */
export async function secretIsActive(name: string): Promise<boolean> {
  const value = await getSecretValue(name);
  return value !== null;
}

/**
 * JSON.parse safe: se il secret value non è JSON valido, ritorna null.
 * Gestisce il caso retro-compat in cui qualcuno avesse scritto plain string.
 */
export function parseSecretJson<T = Record<string, string>>(
  raw: string | null,
): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}
