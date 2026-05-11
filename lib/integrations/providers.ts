/**
 * S13 — Provider registry (shared client + Cloud Functions).
 *
 * Single source of truth per i provider supportati nel modulo Self-Service
 * Integrations. Lato client guida UI; lato CF (mirror in functions/src/) guida
 * test connection + Secret Manager naming.
 *
 * Naming convention Secret Manager:
 *  - Workspace-level default: `ws-{workspaceId}-{providerId}`
 *  - Project-level override:  `proj-{projectId}-{providerId}`
 *
 * I value salvati nel Secret Manager sono SEMPRE JSON serialized di tutti i
 * field del provider (anche provider single-field), così il consumer fa
 * sempre `JSON.parse(value)` senza branching.
 */

export type IntegrationProviderId =
  | "anthropic"
  | "openai"
  | "gemini"
  | "dataforseo"
  | "adsense"
  | "ga4"
  | "cloudflare";

export type IntegrationCategory =
  | "llm"
  | "seo"
  | "ads"
  | "analytics"
  | "dns";

export type IntegrationFieldType = "text" | "password" | "json";

export type IntegrationField = {
  key: string;
  label: string;
  type: IntegrationFieldType;
  placeholder?: string;
  required: boolean;
  /**
   * Hint visualizzato sotto il campo (es. "Inizia con sk-..." per OpenAI).
   */
  hint?: string;
  /** Quando type=json: testo con esempio shape (display only, non validato). */
  exampleJson?: string;
};

export type ProviderGuide = {
  /** Headline modal "Come ottenere le credenziali". */
  headline: string;
  /** Steps numerati. */
  steps: string[];
  /** Link docs ufficiali. */
  docsUrl: string;
};

export type IntegrationProviderDef = {
  id: IntegrationProviderId;
  label: string;
  category: IntegrationCategory;
  /** Schema dei field obbligatori per questo provider. */
  fields: IntegrationField[];
  /**
   * Field key da usare per generare il "last4" mostrato in UI dopo salvataggio
   * (mai esponiamo la chiave intera). Per JSON, last4 è preso da una key
   * specifica nel JSON parsed (es. "client_email").
   */
  last4Source: { fieldKey: string; jsonKey?: string };
  guide: ProviderGuide;
  /** Difficoltà setup user-side (mostrato come stelline UI). */
  difficulty: 1 | 2 | 3 | 4 | 5;
  /** Descrizione breve per card UI. */
  description: string;
};

export const INTEGRATION_PROVIDERS: Record<
  IntegrationProviderId,
  IntegrationProviderDef
