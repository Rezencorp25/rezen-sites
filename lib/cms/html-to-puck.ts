import * as cheerio from "cheerio";
import type { Data as PuckData } from "@measured/puck";

/**
 * S7.9 — Parser HTML → PuckData.
 *
 * Heuristic mapping per export Webflow / Framer / WordPress static / hand-coded:
 *  - `<header>` / primo H1 → Hero
 *  - `<main>` H2 → Heading
 *  - `<main>` p → Paragraph
 *  - `<img>` → Image (URL ricabbato a /imports/{...})
 *  - `<footer>` → Footer (versione semplificata: testo)
 *  - sezioni con grid/flex layout articolato → GenericHtml fallback (no data loss)
 *
 * Asset images vengono lasciati con il path che già hanno; il caller deve
 * pre-fixare il base URL (es. /imports/{projectId}/{pageId}/).
 */

export type ParseResult = {
  puckData: PuckData;
  stats: {
    blocksProduced: number;
    fallbackBlocks: number;
    detectedTitle?: string;
    detectedDescription?: string;
  };
};

export function parseHtmlToPuck(
  html: string,
  options: { assetBaseUrl?: string } = {},
): ParseResult {
  const $ = cheerio.load(html);
  const content: PuckData["content"] = [];
  let fallbackBlocks = 0;
  let blockId = 0;
  const nextId = (prefix: string) => `${prefix}-${++blockId}`;

  const title = $("title").first().text().trim() || $("h1").first().text().trim();
  const description =
    $('meta[name="description"]').attr("content") ??
    $("p").first().text().trim();

  function rewriteSrc(src: string | undefined): string {
    if (!src) return "";
    if (/^https?:\/\//i.test(src)) return src;
    if (src.startsWith("/")) return src;
    return options.assetBaseUrl ? `${options.assetBaseUrl}${src}` : src;
  }

  // 1) Hero: <header> con H1 + tagline
  const header = $("header").first();
  if (header.length) {
    const h1 = header.find("h1").first();
    const tagline = header.find("p").first();
    if (h1.length) {
      content.push({
        type: "Hero",
        props: {
          id: nextId("hero"),
          headline: h1.text().trim(),
          subheadline: tagline.text().trim() || undefined,
          ctaText: header.find("a.cta, button").first().text().trim() || "",
          ctaHref: header.find("a.cta").first().attr("href") || "",
          variant: "luminous",
        },
      } as PuckData["content"][number]);
      header.remove();
    }
  } else {
    // Fallback Hero: primo H1 documento
    const h1 = $("h1").first();
    if (h1.length) {
      content.push({
        type: "Hero",
        props: {
          id: nextId("hero"),
          headline: h1.text().trim(),
          subheadline: h1.next("p").text().trim() || undefined,
          ctaText: "",
          ctaHref: "",
          variant: "luminous",
        },
      } as PuckData["content"][number]);
      h1.remove();
    }
  }

  // 2) Body: itera sui figli diretti di <main> o <body>
  const root = $("main").first().length ? $("main").first() : $("body");
  root.children().each((_, el) => {
    const $el = $(el);
    const tag = (el as { tagName?: string }).tagName?.toLowerCase();
    if (!tag) return;

    if (tag === "footer") {
      content.push({
        type: "Footer",
        props: {
          id: nextId("footer"),
          companyName: $el.find("strong, .brand").first().text().trim() || "",
          tagline: $el.find("p").first().text().trim() || "",
          copyright: $el.text().match(/©\s*\d{4}.*$/)?.[0] ?? "",
          columns: [],
        },
      } as PuckData["content"][number]);
      return;
    }

    if (tag === "h2" || tag === "h3" || tag === "h4") {
      content.push({
        type: "Heading",
        props: {
          id: nextId("h"),
          text: $el.text().trim(),
          level: tag,
          alignment: "left",
          color: "on-surface",
        },
      } as PuckData["content"][number]);
      return;
    }

    if (tag === "p") {
      content.push({
        type: "Paragraph",
        props: {
          id: nextId("p"),
          text: $el.text().trim(),
          alignment: "left",
          size: "md",
        },
      } as PuckData["content"][number]);
      return;
    }

    if (tag === "img") {
      const src = rewriteSrc($el.attr("src"));
      content.push({
        type: "Image",
        props: {
          id: nextId("img"),
          src,
          alt: $el.attr("alt") ?? "",
          aspectRatio: "auto",
          fit: "cover",
        },
      } as PuckData["content"][number]);
      return;
    }

    if (tag === "section" || tag === "article" || tag === "div") {
      // Itera ricorsivamente su questo nodo per estrarre headings/img/p
      const innerH = $el.find("h2,h3").first();
      const innerP = $el.find("p").first();
      const innerImg = $el.find("img").first();
      if (innerH.length || innerP.length || innerImg.length) {
        if (innerH.length) {
          content.push({
            type: "Heading",
            props: {
              id: nextId("h"),
              text: innerH.text().trim(),
              level: (innerH.prop("tagName")?.toLowerCase() ?? "h2") as
                | "h2"
                | "h3",
              alignment: "left",
              color: "on-surface",
            },
          } as PuckData["content"][number]);
        }
        if (innerImg.length) {
          content.push({
            type: "Image",
            props: {
              id: nextId("img"),
              src: rewriteSrc(innerImg.attr("src")),
              alt: innerImg.attr("alt") ?? "",
              aspectRatio: "auto",
              fit: "cover",
            },
          } as PuckData["content"][number]);
        }
        if (innerP.length) {
          content.push({
            type: "Paragraph",
            props: {
              id: nextId("p"),
              text: innerP.text().trim(),
              alignment: "left",
              size: "md",
            },
          } as PuckData["content"][number]);
        }
        return;
      }
      // Fallback: blocco non riconosciuto → preserva HTML raw
      const rawHtml = $.html(el).trim();
      if (rawHtml.length > 0) {
        content.push({
          type: "GenericHtml",
          props: {
            id: nextId("raw"),
            html: rawHtml,
            warning: true,
          },
        } as PuckData["content"][number]);
        fallbackBlocks += 1;
      }
      return;
    }

    // Tag non gestito → fallback
    const rawHtml = $.html(el).trim();
    if (rawHtml.length > 0) {
      content.push({
        type: "GenericHtml",
        props: {
          id: nextId("raw"),
          html: rawHtml,
          warning: true,
        },
      } as PuckData["content"][number]);
      fallbackBlocks += 1;
    }
  });

  return {
    puckData: {
      content,
      root: { props: { title: title || "Imported page" } },
    } as unknown as PuckData,
    stats: {
      blocksProduced: content.length,
      fallbackBlocks,
      detectedTitle: title || undefined,
      detectedDescription: description || undefined,
    },
  };
}
