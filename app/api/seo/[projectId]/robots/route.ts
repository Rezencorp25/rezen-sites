import { NextResponse } from "next/server";
import { buildRobotsTxt, type RobotsConfig } from "@/lib/seo/robots-sitemap";

export const runtime = "nodejs";

/**
 * Preview robots.txt builder. Accepts the project's robots config + base URL
 * via POST body. Used for live preview in Settings UI.
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      config: RobotsConfig;
      baseUrl: string;
    };
    const txt = buildRobotsTxt(body.config, body.baseUrl);
    return new NextResponse(txt, {
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message ?? "robots build failed" },
      { status: 500 },
    );
  }
}
