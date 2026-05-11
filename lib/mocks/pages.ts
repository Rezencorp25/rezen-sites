import type { Page } from "@/types";
import type { Data as PuckData } from "@measured/puck";
import {
  heroLandingTemplate,
  simplePageTemplate,
  contactPageTemplate,
  notFoundTemplate,
} from "./puck-templates";

type PageSeed = Omit<Page, "createdAt" | "updatedAt"> & {
  createdAt: Date;
  updatedAt: Date;
};

const now = () => new Date("2026-04-18T10:00:00Z");

function importedSitePuckData(src: string, title: string): PuckData {
  return {
    content: [
      {
        type: "IframeEmbed",
        props: {
          id: "iframe-import-verumflow",
          src,
          height: 4800,
          title,
          badge: false,
          autoFit: true,
          showToolbar: true,
        },
      },
    ],
    root: { props: { title } },
  } as unknown as PuckData;
}

const VERUMFLOW_IMPORT_BASE = "/imports/verumflow-ch/static-real";

// Helper: scaffold a Page seeded from an imported HTML file. Keeps the 10
// VerumFlow pages declarative (title + slug + seo) without repeating
// IframeEmbed + analytics + timestamps boilerplate.
function verumflowImportedPage(input: {
  id: string;
  title: string;
  slug: string;
  htmlFile: string;
  metaTitle: string;
  metaDescription: string;
  status?: "published" | "draft";
  canonicalPath?: string;
}): PageSeed {
  return {
    id: input.id,
    projectId: "verumflow-ch",
    title: input.title,
    slug: input.slug,
    status: input.status ?? "published",
    puckData: importedSitePuckData(
      `${VERUMFLOW_IMPORT_BASE}/${input.htmlFile}`,
      input.metaTitle,
    ),
    seo: {
      metaTitle: input.metaTitle,
      metaDescription: input.metaDescription,
      canonicalUrl: `https://verumflow.ch${input.canonicalPath ?? input.slug}`,
      indexable: input.status !== "draft",
      internalSearch: input.status !== "draft",
      og: {},
    },
    analytics: {
      pageviews7d: 0,
      pageviews30d: 0,
      bounceRate: 0,
      avgPosition: 0,
      topKeyword: "",
      seoScore: 0,
    },
    createdAt: new Date("2026-05-10T14:00:00Z"),
    updatedAt: new Date("2026-05-10T14:00:00Z"),
  };
}

export const VERUMFLOW_PAGES: PageSeed[] = [
  verumflowImportedPage({
    id: "home",
    title: "VerumFlow.ch",
    slug: "/",
    htmlFile: "index.html",
    metaTitle: "VerumFlow — Sistemi gestionali su misura, in 14 giorni",
    metaDescription:
      "AI-native agency. Costruiamo software custom per micro-imprese in Ticino e Nord Italia.",
  }),
  verumflowImportedPage({
    id: "servizi",
    title: "Servizi",
    slug: "/servizi",
    htmlFile: "servizi.html",
    metaTitle: "Servizi — VerumFlow",
    metaDescription:
      "Sistemi gestionali, VerumAudit, automazioni AI e integrazioni. Quattro modi di costruire il tuo sistema su misura.",
  }),
  verumflowImportedPage({
    id: "case-studies",
    title: "Case studies",
    slug: "/case-studies",
    htmlFile: "case-studies.html",
    metaTitle: "Case studies — VerumFlow",
    metaDescription:
      "Sistemi reali, misurabili. Quattro micro-imprese in Ticino e Nord Italia.",
  }),
  verumflowImportedPage({
    id: "case-af-real-estate",
    title: "Case · A&F Real Estate",
    slug: "/case-studies/a-f-real-estate",
    htmlFile: "case-af-real-estate.html",
    metaTitle: "A&F Real Estate — Case Study · VerumFlow",
    metaDescription:
      "CRM custom centralizzato in 14 giorni: pipeline mandati, scheda immobile, calendario visite, automazione follow-up.",
  }),
  verumflowImportedPage({
    id: "case-stanzasemplice",
    title: "Case · StanzaSemplice",
    slug: "/case-studies/stanzasemplice",
    htmlFile: "case-stanzasemplice.html",
    metaTitle: "StanzaSemplice — Case Study · VerumFlow",
    metaDescription:
      "Sistema property-rental end-to-end: prenotazioni, prezzi dinamici, pulizie e fatturazione in un solo flusso.",
  }),
  verumflowImportedPage({
    id: "contatti",
    title: "Contatti",
    slug: "/contatti",
    htmlFile: "contatti.html",
    metaTitle: "Contatti — VerumFlow",
    metaDescription:
      "Scrivici a sales@verumflow.com o prenota un VerumAudit. Canton Ticino, Svizzera.",
  }),
  verumflowImportedPage({
    id: "book",
    title: "Prenota Audit",
    slug: "/book",
    htmlFile: "book.html",
    metaTitle: "Prenota VerumAudit — VerumFlow",
    metaDescription:
      "45 minuti di voice-AI audit con il tuo team. Blueprint con preventivo fisso entro 72 ore. Nessun contratto vincolante prima.",
  }),
  verumflowImportedPage({
    id: "privacy",
    title: "Privacy Policy",
    slug: "/privacy",
    htmlFile: "privacy.html",
    metaTitle: "Privacy Policy — VerumFlow",
    metaDescription:
      "Informativa privacy ai sensi del GDPR e della LPD svizzera.",
  }),
  verumflowImportedPage({
    id: "cookie",
    title: "Cookie Policy",
    slug: "/cookie",
    htmlFile: "cookie.html",
    metaTitle: "Cookie Policy — VerumFlow",
    metaDescription:
      "Quali cookie usiamo, perché, e come gestire le preferenze.",
  }),
  verumflowImportedPage({
    id: "mobile-preview",
    title: "Mobile Preview",
    slug: "/mobile-preview",
    htmlFile: "mobile-preview.html",
    metaTitle: "VerumFlow — Mobile Preview",
    metaDescription:
      "Preview interna mobile-first del sito. Non indicizzata.",
    status: "draft",
  }),
];

