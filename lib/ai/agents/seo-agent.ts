import { getAnthropic, hasApiKey, MODELS } from "@/lib/ai/client";
import type { PageSEO, PuckData } from "@/types";

const SYSTEM = `You are SEO Agent. Given a page's Puck JSON, produce SEO metadata.
Output JSON with exact keys:
{
  "metaTitle": string (<=60 chars),
  "metaDescription": string (<=160 chars),
  "focusKeyword": string,
  "og": { "title": string, "description": string }
}
Italian unless page content is in another language. Raw JSON, no fences.`;

export type SEOFill = {
  metaTitle: string;
  metaDescription: string;
  focusKeyword: string;
  og: { title: string; description: string };
};

export async function fillSEO(args: {
  page: PuckData;
  pageTitle: string;
  focusKeyword?: string;
}): Promise<{ seo: SEOFill; mode: "ai" | "stub" }> {
  if (!hasApiKey()) {
    return { seo: stubSEO(args), mode: "stub" };
  }
  const client = getAnthropic()!;
  const msg = await client.messages.create({
    model: MODELS.sonnet,
    max_tokens: 1024,
    system: SYSTEM,
    messages: [
      {
        role: "user",
        content: `Titolo: ${args.pageTitle}\nFocus keyword (opzionale): ${args.focusKeyword ?? "-"}\nContenuto:\n${JSON.stringify(args.page.content)}`,
      },
    ],
  });
  const text = msg.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { text: string }).text)
    .join("");
  const seo = JSON.parse(text) as SEOFill;
  return { seo, mode: "ai" };
}

function stubSEO(args: { pageTitle: string; focusKeyword?: string }): SEOFill {
  const kw = args.focusKeyword ?? args.pageTitle.toLowerCase();
  return {
    metaTitle: `${args.pageTitle} — generato stub`,
    metaDescription: `Pagina "${args.pageTitle}" ottimizzata per ${kw}. [Stub: aggiungi ANTHROPIC_API_KEY per output reale]`,
    focusKeyword: kw,
    og: {
      title: args.pageTitle,
      description: `Scopri ${args.pageTitle} — ${kw}.`,
    },
  };
}

export function applySEOFill(current: PageSEO, fill: SEOFill): PageSEO {
  return {
    ...current,
    metaTitle: fill.metaTitle,
    metaDescription: fill.metaDescription,
    og: {
      ...current.og,
      title: fill.og.title,
      description: fill.og.description,
    },
  };
}
