import type { PuckData } from "@/types";

/**
 * Hand-crafted Puck data for seed pages.
 * These render via Puck config in components/puck-components/*.
 * Kept deliberately small: enough to prove rendering, varied enough to look real.
 */

function id(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

export function heroLandingTemplate(opts: {
  siteName: string;
  headline: string;
  subheadline: string;
  ctaText: string;
  ctaHref: string;
}): PuckData {
  return {
    root: { props: { title: opts.siteName } },
    content: [
      {
        type: "Hero",
        props: {
          id: id("hero"),
          title: opts.headline,
          subtitle: opts.subheadline,
          ctaText: opts.ctaText,
          ctaHref: opts.ctaHref,
          backgroundImage: "/mock-images/hero-gradient.svg",
          alignment: "left",
        },
      },
      {
        type: "Section",
        props: {
          id: id("section"),
          padding: "large",
          background: "surface",
          maxWidth: "container",
        },
      },
      {
        type: "Heading",
        props: {
          id: id("heading"),
          text: `Cosa offre ${opts.siteName}`,
          level: "h2",
          alignment: "center",
          color: "on-surface",
        },
      },
      {
        type: "FeatureList",
        props: {
          id: id("features"),
          items: [
            {
              icon: "Rocket",
              title: "Velocità di esecuzione",
              description:
                "Progetti consegnati in giorni, non mesi. Pipeline ottimizzata per il team.",
            },
            {
              icon: "Sparkles",
              title: "AI multi-agente",
              description:
                "Orchestriamo Claude Opus + Sonnet per generare, editare e pubblicare.",
            },
            {
              icon: "ShieldCheck",
              title: "Compliance di default",
              description:
                "GDPR, tracking pixel verificati, security rules serie.",
            },
          ],
          layout: "grid",
        },
      },
      {
        type: "CTA",
        props: {
          id: id("cta"),
          headline: "Pronto a iniziare?",
          description:
            "Prenota un audit gratuito di 15 minuti con il team REZEN.",
          buttonText: "Prenota audit",
          buttonHref: "/audit",
          style: "gradient",
        },
      },
      {
        type: "Footer",
        props: {
          id: id("footer"),
          columns: [
            { title: "Prodotto", links: ["Home", "Audit", "Blog"] },
            { title: "Azienda", links: ["Privacy", "Termini", "Contatti"] },
          ],
          copyright: `© 2026 ${opts.siteName}. Tutti i diritti riservati.`,
        },
      },
    ],
    zones: {},
  } as PuckData;
}

export function simplePageTemplate(opts: {
  title: string;
  body: string;
}): PuckData {
  return {
    root: { props: { title: opts.title } },
    content: [
      {
        type: "Heading",
        props: {
          id: id("heading"),
          text: opts.title,
          level: "h1",
          alignment: "left",
          color: "on-surface",
        },
      },
      {
        type: "Paragraph",
        props: {
          id: id("para"),
          text: opts.body,
          alignment: "left",
          size: "md",
        },
      },
      {
        type: "Footer",
        props: {
          id: id("footer"),
          columns: [
            { title: "Navigazione", links: ["Home", "Contatti"] },
          ],
          copyright: "© 2026",
        },
      },
    ],
    zones: {},
  } as PuckData;
}

export function contactPageTemplate(): PuckData {
  return {
    root: { props: { title: "Contatti" } },
    content: [
      {
        type: "Hero",
        props: {
          id: id("hero"),
          title: "Parliamone",
          subtitle:
            "Compila il form: ti rispondiamo entro 24h lavorative.",
          ctaText: "Scrivi ora",
          ctaHref: "#form",
          backgroundImage: "/mock-images/hero-dark.svg",
          alignment: "center",
        },
      },
      {
        type: "ContactForm",
        props: {
          id: id("form"),
          title: "Richiedi un preventivo",
          fields: ["name", "email", "company", "message"],
          submitText: "Invia richiesta",
        },
      },
      {
        type: "Footer",
        props: {
          id: id("footer"),
          columns: [
            { title: "Contatti", links: ["Email", "Telefono"] },
          ],
          copyright: "© 2026",
        },
      },
    ],
    zones: {},
  } as PuckData;
}

export function notFoundTemplate(): PuckData {
  return {
    root: { props: { title: "Pagina non trovata" } },
    content: [
      {
        type: "Heading",
        props: {
          id: id("heading"),
          text: "404 — Pagina non trovata",
          level: "h1",
          alignment: "center",
          color: "on-surface",
        },
      },
      {
        type: "Paragraph",
        props: {
          id: id("para"),
          text: "La pagina che cerchi è stata spostata o non esiste più.",
          alignment: "center",
          size: "md",
        },
      },
      {
        type: "Button",
        props: {
          id: id("btn"),
          text: "Torna alla home",
          href: "/",
          variant: "primary",
          size: "md",
        },
      },
    ],
    zones: {},
  } as PuckData;
}
