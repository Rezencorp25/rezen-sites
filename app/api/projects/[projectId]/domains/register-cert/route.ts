import { NextResponse } from "next/server";
import { getAdmin } from "@/lib/firebase/admin";
import {
  addCustomDomain,
  defaultBackendCoords,
  getCustomDomain,
} from "@/lib/firebase/apphosting-admin";
import { splitDomain } from "@/lib/dns/util";
import {
  resolveDnsProvider,
  isDnsProviderId,
} from "@/lib/dns/provider-factory";

/**
 * S7.14 sub-C — Registra il dominio su Firebase App Hosting + crea i DNS
 * record di routing (A/CNAME) sul provider connesso.
 *
 * Prereq: il dominio deve essere già `verified` (sub-B).
 *
 * Flow:
 *   1. Carica Firestore `domains/{fqdn}` → verifica status=="verified" o ">"
 *   2. POST App Hosting domains.create — Firebase inizia provisioning Let's
 *      Encrypt cert. Long-running operation.
 *   3. App Hosting risponde con record DNS richiesti (A / AAAA / TXT challenge).
 *      Per il preview noi colleghiamo via A record statico se ce lo ritornano,
 *      altrimenti CNAME al backend hosted.app subdomain.
 *   4. Upsert quei record via DNS provider connesso.
 *   5. Firestore status → "issuing-cert".
 *
 * Status finale "live" arriva tramite endpoint polling separato (GET
 * /domains/{fqdn}/status) o scheduled CF — qui ritorniamo "issuing-cert" e
 * la UI fa polling.
 */

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(
  req: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params;
  if (!/^[a-z0-9-]+$/.test(projectId)) {
    return NextResponse.json({ error: "invalid projectId" }, { status: 400 });
  }
  let body: { domain?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  const domain = (body.domain ?? "").toLowerCase().trim();
  if (!domain) {
    return NextResponse.json({ error: "domain required" }, { status: 400 });
  }
  try {
    const { db } = getAdmin();
    const docRef = db.collection("domains").doc(domain);
    const snap = await docRef.get();
    if (!snap.exists) {
      return NextResponse.json(
        { error: "domain_not_connected" },
        { status: 404 },
      );
    }
    const data = snap.data() as {
      projectId: string;
      status: string;
      registrationProvider?: string;
    };
    if (data.projectId !== projectId) {
      return NextResponse.json({ error: "wrong_project" }, { status: 403 });
    }
    if (data.status === "pending-verify") {
      return NextResponse.json(
        {
          error: "domain_not_verified",
          message: "Esegui /domains/verify prima di registrare il certificato.",
        },
        { status: 400 },
      );
    }
    if (data.status === "live") {
      return NextResponse.json({
        ok: true,
        domain,
        status: "live",
        alreadyLive: true,
      });
    }

    // 1. Registra dominio su App Hosting.
    const coords = defaultBackendCoords();
    const { operationName } = await addCustomDomain({ coords, domain });

    // 2. Recupera lo stato per estrarre i requisiti DNS (A record IP).
    // L'API potrebbe ritornare i record richiesti dopo qualche secondo.
    // Per ora leggiamo e logghiamo; UI mostrerà istruzioni manuali se i
    // record non sono ancora visibili.
    let appHostingState;
    try {
      appHostingState = await getCustomDomain({ coords, domain });
    } catch (err) {
      console.warn(
        "[api/domains/register-cert] getCustomDomain failed, continuing",
        err,
      );
      appHostingState = { status: "pending" as const, raw: {} };
    }

    // 3. Se App Hosting ha già risposto con required A records, li scriviamo
    // automaticamente tramite il DNS provider. Estraggo da `raw` quando lo
    // schema reale è confermato. Per ora, log only.
    const dnsRecordsApplied: Array<{
      type: string;
      name: string;
      value: string;
    }> = [];
    const providerId = data.registrationProvider;
    if (providerId && isDnsProviderId(providerId)) {
      try {
        const dns = await resolveDnsProvider({
          provider: providerId,
          projectId,
        });
        const { apex, subdomain } = splitDomain(domain);
        // CNAME al backend hosted.app come fallback. Quando App Hosting
        // restituisce A records pubblici dedicati, sostituiremo qui.
        const cnameTarget = `${coords.backend}--${coords.project}.${coords.location}.hosted.app`;
        const recordName = subdomain === "@" || subdomain === "" ? "@" : subdomain;
        // CNAME su apex non è valido per la maggior parte dei DNS (incluso
        // GoDaddy) — skippiamo per apex, lasciamo all'utente di puntare A
        // record. Per subdomain CNAME è ok.
        if (recordName !== "@") {
          await dns.upsertRecord(apex, {
            type: "CNAME",
            name: recordName,
            value: cnameTarget,
            ttl: 600,
          });
          dnsRecordsApplied.push({
            type: "CNAME",
            name: `${recordName}.${apex}`,
            value: cnameTarget,
          });
        }
      } catch (err) {
        console.warn(
          "[api/domains/register-cert] DNS provider record upsert failed",
          err,
        );
      }
    }

    // 4. Update Firestore.
    const now = new Date();
    await docRef.set(
      {
        status: "issuing-cert",
        appHostingOperation: operationName,
        appHostingCertState: appHostingState.status,
        updatedAt: now,
        dnsRecordsApplied,
      },
      { merge: true },
    );

    return NextResponse.json({
      ok: true,
      domain,
      status: "issuing-cert",
      backend: coords,
      operation: operationName,
      certState: appHostingState.status,
      dnsRecordsApplied,
      hints: {
        apexNeedsManualA:
          splitDomain(domain).subdomain === "@" || splitDomain(domain).subdomain === ""
            ? "Apex domain: CNAME non valido. Aggiungi A records manualmente quando Firebase li mostra in console o leggi GET /domains/{fqdn}/status."
            : null,
        pollEndpoint: `/api/projects/${projectId}/domains/status?domain=${domain}`,
      },
    });
  } catch (err) {
    console.error("[api/domains/register-cert] failed", err);
    return NextResponse.json(
      { error: (err as Error).message ?? "unknown error" },
      { status: 500 },
    );
  }
}
