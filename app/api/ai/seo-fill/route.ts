import { NextResponse } from "next/server";
import { fillSEO } from "@/lib/ai/agents/seo-agent";
import type { PuckData } from "@/types";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      page: PuckData;
      pageTitle: string;
      focusKeyword?: string;
    };
    const result = await fillSEO(body);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message ?? "seo-fill failed" },
      { status: 500 },
    );
  }
}
