import { NextResponse } from "next/server";
import { editSection } from "@/lib/ai/agents/copywriter";
import type { PuckData } from "@/types";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      page: PuckData;
      selectedId: string | null;
      instruction: string;
    };
    const result = await editSection(body);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message ?? "edit-section failed" },
      { status: 500 },
    );
  }
}
