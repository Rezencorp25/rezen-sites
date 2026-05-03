import type { AuthorityComponents } from "./seo-types";

/**
 * VerumFlow Authority Score — formula brief §3.7 / §6.3.
 *
 * VF_Authority = 0.55 × LinkPower_norm + 0.30 × Traffic_norm + 0.15 × NaturalProfile
 *
 * Componenti normalizzate su scala 0-100:
 * - LinkPower_norm = log10-normalize(domain_rank) (saturazione 1000)
 * - Traffic_norm = log10-normalize(etv_monthly) (saturazione 1M visite)
 * - NaturalProfile = 100 - spam_score
 */
export function calcVfAuthority(input: {
  domainRank: number;
  etvMonthly: number;
  spamScore: number;
  referringDomains: number;
}): { score: number; components: AuthorityComponents } {
  const linkPower = Math.min(
    100,
    (Math.log10(input.domainRank + 1) / Math.log10(1001)) * 100,
  );
  const traffic = Math.min(
    100,
    (Math.log10(input.etvMonthly + 1) / Math.log10(1_000_001)) * 100,
  );
  const naturalProfile = Math.max(0, 100 - input.spamScore);

  const raw = 0.55 * linkPower + 0.3 * traffic + 0.15 * naturalProfile;

  return {
    score: Math.round(raw),
    components: {
      linkPower: Math.round(linkPower),
      traffic: Math.round(traffic),
      naturalProfile: Math.round(naturalProfile),
      domainRank: input.domainRank,
      spamScore: input.spamScore,
      referringDomains: input.referringDomains,
    },
  };
}

export type AuthorityBucket = "good" | "warn" | "poor";

export function authorityBucket(score: number): AuthorityBucket {
  if (score >= 60) return "good";
  if (score >= 35) return "warn";
  return "poor";
}
