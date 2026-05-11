import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAdmin } from "@/lib/firebase/admin";

/**
 * S7.14 sub-D — Host-aware request proxy.
 *
 * Decide il comportamento del request in base al `Host` header:
 *  1) Host = gestionale (hosted.app, localhost) → applica regole originali
 *     (auth gate + SEO research redirect)
 *  2) Host = custom domain live in Firestore `domains/{host}` → rewrite a
 *     `/sites/{projectId}/...`, BYPASSANDO l'auth gate (sono utenti finali
 *     del sito cliente, non operatori del gestionale)
 *  3) Host sconosciuto → 404 implicito (next() lascia che Next risponda)
 *
 * Cache: in-memory TTL 5 min sui lookup Firestore per non hit-arlo a ogni
 * request. Failed-open su errore Firestore (peggio: gestionale di default;
 * meglio di 500).
 */

const SESSION_COOKIE = "rezen_session";
const PUBLIC_PREFIXES = ["/login", "/onboarding"];
const SEO_RESEARCH_REDIRECT = /^\/projects\/([^/]+)\/seo-research(\/.*)?$/;

const GESTIONALE_HOST_SUFFIXES = [
  ".hosted.app", // Firebase App Hosting backend subdomain
  ".vercel.app", // preview Vercel future
];
const GESTIONALE_HOST_EXACT = ["localhost", "127.0.0.1"];

const CACHE_TTL_MS = 5 * 60 * 1000;
type CacheEntry = { projectId: string | null; expiresAt: number };
const customDomainCache = new Map<string, CacheEntry>();

function isGestionaleHost(host: string): boolean {
  return (
    GESTIONALE_HOST_EXACT.includes(host) ||
    GESTIONALE_HOST_SUFFIXES.some((suffix) => host.endsWith(suffix))
  );
}

async function resolveProjectForHost(host: string): Promise<string | null> {
  const now = Date.now();
  const cached = customDomainCache.get(host);
  if (cached && cached.expiresAt > now) return cached.projectId;
  let projectId: string | null = null;
  try {
    const { db } = getAdmin();
    const snap = await db.collection("domains").doc(host).get();
    if (snap.exists) {
      const data = snap.data() as { projectId?: string; status?: string };
      if (data.projectId && data.status === "live") {
        projectId = data.projectId;
      }
    }
  } catch (err) {
    console.warn("[proxy] domain lookup failed", { host, err });
  }
  customDomainCache.set(host, { projectId, expiresAt: now + CACHE_TTL_MS });
  return projectId;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = (request.headers.get("host") ?? "").toLowerCase().split(":")[0];

  // 1) Custom domain → rewrite a /sites/{projectId}/... (no auth gate)
  if (host && !isGestionaleHost(host)) {
    const projectId = await resolveProjectForHost(host);
    if (projectId) {
      const url = request.nextUrl.clone();
      url.pathname = `/sites/${projectId}${pathname === "/" ? "/" : pathname}`;
      return NextResponse.rewrite(url);
    }
    // Host non riconosciuto → pass-through, Next risponde con 404 della
    // gestionale (acceptable per ora; in futuro dedicata page "not found").
    return NextResponse.next();
  }

  // 2) Gestionale host → regole originali (auth + redirect)

  const seoResearchMatch = pathname.match(SEO_RESEARCH_REDIRECT);
  if (seoResearchMatch) {
    const url = request.nextUrl.clone();
    url.pathname = `/projects/${seoResearchMatch[1]}/seo${seoResearchMatch[2] ?? ""}`;
    return NextResponse.redirect(url, 308);
  }

  const hasSession = Boolean(request.cookies.get(SESSION_COOKIE));
  const isPublic = PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));

  if (!hasSession && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (hasSession && pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/projects";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|imports|sites|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
