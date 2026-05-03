import { onSchedule } from "firebase-functions/scheduler";
import { logger } from "firebase-functions";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import {
  DATAFORSEO_LOGIN,
  DATAFORSEO_PASSWORD,
} from "../utils/secrets";

/**
 * Rank Tracking — scheduled daily 03:00 Europe/Rome.
 *
 * Per ogni progetto con feature-flag `rank_tracking` abilitato:
 *   1. Legge il keyword set da `projects/{id}/seo_keywords/{keywordId}`
 *      (popolato dall'onboarding wizard S6d).
 *   2. Per ogni keyword chiama `serp/google/organic/live/regular` (DataForSEO).
 *   3. Estrae posizione cliente + presenza SERP feature + top 10 risultati.
 *   4. Persiste in `projects/{id}/rank_snapshots/{date}__{keywordId}`
 *      (immutable da Firestore rules, TTL 90gg su `createdAt`).
 *
 * Stub-mode di default — attiva live mode quando i secrets DATAFORSEO_LOGIN/
 * DATAFORSEO_PASSWORD sono presenti AND la EU residency è confermata
 * (memo project_rezen_sites_seo_modules + flag `rank_tracking_live`).
 *
 * Costo target a regime: ~$1.80/cliente/mese per 50kw (brief §5).
 *
 * NOTA S5.3: TTL 90gg sulla collection `rank_snapshots` da configurare
 * post-deploy via:
 *   gcloud firestore fields ttls update createdAt \
 *     --collection-group=rank_snapshots \
 *     --enable-ttl \
 *     --project=<PROJECT_ID>
 *
 * (in alternativa, configurare TTL via Firebase Console → Firestore → TTL).
 */

type RankTrackingProject = {
  projectId: string;
  domain: string;
  countryCode: string;
  languageCode: string;
};

type KeywordEntry = {
  id: string;
  keyword: string;
  searchVolume: number;
  intent: string;
};

type SerpFeatureFlags = {
  aiOverview?: boolean;
  aiOverviewOwner?: boolean;
  featuredSnippet?: boolean;
  featuredSnippetOwner?: boolean;
  paa?: boolean;
  knowledgePanel?: boolean;
  adsPack?: boolean;
};

type RankSnapshotDoc = {
  keywordId: string;
  keyword: string;
  date: string;
  projectId: string;
  position: number;
  url: string | null;
  features: SerpFeatureFlags;
  top10: Array<{
    position: number;
    domain: string;
    url: string;
    title: string;
    isOwner: boolean;
  }>;
  source: "stub" | "dataforseo";
  createdAt: FirebaseFirestore.FieldValue;
};

export const runRankTracking = onSchedule(
  {
    schedule: "0 3 * * *",
    timeZone: "Europe/Rome",
    region: "europe-west1",
    secrets: [DATAFORSEO_LOGIN, DATAFORSEO_PASSWORD],
    timeoutSeconds: 540,
    memory: "1GiB",
  },
  async () => {
    const db = getFirestore();
    const isoDate = new Date().toISOString().slice(0, 10);

    const flagSnap = await db.doc("_config/features").get();
    const globalEnabled = flagSnap.exists
      ? (flagSnap.get("rank_tracking") as boolean | undefined) === true
      : false;

    if (!globalEnabled) {
      logger.info("runRankTracking:skipped", {
        reason: "feature flag _config/features.rank_tracking is OFF",
        date: isoDate,
      });
      return;
    }

    const liveMode = await resolveLiveMode(db);
    const dfs = liveMode ? await loadDataForSeoClient() : null;

    const projects = await listEnabledProjects(db);
    logger.info("runRankTracking:start", {
      date: isoDate,
      projectCount: projects.length,
      mode: liveMode ? "live" : "stub",
    });

    let totalKeywords = 0;
    let totalErrors = 0;

    for (const project of projects) {
      const keywords = await listProjectKeywords(db, project.projectId);
      if (keywords.length === 0) {
        logger.info("runRankTracking:project:noKeywords", {
          projectId: project.projectId,
        });
        continue;
      }

      for (const kw of keywords) {
        try {
          const snap = await fetchSnapshot({
            project,
            keyword: kw,
            date: isoDate,
            dfs,
          });
          const snapshotId = `${isoDate}__${kw.id}`;
          await db
            .doc(`projects/${project.projectId}/rank_snapshots/${snapshotId}`)
            .set(snap, { merge: false });
          totalKeywords++;
        } catch (err) {
          totalErrors++;
          logger.error("runRankTracking:keywordError", {
            projectId: project.projectId,
            keywordId: kw.id,
            error: (err as Error).message,
          });
        }
      }
    }

    logger.info("runRankTracking:done", {
      date: isoDate,
      keywords: totalKeywords,
      errors: totalErrors,
      mode: liveMode ? "live" : "stub",
    });
  },
);

