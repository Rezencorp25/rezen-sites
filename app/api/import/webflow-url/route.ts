import { NextResponse } from "next/server";
import { orchestratePage } from "@/lib/ai/orchestrator";

export const runtime = "nodejs";

/**
 * Import pagina da URL Webflow pubblico.
 * Stesso flow di framer-url: fetch HTML + estrazione meta → brief → orchestratePage.
 */
export async function POST(req: Request) {
  try {
    const { projectId, title, slug, url } = (await req.json()) as {
      projectId: string;
      title: string;
      slug: string;
      url: string;
    };
    if (!projectId || !url) {
      return NextResponse.json(
        { error: "projectId e url richiesti" },
        { status: 400 },
      );
    }

    const snapshot = await fetchPageSnapshot(url);
    const brief = {
      goal: snapshot.h1 || snapshot.title || "Pagina importata da Webflow",
      audience: snapshot.description ?? undefined,
      tone: "allineato al design del sito sorgente",
    };

    const { page, modes } = await orchestratePage({
      projectId,
      title: title || snapshot.title || "Webflow import",
      slug: slug || toSlug(snapshot.title ?? "webflow-import"),
      brief,
    });

    return NextResponse.json({
      page,
      modes,
      source: "webflow-url",
      snapshot,
    });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message ?? "webflow-url import failed" },
      { status: 500 },
    );
  }
}

async function fetchPageSnapshot(url: string) {
  const res = await fetch(url, {
    headers: {
      "user-agent":
        "Mozilla/5.0 (compatible; REZEN-Sites-Importer/1.0; +https://rezen.corp)",
    },
  });
  if (!res.ok) throw new Error(`fetch ${url} → ${res.status}`);
  const html = await res.text();
  return {
    title: extractMeta(html, /<title>([^<]+)<\/title>/i),
    description:
      extractMeta(html, /<meta\s+name="description"\s+content="([^"]+)"/i) ??
      extractMeta(html, /<meta\s+property="og:description"\s+content="([^"]+)"/i),
    h1: extractMeta(html, /<h1[^>]*>([^<]+)<\/h1>/i),
  };
}

function extractMeta(html: string, re: RegExp): string | null {
  const m = html.match(re);
  return m?.[1] ? decodeHtml(m[1].trim()) : null;
}

function decodeHtml(s: string) {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function toSlug(s: string) {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
