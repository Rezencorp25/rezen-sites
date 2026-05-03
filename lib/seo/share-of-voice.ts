import type { ShareOfVoiceEntry } from "./rank-types";

export type DomainEtvInput = {
  domain: string;
  label: string;
  etv: number;
  isOwner?: boolean;
};

/**
 * Share of Voice — formula brief §6.2.
 *
 * SoV[domain] = ETV[domain] / Σ ETV[all domains] × 100
 *
 * ETV proviene dall'endpoint dataforseo_labs/google/bulk_traffic_estimation/live
 * (cliente + competitor in singola chiamata). Lato stub usiamo gli ETV calcolati
 * da `calcEstimatedTraffic` per cliente e da fattori pseudo-random per competitor.
 */
export function calcShareOfVoice(
  domains: DomainEtvInput[],
): ShareOfVoiceEntry[] {
  if (domains.length === 0) return [];
  const total = domains.reduce((sum, d) => sum + Math.max(0, d.etv), 0);
  if (total === 0) {
    return domains.map((d) => ({
      domain: d.domain,
      label: d.label,
      etv: 0,
      sharePct: 0,
      isOwner: d.isOwner ?? false,
    }));
  }
  return domains
    .map((d) => ({
      domain: d.domain,
      label: d.label,
      etv: Math.max(0, d.etv),
      sharePct: Math.round((Math.max(0, d.etv) / total) * 1000) / 10,
      isOwner: d.isOwner ?? false,
    }))
    .sort((a, b) => b.etv - a.etv);
}
