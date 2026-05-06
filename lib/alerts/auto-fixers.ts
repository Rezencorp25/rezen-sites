"use client";

import type { Alert, AlertAutoFixId } from "@/types";
import { usePagesStore } from "@/lib/stores/pages-store";
import { useSettingsStore } from "@/lib/stores/settings-store";
import { useProjectsStore } from "@/lib/stores/projects-store";

/**
 * S12 — Auto-fix handlers per Alert.fixActionId.
 *
 * Tutti gli handler:
 * - sono idempotenti (chiamabili più volte, stesso risultato)
 * - lavorano client-side modificando gli store Zustand persistiti
 * - ritornano AutoFixResult per riportare summary leggibile all'utente
 *
 * Future iteration (S12.2): handler che richiedono CF (cache invalidation CDN,
 * schema generator AI) verranno aggiunti come `kind: "cloud"` con backend call.
 */

export type AutoFixResult = {
  ok: boolean;
  /** Summary umano "cosa è stato fatto" mostrato nel toast post-apply. */
  summary: string;
  /** Lista entità modificate (per audit trail). */
  patched?: { entity: string; id: string; field: string }[];
  /** Messaggio errore quando ok === false. */
  error?: string;
};

export type AutoFixContext = {
  alert: Alert;
};

const REZEN_OG_FALLBACK_BRAND = "/og-default.jpg";
const REZEN_OG_FALLBACK_GENERIC = "https://placehold.co/1200x630/ff6200/ffffff?text=REZEN";

function buildMetaDescriptionFallback(pageTitle: string, brandName: string): string {
  // Target 130-155 char. Compone titolo + brand + invito generico.
  const base = `${pageTitle.trim()} — ${brandName}.`;
  const filler =
    " Scopri di più, contattaci o esplora i nostri contenuti per approfondire.";
  const candidate = (base + filler).trim();
  if (candidate.length >= 130 && candidate.length <= 160) return candidate;
  if (candidate.length > 160) return candidate.slice(0, 157).trimEnd() + "...";
  // candidate < 130 → estendi con keyword generiche
  return (candidate + " Risorse, guide e approfondimenti aggiornati.").slice(0, 160);
}

function setMetaTitleFromPageTitle(ctx: AutoFixContext): AutoFixResult {
  const { alert } = ctx;
  if (!alert.fixPageId) {
    return { ok: false, summary: "", error: "fixPageId mancante sull'alert" };
  }
  const pagesStore = usePagesStore.getState();
  const page = pagesStore.getById(alert.fixPageId);
  if (!page) {
    return { ok: false, summary: "", error: "Pagina non trovata" };
  }
  if (page.seo.metaTitle?.trim()) {
    return {
      ok: true,
      summary: `Meta title già presente su ${page.slug || "/"} — nessuna azione.`,
    };
  }
  const newTitle = page.title;
  pagesStore.updatePage(page.id, {
    seo: { ...page.seo, metaTitle: newTitle },
  });
  return {
    ok: true,
    summary: `Meta title impostato su "${newTitle}" per ${page.slug || "/"}.`,
    patched: [{ entity: "page", id: page.id, field: "seo.metaTitle" }],
  };
}

function generateMetaDescriptionFallback(ctx: AutoFixContext): AutoFixResult {
  const { alert } = ctx;
  if (!alert.fixPageId) {
    return { ok: false, summary: "", error: "fixPageId mancante sull'alert" };
  }
  const pagesStore = usePagesStore.getState();
  const projectsStore = useProjectsStore.getState();
  const page = pagesStore.getById(alert.fixPageId);
  if (!page) {
    return { ok: false, summary: "", error: "Pagina non trovata" };
  }
  if (page.seo.metaDescription?.trim()) {
    return {
      ok: true,
      summary: `Meta description già presente su ${page.slug || "/"} — nessuna azione.`,
    };
  }
  const project = projectsStore.getById(page.projectId);
  const brandName = project?.name ?? "REZEN Sites";
  const newDesc = buildMetaDescriptionFallback(page.title, brandName);
  pagesStore.updatePage(page.id, {
    seo: { ...page.seo, metaDescription: newDesc },
  });
  return {
    ok: true,
    summary: `Meta description (${newDesc.length} char) generata su ${page.slug || "/"}: "${newDesc.slice(0, 60)}..."`,
    patched: [{ entity: "page", id: page.id, field: "seo.metaDescription" }],
  };
}

