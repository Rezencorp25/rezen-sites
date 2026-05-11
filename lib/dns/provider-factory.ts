import "server-only";

import type { DnsProvider } from "./types";
import { DnsProviderError } from "./types";
import { GoDaddyProvider } from "./godaddy";
import { resolveProviderSecret } from "@/lib/integrations/server-secrets";
import type { IntegrationProviderId } from "@/lib/integrations/providers";

/**
 * S7.14 sub-A — Resolve a DnsProvider istance per uno scope.
 *
 * Risolve credentials da Secret Manager (project override → workspace default)
 * e ritorna l'implementazione concreta. Throw DnsProviderError se non
 * configurato — il caller decide come surface-arlo all'utente (404 con
 * "collega prima un provider DNS").
 */

const DNS_PROVIDER_IDS = ["godaddy"] as const satisfies ReadonlyArray<IntegrationProviderId>;

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
    case "godaddy": {
      const { apiKey, apiSecret } = secret.fields;
      if (!apiKey || !apiSecret) {
        throw new DnsProviderError(
          "Credenziali GoDaddy incomplete (apiKey + apiSecret richiesti)",
          400,
          "godaddy",
        );
      }
      return new GoDaddyProvider(apiKey, apiSecret);
    }
  }
}

/**
 * Trova il primo DnsProvider configurato per lo scope. Utile per UI "scegli
 * un dominio" che non conosce ancora quale provider l'utente ha settato.
 * Ritorna null se nessuno configurato.
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
