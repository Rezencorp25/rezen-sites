import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { logger } from "firebase-functions";
import { disableSecret } from "../integrations/secret-manager";
import { checkRateLimit } from "../utils/rate-limit";

/**
 * S13 — Revoca integrazione: disabilita versions Secret Manager + segna
 * status="revoked" in Firestore. Se workspace: rimane il doc per audit.
 * Se project override: useOverride=false e metadata mantenuta come storia.
 */
export const revokeIntegration = onCall(
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

    // S15: Rate limit 10 revoke/h per UID
    const rl = await checkRateLimit({
      key: `integrations:revoke:${uid}`,
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

    try {
      await disableSecret(secretName);
    } catch (err) {
      logger.error(`revokeIntegration: disable secret failed ${secretName}`, err);
      throw new HttpsError("internal", "Secret revoke failed.");
    }

    const db = getFirestore();
    const now = Timestamp.now();
    try {
      if (scope === "workspace") {
        await db.doc(`workspaces/${scopeId}/integrations/${provider}`).set(
          {
            status: "revoked",
            updatedAt: now,
            revokedBy: uid,
          },
          { merge: true },
        );
      } else {
        await db.doc(`projects/${scopeId}`).update({
          [`integrations.apiOverrides.${provider}.useOverride`]: false,
          [`integrations.apiOverrides.${provider}.metadata.status`]: "revoked",
          [`integrations.apiOverrides.${provider}.metadata.updatedAt`]: now,
          updatedAt: now,
        });
      }
    } catch (err) {
      logger.warn(`revokeIntegration: metadata update failed`, err);
    }

    logger.info(`revokeIntegration: ${provider}/${scope}/${scopeId} by ${uid}`);
    return { ok: true };
  },
);