function setDefaultOgImage(ctx: AutoFixContext): AutoFixResult {
  const { alert } = ctx;
  if (!alert.fixPageId) {
    return { ok: false, summary: "", error: "fixPageId mancante sull'alert" };
  }
  const pagesStore = usePagesStore.getState();
  const projectsStore = useProjectsStore.getState();
  const page = pagesStore.getById(alert.fixPageId);
  if (!page) {
    return { ok: false, summary: "", error: "Pagina non trovata" };
  }
  if (page.seo.og?.image) {
    return {
      ok: true,
      summary: `OG image già presente su ${page.slug || "/"} — nessuna azione.`,
    };
  }
  const project = projectsStore.getById(page.projectId);
  // Preferenza: brand logo del progetto se configurato (S8 branding), altrimenti
  // fallback REZEN. Non perfetto ma sblocca il share preview social.
  const brandImage =
    project?.branding?.logoUrl?.trim() || REZEN_OG_FALLBACK_BRAND;
  const ogImage = brandImage.startsWith("http")
    ? brandImage
    : REZEN_OG_FALLBACK_GENERIC;

  pagesStore.updatePage(page.id, {
    seo: {
      ...page.seo,
      og: { ...page.seo.og, image: ogImage },
    },
  });
  return {
    ok: true,
    summary: `OG image fallback impostata su ${page.slug || "/"}: ${ogImage}`,
    patched: [{ entity: "page", id: page.id, field: "seo.og.image" }],
  };
}

function enableConsentBanner(ctx: AutoFixContext): AutoFixResult {
  const { alert } = ctx;
  const settingsStore = useSettingsStore.getState();
  const current = settingsStore.get(alert.projectId);
  if (current.consent.enabled) {
    return {
      ok: true,
      summary: "Consent banner già abilitato — nessuna azione.",
    };
  }
  settingsStore.updateSection(alert.projectId, "consent", {
    ...current.consent,
    enabled: true,
    regions: { ...current.consent.regions, gdpr: true },
  });
  return {
    ok: true,
    summary:
      "Consent banner abilitato (regione GDPR). Verifica privacyPolicyUrl in Settings.",
    patched: [
      { entity: "settings", id: alert.projectId, field: "consent.enabled" },
    ],
  };
}

const HANDLERS: Record<AlertAutoFixId, (ctx: AutoFixContext) => AutoFixResult> = {
  "set-meta-title-from-page-title": setMetaTitleFromPageTitle,
  "generate-meta-description-fallback": generateMetaDescriptionFallback,
  "set-default-og-image": setDefaultOgImage,
  "enable-consent-banner": enableConsentBanner,
};

export function executeAutoFix(alert: Alert): AutoFixResult {
  if (alert.fixAction !== "auto" || !alert.fixActionId) {
    return {
      ok: false,
      summary: "",
      error: "Alert non ha auto-fix configurato",
    };
  }
  const handler = HANDLERS[alert.fixActionId];
  if (!handler) {
    return {
      ok: false,
      summary: "",
      error: `Handler ${alert.fixActionId} non implementato`,
    };
  }
  try {
    return handler({ alert });
  } catch (e) {
    return {
      ok: false,
      summary: "",
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

/**
 * Descrizione human-readable di cosa farebbe l'auto-fix, mostrata in dialog
 * pre-applicazione.
 */
export const AUTO_FIX_DESCRIPTION: Record<AlertAutoFixId, string> = {
  "set-meta-title-from-page-title":
    "Il sistema imposterà il meta title della pagina con il titolo già presente nel CMS. Operazione reversibile da SEO editor.",
  "generate-meta-description-fallback":
    "Il sistema genererà una meta description fallback (130-160 caratteri) basata sul titolo pagina + nome brand. Sostituibile manualmente in qualsiasi momento.",
  "set-default-og-image":
    "Il sistema imposterà un'immagine Open Graph di fallback (logo brand del progetto se configurato, altrimenti placeholder REZEN 1200×630). Sostituibile in SEO editor.",
  "enable-consent-banner":
    "Il sistema abiliterà il consent banner per il progetto con regione GDPR attiva. Verifica privacy/cookie policy URL in Settings dopo l'applicazione.",
};
