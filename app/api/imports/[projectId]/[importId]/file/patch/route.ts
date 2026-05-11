import { NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";
import * as cheerio from "cheerio";

/**
 * Patch-based save for imported-site inline edits.
 *
 * Why: the previous flow serialized iframe.contentDocument.outerHTML and
 * persisted it. That captured Babel in-browser script expansions and other
 * runtime transforms, blowing the file size by 5–10×. This endpoint accepts
 * the original *patches* (selector + prop + value) and applies them against
 * the on-disk HTML via Cheerio, preserving the rest of the file byte-for-byte.
 */

export const runtime = "nodejs";
export const maxDuration = 30;

const MAX_FILE_BYTES = 2 * 1024 * 1024;
const MAX_PATCHES = 50;

const ALLOWED_STYLE_PROPS = [
  "color",
  "backgroundColor",
  "borderColor",
  "fontFamily",
  "fontSize",
  "fontWeight",
  "width",
  "height",
] as const;
type StyleProp = (typeof ALLOWED_STYLE_PROPS)[number];

type Patch = {
  selector: string;
  prop: "text" | "href" | "src" | "alt" | "style";
  styleProp?: StyleProp;
  value: string;
};

function toKebab(s: string): string {
  return s.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
}

/**
 * Merge a single property into an inline style attribute, preserving the rest.
 * Empty value removes the property. Last write wins.
 */
function mergeStyle(existing: string, prop: string, value: string): string {
  const kebab = toKebab(prop);
  const parts = (existing || "")
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((decl) => {
      const k = decl.split(":")[0]?.trim();
      return k !== kebab;
    });
  if (value && value.trim()) {
    parts.push(`${kebab}: ${value.trim()}`);
  }
  return parts.length ? parts.join("; ") + ";" : "";
}

function safeResolve(
  projectId: string,
  importId: string,
  relPath: string,
): string | null {
  if (!/^[a-z0-9-]+$/.test(projectId) || !/^[a-z0-9-]+$/.test(importId)) {
    return null;
  }
  if (!relPath || relPath.includes("..") || relPath.startsWith("/")) {
    return null;
  }
  const baseRoot = path.join(
    process.cwd(),
    "public",
    "imports",
    projectId,
    importId,
  );
  const candidate = path.resolve(path.join(baseRoot, relPath));
  if (!candidate.startsWith(path.resolve(baseRoot))) return null;
  return candidate;
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ projectId: string; importId: string }> },
) {
  const { projectId, importId } = await params;
  const body = (await req.json()) as { path?: string; patches?: Patch[] };
  const relPath = body.path ?? "";
  const file = safeResolve(projectId, importId, relPath);
  if (!file) {
    return NextResponse.json({ error: "invalid path" }, { status: 400 });
  }
  if (!/\.html?$/i.test(file)) {
    return NextResponse.json({ error: "solo .html" }, { status: 400 });
  }
  if (!Array.isArray(body.patches) || body.patches.length === 0) {
    return NextResponse.json({ error: "patches array richiesto" }, { status: 400 });
  }
  if (body.patches.length > MAX_PATCHES) {
    return NextResponse.json(
      { error: `troppe patches (max ${MAX_PATCHES})` },
      { status: 413 },
    );
  }

  try {
    const stat = await fs.stat(file);
    if (stat.size > MAX_FILE_BYTES) {
      return NextResponse.json(
        { error: `file troppo grande (${stat.size} > ${MAX_FILE_BYTES})` },
        { status: 413 },
      );
    }
    const html = await fs.readFile(file, "utf-8");
    // Preserve doctype / leading whitespace; Cheerio's $.html() does too,
    // but be defensive and capture explicitly.
    const $ = cheerio.load(html);

    const applied: Patch[] = [];
    const skipped: Array<{ patch: Patch; reason: string }> = [];

    for (const patch of body.patches) {
      if (typeof patch?.selector !== "string" || typeof patch?.value !== "string") {
        skipped.push({ patch, reason: "patch malformata" });
        continue;
      }
      let el;
      try {
        el = $(patch.selector).first();
      } catch (err) {
        skipped.push({ patch, reason: `selector invalido: ${(err as Error).message}` });
        continue;
      }
      if (!el.length) {
        skipped.push({ patch, reason: "selector non matcha alcun elemento" });
        continue;
      }
      const tag = (el.prop("tagName") || "").toString().toUpperCase();
      switch (patch.prop) {
        case "text":
          el.text(patch.value);
          applied.push(patch);
          break;
        case "href":
          if (tag !== "A") {
            skipped.push({ patch, reason: "href solo su <a>" });
          } else {
            el.attr("href", patch.value);
            applied.push(patch);
          }
          break;
        case "src":
          if (tag !== "IMG") {
            skipped.push({ patch, reason: "src solo su <img>" });
          } else {
            el.attr("src", patch.value);
            applied.push(patch);
          }
          break;
        case "alt":
          if (tag !== "IMG") {
            skipped.push({ patch, reason: "alt solo su <img>" });
          } else {
            el.attr("alt", patch.value);
            applied.push(patch);
          }
          break;
        case "style": {
          const sp = patch.styleProp;
          if (!sp || !ALLOWED_STYLE_PROPS.includes(sp)) {
            skipped.push({ patch, reason: `styleProp non supportato: ${sp ?? "(missing)"}` });
            break;
          }
          const existingStyle = el.attr("style") ?? "";
          const merged = mergeStyle(existingStyle, sp, patch.value);
          if (merged) el.attr("style", merged);
          else el.removeAttr("style");
          applied.push(patch);
          break;
        }
        default:
          skipped.push({ patch, reason: `prop sconosciuta: ${patch.prop}` });
      }
    }

    const out = $.html();
    if (Buffer.byteLength(out, "utf-8") > MAX_FILE_BYTES) {
      return NextResponse.json(
        { error: "output troppo grande dopo patch" },
        { status: 413 },
      );
    }
    await fs.writeFile(file, out, "utf-8");
    const newStat = await fs.stat(file);

    return NextResponse.json({
      path: relPath,
      size: newStat.size,
      applied: applied.length,
      skipped: skipped.length,
      skippedDetails: skipped.slice(0, 10),
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message ?? "patch failed" },
      { status: 500 },
    );
  }
}
