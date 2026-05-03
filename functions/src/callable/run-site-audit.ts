import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { runPsiAudit } from "../audit/psi-client";
import { computeHealthScore } from "../audit/psi-types";
import { PSI_API_KEY } from "../utils/secrets";
import { writeAudit } from "../utils/audit-log";
import { checkRateLimit } from "../utils/rate-limit";

/**
 * Esegue un audit Lighthouse-via-PSI per un progetto e persiste il risultato
 * in `projects/{projectId}/audits/{auditId}` (immutable da Firestore rules).
 *
 * Sicurezza:
 * - Auth obbligatoria
 * - Rate-limit 10 audit/h per projectId (riusa rate-limiter S0)
 * - Audit log immutabile
 *
 * Funziona in stub-mode finché PSI_API_KEY non è settata in Secret Manager
 * — pattern speculare al DataForSEO wrapper.
 */
export const runSiteAudit = onCall(
  {
    region: "europe-west1",
    secrets: [PSI_API_KEY],
    timeoutSeconds: 90,
    memory: "512MiB",
  },
  async (request) => {
    const uid = request.auth?.uid;
    if (!uid) {
      throw new HttpsError("unauthenticated", "Login required.");
    }

    const data = (request.data ?? {}) as {
      projectId?: string;
      url?: string;
      strategy?: "mobile" | "desktop";
    };
    if (!data.projectId || !data.url) {
      throw new HttpsError(
        "invalid-argument",
        "projectId and url are required.",
      );
    }
    try {
      new URL(data.url);
    } catch {
      throw new HttpsError("invalid-argument", "Invalid URL.");
    }

    const rl = await checkRateLimit({
      key: `site-audit:${data.projectId}`,
      limit: 10,
      windowSeconds: 3600,
    });
    if (!rl.allowed) {
      throw new HttpsError(
        "resource-exhausted",
        `Rate limit reached. Reset at ${rl.resetAt.toISOString()}.`,
      );
    }

    let apiKey: string | undefined;
    try {
      apiKey = PSI_API_KEY.value();
    } catch {
      apiKey = undefined;
    }

    const result = await runPsiAudit({
      url: data.url,
      strategy: data.strategy ?? "mobile",
      apiKey,
    });
    const healthScore = computeHealthScore(result.scores);

    const db = getFirestore();
    const auditRef = await db
      .collection(`projects/${data.projectId}/audits`)
      .add({
        ...result,
        healthScore,
        createdAt: FieldValue.serverTimestamp(),
        triggeredBy: uid,
      });

    await writeAudit({
      collectionPath: `projects/${data.projectId}/audits/${auditRef.id}/_audit`,
      actorUid: uid,
      action: "site_audit.executed",
      description: `Audit ${result.strategy} su ${result.url} (${result.source})`,
      metadata: {
        healthScore,
        durationMs: result.durationMs,
        opportunities: result.opportunities.length,
      },
    });

    return {
      auditId: auditRef.id,
      healthScore,
      ...result,
    };
  },
);
