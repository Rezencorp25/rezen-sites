import "server-only";

import type {
  DnsProvider,
  DnsRecord,
  DnsRecordType,
  DomainSummary,
} from "./types";
import { DnsProviderError } from "./types";

/**
 * S7.14 sub-A — GoDaddy DNS provider.
 *
 * Docs: developer.godaddy.com — endpoints v1 + v2. Auth: header
 * `Authorization: sso-key {API_KEY}:{API_SECRET}`. Production keys (NOT
 * OTE/test) sono richieste per vedere domini reali. Rate limit: 60 req/min
 * burst, 5 req/min sustained per endpoint.
 *
 * Note importanti:
 *  - GET /v1/domains/{domain}/records/{type}/{name} ritorna ARRAY (un nome
 *    può avere multipli value, es. round-robin A records).
 *  - PUT /v1/domains/{domain}/records/{type}/{name} REPLACE l'array intero
 *    per quel (type, name) tuple — niente patch. Per upsert idempotente
 *    mergiamo client-side.
 *  - apex domain è rappresentato come name="@". Quando l'utente passa
 *    `verify.example.com`, dobbiamo splittare in sub="verify" + apex="example.com".
 *  - GoDaddy NON espone API per provisionare cert SSL — lo facciamo via
 *    App Hosting (sub-C).
 */

const BASE = "https://api.godaddy.com";
const DEFAULT_TTL = 600;

export class GoDaddyProvider implements DnsProvider {
  readonly id = "godaddy" as const;

  constructor(
    private readonly apiKey: string,
    private readonly apiSecret: string,
  ) {
    if (!apiKey || !apiSecret) {
      throw new DnsProviderError(
        "GoDaddyProvider richiede apiKey + apiSecret",
        undefined,
        "godaddy",
      );
    }
  }

  private async req<T>(
    path: string,
    init: RequestInit = {},
  ): Promise<T> {
    const res = await fetch(`${BASE}${path}`, {
      ...init,
      headers: {
        authorization: `sso-key ${this.apiKey}:${this.apiSecret}`,
        accept: "application/json",
        "content-type": "application/json",
        ...(init.headers ?? {}),
      },
    });
    if (res.status === 401 || res.status === 403) {
      throw new DnsProviderError(
        "GoDaddy auth fallita (401/403). Verifica che la key sia Production-tier e non OTE.",
        res.status,
        "godaddy",
      );
    }
    if (res.status === 404) {
      // Caller decide come trattare 404 (lookup record inesistente vs dominio
      // inesistente). Throw esplicito così upsert può fare fallback su POST.
      throw new DnsProviderError(
        `GoDaddy 404 su ${path}`,
        404,
        "godaddy",
      );
    }
    if (res.status === 429) {
      throw new DnsProviderError(
        "Rate limit GoDaddy (60 req/min). Riprova fra qualche secondo.",
        429,
        "godaddy",
      );
    }
    if (!res.ok) {
      const body = await res.text();
      throw new DnsProviderError(
        `GoDaddy ${res.status}: ${body.slice(0, 200)}`,
        res.status,
        "godaddy",
      );
    }
    // Alcuni endpoint (PUT/DELETE) ritornano 200/204 con body vuoto.
    const text = await res.text();
    if (!text) return undefined as unknown as T;
    return JSON.parse(text) as T;
  }

  async listDomains(): Promise<DomainSummary[]> {
    // GoDaddy supporta paginazione via Markers ma per 99% degli utenti
    // (< 100 domini) il default è sufficiente. Limit massimo 1000.
    const data = await this.req<
      Array<{ domain: string; status: string; expires?: string }>
    >("/v1/domains?statuses=ACTIVE&limit=1000");
    return data.map((d) => ({
      name: d.domain,
      status: d.status,
      expiresAt: d.expires,
    }));
  }

