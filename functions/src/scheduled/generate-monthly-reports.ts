import { onSchedule } from "firebase-functions/scheduler";
import { logger } from "firebase-functions";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { renderReportPdf } from "../reports/pdf-builder";
import {
  buildReportPayload,
  monthKeyOf,
  periodFromMonthKey,
} from "../reports/payload-builder";

/**
 * S8: scheduler mensile per generare i report PDF di tutti i progetti
 * `seoTracking.enabled === true`. Schedule: 1° del mese alle 09:00 Europe/Rome.
 *
 * Genera per il MESE PRECEDENTE (es. il 1 maggio genera Aprile).
 * Idempotente: se il doc `projects/{id}/reports/{monthKey}` già esiste, salta.
 *
 * Memory 1GiB perché react-pdf può essere pesante con tabelle e font embedded.
 */
export const generateMonthlyReports = onSchedule(
  {
    schedule: "0 9 1 * *",
    timeZone: "Europe/Rome",
    region: "europe-west1",
    timeoutSeconds: 540,
    memory: "1GiB",
  },
  async () => {
    const db = getFirestore();
    const cfg = await db.doc("_config/features").get();
    const enabled =
      cfg.exists && (cfg.get("monthly_reports") as boolean | undefined) === true;
    if (!enabled) {
      logger.info("generateMonthlyReports:skipped", {
        reason: "feature flag _config/features.monthly_reports is OFF",
      });
      return;
    }

    // Genera per il mese precedente.
    const now = new Date();
    const prev = new Date(Date.UTC(now.getFullYear(), now.getMonth() - 1, 1));
    const monthKey = monthKeyOf(prev);
    const period = periodFromMonthKey(monthKey);

    const projects = await db
      .collection("projects")
      .where("seoTracking.enabled", "==", true)
      .get();
    logger.info("generateMonthlyReports:start", {
      monthKey,
      projectCount: projects.size,
    });

    const bucket = getStorage().bucket();
    let ok = 0;
    let skipped = 0;
    let errs = 0;

    for (const projectDoc of projects.docs) {
      const projectId = projectDoc.id;
      try {
        // Idempotency check
        const existing = await db
          .doc(`projects/${projectId}/reports/${monthKey}`)
          .get();
        if (existing.exists) {
          logger.info("generateMonthlyReports:skip:exists", {
            projectId,
            monthKey,
          });
          skipped++;
          continue;
        }

        const payload = await buildReportPayload({
          db,
          projectId,
          project: projectDoc.data(),
          period,
        });
        const buffer = await renderReportPdf(payload);

        const objectPath = `reports/${projectId}/${monthKey}.pdf`;
        const file = bucket.file(objectPath);
        await file.save(buffer, {
          metadata: {
            contentType: "application/pdf",
            cacheControl: "private, max-age=3600",
            metadata: { projectId, monthKey, generatedBy: "scheduler" },
          },
        });

        const expiresAt = Date.now() + 30 * 24 * 3600 * 1000; // 30gg per scheduled
        const [signedUrl] = await file.getSignedUrl({
          action: "read",
          expires: expiresAt,
        });

        await db.doc(`projects/${projectId}/reports/${monthKey}`).set({
          monthKey,
          periodStart: period.start,
          periodEnd: period.end,
          url: signedUrl,
          urlExpiresAt: new Date(expiresAt),
          objectPath,
          sizeBytes: buffer.byteLength,
          status: "ready",
          generatedAt: FieldValue.serverTimestamp(),
          generatedBy: "scheduler",
        });
        ok++;
      } catch (err) {
        errs++;
        logger.error("generateMonthlyReports:projectError", {
          projectId,
          monthKey,
          error: (err as Error).message,
        });
      }
    }

    logger.info("generateMonthlyReports:done", {
      monthKey,
      ok,
      skipped,
      errors: errs,
    });
  },
);
