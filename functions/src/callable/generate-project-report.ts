import { onCall, HttpsError } from "firebase-functions/v2/https";
import { logger } from "firebase-functions";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { renderReportPdf } from "../reports/pdf-builder";
import { buildReportPayload, periodFromMonthKey, monthKeyOf } from "../reports/payload-builder";

/**
 * S8: genera un report PDF mensile per un progetto.
 *
 * Input opzionali:
 *  - projectId (obbligatorio)
 *  - monthKey (opzionale, default: mese corrente, formato "YYYY-MM")
 *
 * Flow:
 *  1. Verifica auth
 *  2. Carica payload da Firestore (rank/aeo/geo/aish + branding)
 *  3. Render PDF con react-pdf (~3s)
 *  4. Upload su Storage `gs://<bucket>/reports/{projectId}/{monthKey}.pdf`
 *  5. Genera signed URL (7gg expiry)
 *  6. Scrive doc `projects/{id}/reports/{monthKey}` con metadata
 *  7. Ritorna { url, monthKey, sizeBytes }
 *
 * Idempotente: se il doc esiste già, fa overwrite (utile per regen manuale).
 */
export const generateProjectReport = onCall(
  {
    region: "europe-west1",
    timeoutSeconds: 120,
    memory: "1GiB",
  },
  async (request) => {
    const uid = request.auth?.uid;
    if (!uid) {
      throw new HttpsError("unauthenticated", "Login required");
    }

    const projectId = (request.data?.projectId as string | undefined)?.trim();
    if (!projectId) {
      throw new HttpsError("invalid-argument", "projectId required");
    }

    const monthKey =
      (request.data?.monthKey as string | undefined)?.trim() || monthKeyOf(new Date());
    if (!/^\d{4}-\d{2}$/.test(monthKey)) {
      throw new HttpsError("invalid-argument", "monthKey must be YYYY-MM");
    }

    const db = getFirestore();
    const projectSnap = await db.doc(`projects/${projectId}`).get();
    if (!projectSnap.exists) {
      throw new HttpsError("not-found", "Project not found");
    }

    const period = periodFromMonthKey(monthKey);
    logger.info("generateProjectReport:start", { projectId, monthKey, uid });

    const payload = await buildReportPayload({
      db,
      projectId,
      project: projectSnap.data() ?? {},
      period,
    });

    const buffer = await renderReportPdf(payload);

    const bucket = getStorage().bucket();
    const objectPath = `reports/${projectId}/${monthKey}.pdf`;
    const file = bucket.file(objectPath);
    await file.save(buffer, {
      metadata: {
        contentType: "application/pdf",
        cacheControl: "private, max-age=3600",
        metadata: {
          projectId,
          monthKey,
          generatedBy: uid,
        },
      },
    });

    const expiresAt = Date.now() + 7 * 24 * 3600 * 1000;
    const [signedUrl] = await file.getSignedUrl({
      action: "read",
      expires: expiresAt,
    });

    await db.doc(`projects/${projectId}/reports/${monthKey}`).set(
      {
        monthKey,
        periodStart: period.start,
        periodEnd: period.end,
        url: signedUrl,
        urlExpiresAt: new Date(expiresAt),
        objectPath,
        sizeBytes: buffer.byteLength,
        pageCount: countPagesInPayload(payload),
        status: "ready",
        generatedAt: FieldValue.serverTimestamp(),
        generatedBy: uid,
      },
      { merge: false },
    );

    logger.info("generateProjectReport:done", {
      projectId,
      monthKey,
      sizeBytes: buffer.byteLength,
    });

    return {
      monthKey,
      url: signedUrl,
      sizeBytes: buffer.byteLength,
      urlExpiresAt: expiresAt,
    };
  },
);

function countPagesInPayload(p: Awaited<ReturnType<typeof buildReportPayload>>): number {
  // Cover + ExecSummary + Actions + Footer = 4 fixed
  let n = 4;
  if (p.seo) n++;
  if (p.aeo) n++;
  if (p.geo) n++;
  if (p.aish) n++;
  return n;
}
