/**
 * DataForSEO client wrapper — server-only.
 *
 * NON IMPORTARE QUESTO FILE DAL BROWSER. Usa Cloud Functions o Server Actions
 * per le chiamate live (le credenziali sono Basic auth e non possono essere
 * esposte client-side).
 *
 * Sprint S0 — wrapper in stub-mode di default. Live mode si attiva quando
 * `DATAFORSEO_LOGIN` e `DATAFORSEO_PASSWORD` sono presenti come secrets.
 *
 * Compliance Playbook §3.5 — secrets via Firebase Secrets Manager.
 * Compliance Playbook §10.4 — DataForSEO è sub-processor da iscrivere in ROPA.
 *
 * Reference docs: https://docs.dataforseo.com/v3/
 */

import type {
  DfsClientConfig,
  DfsClientMode,
  SerpKeywordRequest,
  SerpResponse,
  KeywordOverviewRequest,
  KeywordOverviewItem,
  BacklinkOverviewRequest,
  BacklinkOverviewResponse,
  DomainOverviewRequest,
  DomainOverviewResponse,
} from "./dataforseo-types";
import { DfsApiError } from "./dataforseo-types";
import {
  mockSerpResponse,
  mockKeywordOverview,
  mockBacklinkOverview,
  mockDomainOverview,
} from "./dataforseo-mocks";

const DFS_BASE = "https://api.dataforseo.com/v3";

export class DataForSeoClient {
  private mode: DfsClientMode;
  private authHeader: string | null = null;
  private timeoutMs: number;

  constructor(config: DfsClientConfig) {
    this.mode = config.mode;
    this.timeoutMs = config.timeoutMs ?? 30_000;
    if (config.mode === "live") {
      if (!config.login || !config.password) {
        throw new Error(
          "DataForSeoClient: live mode requires login + password",
        );
      }
      const token = Buffer.from(`${config.login}:${config.password}`).toString(
        "base64",
      );
      this.authHeader = `Basic ${token}`;
    }
  }

  /**
   * Costruisce un client dalle env vars / secrets disponibili.
   * Se mancano, fallback automatico a stub-mode con log esplicito.
   */
  static fromEnv(): DataForSeoClient {
    const login = process.env.DATAFORSEO_LOGIN;
    const password = process.env.DATAFORSEO_PASSWORD;
    if (login && password) {
      return new DataForSeoClient({ mode: "live", login, password });
    }
    return new DataForSeoClient({ mode: "stub" });
  }

  isStub(): boolean {
    return this.mode === "stub";
  }

  // ── Public API ────────────────────────────────────────────────────────

  async serpLive(req: SerpKeywordRequest): Promise<SerpResponse> {
    if (this.mode === "stub") return mockSerpResponse(req);
    const data = await this.post<unknown>(
      "/serp/google/organic/live/regular",
      [
        {
          keyword: req.keyword,
          location_code: this.locationCode(req.location.countryCode),
          language_code: req.location.languageCode,
          device: req.device ?? "desktop",
        },
      ],
    );
    return this.parseSerp(req, data);
  }

  async keywordOverview(
    req: KeywordOverviewRequest,
  ): Promise<KeywordOverviewItem[]> {
    if (this.mode === "stub") return mockKeywordOverview(req);
    const data = await this.post<unknown>(
      "/keywords_data/google_ads/search_volume/live",
      [
        {
          keywords: req.keywords,
          location_code: this.locationCode(req.location.countryCode),
          language_code: req.location.languageCode,
        },
      ],
    );
    return this.parseKeywordOverview(req, data);
  }

  async backlinkOverview(
    req: BacklinkOverviewRequest,
  ): Promise<BacklinkOverviewResponse> {
    if (this.mode === "stub") return mockBacklinkOverview(req);
    const data = await this.post<unknown>("/backlinks/summary/live", [
      { target: req.target },
    ]);
    return this.parseBacklinkOverview(req, data);
  }

  async domainOverview(
    req: DomainOverviewRequest,
  ): Promise<DomainOverviewResponse> {
    if (this.mode === "stub") return mockDomainOverview(req);
    const data = await this.post<unknown>(
      "/dataforseo_labs/google/domain_rank_overview/live",
      [
        {
          target: req.target,
          location_code: this.locationCode(req.location.countryCode),
          language_code: req.location.languageCode,
        },
      ],
    );
    return this.parseDomainOverview(req, data);
  }

  // ── Internals ─────────────────────────────────────────────────────────

