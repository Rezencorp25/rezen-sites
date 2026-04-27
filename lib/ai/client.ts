import Anthropic from "@anthropic-ai/sdk";

export function hasApiKey() {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

export function getAnthropic() {
  if (!hasApiKey()) return null;
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

export const MODELS = {
  opus: "claude-opus-4-7",
  sonnet: "claude-sonnet-4-6",
  haiku: "claude-haiku-4-5-20251001",
} as const;
