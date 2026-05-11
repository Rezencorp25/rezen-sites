import { NextResponse } from "next/server";
import { getAdmin } from "@/lib/firebase/admin";
import {
  defaultBackendCoords,
  getCustomDomain,
} from "@/lib/firebase/apphosting-admin";

/**
 * S7.14 sub-C — Status polling per la fase "issuing-cert" → "live".
 *
 * Usage:
 *   GET /api/projects/{projectId}/domains/status?domain=verumflow.com
 *
 * Legge sia Firestore (status corrente) sia App Hosting (cert state) e
 * avanza a "live" quando Firebase ha emesso il cert. UI ci pollerà ogni
 * 5-10s mostrando spinner finché non torna "live" o "failed".
 */

export const runtime = "nodejs";
export const maxDuration = 15;

export async function GET(
  req: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params;
  if (!/^[a-z0-9-]+$/.test(projectId)) {
    return NextResponse.json({ error: "invalid projectId" }, { status: 400 });
  }
  const url = new URL(req.url);
  const domain = (url.searchParams.get("domain") ?? "").toLowerCase().trim();
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
      verifiedAt?: { toDate: () => Date };
      liveAt?: { toDate: () => Date };
    };
    if (data.projectId !== projectId) {
      return NextResponse.json({ error: "wrong_project" }, { status: 403 });
    }

    // Per status terminal (live / failed) niente fetch a App Hosting.
    if (data.status === "live" || data.status === "failed") {
      return NextResponse.json({
        domain,
        status: data.status,
        verifiedAt: data.verifiedAt?.toDate().toISOString() ?? null,
        liveAt: data.liveAt?.toDate().toISOString() ?? null,
      });
    }

    // Per stati pending (pending-verify / issuing-cert) poll App Hosting.
    let appHostingStatus: string = "n/a";
    let appHostingError: string | undefined;
    try {
      const coords = defaultBackendCoords();
      const ahState = await getCustomDomain({ coords, domain });
      appHostingStatus = ahState.status;
      // Avanza Firestore se App Hosting dice cert attivo.
      if (ahState.status === "active" && data.status === "issuing-cert") {
        const now = new Date();
        await docRef.set(
          {
            status: "live",
            liveAt: now,
            updatedAt: now,
          },
          { merge: true },
        );
        return NextResponse.json({
          domain,
          status: "live",
          liveAt: now.toISOString(),
          appHostingStatus,
        });
      }
      if (ahState.status === "failed" && data.status !== "failed") {
        const now = new Date();
        await docRef.set(
          {
            status: "failed",
            updatedAt: now,
            lastError: "App Hosting cert provisioning failed",
          },
          { merge: true },
        );
        return NextResponse.json({
          domain,
          status: "failed",
          appHostingStatus,
        });
      }
    } catch (err) {
      appHostingError = (err as Error).message;
    }

    return NextResponse.json({
      domain,
      status: data.status,
      appHostingStatus,
      ...(appHostingError && { appHostingError }),
    });
  } catch (err) {
    console.error("[api/domains/status] failed", err);
    return NextResponse.json(
      { error: (err as Error).message ?? "unknown error" },
      { status: 500 },
    );
  }
}
