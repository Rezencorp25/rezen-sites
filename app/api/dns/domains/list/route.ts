import { NextResponse } from "next/server";
import {
  findFirstConfiguredDnsProvider,
  resolveDnsProvider,
  isDnsProviderId,
} from "@/lib/dns/provider-factory";
import { DnsProviderError } from "@/lib/dns/types";

/**
 * S7.14 sub-A — Lista domini posseduti dall'account DNS provider connesso.
 *
 * Usage:
 *   GET /api/dns/domains/list?projectId=verumflow-ch
 *   GET /api/dns/domains/list?projectId=...&provider=godaddy
 *
 * Risolve provider in cascata project → workspace (vedi provider-factory).
 * Se nessun provider è configurato ritorna 404 con shape consistente che la
 * UI può differenziare dal 500.
 */

export const runtime = "nodejs";
export const maxDuration = 15;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const projectId = url.searchParams.get("projectId") ?? undefined;
  const providerParam = url.searchParams.get("provider");
  if (projectId && !/^[a-z0-9-]+$/.test(projectId)) {
    return NextResponse.json({ error: "invalid projectId" }, { status: 400 });
  }
  try {
    let providerId: string | undefined;
    let domains: Awaited<ReturnType<typeof listDomainsFor>> = [];
    if (providerParam) {
      if (!isDnsProviderId(providerParam)) {
        return NextResponse.json(
          { error: `provider ${providerParam} non supportato` },
          { status: 400 },
        );
      }
      const instance = await resolveDnsProvider({
        provider: providerParam,
        projectId,
      });
      providerId = providerParam;
      domains = await instance.listDomains();
    } else {
      const found = await findFirstConfiguredDnsProvider({ projectId });
      if (!found) {
        return NextResponse.json(
          {
            error: "no_dns_provider_configured",
            message:
              "Nessun provider DNS configurato. Collega GoDaddy in Integrazioni.",
          },
          { status: 404 },
        );
      }
      providerId = found.provider;
      domains = await found.instance.listDomains();
    }
    return NextResponse.json({
      provider: providerId,
      domains,
    });
  } catch (err) {
    if (err instanceof DnsProviderError) {
      return NextResponse.json(
        { error: err.message, provider: err.provider },
        { status: err.statusCode ?? 500 },
      );
    }
    console.error("[api/dns/domains/list] failed", err);
    return NextResponse.json(
      { error: (err as Error).message ?? "unknown error" },
      { status: 500 },
    );
  }
}

async function listDomainsFor(
  instance: import("@/lib/dns/types").DnsProvider,
) {
  return instance.listDomains();
}