> = {
  anthropic: {
    id: "anthropic",
    label: "Anthropic Claude",
    category: "llm",
    description: "API key per chiamate ai modelli Claude (Sonnet, Opus, Haiku).",
    difficulty: 1,
    fields: [
      {
        key: "apiKey",
        label: "API Key",
        type: "password",
        placeholder: "sk-ant-api03-...",
        required: true,
        hint: "Inizia con sk-ant-",
      },
    ],
    last4Source: { fieldKey: "apiKey" },
    guide: {
      headline: "Come ottenere la chiave Anthropic",
      steps: [
        "Vai su console.anthropic.com",
        "Accedi o crea un account workspace",
        "Apri 'Settings' → 'API Keys'",
        "Click 'Create Key', dai un nome descrittivo (es. 'rezen-sites')",
        "Copia subito la chiave (mostrata una sola volta) e incollala qui",
      ],
      docsUrl: "https://docs.anthropic.com/en/api/getting-started",
    },
  },

  openai: {
    id: "openai",
    label: "OpenAI",
    category: "llm",
    description: "API key per chiamate ai modelli GPT-4, GPT-5, o-series.",
    difficulty: 1,
    fields: [
      {
        key: "apiKey",
        label: "API Key",
        type: "password",
        placeholder: "sk-proj-...",
        required: true,
        hint: "Inizia con sk-proj- o sk-",
      },
    ],
    last4Source: { fieldKey: "apiKey" },
    guide: {
      headline: "Come ottenere la chiave OpenAI",
      steps: [
        "Vai su platform.openai.com/api-keys",
        "Click 'Create new secret key'",
        "Scegli 'Restricted' permissions (consigliato: solo Models + Chat)",
        "Copia la chiave generata (mostrata una sola volta) e incollala qui",
      ],
      docsUrl: "https://platform.openai.com/docs/api-reference/authentication",
    },
  },

  gemini: {
    id: "gemini",
    label: "Google Gemini",
    category: "llm",
    description: "API key per Google AI Studio (Gemini Pro, Flash, 2.0).",
    difficulty: 1,
    fields: [
      {
        key: "apiKey",
        label: "API Key",
        type: "password",
        placeholder: "AIzaSy...",
        required: true,
        hint: "Inizia con AIza",
      },
    ],
    last4Source: { fieldKey: "apiKey" },
    guide: {
      headline: "Come ottenere la chiave Gemini",
      steps: [
        "Vai su aistudio.google.com/app/apikey",
        "Click 'Create API key' (puoi associarla a un progetto Google Cloud)",
        "Copia la chiave generata e incollala qui",
      ],
      docsUrl: "https://ai.google.dev/gemini-api/docs/api-key",
    },
  },

  dataforseo: {
    id: "dataforseo",
    label: "DataForSEO",
    category: "seo",
    description: "SERP, keyword research, backlink data per moduli SEO/AEO.",
    difficulty: 2,
    fields: [
      {
        key: "login",
        label: "API Login (email)",
        type: "text",
        placeholder: "you@example.com",
        required: true,
      },
      {
        key: "password",
        label: "API Password",
        type: "password",
        placeholder: "32-char generated password",
        required: true,
        hint: "Generata in dashboard, NON è la password account",
      },
    ],
    last4Source: { fieldKey: "password" },
    guide: {
      headline: "Come ottenere le credenziali DataForSEO",
      steps: [
        "Vai su app.dataforseo.com e crea account (richiede carta credito, primo $1 free)",
        "Apri 'My API Access' nel menu account",
        "Trova la sezione 'API credentials': vedi la tua API Login (email)",
        "Click 'Generate new password' per generare una password API a 32 caratteri",
        "Copia login + password generata e incollali qui",
      ],
      docsUrl: "https://docs.dataforseo.com/v3/auth/",
    },
  },

  adsense: {
    id: "adsense",
    label: "Google AdSense",
    category: "ads",
    description: "Revenue + impressions + RPM per dashboard monetizzazione.",
    difficulty: 4,
    fields: [
      {
        key: "clientId",
        label: "OAuth Client ID",
        type: "text",
        placeholder: "xxxxx.apps.googleusercontent.com",
        required: true,
      },
      {
        key: "clientSecret",
        label: "OAuth Client Secret",
        type: "password",
        placeholder: "GOCSPX-...",
        required: true,
      },
      {
        key: "refreshToken",
        label: "Refresh Token",
        type: "password",
        placeholder: "1//0g...",
        required: true,
        hint: "Generato una sola volta tramite OAuth Playground",
      },
    ],
    last4Source: { fieldKey: "refreshToken" },
    guide: {
      headline: "Come ottenere le credenziali AdSense",
      steps: [
        "Vai su console.cloud.google.com/apis/credentials e crea un OAuth Client (Web application)",
        "Aggiungi 'https://developers.google.com/oauthplayground' come Authorized redirect URI",
        "Copia Client ID + Client Secret",
        "Vai su developers.google.com/oauthplayground (top-right gear: spunta 'Use your own OAuth credentials' e incolla Client ID/Secret)",
        "Step 1: scegli scope 'https://www.googleapis.com/auth/adsense.readonly' → Authorize",
        "Step 2: dopo consent screen, click 'Exchange authorization code for tokens'",
        "Copia il 'Refresh token' generato e incollalo qui",
        "Importante: l'account Google usato deve essere il proprietario del publisher AdSense",
      ],
      docsUrl: "https://developers.google.com/adsense/management/getting-started",
    },
  },

  cloudflare: {
    id: "cloudflare",
    label: "Cloudflare DNS",
    category: "dns",
    description:
      "Gestisce record DNS via Cloudflare (gratis). Funziona per qualunque dominio dopo che i nameservers puntano a Cloudflare — la registrazione resta su GoDaddy/altri.",
    difficulty: 2,
    fields: [
      {
        key: "apiToken",
        label: "API Token",
        type: "password",
        placeholder: "Y...",
        required: true,
        hint: "Token con permessi Zone:Read + DNS:Edit",
      },
    ],
    last4Source: { fieldKey: "apiToken" },
    guide: {
      headline: "Come ottenere il token Cloudflare",
      steps: [
        "Crea account gratis su cloudflare.com (se non ce l'hai)",
        "Aggiungi il tuo dominio (es. verumflow.com) a Cloudflare → ti dà 2 nameservers",
        "Su GoDaddy: cambia i nameservers del dominio puntandoli a quelli Cloudflare (operazione 1 volta)",
        "Vai su dash.cloudflare.com/profile/api-tokens",
        "Click 'Create Token' → template 'Edit zone DNS' (o custom con Zone:Read + DNS:Edit)",
        "Zone Resources: 'Include All zones' (o solo il tuo dominio)",
        "Copia il token mostrato e incollalo qui — viene mostrato una sola volta",
      ],
      docsUrl:
        "https://developers.cloudflare.com/fundamentals/api/get-started/create-token/",
    },
  },

  ga4: {
    id: "ga4",
    label: "Google Analytics 4",
    category: "analytics",
    description:
      "Pageviews + sessioni + conversion events per dashboard reali (no mock).",
    difficulty: 3,
    fields: [
      {
        key: "propertyId",
        label: "GA4 Property ID",
        type: "text",
        placeholder: "123456789",
        required: true,
        hint: "9-10 cifre, NON 'G-XXX' (quello è measurement ID diverso)",
      },
      {
        key: "serviceAccountKey",
        label: "Service Account JSON",
        type: "json",
        required: true,
        hint: "Incolla il contenuto completo del file .json scaricato",
        exampleJson: `{\n  "type": "service_account",\n  "project_id": "...",\n  "client_email": "ga4-reader@...",\n  "private_key": "-----BEGIN PRIVATE KEY-----\\n..."\n}`,
      },
    ],
    last4Source: { fieldKey: "serviceAccountKey", jsonKey: "client_email" },
    guide: {
      headline: "Come ottenere le credenziali GA4",
      steps: [
        "GA4 Admin → 'Property settings' → copia 'Property ID' (numero a 9-10 cifre)",
        "Vai su console.cloud.google.com → IAM & Admin → Service Accounts",
        "Click 'Create Service Account', dai un nome (es. 'ga4-reader-rezen')",
        "Salta i ruoli (li daremo direttamente in GA4), Done",
        "Apri il service account creato → tab 'Keys' → 'Add Key' → JSON → scarica il file",
        "Torna in GA4: Admin → 'Property Access Management' → '+' → invita l'email del service account come 'Viewer'",
        "Apri il file .json scaricato, copia tutto il contenuto e incollalo qui",
      ],
      docsUrl:
        "https://developers.google.com/analytics/devguides/reporting/data/v1/quickstart-client-libraries",
    },
  },
};

