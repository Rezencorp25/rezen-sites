import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getFirestore, FieldValue, Timestamp } from "firebase-admin/firestore";
import { logger } from "firebase-functions";
import {
  getSecretValue,
  parseSecretJson,
} from "../integrations/secret-manager";
import { runProviderTest } from "../integrations/provider-tests";
import { checkRateLimit } from "../utils/rate-limit";

/**
 * S13 — Re-test connection di un'integrazione esistente.
 *
 * Legge il secret corrente, esegue test live, aggiorna metadata Firestore
 * con verifiedAt aggiornato (se ok) o lastError (se fallisce).
 *
 * Non muta il secret value.
 */
export const testIntegration = onCall(
  {
    region: "europe-west1",
    timeoutSeconds: 30,
    memory: "256MiB",
    enforceAppCheck: false, // S15: enable post App Check enforcement Console toggle
  },
  async (request) => {
    const uid = request.auth?.uid;
    if (!uid) {
      throw new HttpsError("unauthenticated", "Login required.");
    }

    // S15: Rate limit 30 test/h per UID (più alto del set perché verify-only)
    const rl = await checkRateLimit({
      key: `integrations:test:${uid}`,
      limit: 30,
      windowSeconds: 3600,
    });
    if (!rl.allowed) {
      throw new HttpsError(
        "resource-exhausted",
        `Troppe richieste. Riprova dopo ${rl.resetAt.toISOString()}.`,
      );
    }

    const data = (request.data ?? {}) as {
      provider?: string;
      scope?: "workspace" | "project";
      scopeId?: string;
    };
    const { provider, scope, scopeId } = data;
    if (!provider || !scope || !scopeId) {
      throw new HttpsError(
        "invalid-argument",
        "Missing provider, scope, or scopeId.",
      );
    }

    const secretName =
      scope === "workspace"
        ? `ws-${scopeId}-${provider}`
        : `proj-${scopeId}-${provider}`;
    const raw = await getSecretValue(secretName);
    const fields = parseSecretJson<Record<string, string>>(raw);
    if (!fields) {
      return {
        ok: false,
        error: "Secret non trovato o corrotto. Riconfigura l'integrazione.",
      };
    }

    const result = await runProviderTest(provider, fields);
    const db = getFirestore();
    const now = Timestamp.now();

    try {
      if (scope === "workspace") {
        await db
          .doc(`workspaces/${scopeId}/integrations/${provider}`)
          .set(
            result.ok
              ? {
                  status: "active",
                  verifiedAt: now,
                  updatedAt: now,
                  lastError: FieldValue.delete(),
                }
              : {
                  status: "error",
                  lastError: result.error,
                  updatedAt: now,
                },
            { merge: true },
          );
      } else {
        const path = `integrations.apiOverrides.${provider}.metadata`;
        const update: Record<string, unknown> = result.ok
          ? {
              [`${path}.status`]: "active",
              [`${path}.verifiedAt`]: now,
              [`${path}.updatedAt`]: now,
              [`${path}.lastError`]: FieldValue.delete(),
            }
          : {
              [`${path}.status`]: "error",
              [`${path}.lastError`]: result.error,
              [`${path}.updatedAt`]: now,
            };
        await db.doc(`projects/${scopeId}`).update(update);
      }
    } catch (err) {
      logger.warn(`testIntegration: metadata update failed`, err);
    }

    return result;
  },
);