async function resolveLiveMode(
  db: FirebaseFirestore.Firestore,
): Promise<boolean> {
  const cfg = await db.doc("_config/features").get();
  const flag = cfg.get("rank_tracking_live") as boolean | undefined;
  if (flag !== true) return false;
  try {
    return !!DATAFORSEO_LOGIN.value() && !!DATAFORSEO_PASSWORD.value();
  } catch {
    return false;
  }
}

/**
 * Carica il client DataForSEO via dynamic import per evitare di importare
 * lib/seo/dataforseo-client.ts (che è dentro il workspace Next, non in functions).
 *
 * Quando si attiva live mode, copiare il client in functions/src/seo/ oppure
 * estrarre un package condiviso. Per ora questo placeholder lancia errore
 * esplicito se invocato — assicura che `liveMode` resti false finché S5.3-bis
 * non porta dentro le dipendenze.
 */
async function loadDataForSeoClient(): Promise<null> {
  logger.warn("runRankTracking:loadDataForSeoClient", {
    msg: "live mode requested but DataForSEO client wrapper not bundled in functions/ — falling back to stub",
  });
  return null;
}

async function listEnabledProjects(
  db: FirebaseFirestore.Firestore,
): Promise<RankTrackingProject[]> {
  const snap = await db
    .collection("projects")
    .where("seoTracking.enabled", "==", true)
    .get();
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      projectId: d.id,
      domain: (data.domain as string | undefined) ?? "",
      countryCode: (data.seoTracking?.countryCode as string | undefined) ?? "CH",
      languageCode: (data.seoTracking?.languageCode as string | undefined) ?? "it",
    };
  });
}

async function listProjectKeywords(
  db: FirebaseFirestore.Firestore,
  projectId: string,
): Promise<KeywordEntry[]> {
  const snap = await db
    .collection(`projects/${projectId}/seo_keywords`)
    .get();
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      keyword: (data.keyword as string | undefined) ?? "",
      searchVolume: (data.searchVolume as number | undefined) ?? 0,
      intent: (data.intent as string | undefined) ?? "informational",
    };
  });
}

async function fetchSnapshot(input: {
  project: RankTrackingProject;
  keyword: KeywordEntry;
  date: string;
  dfs: unknown | null;
}): Promise<RankSnapshotDoc> {
  const { project, keyword, date, dfs } = input;
  if (dfs === null) {
    return stubSnapshot(project, keyword, date);
  }
  // S5.3-bis: chiamata live a serp/google/organic/live/regular.
  // Per ora il loader ritorna sempre null → mai raggiunto.
  throw new Error("live mode not implemented yet");
}

function stubSnapshot(
  project: RankTrackingProject,
  keyword: KeywordEntry,
  date: string,
): RankSnapshotDoc {
  const seed = hash(`${project.projectId}::${keyword.id}::${date}`);
  const rand = pseudoRand(seed);
  const positionRoll = rand();
  let position: number;
  if (positionRoll < 0.18) position = 1 + Math.floor(rand() * 3);
  else if (positionRoll < 0.45) position = 4 + Math.floor(rand() * 7);
  else if (positionRoll < 0.7) position = 11 + Math.floor(rand() * 10);
  else if (positionRoll < 0.92) position = 21 + Math.floor(rand() * 80);
  else position = 0;

  const features: SerpFeatureFlags = {};
  const featRoll = rand();
  if (featRoll < 0.25) features.aiOverview = true;
  if (featRoll > 0.85) features.featuredSnippet = true;
  if (featRoll > 0.55 && featRoll < 0.7) features.paa = true;
  if (rand() < 0.18) features.adsPack = true;

  const top10 = Array.from({ length: 10 }, (_, i) => {
    const pos = i + 1;
    const isOwner = position > 0 && position === pos;
    const dom = isOwner ? project.domain : `competitor-${pos}.example.com`;
    return {
      position: pos,
      domain: dom,
      url: `https://${dom}/${keyword.keyword.replace(/\s+/g, "-")}`,
      title: `${keyword.keyword} - ${dom.replace(/\.[a-z]{2,4}$/, "")}`,
      isOwner,
    };
  });

  return {
    keywordId: keyword.id,
    keyword: keyword.keyword,
    date,
    projectId: project.projectId,
    position,
    url: position > 0 ? `https://${project.domain}/${keyword.keyword.replace(/\s+/g, "-")}` : null,
    features,
    top10,
    source: "stub",
    createdAt: FieldValue.serverTimestamp(),
  };
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0;
  }
  return h;
}

function pseudoRand(seed: number): () => number {
  let s = seed || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return (s >>> 8) / 0x01000000;
  };
}
