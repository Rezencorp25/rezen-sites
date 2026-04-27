import { NextResponse } from "next/server";
import {
  buildSitemapXml,
  buildSitemapEntriesFromPages,
} from "@/lib/seo/robots-sitemap";
import type { Page, Project } from "@/types";

export const runtime = "nodejs";

/**
 * Preview sitemap.xml builder. Project + pages come from the client store.
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      project: Project;
      pages: Page[];
    };
    const entries = buildSitemapEntriesFromPages(body.project, body.pages);
    const xml = buildSitemapXml(entries);
    return new NextResponse(xml, {
      headers: { "content-type": "application/xml; charset=utf-8" },
    });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message ?? "sitemap build failed" },
      { status: 500 },
    );
  }
}
