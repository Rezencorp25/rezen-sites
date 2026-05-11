import { NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";
import * as cheerio from "cheerio";
import { commitFiles } from "@/lib/github/commit-files";

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
 * Map of human-readable Google Font names to URL-encoded family tokens for
 * fonts.googleapis.com/css2?family=… requests. When a fontFamily patch is
 * applied, we ensure the corresponding <link> tag exists in <head> so the
 * font actually renders. Keep in sync with FONT_FAMILIES in the side panel.
 */
const GOOGLE_FONTS: Record<string, string> = {
  "Inter": "Inter:wght@100..900",
  "Manrope": "Manrope:wght@200..800",
  "DM Sans": "DM+Sans:wght@100..1000",
  "Plus Jakarta Sans": "Plus+Jakarta+Sans:wght@200..800",
  "Space Grotesk": "Space+Grotesk:wght@300..700",
  "Playfair Display": "Playfair+Display:wght@400..900",
  "Lora": "Lora:wght@400..700",
  "Instrument Serif": "Instrument+Serif",
  "JetBrains Mono": "JetBrains+Mono:wght@100..800",
  "Bebas Neue": "Bebas+Neue",
};

/**
 * Extracts the first family name from a CSS font-family value, stripping
 * quotes and stack fallbacks. "'Inter', sans-serif" → "Inter".
 */
function firstFamilyName(value: string): string {
  const first = value.split(",")[0] || "";
  return first.replace(/['"]/g, "").trim();
}

/**
 * Idempotently appends the Google Fonts <link> for `family` to <head>.
 * No-op when family isn't in our curated map or link already exists.
 */
function ensureGoogleFontLink(
  $: cheerio.CheerioAPI,
  family: string,
): void {
  const token = GOOGLE_FONTS[family];
  if (!token) return;
  const href = `https://fonts.googleapis.com/css2?family=${token}&display=swap`;
  if ($(`link[href="${href}"]`).length) return;
  $("head").append(`<link rel="stylesheet" href="${href}">`);
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
  const body = (await req.json()) as {
    path?: string;
    patches?: Patch[];
    /**
     * S7.13 — When the project has a GitHub repo, the client passes its
     * coords so we can commit the modified files alongside the local fs
     * write. Repo is the source of truth (Cloud Run fs is ephemeral).
     */
    githubRepo?: { owner: string; name: string; branch: string };
  };
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
      // Per-patch try/catch so a single malformed/throwing patch doesn't
      // tank the whole batch with a 500. We collect partial results and
      // report them back via skippedDetails.
      try {
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
          if (!sp || !(ALLOWED_STYLE_PROPS as readonly string[]).includes(sp)) {
            skipped.push({ patch, reason: `styleProp non supportato: ${sp ?? "(missing)"}` });
            break;
          }
          const existingStyle = el.attr("style") ?? "";
          const merged = mergeStyle(existingStyle, sp, patch.value);
          if (merged) {
            el.attr("style", merged);
          } else if (existingStyle) {
            // Only call removeAttr when there's actually a style attr to
            // remove. Older cheerio builds throw on no-op removeAttr.
            el.removeAttr("style");
          }
          // Side-effect: when changing fontFamily to one of our curated
          // Google Fonts, also ensure the <link> is in <head>. Otherwise
          // the user sees the fallback even though style is "correct".
          if (sp === "fontFamily" && patch.value) {
            ensureGoogleFontLink($, firstFamilyName(patch.value));
          }
          applied.push(patch);
          break;
        }
        default:
          skipped.push({ patch, reason: `prop sconosciuta: ${patch.prop}` });
      }
      } catch (perPatchErr) {
        skipped.push({ patch, reason: `errore: ${(perPatchErr as Error).message}` });
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

    // S7.13 Fase B — commit to GitHub repo if linked. Best-effort: a commit
    // failure shouldn't undo the successful local write (preview still works),
    // but we report it so the client can surface a warning.
    let commitSha: string | undefined;
    let commitError: string | undefined;
    if (body.githubRepo && applied.length > 0) {
      try {
        const { sha } = await commitFiles({
          owner: body.githubRepo.owner,
          repo: body.githubRepo.name,
          branch: body.githubRepo.branch,
          message: `edit: ${relPath} (${applied.length} patches)`,
          files: [{ path: relPath, content: out }],
        });
        commitSha = sha;
      } catch (err) {
        commitError = (err as Error).message;
        console.error("[api/imports/patch] commit failed", {
          projectId,
          importId,
          relPath,
          err: commitError,
        });
      }
    }

    return NextResponse.json({
      path: relPath,
      size: newStat.size,
      applied: applied.length,
      skipped: skipped.length,
      skippedDetails: skipped.slice(0, 10),
      updatedAt: new Date().toISOString(),
      ...(commitSha && { commitSha }),
      ...(commitError && { commitError }),
    });
  } catch (err) {
    // Surface to Cloud Run logs — the JSON response is opaque to clients
    // when App Hosting catches an unhandled-looking error and replaces our
    // body with its own 500 HTML page. Logging here lets us diagnose
    // from gcloud / Firebase Console.
    console.error("[api/imports/patch] fatal", {
      err: (err as Error).message,
      stack: (err as Error).stack?.slice(0, 500),
      projectId,
      importId,
      relPath,
    });
    return NextResponse.json(
      { error: (err as Error).message ?? "patch failed" },
      { status: 500 },
    );
  }
}