  async getRecords(domain: string): Promise<DnsRecord[]> {
    const data = await this.req<
      Array<{ type: string; name: string; data: string; ttl?: number }>
    >(`/v1/domains/${encodeURIComponent(domain)}/records`);
    return data
      .filter((r): r is { type: DnsRecordType; name: string; data: string; ttl?: number } =>
        ["TXT", "A", "AAAA", "CNAME"].includes(r.type),
      )
      .map((r) => ({
        type: r.type,
        name: r.name,
        value: r.data,
        ttl: r.ttl ?? DEFAULT_TTL,
      }));
  }

  async upsertRecord(
    domain: string,
    record: { type: DnsRecordType; name: string; value: string; ttl?: number },
  ): Promise<void> {
    const { type, name, value, ttl = DEFAULT_TTL } = record;
    const url = `/v1/domains/${encodeURIComponent(domain)}/records/${type}/${encodeURIComponent(name)}`;
    // Read-modify-write: leggiamo gli esistenti per quel (type, name), mergiamo
    // o sostituiamo il match, riscriviamo tutto via PUT (GoDaddy REPLACE-only).
    let existing: Array<{ data: string; ttl?: number }> = [];
    try {
      existing = await this.req<Array<{ data: string; ttl?: number }>>(url);
    } catch (err) {
      // 404 = nessun record per quel (type, name): creiamo da zero.
      if (!(err instanceof DnsProviderError && err.statusCode === 404)) {
        throw err;
      }
    }
    // Per TXT (multi-value supportato) appendi se non già presente.
    // Per A/CNAME (single-value tipico) sostituisci.
    let newSet: Array<{ data: string; ttl: number }>;
    if (type === "TXT") {
      const filtered = existing.filter((r) => r.data !== value);
      newSet = [
        ...filtered.map((r) => ({ data: r.data, ttl: r.ttl ?? ttl })),
        { data: value, ttl },
      ];
    } else {
      newSet = [{ data: value, ttl }];
    }
    await this.req<void>(url, {
      method: "PUT",
      body: JSON.stringify(newSet),
    });
  }

  async deleteRecord(
    domain: string,
    selector: { type: DnsRecordType; name: string },
  ): Promise<void> {
    const url = `/v1/domains/${encodeURIComponent(domain)}/records/${selector.type}/${encodeURIComponent(selector.name)}`;
    try {
      await this.req<void>(url, { method: "DELETE" });
    } catch (err) {
      if (err instanceof DnsProviderError && err.statusCode === 404) {
        return; // idempotente: già assente
      }
      throw err;
    }
  }
}

/**
 * Split di "verify.example.com" → { subdomain: "verify", apex: "example.com" }.
 * Per "example.com" ritorna { subdomain: "@", apex: "example.com" }.
 * Naïve: assume TLD a 1-2 segmenti (".com", ".co.uk"). Per casi edge tipo
 * ".com.au" passa esplicitamente apex separato.
 */
export function splitDomain(fqdn: string): { subdomain: string; apex: string } {
  const parts = fqdn.toLowerCase().trim().split(".");
  if (parts.length < 2) {
    throw new DnsProviderError(`Hostname non valido: ${fqdn}`);
  }
  if (parts.length === 2) {
    return { subdomain: "@", apex: fqdn };
  }
  // Lista compatta di TLD multi-parte comuni. Estendere se serve.
  const COMPOUND_TLDS = new Set([
    "co.uk", "ac.uk", "org.uk", "gov.uk",
    "com.au", "net.au", "org.au",
    "co.nz", "co.jp",
  ]);
  const last2 = parts.slice(-2).join(".");
  const last3 = parts.slice(-3).join(".");
  if (parts.length >= 3 && COMPOUND_TLDS.has(last2)) {
    return {
      subdomain: parts.slice(0, -3).join(".") || "@",
      apex: last3,
    };
  }
  return {
    subdomain: parts.slice(0, -2).join("."),
    apex: last2,
  };
}
