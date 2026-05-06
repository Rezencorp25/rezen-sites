/**
 * S13 — Test connection per provider supportati.
 *
 * Ogni test fa una chiamata API minimale, idempotente, low-cost. Se la
 * risposta indica autenticazione OK, ritorna `{ok: true}`. Altrimenti
 * `{ok: false, error: "..."}` con messaggio leggibile per UI.
 *
 * Eseguito SEMPRE server-side (Cloud Functions). I valori delle chiavi
 * NON vengono mai loggati. In caso di errore, `error` è ritornato sanitized.
 */

import { logger } from "firebase-functions";

export type TestResult = { ok: true } | { ok: false; error: string };

type Fields = Record<string, string>;

function bad(error: string): TestResult {
  return { ok: false, error };
}

function ok(): TestResult {
  return { ok: true };
}

function safeFetch(
  url: string,
  init: RequestInit,
  timeoutMs = 8000,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...init, signal: controller.signal }).finally(() => {
    clearTimeout(timer);
  });
}

// ─── Provider tests ──────────────────────────────────────────────────

async function testAnthropic(fields: Fields): Promise<TestResult> {
  const apiKey = fields.apiKey;
  if (!apiKey) return bad("Manca apiKey");
  try {
    // Minimal completion: 1 token output. Conferma auth + rate-limit access.
    const res = await safeFetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5",
        max_tokens: 1,
        messages: [{ role: "user", content: "ping" }],
      }),
    });
    if (res.status === 401 || res.status === 403) {
      return bad("API key non valida (401/403 da Anthropic)");
    }
    if (!res.ok) {
      const txt = await res.text();
      return bad(`Anthropic ${res.status}: ${txt.slice(0, 120)}`);
    }
    return ok();
  } catch (err) {
    return bad(formatErr(err, "Anthropic"));
  }
}

async function testOpenAI(fields: Fields): Promise<TestResult> {
  const apiKey = fields.apiKey;
  if (!apiKey) return bad("Manca apiKey");
  try {
    const res = await safeFetch("https://api.openai.com/v1/models", {
      method: "GET",
      headers: { authorization: `Bearer ${apiKey}` },
    });
    if (res.status === 401) return bad("API key non valida (401 da OpenAI)");
    if (!res.ok) {
      return bad(`OpenAI ${res.status}: ${(await res.text()).slice(0, 120)}`);
    }
    return ok();
  } catch (err) {
    return bad(formatErr(err, "OpenAI"));
  }
}

