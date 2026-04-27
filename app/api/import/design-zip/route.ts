import { NextResponse } from "next/server";
import JSZip from "jszip";
import { orchestratePage } from "@/lib/ai/orchestrator";

export const runtime = "nodejs";

/**
 * Import ZIP generato da Claude Design / Stitch.
 * Convenzione attesa dentro lo zip:
 * - prompt.md (o prompt.txt) — brief testuale
 * - screen.png / screen.jpg — screenshot preview (opzionale, per vision AI futura)
 * - Qualsiasi struttura HTML/JSX è ignorata: usiamo il prompt come input Page Designer.
 */
export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    const projectId = String(form.get("projectId") ?? "");
    const title = String(form.get("title") ?? "Pagina importata");
    const slug = slugify(String(form.get("slug") ?? title));

    if (!projectId) {
      return NextResponse.json({ error: "projectId mancante" }, { status: 400 });
    }
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "file zip mancante" }, { status: 400 });
    }

    const buf = Buffer.from(await file.arrayBuffer());
    const zip = await JSZip.loadAsync(buf);

    let promptText = "";
    const promptFile =
      zip.file(/prompt\.(md|txt)$/i)[0] ?? zip.file(/brief\.(md|txt)$/i)[0];
    if (promptFile) promptText = await promptFile.async("string");

    const hasScreen = Boolean(
      zip.file(/screen\.(png|jpg|jpeg|webp)$/i)[0],
    );

    const brief = {
      goal:
        promptText.trim() ||
        `Pagina importata da ZIP (${hasScreen ? "con screenshot" : "solo struttura"}).`,
      tone: "coerente con il design allegato",
    };

    const { page, modes } = await orchestratePage({
      projectId,
      title,
      slug,
      brief,
    });

    return NextResponse.json({
      page,
      modes,
      source: "design-zip",
      hasPrompt: Boolean(promptText),
      hasScreen,
    });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message ?? "design-zip import failed" },
      { status: 500 },
    );
  }
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