export const CARFI_PAGES: PageSeed[] = [
  {
    id: "home",
    projectId: "impresa-edile-carfi",
    title: "Home",
    slug: "/",
    status: "published",
    puckData: heroLandingTemplate({
      siteName: "Impresa Edile Carfi",
      headline: "Ristrutturazioni chiavi in mano in Ticino",
      subheadline:
        "40 anni di esperienza, 200+ cantieri. Preventivo gratuito in 48h.",
      ctaText: "Richiedi preventivo",
      ctaHref: "/contatti",
    }),
    seo: {
      metaTitle:
        "Impresa Edile Carfi — Ristrutturazioni Ticino",
      metaDescription:
        "40 anni di esperienza in ristrutturazioni. Preventivo in 48h.",
      canonicalUrl: "https://impresaedilecarfi.ch/",
      indexable: true,
      internalSearch: false,
      og: {},
    },
    analytics: {
      pageviews7d: 312,
      pageviews30d: 1102,
      bounceRate: 0.45,
      avgPosition: 6.2,
      topKeyword: "ristrutturazioni ticino",
      seoScore: 78,
    },
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: "progetti",
    projectId: "impresa-edile-carfi",
    title: "Progetti",
    slug: "/progetti",
    status: "published",
    puckData: simplePageTemplate({
      title: "I nostri progetti",
      body: "Galleria dei cantieri completati negli ultimi anni.",
    }),
    seo: {
      metaTitle: "Progetti Realizzati — Impresa Edile Carfi",
      metaDescription: "Galleria cantieri e ristrutturazioni.",
      canonicalUrl: "https://impresaedilecarfi.ch/progetti",
      indexable: true,
      internalSearch: true,
      og: {},
    },
    analytics: {
      pageviews7d: 98,
      pageviews30d: 354,
      bounceRate: 0.52,
      avgPosition: 11.4,
      topKeyword: "ristrutturazioni esempi",
      seoScore: 72,
    },
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: "servizi",
    projectId: "impresa-edile-carfi",
    title: "Servizi",
    slug: "/servizi",
    status: "published",
    puckData: simplePageTemplate({
      title: "Servizi",
      body: "Lista dei servizi offerti dall'impresa.",
    }),
    seo: {
      metaTitle: "Servizi Edili — Impresa Edile Carfi",
      metaDescription:
        "Ristrutturazioni, progetti chiavi in mano, consulenze.",
      canonicalUrl: "https://impresaedilecarfi.ch/servizi",
      indexable: true,
      internalSearch: true,
      og: {},
    },
    analytics: {
      pageviews7d: 52,
      pageviews30d: 184,
      bounceRate: 0.58,
      avgPosition: 13.2,
      topKeyword: "servizi impresa edile",
      seoScore: 68,
    },
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: "chi-siamo",
    projectId: "impresa-edile-carfi",
    title: "Chi siamo",
    slug: "/chi-siamo",
    status: "published",
    puckData: simplePageTemplate({
      title: "Chi siamo",
      body: "La storia di Carfi: da 40 anni al fianco dei clienti.",
    }),
    seo: {
      metaTitle: "Chi siamo — Impresa Edile Carfi",
      metaDescription: "40 anni di storia e cantieri.",
      canonicalUrl: "https://impresaedilecarfi.ch/chi-siamo",
      indexable: true,
      internalSearch: true,
      og: {},
    },
    analytics: {
      pageviews7d: 34,
      pageviews30d: 128,
      bounceRate: 0.62,
      avgPosition: 14,
      topKeyword: "carfi chi siamo",
      seoScore: 70,
    },
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: "contatti",
    projectId: "impresa-edile-carfi",
    title: "Contatti",
    slug: "/contatti",
    status: "published",
    puckData: contactPageTemplate(),
    seo: {
      metaTitle: "Contatti — Impresa Edile Carfi",
      metaDescription: "Contattaci per un preventivo gratuito.",
      canonicalUrl: "https://impresaedilecarfi.ch/contatti",
      indexable: true,
      internalSearch: false,
      og: {},
    },
    analytics: {
      pageviews7d: 88,
      pageviews30d: 312,
      bounceRate: 0.42,
      avgPosition: 9,
      topKeyword: "contatti impresa edile",
      seoScore: 74,
    },
    createdAt: now(),
    updatedAt: now(),
  },
];

