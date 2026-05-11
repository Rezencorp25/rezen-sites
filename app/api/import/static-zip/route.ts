import { NextResponse } from "next/server";
import JSZip from "jszip";
import { promises as fs } from "node:fs";
import path from "node:path";
import type { Page, PageSEO, PageAnalytics } from "@/types";
import type { Data as PuckData } from "@measured/puck";
import { parseHtmlToPuck } from "@/lib/cms/html-to-puck";

/**
 * S7.8 — Import passthrough di un sito statico (Webflow/Framer/WordPress export).
 *
 * Spacchetta lo ZIP, scrive gli asset in `public/imports/{projectId}/{pageId}/`,
 * crea una Page con singolo blocco IframeEmbed che serve il sito originale 1:1.
 *
 * In produzione (S7+ deploy):
 *  - asset uploaded su Firebase Storage `gs://{bucket}/imports/{projectId}/{pageId}/`
 *  - URL signed 7gg (rotazione automatica via CF)
 *  - Storage rules: max 4MB/file, MIME whitelist html/css/js/png/jpg/woff2
 */

export const runtime = "nodejs";
export const maxDuration = 60;

const ALLOWED_EXT = new Set([
  ".html",
  ".htm",
  ".css",
  ".js",
  ".mjs",
  ".jsx",
  ".tsx",
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".svg",
  ".ico",
  ".woff",
  ".woff2",
  ".ttf",
  ".otf",
  ".json",
  ".xml",
  ".txt",
  ".map",
]);

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB per file (più generoso del Storage rule prod)
const MAX_TOTAL_SIZE = 100 * 1024 * 1024; // 100 MB total ZIP

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    const projectId = String(form.get("projectId") ?? "");
    const title = String(form.get("title") ?? "Sito importato");
    const slug = slugify(String(form.get("slug") ?? title));
    const importMode = String(form.get("mode") ?? "passthrough"); // "passthrough" | "parse"

    if (!projectId) {
      return NextResponse.json({ error: "projectId mancante" }, { status: 400 });
    }
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "file zip mancante" }, { status: 400 });
    }

    const buf = Buffer.from(await file.arrayBuffer());
    if (buf.length > MAX_TOTAL_SIZE) {
      return NextResponse.json(
        { error: `ZIP troppo grande (${formatBytes(buf.length)} > ${formatBytes(MAX_TOTAL_SIZE)})` },
        { status: 413 },
      );
    }

    const zip = await JSZip.loadAsync(buf);

    // Heuristic: detect index.html in root o subdir
    const indexEntry =
      zip.file(/^index\.html?$/i)[0] ??
      zip.file(/^[^/]+\/index\.html?$/i)[0] ??
      zip.file(/index\.html?$/i)[0];

    if (!indexEntry) {
      return NextResponse.json(
        {
          error:
            "Nessun index.html trovato nello ZIP. Per Claude Design / brief usare /api/import/design-zip.",
        },
        { status: 400 },
      );
    }

    // Calcola root dir interna (es. 'site/' o '')
    const indexPath = indexEntry.name;
    const rootDir = indexPath.includes("/")
      ? indexPath.slice(0, indexPath.lastIndexOf("/") + 1)
      : "";

    const pageId = `static-${Date.now()}`;
    const baseDir = path.join(
      process.cwd(),
      "public",
      "imports",
      projectId,
      pageId,
    );
    await fs.mkdir(baseDir, { recursive: true });

    let totalWritten = 0;
    let filesWritten = 0;
    const skipped: string[] = [];

    // Itera su tutti i file dello ZIP, filtra per estensione + size, normalizza path.
    const entries = Object.values(zip.files);
    for (const entry of entries) {
      if (entry.dir) continue;
      const relName = rootDir
        ? entry.name.startsWith(rootDir)
          ? entry.name.slice(rootDir.length)
          : entry.name
        : entry.name;
      if (!relName) continue;
      if (relName.includes("..")) {
        skipped.push(relName);
        continue;
      }
      const ext = path.extname(relName).toLowerCase();
      if (!ALLOWED_EXT.has(ext)) {
        skipped.push(relName);
        continue;
      }
      const data = await entry.async("nodebuffer");
      if (data.length > MAX_FILE_SIZE) {
        skipped.push(`${relName} (size ${formatBytes(data.length)})`);
        continue;
      }
      totalWritten += data.length;
      const target = path.join(baseDir, relName);
      await fs.mkdir(path.dirname(target), { recursive: true });
      await fs.writeFile(target, data);
      filesWritten += 1;
    }

    const assetBaseUrl = `/imports/${projectId}/${pageId}/`;

    // Collect every .html written to disk and produce a Page per file.
    // Index is always first so we can keep it as the "primary" page returned
    // for back-compat consumers that read `body.page`.
    const htmlEntries = entries.filter((e) => {
      if (e.dir) return false;
      const rel = rootDir && e.name.startsWith(rootDir)
        ? e.name.slice(rootDir.length)
        : e.name;
      if (!rel || rel.includes("..")) return false;
      const ext = path.extname(rel).toLowerCase();
      return ext === ".html" || ext === ".htm";
    });

    let parseStats:
      | { blocksProduced: number; fallbackBlocks: number }
      | undefined;
    const pages: Page[] = [];
    const now = new Date();

    for (const entry of htmlEntries) {
      const rel = rootDir && entry.name.startsWith(rootDir)
        ? entry.name.slice(rootDir.length)
        : entry.name;
      const isIndex = /(?:^|\/)index\.html?$/i.test(rel);
      const html = await entry.async("string");
      const detectedTitle = extractTitle(html);
      const detectedDescription = extractDescription(html);

      const fileTitle = detectedTitle || (isIndex ? title : prettifyName(rel));
      const fileSlug = isIndex ? slug || "/" : `/${rel.replace(/\.html?$/i, "")}`;
      const filePuckSrc = `/imports/${projectId}/${pageId}/${rel}`;

      let filePuckData: PuckData;
      if (importMode === "parse" && isIndex) {
        const parsed = parseHtmlToPuck(html, { assetBaseUrl });
        filePuckData = parsed.puckData;
        parseStats = {
          blocksProduced: parsed.stats.blocksProduced,
          fallbackBlocks: parsed.stats.fallbackBlocks,
        };
      } else {
        filePuckData = {
          content: [
            {
              type: "IframeEmbed",
              props: {
                id: `iframe-import-${slugifyId(rel)}`,
                src: filePuckSrc,
                height: 1600,
                title: fileTitle,
                badge: true,
                autoFit: true,
                showToolbar: true,
              },
            },
          ],
          root: { props: { title: fileTitle } },
        } as unknown as PuckData;
      }

      const seo = defaultSeo(fileTitle);
      if (detectedDescription) seo.metaDescription = detectedDescription.slice(0, 160);

      pages.push({
        id: isIndex ? pageId : `${pageId}-${slugifyId(rel)}`,
        projectId,
        title: fileTitle,
        slug: fileSlug,
        status: "draft",
        puckData: filePuckData,
        seo,
        analytics: defaultAnalytics(),
        createdAt: now,
        updatedAt: now,
      });
    }

    // Move the index page to position 0 so consumers can rely on pages[0]
    // being the homepage of the imported site.
    pages.sort((a, b) => {
      if (a.slug === "/") return -1;
      if (b.slug === "/") return 1;
      return a.slug.localeCompare(b.slug);
    });

    return NextResponse.json({
      // Back-compat: consumers that still read `page` get the homepage.
      page: pages[0] ?? null,
      pages,
      source: "static-zip",
      mode: importMode,
      stats: {
        filesWritten,
        pagesCreated: pages.length,
        skipped,
        totalBytes: totalWritten,
        ...(parseStats ?? {}),
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message ?? "static-zip import failed" },
      { status: 500 },
    );
  }
}

function defaultSeo(title: string): PageSEO {
  return {
    metaTitle: title,
    metaDescription: "",
    canonicalUrl: "",
    indexable: false,
    internalSearch: false,
    og: {},
    schemaType: "Article",
  };
}

function defaultAnalytics(): PageAnalytics {
  return {
    pageviews7d: 0,
    pageviews30d: 0,
    bounceRate: 0,
    avgPosition: 0,
    topKeyword: "",
    seoScore: 60,
  };
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function slugifyId(filePath: string): string {
  // Strip extension, collapse slashes to dashes, then slugify.
  return slugify(filePath.replace(/\.html?$/i, "").replace(/[/\\]+/g, "-"));
}

function prettifyName(filePath: string): string {
  const base = filePath.replace(/\.html?$/i, "").split(/[/\\]/).pop() ?? filePath;
  return base
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function extractTitle(html: string): string | undefined {
  const m = html.match(/<title>([^<]+)<\/title>/i);
  return m ? decodeEntities(m[1].trim()) : undefined;
}

function extractDescription(html: string): string | undefined {
  const m = html.match(
    /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i,
  );
  return m ? decodeEntities(m[1].trim()) : undefined;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}
