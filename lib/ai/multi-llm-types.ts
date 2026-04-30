/**
 * Multi-LLM client — types comuni cross-provider.
 *
 * Provider supportati in v.2: Anthropic (live), OpenAI (stub fino a Sprint S6),
 * Gemini (stub fino a Sprint S6).
 *
 * Use case principale: AI Visibility tracking (GEO/AEO) — interrogare i 3
 * modelli con lo stesso prompt e contare menzioni del brand cliente.
 */

export type LlmProvider = "anthropic" | "openai" | "gemini";

export type LlmModelId =
  // Anthropic — Claude 4.X family
  | "claude-opus-4-7"
  | "claude-sonnet-4-6"
  | "claude-haiku-4-5-20251001"
  // OpenAI (stub mapping; verifica modelli attuali al momento dell'attivazione live)
  | "gpt-4o"
  | "gpt-4o-mini"
  // Google Gemini
  | "gemini-2.5-pro"
  | "gemini-2.5-flash";

export type LlmRequest = {
  provider: LlmProvider;
  model: LlmModelId;
  /** System prompt opzionale — separato dall'user prompt. */
  system?: string;
  prompt: string;
  /** Max tokens output. Default conservativo per AI Visibility (300). */
  maxTokens?: number;
  /** Temperature 0-1 (deterministica = 0). */
  temperature?: number;
  /** Metadata per audit log (es. { projectId, useCase }). */
  metadata?: Record<string, string>;
};

export type LlmCost = {
  inputTokens: number;
  outputTokens: number;
  /** Costo stimato in USD. Calcolato da pricing tier statico. */
  estimatedUsd: number;
};

export type LlmResponse = {
  provider: LlmProvider;
  model: LlmModelId;
  text: string;
  cost: LlmCost;
  latencyMs: number;
  /** True se la risposta proviene da stub (no API call reale). */
  isStub: boolean;
};

export class LlmProviderError extends Error {
  constructor(
    public readonly provider: LlmProvider,
    public readonly underlying: Error,
  ) {
    super(`[${provider}] ${underlying.message}`);
    this.name = "LlmProviderError";
  }
}

/**
 * Pricing per 1M token (USD) — aggiornare quando i provider rivedono i listini.
 * Source: pricing pages ufficiali, snapshot 2026-04.
 */
export const PRICING_PER_MILLION_TOKENS: Record<
  LlmModelId,
  { input: number; output: number }
> = {
  "claude-opus-4-7": { input: 15, output: 75 },
  "claude-sonnet-4-6": { input: 3, output: 15 },
  "claude-haiku-4-5-20251001": { input: 1, output: 5 },
  "gpt-4o": { input: 2.5, output: 10 },
  "gpt-4o-mini": { input: 0.15, output: 0.6 },
  "gemini-2.5-pro": { input: 1.25, output: 5 },
  "gemini-2.5-flash": { input: 0.075, output: 0.3 },
};

export function estimateCost(
  model: LlmModelId,
  inputTokens: number,
  outputTokens: number,
): number {
  const tier = PRICING_PER_MILLION_TOKENS[model];
  return (
    (inputTokens * tier.input + outputTokens * tier.output) / 1_000_000
  );
}
