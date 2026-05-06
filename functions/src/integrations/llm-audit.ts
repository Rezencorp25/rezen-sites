/**
 * S13.1.5 — Audit log per chiamate LLM live.
 *
 * Path: `_ai_logs/{logId}` (rules già esistenti: read=admin, write=false client).
 * Scritto da Cloud Functions con Admin SDK.
 *
 * Contiene: projectId, llm, query (truncated), success, latencyMs, errorMessage,
 *           costUsd, createdAt.
 *
 * **NON salva mai**: chiavi API, response text complete (privacy + cost), prompt
 * con dati cliente sensibili.
 *
 * Retention: configurare TTL su `createdAt` 90gg post-deploy.
 */

import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { logger } from "firebase-functions";

export type LlmAuditEntry = {
  projectId: string;
  llm: string;
  /** Query truncated to first 200 chars */
  queryPreview: string;
  success: boolean;
  latencyMs: number;
  costUsd: number;
  errorMessage?: string;
  /** Lunghezza response (caratteri) per audit, no full text */
  responseLength?: number;
  /** Boolean estratto da parser */
  mentioned?: boolean;
};

export async function logLlmCall(entry: LlmAuditEntry): Promise<void> {
  const db = getFirestore();
  const logId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  try {
    await db.doc(`_ai_logs/${logId}`).set({
      ...entry,
      queryPreview: entry.queryPreview.slice(0, 200),
      createdAt: FieldValue.serverTimestamp(),
    });
  } catch (err) {
    logger.warn("logLlmCall: write failed", { err, projectId: entry.projectId });
  }
}