async function testGemini(fields: Fields): Promise<TestResult> {
  const apiKey = fields.apiKey;
  if (!apiKey) return bad("Manca apiKey");
  try {
    const res = await safeFetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`,
      { method: "GET" },
    );
    if (res.status === 400 || res.status === 403) {
      return bad("API key non valida (Gemini)");
    }
    if (!res.ok) {
      return bad(`Gemini ${res.status}: ${(await res.text()).slice(0, 120)}`);
    }
    return ok();
  } catch (err) {
    return bad(formatErr(err, "Gemini"));
  }
}

async function testDataForSEO(fields: Fields): Promise<TestResult> {
  const login = fields.login;
  const password = fields.password;
  if (!login || !password) return bad("Manca login o password");
  try {
    const auth = Buffer.from(`${login}:${password}`).toString("base64");
    const res = await safeFetch(
      "https://api.dataforseo.com/v3/appendix/user_data",
      {
        method: "GET",
        headers: { authorization: `Basic ${auth}` },
      },
    );
    if (res.status === 401) return bad("Credenziali DataForSEO non valide");
    if (!res.ok) {
      return bad(
        `DataForSEO ${res.status}: ${(await res.text()).slice(0, 120)}`,
      );
    }
    const body = (await res.json()) as { status_code?: number };
    if (body.status_code !== 20000) {
      return bad(
        `DataForSEO status_code ${body.status_code} (atteso 20000)`,
      );
    }
    return ok();
  } catch (err) {
    return bad(formatErr(err, "DataForSEO"));
  }
}

async function testGa4(fields: Fields): Promise<TestResult> {
  const propertyId = fields.propertyId;
  const serviceAccountKey = fields.serviceAccountKey;
  if (!propertyId || !serviceAccountKey) {
    return bad("Manca propertyId o serviceAccountKey");
  }
  let parsed: { client_email?: string; private_key?: string };
  try {
    parsed = JSON.parse(serviceAccountKey);
  } catch {
    return bad("serviceAccountKey non è JSON valido");
  }
  if (!parsed.client_email || !parsed.private_key) {
    return bad("Service Account JSON manca client_email o private_key");
  }
  try {
    const accessToken = await fetchGoogleServiceAccountToken({
      clientEmail: parsed.client_email,
      privateKey: parsed.private_key,
      scopes: ["https://www.googleapis.com/auth/analytics.readonly"],
    });
    const res = await safeFetch(
      `https://analyticsdata.googleapis.com/v1beta/properties/${encodeURIComponent(propertyId)}:runReport`,
      {
        method: "POST",
        headers: {
          authorization: `Bearer ${accessToken}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          dateRanges: [{ startDate: "yesterday", endDate: "yesterday" }],
          dimensions: [{ name: "date" }],
          metrics: [{ name: "screenPageViews" }],
          limit: 1,
        }),
      },
    );
    if (res.status === 403) {
      return bad(
        "Service Account non ha accesso al property GA4 (invitalo come Viewer)",
      );
    }
    if (res.status === 404) {
      return bad("Property ID GA4 non trovato (verifica numero)");
    }
    if (!res.ok) {
      return bad(`GA4 ${res.status}: ${(await res.text()).slice(0, 120)}`);
    }
    return ok();
  } catch (err) {
    return bad(formatErr(err, "GA4"));
  }
}

async function testAdSense(fields: Fields): Promise<TestResult> {
  const clientId = fields.clientId;
  const clientSecret = fields.clientSecret;
  const refreshToken = fields.refreshToken;
  if (!clientId || !clientSecret || !refreshToken) {
    return bad("Manca clientId / clientSecret / refreshToken");
  }
  try {
    // Refresh access token con refresh_token grant.
    const tokenRes = await safeFetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }).toString(),
    });
    if (!tokenRes.ok) {
      return bad(
        `OAuth refresh fallito (${tokenRes.status}): verifica clientId/Secret/refreshToken`,
      );
    }
    const { access_token } = (await tokenRes.json()) as {
      access_token?: string;
    };
    if (!access_token) return bad("OAuth response manca access_token");

    // Ping AdSense Management API.
    const res = await safeFetch(
      "https://adsense.googleapis.com/v2/accounts",
      {
        method: "GET",
        headers: { authorization: `Bearer ${access_token}` },
      },
    );
    if (res.status === 403) {
      return bad("AdSense API non accessibile (verifica scope adsense.readonly)");
    }
    if (!res.ok) {
      return bad(
        `AdSense ${res.status}: ${(await res.text()).slice(0, 120)}`,
      );
    }
    return ok();
  } catch (err) {
    return bad(formatErr(err, "AdSense"));
  }
}

// ─── Google Service Account JWT helper ───────────────────────────────

import { createSign } from "node:crypto";

async function fetchGoogleServiceAccountToken(opts: {
  clientEmail: string;
  privateKey: string;
  scopes: string[];
}): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = base64UrlEncode(
    JSON.stringify({ alg: "RS256", typ: "JWT" }),
  );
  const payload = base64UrlEncode(
    JSON.stringify({
      iss: opts.clientEmail,
      scope: opts.scopes.join(" "),
      aud: "https://oauth2.googleapis.com/token",
      exp: now + 3600,
      iat: now,
    }),
  );
  const unsigned = `${header}.${payload}`;
  const signer = createSign("RSA-SHA256");
  signer.update(unsigned);
  signer.end();
  const signature = signer.sign(opts.privateKey).toString("base64url");
  const jwt = `${unsigned}.${signature}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }).toString(),
  });
  if (!res.ok) {
    throw new Error(
      `Service account auth failed ${res.status}: ${(await res.text()).slice(0, 120)}`,
    );
  }
  const body = (await res.json()) as { access_token?: string };
  if (!body.access_token) throw new Error("No access_token in response");
  return body.access_token;
}

function base64UrlEncode(input: string): string {
  return Buffer.from(input, "utf8").toString("base64url");
}

function formatErr(err: unknown, providerLabel: string): string {
  if (err instanceof Error) {
    if (err.name === "AbortError") return `${providerLabel}: timeout (>8s)`;
    return `${providerLabel}: ${err.message.slice(0, 160)}`;
  }
  return `${providerLabel}: errore sconosciuto`;
}

// ─── Dispatcher ──────────────────────────────────────────────────────

const TESTS: Record<string, (fields: Fields) => Promise<TestResult>> = {
  anthropic: testAnthropic,
  openai: testOpenAI,
  gemini: testGemini,
  dataforseo: testDataForSEO,
  adsense: testAdSense,
  ga4: testGa4,
};

export async function runProviderTest(
  provider: string,
  fields: Fields,
): Promise<TestResult> {
  const fn = TESTS[provider];
  if (!fn) {
    logger.warn(`runProviderTest: provider ${provider} non supportato`);
    return bad(`Provider ${provider} non supportato`);
  }
  return fn(fields);
}
