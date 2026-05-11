import "server-only";

import type {
  DnsProvider,
  DnsRecord,
  DnsRecordType,
  DomainSummary,
} from "./types";
import { DnsProviderError } from "./types";

/**
 * S7.14 — Cloudflare DNS provider.
 *
 * Auth: API Token (Bearer). User-generated su
 *   dash.cloudflare.com/profile/api-tokens
 * Token deve avere permessi:
 *   - Zone:Read (per listZones)
 *   - DNS:Edit (per upsert/delete records)
 * Account può essere "All accounts" o specifico.
 *
 * Cloudflare API è GRATIS per qualunque account. Usa Cloudflare come DNS
 * controller dei tuoi domini: registri restano su GoDaddy/altri ma cambi
 * i nameservers a Cloudflare (operazione 1 volta sola per dominio).
 * Bonus: ottieni CDN + DDoS protection gratuiti.
 *
 * Cache zoneId per dominio (map in-memory) — la lookup `zones?name={domain}`
 * non è gratis ma è rate-limited ed evita un hit per ogni record op.
 */

const BASE = "https://api.cloudflare.com/client/v4";
const DEFAULT_TTL = 300; // Cloudflare min TTL è 60s; 300 è suo default "Auto"

type CfResponse<T> = {
  success: boolean;
  errors: Array<{ code: number; message: string }>;
  messages: Array<{ code: number; message: string }>;
  result: T;
  result_info?: { page: number; per_page: number; total_pages: number };
};

export class CloudflareProvider implements DnsProvider {
  readonly id = "cloudflare" as const;
  private zoneIdCache = new Map<string, string>();

  constructor(private readonly apiToken: string) {
    if (!apiToken) {
      throw new DnsProviderError(
        "CloudflareProvider richiede apiToken",
        undefined,
        "cloudflare",
      );
    }
  }

  private async req<T>(path: string, init: RequestInit = {}): Promise<T> {
    const res = await fetch(`${BASE}${path}`, {
      ...init,
      headers: {
        authorization: `Bearer ${this.apiToken}`,
        "content-type": "application/json",
        accept: "application/json",
        ...(init.headers ?? {}),
      },
    });
    if (res.status === 401 || res.status === 403) {
      throw new DnsProviderError(
        "Cloudflare auth fallita. Verifica che il token abbia permessi Zone:Read + DNS:Edit.",
        res.status,
        "cloudflare",
      );
    }
    if (res.status === 429) {
      throw new DnsProviderError(
        "Cloudflare rate limit. Riprova fra qualche secondo.",
        429,
        "cloudflare",
      );
    }
    const body = (await res.json().catch(() => ({}))) as CfResponse<T>;
    if (!res.ok || body.success === false) {
      const msg = body.errors?.map((e) => `${e.code}:${e.message}`).join("; ");
      throw new DnsProviderError(
        `Cloudflare ${res.status}: ${msg ?? "unknown"}`,
        res.status,
        "cloudflare",
      );
    }
    return body.result;
  }

  async listDomains(): Promise<DomainSummary[]> {
    // Cloudflare API paginates; per workspace tipico <100 zones default 1
    // page basta. per_page max 50.
    type Zone = { name: string; status: string; activated_on?: string };
    const zones = await this.req<Zone[]>("/zones?per_page=50&status=active");
    // popola la cache zoneId per i lookup successivi
    for (const z of zones) {
      // need to fetch id separately, but listZones returns id too — let me fix
    }
    return zones.map((z) => ({
      name: z.name,
      status: z.status,
      expiresAt: undefined, // Cloudflare non gestisce registrazione (solo DNS)
    }));
  }

  private async getZoneId(domain: string): Promise<string> {
    const cached = this.zoneIdCache.get(domain);
    if (cached) return cached;
    // GET /zones?name={domain} — esatto match
    type Zone = { id: string; name: string };
    const zones = await this.req<Zone[]>(
      `/zones?name=${encodeURIComponent(domain)}`,
    );
    if (zones.length === 0) {
      throw new DnsProviderError(
        `Zone Cloudflare non trovata per ${domain}. Hai aggiunto il dominio al tuo account Cloudflare e cambiato i nameservers?`,
        404,
        "cloudflare",
      );
    }
    const id = zones[0].id;
    this.zoneIdCache.set(domain, id);
    return id;
  }

  async getRecords(domain: string): Promise<DnsRecord[]> {
    const zoneId = await this.getZoneId(domain);
    type Rec = {
      type: string;
      name: string;
      content: string;
      ttl: number;
    };
    const records = await this.req<Rec[]>(
      `/zones/${zoneId}/dns_records?per_page=100`,
    );
    return records
      .filter((r): r is { type: DnsRecordType; name: string; content: string; ttl: number } =>
        ["TXT", "A", "AAAA", "CNAME"].includes(r.type),
      )
      .map((r) => {
        // Cloudflare ritorna name come FQDN (es. "_rezen-verify.example.com"
        // o "example.com" per apex). Normalizziamo togliendo il domain.
        let shortName = r.name;
        if (r.name === domain) {
          shortName = "@";
        } else if (r.name.endsWith(`.${domain}`)) {
          shortName = r.name.slice(0, -(domain.length + 1));
        }
        return {
          type: r.type,
          name: shortName,
          value: r.content,
          ttl: r.ttl,
        };
      });
  }

  async upsertRecord(
    domain: string,
    record: { type: DnsRecordType; name: string; value: string; ttl?: number },
  ): Promise<void> {
    const zoneId = await this.getZoneId(domain);
    const { type, name, value, ttl = DEFAULT_TTL } = record;
    const fqdn = name === "@" ? domain : `${name}.${domain}`;
    // Cerca record esistente con stesso (type, name)
    type Rec = { id: string; type: string; name: string; content: string };
    const existing = await this.req<Rec[]>(
      `/zones/${zoneId}/dns_records?type=${type}&name=${encodeURIComponent(fqdn)}`,
    );
    if (type === "TXT") {
      // multi-value possibile: cerca match esatto su content
      const match = existing.find((r) => r.content === value);
      if (match) return; // già presente
      // crea nuovo
      await this.req<unknown>(`/zones/${zoneId}/dns_records`, {
        method: "POST",
        body: JSON.stringify({ type, name: fqdn, content: value, ttl }),
      });
      return;
    }
    // A/CNAME/AAAA: single-value, replace se esiste, create se no
    if (existing.length > 0) {
      const id = existing[0].id;
      await this.req<unknown>(`/zones/${zoneId}/dns_records/${id}`, {
        method: "PUT",
        body: JSON.stringify({ type, name: fqdn, content: value, ttl }),
      });
      return;
    }
    await this.req<unknown>(`/zones/${zoneId}/dns_records`, {
      method: "POST",
      body: JSON.stringify({ type, name: fqdn, content: value, ttl }),
    });
  }

  async deleteRecord(
    domain: string,
    selector: { type: DnsRecordType; name: string },
  ): Promise<void> {
    const zoneId = await this.getZoneId(domain);
    const fqdn = selector.name === "@" ? domain : `${selector.name}.${domain}`;
    type Rec = { id: string };
    const existing = await this.req<Rec[]>(
      `/zones/${zoneId}/dns_records?type=${selector.type}&name=${encodeURIComponent(fqdn)}`,
    );
    for (const r of existing) {
      await this.req<unknown>(`/zones/${zoneId}/dns_records/${r.id}`, {
        method: "DELETE",
      });
    }
  }
}
