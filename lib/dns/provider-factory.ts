import "server-only";

import type { DnsProvider } from "./types";
import { DnsProviderError } from "./types";
import { CloudflareProvider } from "./cloudflare";
import { resolveProviderSecret } from "@/lib/integrations/server-secrets";
import type { IntegrationProviderId } from "@/lib/integrations/providers";

/**
 * S7.14 — Resolve a DnsProvider istance per uno scope.
 *
 * Provider auto-DNS supportati oggi: Cloudflare (free API). I domini su
 * altri registrar (GoDaddy, Namecheap, ecc.) usano il flow MANUAL DNS:
 * la UI mostra i record da copy-paste nel pannello DNS del registrar e
 * polla la propagazione via dns.resolveTxt.
 *
 * Throw DnsProviderError 404 se nessun provider è configurato — il caller
 * decide se fallback a manuale o segnalare all'utente.
 */

const DNS_PROVIDER_IDS = ["cloudflare"] as const satisfies ReadonlyArray<IntegrationProviderId>;

export type DnsProviderId = (typeof DNS_PROVIDER_IDS)[number];

export function isDnsProviderId(id: string): id is DnsProviderId {
  return (DNS_PROVIDER_IDS as readonly string[]).includes(id);
}

export async function resolveDnsProvider(opts: {
  provider: DnsProviderId;
  projectId?: string;
  workspaceId?: string;
}): Promise<DnsProvider> {
  const secret = await resolveProviderSecret<Record<string, string>>({
    provider: opts.provider,
    projectId: opts.projectId,
    workspaceId: opts.workspaceId,
  });
  if (!secret) {
    throw new DnsProviderError(
      `Nessuna integrazione ${opts.provider} configurata per questo workspace/progetto`,
      404,
      opts.provider,
    );
  }
  switch (opts.provider) {
    case "cloudflare": {
      const { apiToken } = secret.fields;
      if (!apiToken) {
        throw new DnsProviderError(
          "Credenziali Cloudflare incomplete (apiToken richiesto)",
          400,
          "cloudflare",
        );
      }
      return new CloudflareProvider(apiToken);
    }
  }
}

/**
 * Trova il primo DnsProvider configurato per lo scope. Utile per UI "scegli
 * un dominio" che non conosce ancora quale provider l'utente ha settato.
 * Ritorna null se nessuno configurato (flow MANUAL DNS).
 */
export async function findFirstConfiguredDnsProvider(opts: {
  projectId?: string;
  workspaceId?: string;
}): Promise<{ provider: DnsProviderId; instance: DnsProvider } | null> {
  for (const id of DNS_PROVIDER_IDS) {
    try {
      const instance = await resolveDnsProvider({
        provider: id,
        projectId: opts.projectId,
        workspaceId: opts.workspaceId,
      });
      return { provider: id, instance };
    } catch (err) {
      if (err instanceof DnsProviderError && err.statusCode === 404) {
        continue;
      }
      throw err;
    }
  }
  return null;
}
