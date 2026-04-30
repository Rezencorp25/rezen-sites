/**
 * Multi-LLM client — server-only.
 *
 * Estende il client Anthropic esistente in `lib/ai/client.ts` con interfacce
 * unificate per OpenAI e Gemini. Al momento (Sprint S0):
 *   - Anthropic → live se ANTHROPIC_API_KEY presente, altrimenti stub
 *   - OpenAI → stub-only (SDK non ancora installato)
 *   - Gemini → stub-only (SDK non ancora installato)
 *
 * Sprint S6 (AI Visibility) abiliterà OpenAI + Gemini live e attiverà il
 * pattern multi-provider parallel query.
 *
 * Compliance:
 *   - §3.5 Secrets — chiavi via Firebase Secrets Manager, mai env inline
 *   - §7.3 — mai inviare PII a LLM senza consenso esplicito + anonymization
 */

import { getAnthropic, hasApiKey as hasAnthropicKey } from "./client";
import {
  estimateCost,
  LlmProviderError,
  type LlmRequest,
  type LlmResponse,
  type LlmProvider,
} from "./multi-llm-types";

// ── Anthropic (live or stub) ────────────────────────────────────────────

async function queryAnthropic(req: LlmRequest): Promise<LlmResponse> {
  const startedAt = Date.now();
  const client = getAnthropic();
  if (!client || !hasAnthropicKey()) {
    return stubResponse(req, "anthropic");
  }
  try {
    const result = await client.messages.create({
      model: req.model,
      max_tokens: req.maxTokens ?? 300,
      temperature: req.temperature ?? 0,
      system: req.system,
      messages: [{ role: "user", content: req.prompt }],
    });
    const text = result.content
      .filter((c) => c.type === "text")
      .map((c) => (c as { text: string }).text)
      .join("\n");
    const inputTokens = result.usage.input_tokens;
    const outputTokens = result.usage.output_tokens;
    return {
      provider: "anthropic",
      model: req.model,
      text,
      cost: {
        inputTokens,
        outputTokens,
        estimatedUsd: estimateCost(req.model, inputTokens, outputTokens),
      },
      latencyMs: Date.now() - startedAt,
      isStub: false,
    };
  } catch (err) {
    throw new LlmProviderError("anthropic", err as Error);
  }
}

// ── OpenAI (stub fino a Sprint S6) ──────────────────────────────────────

async function queryOpenAI(req: LlmRequest): Promise<LlmResponse> {
  // TODO Sprint S6: install `openai` package, replace with real client
  return stubResponse(req, "openai");
}

// ── Gemini (stub fino a Sprint S6) ──────────────────────────────────────

async function queryGemini(req: LlmRequest): Promise<LlmResponse> {
  // TODO Sprint S6: install `@google/generative-ai`, replace with real client
  return stubResponse(req, "gemini");
}

// ── Stub generator ──────────────────────────────────────────────────────

function stubResponse(req: LlmRequest, provider: LlmProvider): LlmResponse {
  // Token count rough estimate: 4 char ≈ 1 token (simulazione conservativa)
  const inputTokens = Math.ceil(
    (req.prompt.length + (req.system?.length ?? 0)) / 4,
  );
  const stubText = `[STUB ${provider}/${req.model}] Risposta simulata al prompt: "${req.prompt.slice(0, 80)}${req.prompt.length > 80 ? "..." : ""}"`;
  const outputTokens = Math.ceil(stubText.length / 4);
  return {
    provider,
    model: req.model,
    text: stubText,
    cost: {
      inputTokens,
      outputTokens,
      estimatedUsd: estimateCost(req.model, inputTokens, outputTokens),
    },
    latencyMs: 0,
    isStub: true,
  };
}

// ── Public API ──────────────────────────────────────────────────────────

/**
 * Query singolo provider/model. Ritorna sempre LlmResponse (anche se stub),
 * facendo emergere il flag `isStub` per audit log.
 */
export async function queryLlm(req: LlmRequest): Promise<LlmResponse> {
  switch (req.provider) {
    case "anthropic":
      return queryAnthropic(req);
    case "openai":
      return queryOpenAI(req);
    case "gemini":
      return queryGemini(req);
  }
}

/**
 * Query parallel a N provider con stesso prompt. Pattern principale per AI
 * Visibility tracking (GEO/AEO) — Sprint S6.
 *
 * Errori per provider singolo NON bloccano gli altri: il chiamante riceve
 * un array con results | errors per ciascun provider richiesto.
 */
export async function queryAllProviders(
  prompt: string,
  configs: Pick<LlmRequest, "provider" | "model">[],
  options: Omit<LlmRequest, "provider" | "model" | "prompt"> = {},
): Promise<
  ({ ok: true; response: LlmResponse } | { ok: false; provider: LlmProvider; error: Error })[]
> {
  const results = await Promise.allSettled(
    configs.map((c) =>
      queryLlm({ ...options, prompt, provider: c.provider, model: c.model }),
    ),
  );
  return results.map((r, i) => {
    if (r.status === "fulfilled") {
      return { ok: true as const, response: r.value };
    }
    return {
      ok: false as const,
      provider: configs[i].provider,
      error: r.reason as Error,
    };
  });
}