  private async post<T>(path: string, body: unknown): Promise<T> {
    if (!this.authHeader) {
      throw new Error("DataForSeoClient: no auth header (stub mode?)");
    }
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), this.timeoutMs);
    try {
      const res = await fetch(`${DFS_BASE}${path}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: this.authHeader,
        },
        body: JSON.stringify(body),
        signal: ctrl.signal,
      });
      if (!res.ok) {
        throw new DfsApiError(res.status, res.statusText, path);
      }
      return (await res.json()) as T;
    } finally {
      clearTimeout(timer);
    }
  }

  /**
   * Mapping country code → DataForSEO location_code.
   * Lista completa: https://docs.dataforseo.com/v3/locations/
   * Per ora coverage minimale; estendere on-demand.
   */
  private locationCode(countryCode: string): number {
    const map: Record<string, number> = {
      IT: 2380,
      CH: 2756,
      US: 2840,
      GB: 2826,
      FR: 2250,
      DE: 2276,
      ES: 2724,
    };
    return map[countryCode] ?? 2380; // default IT
  }

  // Parsers — versione minimal-viable. Quando si attiva live mode con dati
  // reali, validare contro JSON Schema dell'endpoint specifico.

  private parseSerp(req: SerpKeywordRequest, raw: unknown): SerpResponse {
    const root = raw as {
      tasks?: { result?: { items?: unknown[]; total_count?: number }[] }[];
    };
    const result = root.tasks?.[0]?.result?.[0];
    const items = (result?.items ?? []).map((it, i) => {
      const x = it as Record<string, unknown>;
      return {
        rankAbsolute:
          typeof x.rank_absolute === "number" ? x.rank_absolute : i + 1,
        title: String(x.title ?? ""),
        url: String(x.url ?? ""),
        domain: String(x.domain ?? ""),
        isAd: x.type === "paid" || Boolean(x.is_ad),
        type:
          x.type === "paid"
            ? ("paid" as const)
            : x.type === "organic"
              ? ("organic" as const)
              : x.type === "featured_snippet"
                ? ("featured_snippet" as const)
                : x.type === "people_also_ask"
                  ? ("people_also_ask" as const)
                  : ("other" as const),
      };
    });
    return {
      keyword: req.keyword,
      location: req.location,
      totalResults: Number(result?.total_count ?? items.length),
      fetchedAt: new Date().toISOString(),
      items,
    };
  }

  private parseKeywordOverview(
    req: KeywordOverviewRequest,
    raw: unknown,
  ): KeywordOverviewItem[] {
    const root = raw as { tasks?: { result?: unknown[] }[] };
    const items = (root.tasks?.[0]?.result ?? []) as Record<string, unknown>[];
    return items.map((x) => ({
      keyword: String(x.keyword ?? ""),
      searchVolume: Number(x.search_volume ?? 0),
      cpc: Number(x.cpc ?? 0),
      competition: Number(x.competition ?? 0),
      competitionLevel:
        x.competition_level === "LOW"
          ? "low"
          : x.competition_level === "MEDIUM"
            ? "medium"
            : "high",
      monthlySearches: Array.isArray(x.monthly_searches)
        ? (x.monthly_searches as Record<string, number>[]).map((m) => ({
            year: Number(m.year ?? 0),
            month: Number(m.month ?? 0),
            searchVolume: Number(m.search_volume ?? 0),
          }))
        : [],
    }));
  }

  private parseBacklinkOverview(
    req: BacklinkOverviewRequest,
    raw: unknown,
  ): BacklinkOverviewResponse {
    const root = raw as { tasks?: { result?: unknown[] }[] };
    const r = (root.tasks?.[0]?.result?.[0] ?? {}) as Record<string, unknown>;
    return {
      target: req.target,
      rank: Number(r.rank ?? 0),
      backlinks: Number(r.backlinks ?? 0),
      referringDomains: Number(r.referring_domains ?? 0),
      referringMainDomains: Number(r.referring_main_domains ?? 0),
      brokenBacklinks: Number(r.broken_backlinks ?? 0),
      fetchedAt: new Date().toISOString(),
    };
  }

  private parseDomainOverview(
    req: DomainOverviewRequest,
    raw: unknown,
  ): DomainOverviewResponse {
    const root = raw as { tasks?: { result?: unknown[] }[] };
    const r = (root.tasks?.[0]?.result?.[0] ?? {}) as Record<string, unknown>;
    const metrics = (r.metrics as Record<string, unknown>) ?? {};
    const organic = (metrics.organic as Record<string, unknown>) ?? {};
    const paid = (metrics.paid as Record<string, unknown>) ?? {};
    return {
      target: req.target,
      authorityScore: Number(r.rank ?? 0),
      organicTraffic: Number(organic.etv ?? 0),
      organicKeywords: Number(organic.count ?? 0),
      paidKeywords: Number(paid.count ?? 0),
      referringDomains: Number(r.referring_domains ?? 0),
      fetchedAt: new Date().toISOString(),
    };
  }
}
