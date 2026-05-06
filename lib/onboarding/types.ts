/**
 * Onboarding wizard (S6d) — types persistenti.
 *
 * Output dell'onboarding è scritto in 3 sotto-collection del progetto:
 *  1. `projects/{id}/seo_keywords/{keywordId}` — keyword tracciate (riusato da
 *     runRankAndAeoTracking + runGeoTracking).
 *  2. `projects/{id}/competitors/{competitorId}` — domini concorrenti (consumati
 *     da runGeoTracking come pool reale invece del placeholder).
 *  3. `projects/{id}/onboarding/state` — singleton con step corrente, completedAt
 *     e snapshot config per ogni step. Permette di ripristinare il wizard parziale.
 */

import type { KeywordIntent } from "@/lib/seo/seo-types";

export type OnboardingStep = 1 | 2 | 3 | 4;

export const ONBOARDING_STEP_TITLE: Record<OnboardingStep, string> = {
  1: "Site basics",
  2: "Keywords",
  3: "Competitors",
  4: "Review & Activate",
};

export const ONBOARDING_STEP_DESC: Record<OnboardingStep, string> = {
  1: "Conferma dominio, country e brand",
  2: "Definisci 5-20 keyword da tracciare",
  3: "Identifica 3-8 competitor diretti",
  4: "Verifica setup e attiva tracking settimanale",
};

/** Configurazione Step 1: dominio, country code (ISO 2), language (ISO), brand. */
export type OnboardingSiteBasics = {
  domain: string;
  countryCode: string;
  languageCode: string;
  brandName: string;
};

/**
 * Keyword in fase di onboarding. Nota: `searchVolume` può essere `null` finché
 * non è stato fatto il lookup (DataForSEO o stub). `intent` opzionale finché
 * non classificata.
 */
export type OnboardingKeyword = {
  id: string;
  keyword: string;
  searchVolume: number | null;
  intent: KeywordIntent | null;
  /** Priorità 1 = high, 2 = medium, 3 = low. Default 2. */
  priority: 1 | 2 | 3;
};

export type OnboardingCompetitor = {
  id: string;
  domain: string;
  /** Label opzionale per displayname (es. "Webflow" per webflow.com). */
  label: string | null;
  /** True se aggiunto da suggerimento SERP automatico, false se manuale. */
  fromSuggestion: boolean;
};

export type OnboardingState = {
  /** Step 1-4 corrente (più alto = più avanti). 4 = pronti per attivare. */
  step: OnboardingStep;
  /** Timestamp completamento (null finché Step 4 non è confermato). */
  completedAt: Date | null;
  siteBasics: OnboardingSiteBasics | null;
  keywords: OnboardingKeyword[];
  competitors: OnboardingCompetitor[];
};

export const MIN_KEYWORDS = 5;
export const TARGET_KEYWORDS = 12;
export const MAX_KEYWORDS = 30;

export const MIN_COMPETITORS = 3;
export const MAX_COMPETITORS = 8;

/**
 * Validazione step-by-step. Ritorna messaggio d'errore o null.
 * Determina se "Avanti" è abilitato e cosa mostrare nel banner step.
 */
export function validateStep(
  step: OnboardingStep,
  state: OnboardingState,
): string | null {
  if (step === 1) {
    const b = state.siteBasics;
    if (!b) return "Compila tutti i campi del sito";
    if (!b.domain.trim()) return "Dominio obbligatorio";
    if (!/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(b.domain.trim())) {
      return "Dominio non valido (es. example.com)";
    }
    if (!b.countryCode || b.countryCode.length !== 2) return "Country code 2 lettere obbligatorio";
    if (!b.languageCode || b.languageCode.length < 2) return "Language code obbligatorio";
    if (!b.brandName.trim()) return "Brand name obbligatorio";
    return null;
  }
  if (step === 2) {
    if (state.keywords.length < MIN_KEYWORDS) {
      return `Servono almeno ${MIN_KEYWORDS} keyword (ne hai ${state.keywords.length})`;
    }
    if (state.keywords.length > MAX_KEYWORDS) {
      return `Max ${MAX_KEYWORDS} keyword (ne hai ${state.keywords.length})`;
    }
    if (state.keywords.some((k) => !k.keyword.trim())) {
      return "Una keyword è vuota — rimuovi o compila";
    }
    return null;
  }
  if (step === 3) {
    if (state.competitors.length < MIN_COMPETITORS) {
      return `Servono almeno ${MIN_COMPETITORS} competitor (ne hai ${state.competitors.length})`;
    }
    if (state.competitors.length > MAX_COMPETITORS) {
      return `Max ${MAX_COMPETITORS} competitor (ne hai ${state.competitors.length})`;
    }
    if (state.competitors.some((c) => !/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(c.domain.trim()))) {
      return "Almeno un dominio competitor non è valido";
    }
    return null;
  }
  // Step 4: tutti gli step precedenti devono essere validi
  for (let s = 1; s < 4; s++) {
    const e = validateStep(s as OnboardingStep, state);
    if (e) return `Step ${s} non valido: ${e}`;
  }
  return null;
}

/** True se onboarding completo (step 4 + completedAt). Usato per banner UI. */
export function isOnboardingComplete(state: OnboardingState | null): boolean {
  return !!state && state.step >= 4 && state.completedAt !== null;
}
