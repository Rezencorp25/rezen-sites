import { NextResponse } from "next/server";
import { generateCMSchema } from "@/lib/ai/agents/cms-architect";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { description: string };
    const result = await generateCMSchema(body);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message ?? "cms-schema failed" },
      { status: 500 },
    );
  }
}
