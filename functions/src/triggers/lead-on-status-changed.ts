import { onDocumentUpdated } from "firebase-functions/firestore";
import { logger } from "firebase-functions";
import { writeAudit } from "../utils/audit-log";

/**
 * Trigger su update lead → se cambia lo status scrive entry audit
 * immutabile e (futuro) invia notifica al project owner.
 *
 * Path: projects/{projectId}/leads/{leadId}
 */
export const leadOnStatusChanged = onDocumentUpdated(
  {
    document: "projects/{projectId}/leads/{leadId}",
    region: "europe-west1",
  },
  async (event) => {
    const { projectId, leadId } = event.params;
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    if (!before || !after) return;
    if (before.status === after.status) return;

    await writeAudit({
      collectionPath: `projects/${projectId}/leads/${leadId}/_audit`,
      actorUid: after.statusUpdatedBy ?? null,
      action: "lead.status_changed",
      description: `Status: ${before.status} → ${after.status}`,
      delta: { from: before.status, to: after.status },
    });

    if (after.status === "won" || after.status === "lost") {
      logger.info("leadOnStatusChanged: terminal transition", {
        projectId,
        leadId,
        status: after.status,
      });
      // TODO: send email / push notification to project owner.
    }
  },
);
