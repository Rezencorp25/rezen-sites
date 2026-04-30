import { getFirestore, FieldValue } from "firebase-admin/firestore";

export type AuditEvent = {
  /**
   * Path della collection a cui l'evento appartiene (es. `projects/abc/leads/xyz/_audit`).
   * Documento atomic-create dentro questa subcollection con id auto-generato.
   */
  collectionPath: string;
  actorUid: string | null;
  action: string;
  description: string;
  delta?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
};

/**
 * Scrive un record immutabile in una subcollection `_audit`.
 * Le rules Firestore proibiscono delete/update di documenti `_audit/{eventId}`.
 *
 * Compliance Playbook §3.2 (audit immutabile) + §2.5 (data breach traceability).
 */
export async function writeAudit(event: AuditEvent): Promise<void> {
  const db = getFirestore();
  await db.collection(event.collectionPath).add({
    actorUid: event.actorUid,
    action: event.action,
    description: event.description,
    delta: event.delta ?? null,
    metadata: event.metadata ?? null,
    createdAt: FieldValue.serverTimestamp(),
  });
}
