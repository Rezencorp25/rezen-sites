import { defineSecret } from "firebase-functions/params";

/**
 * Centralized declaration of all secrets used by Cloud Functions.
 * Pattern: defineSecret() emits a binding referenced by `runWith({ secrets: [...] })`
 * on each function. Values are resolved from Google Secret Manager at runtime.
 *
 * Per Compliance Playbook §3.5 — mai env in chiaro.
 */

export const DATAFORSEO_LOGIN = defineSecret("DATAFORSEO_LOGIN");
export const DATAFORSEO_PASSWORD = defineSecret("DATAFORSEO_PASSWORD");

export const ANTHROPIC_API_KEY = defineSecret("ANTHROPIC_API_KEY");
export const OPENAI_API_KEY = defineSecret("OPENAI_API_KEY");
export const GEMINI_API_KEY = defineSecret("GEMINI_API_KEY");

export const PSI_API_KEY = defineSecret("PSI_API_KEY");

/**
 * Lista aggregata utile come `secrets:` parameter nei runWith() di functions
 * che chiamano servizi esterni multipli.
 */
export const ALL_EXTERNAL_SECRETS = [
  DATAFORSEO_LOGIN,
  DATAFORSEO_PASSWORD,
  ANTHROPIC_API_KEY,
  OPENAI_API_KEY,
  GEMINI_API_KEY,
  PSI_API_KEY,
];
