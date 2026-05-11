import { NextResponse } from "next/server";
import { promises as dnsPromises } from "node:dns";
import { getAdmin } from "@/lib/firebase/admin";
import { VERIFY_TXT_NAME } from "@/lib/dns/verify-token";
import { splitDomain } from "@/lib/dns/godaddy";

/**
 * S7.14 sub-B — Polling endpoint: verifica che il TXT `_rezen-verify.<domain>`
 * sia propagato e contenga il token salvato in Firestore.
 *
 * Match-by-token (NOT match-by-existence): se il TXT esiste ma con un valore
 * diverso (es. l'utente ha rotato manualmente), restiamo in pending-verify.
 *
 * Usage:
 *   POST /api/projects/{projectId}/domains/verify
 *   body: { domain: "verumflow.com" }
 *
 * Idempotente: se status è già verified, ritorna ok senza riverificare.
 * Non avanza oltre "verified" — l'issue-cert + live transition arrivano in
 * sub-C (registrazione Firebase App Hosting custom domain).
 */

export const runtime = "nodejs";
export const maxDuration = 15;

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
        { error: "domain_not_connected", message: "Collega prima il dominio via /domains/connect" },
        { status: 404 },
      );
    }
    const data = snap.data() as {
      projectId: string;
      status: string;
      verifyToken: string;
    };
    if (data.projectId !== projectId) {
      return NextResponse.json(
        { error: "domain_belongs_to_other_project" },
        { status: 403 },
      );
    }
    if (data.status === "verified" || data.status === "issuing-cert" || data.status === "live") {
      return NextResponse.json({
        ok: true,
        domain,
        status: data.status,
        alreadyVerified: true,
      });
    }

    const { apex, subdomain } = splitDomain(domain);
    const lookupHost =
      subdomain === "@" || subdomain === ""
        ? `${VERIFY_TXT_NAME}.${apex}`
        : `${VERIFY_TXT_NAME}.${subdomain}.${apex}`;

    let txtSets: string[][];
    try {
      txtSets = await dnsPromises.resolveTxt(lookupHost);
    } catch (err) {
      const code = (err as { code?: string }).code;
      if (code === "ENOTFOUND" || code === "ENODATA") {
        // Record non ancora propagato — risposta pending, non errore.
        return NextResponse.json({
          ok: false,
          domain,
          status: "pending-verify",
          reason: "TXT non ancora propagato (riprovare fra qualche minuto)",
        });
      }
      throw err;
    }
    // resolveTxt ritorna string[][] — un array per ogni TXT record, con i
    // chunk concatenati. Flatten + cerca il token.
    const flat = txtSets.map((chunks) => chunks.join("")).map((s) => s.trim());
    const matched = flat.includes(data.verifyToken);
    if (!matched) {
      return NextResponse.json({
        ok: false,
        domain,
        status: "pending-verify",
        reason: "TXT trovato ma il valore non corrisponde al token atteso",
        foundCount: flat.length,
      });
    }

    // Avanza a verified.
    const now = new Date();
    await docRef.set(
      {
        status: "verified",
        verifiedAt: now,
        updatedAt: now,
        lastError: null,
      },
      { merge: true },
    );
    return NextResponse.json({
      ok: true,
      domain,
      status: "verified",
      verifiedAt: now.toISOString(),
    });
  } catch (err) {
    console.error("[api/domains/verify] failed", err);
    return NextResponse.json(
      { error: (err as Error).message ?? "unknown error" },
      { status: 500 },
    );
  }
}
