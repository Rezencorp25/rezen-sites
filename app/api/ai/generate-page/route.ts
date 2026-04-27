import { NextResponse } from "next/server";
import { generatePuckPage, type PageBrief } from "@/lib/ai/agents/page-designer";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as PageBrief;
    const result = await generatePuckPage(body);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message ?? "generate-page failed" },
      { status: 500 },
    );
  }
}
