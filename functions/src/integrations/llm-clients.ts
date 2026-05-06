/**
 * S13.1.5 — Wrappers uniformi per i 3 LLM supportati in GEO live mode.
 *
 * Interface comune: `generate({prompt, system, maxTokens})` → `{text, latencyMs}`.
 * Modelli scelti per costo minimo (target ~$0.05/call):
 *   - Anthropic: claude-haiku-4-5
 *   - OpenAI:    gpt-5-nano (fallback gpt-4o-mini se non disponibile)
 *   - Gemini:    gemini-2.0-flash
 *
 * Tutti gli errori vengono propagati come Error con messaggio leggibile;
 * il caller (runGeoTracking) decide se loggare e fallback a stub.
 */

import { logger } from "firebase-functions";

export type LlmClientId = "anthropic" | "openai" | "gemini";

export type LlmGenerateInput = {
  prompt: string;
  system?: string;
  maxTokens?: number;
};

export type LlmGenerateOutput = {
  text: string;
  latencyMs: number;
  /** Stima costo USD per audit (model-dependent). */
  estimatedCostUsd: number;
};

export interface LlmClient {
  id: LlmClientId;
  generate(input: LlmGenerateInput): Promise<LlmGenerateOutput>;
}

const DEFAULT_MAX_TOKENS = 600;
const REQUEST_TIMEOUT_MS = 20_000;

function safeFetch(url: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  return fetch(url, { ...init, signal: controller.signal }).finally(() => {
    clearTimeout(timer);
  });
}

// ─── Anthropic ───────────────────────────────────────────────────────

const ANTHROPIC_MODEL = "claude-haiku-4-5";
// $0.25/MTok input + $1.25/MTok output → ~$0.0006 per call short
const ANTHROPIC_COST_PER_CALL = 0.0006;

export function makeAnthropicClient(apiKey: string): LlmClient {
  return {
    id: "anthropic",
    async generate(input) {
      const start = Date.now();
      const res = await safeFetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: ANTHROPIC_MODEL,
          max_tokens: input.maxTokens ?? DEFAULT_MAX_TOKENS,
          system: input.system,
          messages: [{ role: "user", content: input.prompt }],
        }),
      });
      if (!res.ok) {
        throw new Error(
          `Anthropic ${res.status}: ${(await res.text()).slice(0, 200)}`,
        );
      }
      const body = (await res.json()) as {
        content?: Array<{ type: string; text?: string }>;
      };
      const text =
        body.content
          ?.filter((c) => c.type === "text")
          .map((c) => c.text ?? "")
          .join("\n") ?? "";
      return {
        text,
        latencyMs: Date.now() - start,
        estimatedCostUsd: ANTHROPIC_COST_PER_CALL,
      };
    },
  };
}

// ─── OpenAI ──────────────────────────────────────────────────────────

const OPENAI_MODEL = "gpt-5-nano";
const OPENAI_FALLBACK_MODEL = "gpt-4o-mini";
// gpt-5-nano: $0.05/MTok input + $0.40/MTok output → ~$0.0003 per call short
const OPENAI_COST_PER_CALL = 0.0003;

export function makeOpenAiClient(apiKey: string): LlmClient {
  return {
    id: "openai",
    async generate(input) {
      const start = Date.now();
      // Try primary model, fallback to gpt-4o-mini se 404.
      let res = await callOpenAi(apiKey, OPENAI_MODEL, input);
      if (res.status === 404) {
        logger.info("openai: gpt-5-nano not available, falling back to gpt-4o-mini");
        res = await callOpenAi(apiKey, OPENAI_FALLBACK_MODEL, input);
      }
      if (!res.ok) {
        throw new Error(
          `OpenAI ${res.status}: ${(await res.text()).slice(0, 200)}`,
        );
      }
      const body = (await res.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const text = body.choices?.[0]?.message?.content ?? "";
      return {
        text,
        latencyMs: Date.now() - start,
        estimatedCostUsd: OPENAI_COST_PER_CALL,
      };
    },
  };
}

function callOpenAi(
  apiKey: string,
  model: string,
  input: LlmGenerateInput,
): Promise<Response> {
  const messages: Array<{ role: string; content: string }> = [];
  if (input.system) messages.push({ role: "system", content: input.system });
  messages.push({ role: "user", content: input.prompt });
  return safeFetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages,
      max_completion_tokens: input.maxTokens ?? DEFAULT_MAX_TOKENS,
    }),
  });
}

// ─── Gemini ──────────────────────────────────────────────────────────

const GEMINI_MODEL = "gemini-2.0-flash";
// Gemini 2.0 Flash: $0.075/MTok input + $0.30/MTok output → ~$0.0003 per call
const GEMINI_COST_PER_CALL = 0.0003;

export function makeGeminiClient(apiKey: string): LlmClient {
  return {
    id: "gemini",
    async generate(input) {
      const start = Date.now();
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`;
      const body: Record<string, unknown> = {
        contents: [
          {
            role: "user",
            parts: [{ text: input.prompt }],
          },
        ],
        generationConfig: {
          maxOutputTokens: input.maxTokens ?? DEFAULT_MAX_TOKENS,
        },
      };
      if (input.system) {
        body.systemInstruction = {
          parts: [{ text: input.system }],
        };
      }
      const res = await safeFetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        throw new Error(
          `Gemini ${res.status}: ${(await res.text()).slice(0, 200)}`,
        );
      }
      const json = (await res.json()) as {
        candidates?: Array<{
          content?: { parts?: Array<{ text?: string }> };
        }>;
      };
      const text =
        json.candidates?.[0]?.content?.parts
          ?.map((p) => p.text ?? "")
          .join("\n") ?? "";
      return {
        text,
        latencyMs: Date.now() - start,
        estimatedCostUsd: GEMINI_COST_PER_CALL,
      };
    },
  };
}

// ─── Factory ─────────────────────────────────────────────────────────

export function makeLlmClient(
  id: LlmClientId,
  fields: Record<string, string>,
): LlmClient | null {
  switch (id) {
    case "anthropic":
      if (!fields.apiKey) return null;
      return makeAnthropicClient(fields.apiKey);
    case "openai":
      if (!fields.apiKey) return null;
      return makeOpenAiClient(fields.apiKey);
    case "gemini":
      if (!fields.apiKey) return null;
      return makeGeminiClient(fields.apiKey);
  }
}
