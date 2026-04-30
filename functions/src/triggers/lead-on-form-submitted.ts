import { onDocumentCreated } from "firebase-functions/firestore";
import { logger } from "firebase-functions";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { writeAudit } from "../utils/audit-log";

/**
 * STUB — Sprint S3 (Lead Pipeline) implementerà la logica completa:
 * - parsing dei campi form
 * - creazione lead con status "new"
 * - notifica email/Slack ai membri progetto
 *
 * Per ora: trigger che logga e crea entry audit, da espandere in S3.
 *
 * Path: projects/{projectId}/forms/{formId}/submissions/{submissionId}
 */
export const leadOnFormSubmitted = onDocumentCreated(
  {
    document: "projects/{projectId}/forms/{formId}/submissions/{submissionId}",
    region: "europe-west1",
  },
  async (event) => {
    const { projectId, formId, submissionId } = event.params;
    const data = event.data?.data();

    if (!data) {
      logger.warn("leadOnFormSubmitted: empty submission", {
        projectId,
        formId,
        submissionId,
      });
      return;
    }

    const db = getFirestore();
    const leadRef = db
      .collection("projects")
      .doc(projectId)
      .collection("leads")
      .doc();

    await leadRef.set({
      id: leadRef.id,
      formSubmissionId: submissionId,
      formId,
      source: "form",
      fields: data.fields ?? data,
      status: "new",
      statusUpdatedAt: FieldValue.serverTimestamp(),
      statusUpdatedBy: null,
      assignedTo: null,
      value: null,
      notes: [],
      tags: [],
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    await writeAudit({
      collectionPath: `projects/${projectId}/leads/${leadRef.id}/_audit`,
      actorUid: null,
      action: "lead.created",
      description: `Lead creato da submission ${submissionId}`,
      metadata: { formId, submissionId },
    });

    logger.info("leadOnFormSubmitted: lead created", {
      projectId,
      leadId: leadRef.id,
    });
  },
);
