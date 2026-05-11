import { NextResponse } from "next/server";
import {
  findFirstConfiguredDnsProvider,
  resolveDnsProvider,
  isDnsProviderId,
} from "@/lib/dns/provider-factory";
import { DnsProviderError } from "@/lib/dns/types";
import { splitDomain } from "@/lib/dns/util";
import { generateVerifyToken, VERIFY_TXT_NAME } from "@/lib/dns/verify-token";
import { getAdmin } from "@/lib/firebase/admin";

/**
 * S7.14 — Collega un dominio custom a un progetto.
 *
 * POST body:
 *   { domain, mode?: "auto" | "manual", provider? }
 *
 * Mode auto (default se provider configurato):
 *   Risolve DNS provider (Cloudflare oggi) → upsert TXT verify via API.
 *   L'utente non tocca nulla, polling verify dopo qualche secondo.
 *
 * Mode manual (default se nessun provider configurato):
 *   Genera il TXT atteso ma NON lo crea. La response include i record DNS
 *   da copy-paste nel pannello del registrar (GoDaddy/Namecheap/ecc.).
 *   Lo step verify polla dns.resolveTxt finché l'utente non li aggiunge.
 *
 * Status finale Firestore in entrambi i casi: `pending-verify`.
 */

export const runtime = "nodejs";
export const maxDuration = 30;

const DOMAIN_RE = /^(?=.{1,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i;

type Mode = "auto" | "manual";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params;
  if (!/^[a-z0-9-]+$/.test(projectId)) {
    return NextResponse.json({ error: "invalid projectId" }, { status: 400 });
  }
  let body: { domain?: string; mode?: Mode; provider?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  const domain = (body.domain ?? "").toLowerCase().trim();
  if (!DOMAIN_RE.test(domain)) {
    return NextResponse.json(
      { error: "domain non valido (es. 'example.com' o 'sub.example.com')" },
      { status: 400 },
    );
  }

  // Decide mode: explicit body.mode > provider configurato > manual
  let mode: Mode = body.mode ?? "auto";
  let providerId: string | null = null;
  let dnsInstance: import("@/lib/dns/types").DnsProvider | null = null;

  try {
    if (mode === "auto") {
      if (body.provider) {
        if (!isDnsProviderId(body.provider)) {
          return NextResponse.json(
            { error: `provider ${body.provider} non supportato` },
            { status: 400 },
          );
        }
        dnsInstance = await resolveDnsProvider({
          provider: body.provider,
          projectId,
        });
        providerId = body.provider;
      } else {
        const found = await findFirstConfiguredDnsProvider({ projectId });
        if (found) {
          dnsInstance = found.instance;
          providerId = found.provider;
        } else {
          // Auto richiesto ma nessun provider configurato → fallback a manual.
          mode = "manual";
        }
      }
    }

    // Conflict check Firestore
    const { db } = getAdmin();
    const docRef = db.collection("domains").doc(domain);
    const snap = await docRef.get();
    if (snap.exists) {
      const data = snap.data() as { projectId?: string } | undefined;
      if (data?.projectId && data.projectId !== projectId) {
        return NextResponse.json(
          {
            error: "domain_already_linked",
            message: `Dominio già collegato al progetto ${data.projectId}`,
          },
          { status: 409 },
        );
      }
    }

    // Split FQDN per posizionare il TXT.
    const { apex, subdomain } = splitDomain(domain);
    const txtName =
      subdomain === "@" || subdomain === ""
        ? VERIFY_TXT_NAME
        : `${VERIFY_TXT_NAME}.${subdomain}`;
    const token = generateVerifyToken();

    let recordsCreated = false;
    if (mode === "auto" && dnsInstance) {
      try {
        await dnsInstance.upsertRecord(apex, {
          type: "TXT",
          name: txtName,
          value: token,
          ttl: 600,
        });
        recordsCreated = true;
      } catch (err) {
        // Se l'auto-create fallisce (es. zone non in Cloudflare), ritorniamo
        // graceful: persiste come manual, l'utente vedrà i record da
        // aggiungere a mano.
        console.warn(
          "[api/domains/connect] auto upsert failed, falling back to manual",
          err,
        );
        mode = "manual";
      }
    }

    // Persist Firestore doc.
    const now = new Date();
    await docRef.set(
      {
        fqdn: domain,
        projectId,
        workspaceId: "default",
        status: "pending-verify",
        verifyToken: token,
        registrationProvider: providerId ?? "manual",
        connectMode: mode,
        createdAt: snap.exists ? snap.get("createdAt") : now,
        updatedAt: now,
        verifiedAt: null,
        liveAt: null,
        lastError: null,
      },
      { merge: true },
    );

    return NextResponse.json({
      ok: true,
      domain,
      status: "pending-verify",
      mode,
      provider: providerId,
      recordsCreated,
      // Sempre ritornati così la UI può mostrarli a chi va in modalità manual
      // (e anche in auto, come reference utente).
      dnsRecordsToAdd: [
        {
          type: "TXT" as const,
          name: `${txtName}.${apex}`,
          value: token,
          ttl: 600,
          purpose:
            "Verifica proprietà dominio. Richiesto sempre (anche in modalità auto è stato creato da noi).",
          autoCreated: recordsCreated,
        },
        {
          type: subdomain === "@" || subdomain === "" ? "A" : "CNAME",
          name: subdomain === "@" || subdomain === "" ? "@" : subdomain,
          value:
            subdomain === "@" || subdomain === ""
              ? "[I record A verranno mostrati dopo verify]"
              : `[CNAME al backend hosted.app — generato dopo verify]`,
          ttl: 600,
          purpose:
            "Routing del traffico. Sarà autocompilato dopo il passo di verifica.",
          autoCreated: false,
        },
      ],
      next: {
        verifyEndpoint: `/api/projects/${projectId}/domains/verify`,
        pollIntervalMs: 5000,
      },
    });
  } catch (err) {
    if (err instanceof DnsProviderError) {
      return NextResponse.json(
        { error: err.message, provider: err.provider },
        { status: err.statusCode ?? 500 },
      );
    }
    console.error("[api/domains/connect] failed", err);
    return NextResponse.json(
      { error: (err as Error).message ?? "unknown error" },
      { status: 500 },
    );
  }
}
