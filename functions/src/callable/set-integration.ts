import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getFirestore, FieldValue, Timestamp } from "firebase-admin/firestore";
import { logger } from "firebase-functions";
import { setSecretValue } from "../integrations/secret-manager";
import { runProviderTest } from "../integrations/provider-tests";
import { checkRateLimit } from "../utils/rate-limit";

/**
 * S13 — Set integration credentials.
 *
 * Flusso:
 *  1. Auth required (anche admin per workspace scope)
 *  2. Validate input (provider + scope + fields + scopeId)
 *  3. Live test connection con i field forniti
 *  4. Se OK:
 *     a. Scrivi value in Secret Manager (`ws-{wsId}-{prov}` o `proj-{pid}-{prov}`)
 *     b. Aggiorna Firestore metadata (`workspaces/{wsId}/integrations/{prov}`
 *        oppure `projects/{pid}.integrations.apiOverrides.{prov}`)
 *  5. Ritorna `{ok, last4}` (mai il valore)
 *
 * Se test fallisce → ritorna `{ok: false, error}`, no scrittura.
 *
 * Security:
 *  - In multi-workspace future: verificare che user.uid abbia ruolo in workspaceId
 *  - Per ora workspace="default" è singleton, basta isSignedIn
 *  - Per project scope: verificare che user abbia accesso al projectId
 *    (oggi rules aperte; quando RBAC stretto sarà pronto, check membership)
 */
export const setIntegration = onCall(
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

    // S15: Rate limit 10 set/h per UID per evitare brute-force test connection
    const rl = await checkRateLimit({
      key: `integrations:set:${uid}`,
      limit: 10,
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
      fields?: Record<string, string>;
      last4?: string;
    };
    const provider = data.provider;
    const scope = data.scope;
    const scopeId = data.scopeId;
    const fields = data.fields;
    const last4 = data.last4 ?? "";

    if (!provider || !scope || !scopeId || !fields) {
      throw new HttpsError(
        "invalid-argument",
        "Missing provider, scope, scopeId, or fields.",
      );
    }
    if (scope !== "workspace" && scope !== "project") {
      throw new HttpsError("invalid-argument", "Invalid scope.");
    }

    // Test connection live (mai ritorna i field, solo ok/error)
    const testResult = await runProviderTest(provider, fields);
    if (!testResult.ok) {
      logger.info(
        `setIntegration: test failed ${provider}/${scope}/${scopeId} — ${testResult.error}`,
      );
      return { ok: false, error: testResult.error };
    }

    // Persist secret
    const secretName =
      scope === "workspace"
        ? `ws-${scopeId}-${provider}`
        : `proj-${scopeId}-${provider}`;
    try {
      await setSecretValue(secretName, JSON.stringify(fields), {
        provider,
        scope,
        scope_id: scopeId,
        configured_by: uid,
      });
    } catch (err) {
      logger.error(`setIntegration: secret write failed ${secretName}`, err);
      throw new HttpsError("internal", "Secret Manager write failed.");
    }

    // Persist metadata Firestore
    const db = getFirestore();
    const now = Timestamp.now();
    const metadata = {
      provider,
      last4,
      status: "active" as const,
      verifiedAt: now,
      updatedAt: now,
      configuredBy: uid,
      lastError: FieldValue.delete(),
    };

    try {
      if (scope === "workspace") {
        await db
          .doc(`workspaces/${scopeId}/integrations/${provider}`)
          .set(metadata, { merge: true });
      } else {
        await db.doc(`projects/${scopeId}`).set(
          {
            integrations: {
              apiOverrides: {
                [provider]: {
                  useOverride: true,
                  metadata,
                },
              },
            },
            updatedAt: now,
          },
          { merge: true },
        );
      }
    } catch (err) {
      logger.error(`setIntegration: firestore metadata failed`, err);
      // Note: secret è stato scritto; metadata fallito → sistema in stato
      // inconsistente. Caller può ritentare (idempotente lato Secret Manager
      // grazie a versions, e idempotente lato Firestore grazie al merge).
      throw new HttpsError("internal", "Metadata write failed.");
    }

    logger.info(
      `setIntegration: ${provider}/${scope}/${scopeId} configured by ${uid}`,
    );
    return { ok: true, last4 };
  },
);
