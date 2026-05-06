/**
 * S13.1.5 — Cost guard per chiamate LLM live.
 *
 * Track spese mensili per project + LLM. Hard cap configurabile per project
 * (default $15/mese). Se exceeded → CF skip live e fallback stub.
 *
 * Storage: `_run_costs/{projectId}__{YYYYMM}` con shape:
 * {
 *   projectId, period, totalUsd, byLlm: { anthropic, openai, gemini },
 *   totalCalls, byLlmCalls: { ... }, lastUpdate
 * }
 *
 * Idempotente: usa runTransaction per update atomico.
 */

import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { logger } from "firebase-functions";

const DEFAULT_BUDGET_USD_MONTH = 15;

export type CostGuardCheck = {
  ok: boolean;
  reason?: string;
  currentTotalUsd: number;
};

function periodKey(d: Date = new Date()): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${y}${m}`;
}

/**
 * Verifica se il project ha budget per la chiamata. NON incrementa.
 * Usa get → check → caller poi incrementa con `recordLlmCost` post-call.
 */
export async function checkBudget(
  projectId: string,
  estimatedCostUsd: number,
  budgetOverrideUsd?: number,
): Promise<CostGuardCheck> {
  const db = getFirestore();
  const period = periodKey();
  const docId = `${projectId}__${period}`;
  const snap = await db.doc(`_run_costs/${docId}`).get();
  const currentTotalUsd = (snap.data()?.totalUsd as number | undefined) ?? 0;
  const budget = budgetOverrideUsd ?? DEFAULT_BUDGET_USD_MONTH;

  if (currentTotalUsd + estimatedCostUsd > budget) {
    return {
      ok: false,
      reason: `Budget exceeded: ${currentTotalUsd.toFixed(2)} + ${estimatedCostUsd.toFixed(4)} > ${budget} USD`,
      currentTotalUsd,
    };
  }
  return { ok: true, currentTotalUsd };
}

/**
 * Record costo post-call. Run in transaction per essere safe a concurrent runs.
 */
export async function recordLlmCost(input: {
  projectId: string;
  llm: string;
  costUsd: number;
}): Promise<void> {
  const db = getFirestore();
  const period = periodKey();
  const docId = `${input.projectId}__${period}`;
  try {
    await db.doc(`_run_costs/${docId}`).set(
      {
        projectId: input.projectId,
        period,
        totalUsd: FieldValue.increment(input.costUsd),
        totalCalls: FieldValue.increment(1),
        [`byLlm.${input.llm}`]: FieldValue.increment(input.costUsd),
        [`byLlmCalls.${input.llm}`]: FieldValue.increment(1),
        lastUpdate: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
  } catch (err) {
    logger.warn("recordLlmCost: write failed", { err, projectId: input.projectId });
  }
}
