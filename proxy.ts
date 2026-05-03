import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE = "rezen_session";
const PUBLIC_PREFIXES = ["/login", "/onboarding"];

const SEO_RESEARCH_REDIRECT = /^\/projects\/([^/]+)\/seo-research(\/.*)?$/;

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = Boolean(request.cookies.get(SESSION_COOKIE));
  const isPublic = PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));

  const seoResearchMatch = pathname.match(SEO_RESEARCH_REDIRECT);
  if (seoResearchMatch) {
    const url = request.nextUrl.clone();
    url.pathname = `/projects/${seoResearchMatch[1]}/seo${seoResearchMatch[2] ?? ""}`;
    return NextResponse.redirect(url, 308);
  }

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
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