export const INTEGRATION_CATEGORY_LABEL: Record<IntegrationCategory, string> = {
  llm: "LLM (AI Visibility GEO)",
  seo: "SEO data",
  ads: "Pubblicità",
  analytics: "Web Analytics",
  dns: "Domini & DNS",
};

export const INTEGRATION_PROVIDER_ORDER: IntegrationProviderId[] = [
  "anthropic",
  "openai",
  "gemini",
  "dataforseo",
  "ga4",
  "adsense",
  "cloudflare",
];

/**
 * Calcola last4 da una field map fornita dal client (pre-save).
 * Per JSON usa jsonKey nel parsed object; per text/password prende la stringa.
 */
export function computeLast4(
  provider: IntegrationProviderDef,
  fields: Record<string, string>,
): string {
  const raw = fields[provider.last4Source.fieldKey];
  if (!raw) return "";
  if (provider.last4Source.jsonKey) {
    try {
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      const v = parsed[provider.last4Source.jsonKey];
      if (typeof v === "string" && v.length >= 4) return v.slice(-4);
      return "";
    } catch {
      return "";
    }
  }
  return raw.length >= 4 ? raw.slice(-4) : "";
}

/**
 * Secret Manager resource name builder (workspace o project scope).
 */
export function buildSecretName(opts: {
  scope: "workspace" | "project";
  scopeId: string;
  provider: IntegrationProviderId;
}): string {
  const prefix = opts.scope === "workspace" ? "ws" : "proj";
  return `${prefix}-${opts.scopeId}-${opts.provider}`;
}

/**
 * Workspace ID singleton oggi (multi-workspace future). Usato come scopeId
 * quando scope=workspace.
 */
export const DEFAULT_WORKSPACE_ID = "default";
