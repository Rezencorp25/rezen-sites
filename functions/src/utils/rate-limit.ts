import { getFirestore, FieldValue } from "firebase-admin/firestore";

export type RateLimitConfig = {
  /** Identificatore della risorsa (es. `dataforseo:project_xyz`). */
  key: string;
  /** Numero massimo di hit nella finestra. */
  limit: number;
  /** Finestra in secondi. */
  windowSeconds: number;
};

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
};

/**
 * Rate limiter Firestore-backed con sliding window approssimato.
 * Usa transaction per garantire atomicità anche con esecuzioni parallele.
 *
 * Pattern: documento `_rate_limits/{key}` con array di timestamp recenti.
 * Pulizia inline degli scaduti.
 */
export async function checkRateLimit(
  config: RateLimitConfig,
): Promise<RateLimitResult> {
  const db = getFirestore();
  const ref = db.collection("_rate_limits").doc(config.key);
  const now = Date.now();
  const windowStart = now - config.windowSeconds * 1000;

  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const data = (snap.data() ?? {}) as { timestamps?: number[] };
    const recent = (data.timestamps ?? []).filter((t) => t > windowStart);
    const allowed = recent.length < config.limit;

    if (allowed) {
      recent.push(now);
      tx.set(
        ref,
        {
          timestamps: recent,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
    }

    return {
      allowed,
      remaining: Math.max(0, config.limit - recent.length),
      resetAt: new Date(
        recent.length > 0 ? recent[0] + config.windowSeconds * 1000 : now,
      ),
    };
  });
}