export const BIO_PAGES: PageSeed[] = [
  {
    id: "home",
    projectId: "consulting-bio",
    title: "Home",
    slug: "/",
    status: "draft",
    puckData: simplePageTemplate({
      title: "Consulting Bio",
      body: "Bozza homepage.",
    }),
    seo: {
      metaTitle: "Consulting Bio",
      metaDescription: "",
      canonicalUrl: "https://consulting-bio.eu/",
      indexable: false,
      internalSearch: false,
      og: {},
    },
    analytics: {
      pageviews7d: 0,
      pageviews30d: 0,
      bounceRate: 0,
      avgPosition: 0,
      topKeyword: "—",
      seoScore: 35,
    },
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: "services",
    projectId: "consulting-bio",
    title: "Servizi",
    slug: "/servizi",
    status: "draft",
    puckData: simplePageTemplate({
      title: "Servizi",
      body: "TBD.",
    }),
    seo: {
      metaTitle: "Servizi",
      metaDescription: "",
      canonicalUrl: "https://consulting-bio.eu/servizi",
      indexable: false,
      internalSearch: false,
      og: {},
    },
    analytics: {
      pageviews7d: 0,
      pageviews30d: 0,
      bounceRate: 0,
      avgPosition: 0,
      topKeyword: "—",
      seoScore: 30,
    },
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: "contact",
    projectId: "consulting-bio",
    title: "Contatti",
    slug: "/contatti",
    status: "draft",
    puckData: simplePageTemplate({
      title: "Contatti",
      body: "TBD.",
    }),
    seo: {
      metaTitle: "Contatti",
      metaDescription: "",
      canonicalUrl: "https://consulting-bio.eu/contatti",
      indexable: false,
      internalSearch: false,
      og: {},
    },
    analytics: {
      pageviews7d: 0,
      pageviews30d: 0,
      bounceRate: 0,
      avgPosition: 0,
      topKeyword: "—",
      seoScore: 25,
    },
    createdAt: now(),
    updatedAt: now(),
  },
];

import { MOCK_COLLECTIONS } from "./cms";
import { buildCollectionTemplatePage } from "@/lib/cms/collection-template";

const COLLECTION_TEMPLATE_PAGES: PageSeed[] = MOCK_COLLECTIONS.map((c) =>
  buildCollectionTemplatePage(c),
);

export const ALL_PAGES = [
  ...VERUMFLOW_PAGES,
  ...CARFI_PAGES,
  ...BIO_PAGES,
  ...COLLECTION_TEMPLATE_PAGES,
];
