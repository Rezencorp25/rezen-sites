import { NextResponse } from "next/server";
import {
  findFirstConfiguredDnsProvider,
  resolveDnsProvider,
  isDnsProviderId,
} from "@/lib/dns/provider-factory";
import { DnsProviderError } from "@/lib/dns/types";
import { splitDomain } from "@/lib/dns/godaddy";
import { generateVerifyToken, VERIFY_TXT_NAME } from "@/lib/dns/verify-token";
import { getAdmin } from "@/lib/firebase/admin";

/**
 * S7.14 sub-B — Collega un dominio custom a un progetto.
 *
 * POST body:
 *   { domain: "verumflow.com", provider?: "godaddy" }
 *
 * Flow:
 *   1. Validate domain + projectId (basic).
 *   2. Resolve DNS provider (project override → workspace default; o esplicito).
 *   3. Genera verifyToken cryptografico.
 *   4. Upsert TXT record `_rezen-verify.{domain} = "rzn-{token}"` via provider API.
 *   5. Scrive Firestore doc `domains/{fqdn}` con status="pending-verify" +
 *      token + projectId. Idempotente: se il doc esiste già su STESSO project,
 *      ruota il token. Se esiste su PROGETTO DIVERSO → 409 conflict.
 *
 * Restituisce gli istruzioni che la UI mostrerà all'utente:
 *   - "TXT creato automaticamente, verifica DNS in corso"
 *   - "Aggiungi questi A/CNAME se vuoi che il sito risponda" (placeholder
 *      finché sub-C non collega Firebase App Hosting)
 */

export const runtime = "nodejs";
export const maxDuration = 30;

const DOMAIN_RE = /^(?=.{1,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i;

export async function POST(
  req: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params;
  if (!/^[a-z0-9-]+$/.test(projectId)) {
    return NextResponse.json({ error: "invalid projectId" }, { status: 400 });
  }
  let body: { domain?: string; provider?: string };
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
  try {
    // 1. Provider risoluzione (esplicito > auto-pick).
    let providerId: string;
    let dns;
    if (body.provider) {
      if (!isDnsProviderId(body.provider)) {
        return NextResponse.json(
          { error: `provider ${body.provider} non supportato` },
          { status: 400 },
        );
      }
      dns = await resolveDnsProvider({ provider: body.provider, projectId });
      providerId = body.provider;
    } else {
      const found = await findFirstConfiguredDnsProvider({ projectId });
      if (!found) {
        return NextResponse.json(
          {
            error: "no_dns_provider_configured",
            message:
              "Collega un provider DNS in Integrazioni prima di collegare un dominio.",
          },
          { status: 404 },
        );
      }
      dns = found.instance;
      providerId = found.provider;
    }

    // 2. Conflict check Firestore: se il dominio è già stato collegato a
    // un altro progetto, blocca. Stesso progetto → ok (rotation token).
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

    // 3. Split FQDN per posizionare il TXT sul dominio root.
    const { apex, subdomain } = splitDomain(domain);
    // `_rezen-verify.<full-domain>` → quando l'utente collega un sottodominio
    // verify.example.com, il TXT va su `_rezen-verify.verify.example.com`.
    // Se è apex, va su `_rezen-verify.example.com`.
    const recordName =
      subdomain === "@" || subdomain === ""
        ? VERIFY_TXT_NAME
        : `${VERIFY_TXT_NAME}.${subdomain}`;

    // 4. Generate token + crea TXT.
    const token = generateVerifyToken();
    await dns.upsertRecord(apex, {
      type: "TXT",
      name: recordName,
      value: token,
      ttl: 600,
    });

    // 5. Persist Firestore doc. Usiamo set+merge per gestire entrambi
    // i casi (first connect / re-connect su stesso project).
    const now = new Date();
    await docRef.set(
      {
        fqdn: domain,
        projectId,
        workspaceId: "default", // singleton oggi, future multi-workspace
        status: "pending-verify",
        verifyToken: token,
        registrationProvider: providerId,
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
      provider: providerId,
      txt: {
        name: `${recordName}.${apex}`,
        value: token,
        note: "Creato automaticamente via API provider. La propagazione DNS può richiedere fino a qualche minuto.",
      },
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
