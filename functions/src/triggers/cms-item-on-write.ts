import { onDocumentWritten } from "firebase-functions/firestore";
import { logger } from "firebase-functions";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { defineSecret } from "firebase-functions/params";
import { writeAudit } from "../utils/audit-log";

/**
 * S7.6 — CMS item lifecycle trigger.
 *
 * Path: projects/{projectId}/collections/{collectionId}/items/{itemId}
 *
 * Quando un item passa da `draft → queued`, esegue il publish work:
 * 1. Copia draftData → liveData
 * 2. Set status='published' + lastPublishedAt
 * 3. Append snapshot a `versions/{itemId}/history/{ts}` (per restore future)
 * 4. Audit log in `projects/{pid}/_audit_logs/`
 * 5. Webhook a Next.js `/api/revalidate` per invalidare ISR
 *
 * Quando passa a `archived`, scrive solo audit (no liveData touch — l'item rimane invisibile).
 */

const REVALIDATE_SECRET = defineSecret("REVALIDATE_WEBHOOK_SECRET");
const APP_HOSTING_URL = defineSecret("APP_HOSTING_URL");

export const cmsItemOnWrite = onDocumentWritten(
  {
    document:
      "projects/{projectId}/collections/{collectionId}/items/{itemId}",
    region: "europe-west1",
    secrets: [REVALIDATE_SECRET, APP_HOSTING_URL],
  },
  async (event) => {
    const { projectId, collectionId, itemId } = event.params;
    const before = event.data?.before.data();
    const after = event.data?.after.data();

    if (!after) {
      logger.info("cmsItemOnWrite: doc deleted, skip", { itemId });
      return;
    }

    const beforeStatus = before?.status as string | undefined;
    const afterStatus = after.status as string | undefined;

    // Solo le transizioni rilevanti.
    if (beforeStatus === afterStatus) return;

    const db = getFirestore();
    const itemRef = db
      .collection("projects")
      .doc(projectId)
      .collection("collections")
      .doc(collectionId)
      .collection("items")
      .doc(itemId);

    if (afterStatus === "queued") {
      const liveData = after.draftData ?? {};
      await itemRef.update({
        status: "published",
        liveData,
        lastPublishedAt: FieldValue.serverTimestamp(),
      });

      // Snapshot version per restore.
      const versionRef = itemRef.collection("versions").doc();
      await versionRef.set({
        itemId,
        snapshotAt: FieldValue.serverTimestamp(),
        data: liveData,
        publishedFromStatus: beforeStatus ?? "draft",
      });

      await writeAudit({
        collectionPath: `projects/${projectId}/_audit_logs`,
        actorUid: null,
        action: "cms.item.published",
        description: `Item ${itemId} published in ${collectionId}`,
        metadata: { collectionId, itemId, fromStatus: beforeStatus ?? null },
      });

      // Webhook ISR revalidation.
      const url = APP_HOSTING_URL.value();
      if (url && REVALIDATE_SECRET.value()) {
        const slug = liveData.slug as string | undefined;
        if (slug) {
          try {
            const r = await fetch(`${url}/api/revalidate`, {
              method: "POST",
              headers: {
                "content-type": "application/json",
                "x-revalidate-secret": REVALIDATE_SECRET.value(),
              },
              body: JSON.stringify({
                projectId,
                collectionId,
                itemSlug: slug,
              }),
            });
            if (!r.ok) {
              logger.warn("revalidate webhook non-OK", {
                status: r.status,
                itemId,
              });
            }
          } catch (err) {
            logger.error("revalidate webhook failed", { err, itemId });
          }
        }
      }
      return;
    }

    if (afterStatus === "archived") {
      await writeAudit({
        collectionPath: `projects/${projectId}/_audit_logs`,
        actorUid: null,
        action: "cms.item.archived",
        description: `Item ${itemId} archived in ${collectionId}`,
        metadata: { collectionId, itemId },
      });
    }
  },
);
