import "server-only";

import { GoogleAuth } from "google-auth-library";

/**
 * S7.14 sub-C — Firebase App Hosting REST API wrapper.
 *
 * Endpoint base: https://firebaseapphosting.googleapis.com/v1beta/
 *
 * Authentication: Application Default Credentials con scope `cloud-platform`.
 * In Cloud Run il metadata server fornisce un token per la service account
 * di runtime. In locale dev: `gcloud auth application-default login`.
 *
 * IAM richiesto sulla SA Cloud Run:
 *   - roles/firebaseapphosting.admin (o granulare: domains.create + get)
 *   Aggiunto manualmente o via apphosting deploy script (TODO docs).
 *
 * Operazioni esposte:
 *   - addCustomDomain: registra dominio custom su un backend, scatena
 *     provisioning Let's Encrypt cert (async; check status separatamente).
 *   - getCustomDomain: legge stato dominio (cert status, ssl ready, ecc.).
 *
 * Le risposte sono modellate semplificate per i campi che ci servono.
 * Per altri campi vedi: https://firebase.google.com/docs/reference/apphosting/rest
 */

const API_BASE = "https://firebaseapphosting.googleapis.com/v1beta";

let authClient: GoogleAuth | null = null;

function getAuth(): GoogleAuth {
  if (!authClient) {
    authClient = new GoogleAuth({
      scopes: ["https://www.googleapis.com/auth/cloud-platform"],
    });
  }
  return authClient;
}

async function authedFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const client = await getAuth().getClient();
  const token = await client.getAccessToken();
  if (!token.token) {
    throw new Error("Failed to obtain GCP access token (no credentials in env)");
  }
  return fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      authorization: `Bearer ${token.token}`,
      "content-type": "application/json",
      accept: "application/json",
      ...(init.headers ?? {}),
    },
  });
}

export type AppHostingBackendCoords = {
  project: string; // es. "rezen-sites-preview"
  location: string; // es. "europe-west4"
  backend: string; // es. "rezen-sites-preview"
};

/**
 * Cert status che ritorna App Hosting. Aggregato semplificato per UI:
 *   - "pending"    → registrazione accettata, cert ancora in emissione
 *   - "active"     → cert emesso, dominio servizia HTTPS
 *   - "failed"     → emissione fallita (es. DNS A record non punta al backend)
 */
export type AppHostingDomainStatus = "pending" | "active" | "failed" | "unknown";

export async function addCustomDomain(opts: {
  coords: AppHostingBackendCoords;
  domain: string;
}): Promise<{ operationName: string }> {
  const { coords, domain } = opts;
  const parent = `projects/${coords.project}/locations/${coords.location}/backends/${coords.backend}`;
  // L'API è asincrona: ritorna un long-running Operation. Il body crea il
  // sub-resource `domains/{domain}` sotto il backend.
  const res = await authedFetch(
    `/${parent}/domains?domainId=${encodeURIComponent(domain)}`,
    {
      method: "POST",
      body: JSON.stringify({}),
    },
  );
  if (res.status === 409) {
    // Già registrato — non è errore. Ritorniamo un op fake per uniformità.
    return { operationName: `existing/${domain}` };
  }
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`App Hosting domains.create ${res.status}: ${txt.slice(0, 240)}`);
  }
  const body = (await res.json()) as { name?: string };
  return { operationName: body.name ?? "" };
}

export async function getCustomDomain(opts: {
  coords: AppHostingBackendCoords;
  domain: string;
}): Promise<{ status: AppHostingDomainStatus; raw: unknown }> {
  const { coords, domain } = opts;
  const name = `projects/${coords.project}/locations/${coords.location}/backends/${coords.backend}/domains/${domain}`;
  const res = await authedFetch(`/${name}`);
  if (res.status === 404) {
    return { status: "unknown", raw: { error: "not_registered" } };
  }
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`App Hosting domains.get ${res.status}: ${txt.slice(0, 240)}`);
  }
  const body = (await res.json()) as Record<string, unknown>;
  // Lo schema App Hosting domain include `customDomainStatus.certState` con
  // valori CERT_PREPARING / CERT_VALIDATING / CERT_ACTIVE / CERT_EXPIRING / CERT_ERROR.
  // Per oggi normalizziamo grossolanamente; affineremo quando vedremo
  // risposte reali nei test sub-C.
  const certState =
    ((body.customDomainStatus as Record<string, unknown>)?.certState as string | undefined) ??
    "";
  let status: AppHostingDomainStatus = "unknown";
  if (certState === "CERT_ACTIVE") status = "active";
  else if (certState === "CERT_ERROR") status = "failed";
  else if (certState) status = "pending";
  return { status, raw: body };
}

/**
 * Coords del backend di default (l'unico oggi: `rezen-sites-preview`).
 * Letti da env vars così Production / Preview / Staging si differenziano
 * con minimo cambio configurazione.
 */
export function defaultBackendCoords(): AppHostingBackendCoords {
  return {
    project:
      process.env.GCLOUD_PROJECT ??
      process.env.GOOGLE_CLOUD_PROJECT ??
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ??
      "rezen-sites-preview",
    location: process.env.APPHOSTING_LOCATION ?? "europe-west4",
    backend: process.env.APPHOSTING_BACKEND_ID ?? "rezen-sites-preview",
  };
}
