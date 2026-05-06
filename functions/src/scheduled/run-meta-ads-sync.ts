import { onSchedule } from "firebase-functions/scheduler";
import { logger } from "firebase-functions";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { logActiveProviders } from "../integrations/resolve-secret";

/**
 * Meta Ads daily sync (S9) — scheduled DAILY 06:00 Europe/Rome.
 *
 * Sync giornaliero campagne Meta Ads via Marketing API (graph.facebook.com).
 * Stub-mode di default; live mode richiede:
 *  - `_config/features.meta_ads = true` (gate flag)
 *  - `_config/features.meta_ads_live = true` (live flag)
 *  - Per progetto: integrations.metaAds.{businessAccountId, adAccountId, accessToken}
 *  - Secret `META_SYSTEM_USER_TOKEN` (Firebase Secrets Manager)
 *
 * Costo stimato: ~50-200 API calls/cliente/giorno (insights endpoint paginato).
 * Free tier Meta Marketing API è generoso (200 req/h per app), no upfront cost.
 *
 * Output Firestore: `meta_snapshots/{YYYY-MM-DD}__{projectId}` con totals + campaigns.
 *
 * NOTE: questa è la skeleton CF. Live mode da implementare in S5.3-bis insieme
 * a DataForSEO + multi-LLM activation. Oggi log "stub" e skip.
 */

type MetaSyncProject = {
  projectId: string;
  domain: string;
  metaAds?: {
    businessAccountId: string;
    adAccountId: string;
  };
};

export const runMetaAdsSync = onSchedule(
  {
    schedule: "0 6 * * *",
    timeZone: "Europe/Rome",
    region: "europe-west1",
    memory: "512MiB",
    timeoutSeconds: 540,
  },
  async () => {
    const db = getFirestore();

    // Dual flag check
    const cfg = await db.doc("_config/features").get();
    const features = cfg.data() ?? {};
    if (!features.meta_ads) {
      logger.info("meta_ads gate flag OFF — skipping");
      return;
    }

    const isLive = features.meta_ads_live === true;
    logger.info(`Meta Ads sync starting (mode: ${isLive ? "live" : "stub"})`);

    // Fetch projects con integration metaAds configurata (live mode) o tutti (stub)
    const projectsSnap = await db.collection("projects").get();
    const projects: MetaSyncProject[] = projectsSnap.docs
      .map((d) => {
        const data = d.data();
        return {
          projectId: d.id,
          domain: data.domain ?? "",
          metaAds: data.integrations?.metaAds,
        };
      })
      .filter((p) => p.domain);

    if (projects.length === 0) {
      logger.warn("No projects to sync");
      return;
    }

    const today = new Date().toISOString().slice(0, 10);
    let processed = 0;
    let skipped = 0;

    for (const project of projects) {
      // S13: log chiavi Meta + AdSense configurate via UI Self-Service.
      // Pronto per attivare live mode S13.2 (Meta Marketing API + AdSense API).
      await logActiveProviders(
        project.projectId,
        ["meta", "adsense"],
        "runMetaAdsSync",
      );

      try {
        if (isLive) {
          if (!project.metaAds?.businessAccountId || !project.metaAds?.adAccountId) {
            logger.info(`${project.projectId}: meta_ads not configured, skip`);
            skipped++;
            continue;
          }
          // TODO live: fetch da Meta Marketing API
          // const insights = await fetchMetaInsights({
          //   adAccountId: project.metaAds.adAccountId,
          //   accessToken: process.env.META_SYSTEM_USER_TOKEN,
          //   datePreset: "last_30d",
          // });
          // await writeSnapshot(db, project.projectId, today, insights, "meta-api");
          logger.warn(`${project.projectId}: live mode TODO — skipping`);
          skipped++;
        } else {
          // Stub mode: scrive un placeholder doc per smoke test
          await writeSnapshot(db, project.projectId, today, null, "stub");
          processed++;
        }
      } catch (err) {
        logger.error(`Error syncing ${project.projectId}`, err);
      }
    }

    logger.info(`Meta Ads sync complete: processed=${processed}, skipped=${skipped}`);
  },
);

async function writeSnapshot(
  db: FirebaseFirestore.Firestore,
  projectId: string,
  date: string,
  insights: unknown,
  source: "stub" | "meta-api",
): Promise<void> {
  await db.doc(`meta_snapshots/${date}__${projectId}`).set(
    {
      projectId,
      date,
      source,
      insights: insights ?? { _stub: true },
      createdAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
}
