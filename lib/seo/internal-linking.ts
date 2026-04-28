import type { Page } from "@/types";

const STOPWORDS_IT = new Set([
  "il","la","i","le","lo","gli","un","uno","una","di","del","della","dei","delle","dello","da","dal","della","in","nel","nella","con","su","sul","per","tra","fra","e","o","ma","se","che","chi","cui","ci","è","sono","sei","ho","hai","ha","abbiamo","avete","hanno","non","si","mi","ti","vi","te","me","piu","più","molto","poco","tutto","tutti","quello","questo","quale","quali","mio","tua","suoi","loro","suo","sua","nostri","vostri","essere","stato","stata","fare","fatto","una","uni","de","al","alla","alle","agli",
]);

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .split(/[^a-z0-9]+/)
      .filter((w) => w.length > 3 && !STOPWORDS_IT.has(w)),
  );
}

function pageText(p: Page): string {
  const parts: string[] = [p.title, p.seo.metaDescription, p.seo.metaTitle];
  for (const item of p.puckData.content ?? []) {
    const props = item.props as Record<string, unknown>;
    for (const v of Object.values(props)) {
      if (typeof v === "string") parts.push(v);
    }
  }
  return parts.join(" ");
}

export type LinkSuggestion = {
  fromPageId: string;
  fromTitle: string;
  fromSlug: string;
  toPageId: string;
  toTitle: string;
  toSlug: string;
  /** Words shared between the two pages (anchor candidates) */
  sharedKeywords: string[];
  /** Jaccard-style score 0..1 */
  score: number;
};

/**
 * Suggest internal link opportunities. For each (from, to) page pair compute
 * keyword overlap; surface the top N suggestions for the target page.
 *
 * Used by:
 *   - SEO editor (target=current page) → "Pagine che dovrebbero linkarti"
 *   - Project audit → orphan pages (no inbound + no outbound)
 */
export function suggestInternalLinksTo(
  targetPage: Page,
  allPages: Page[],
  topN = 5,
): LinkSuggestion[] {
  if (allPages.length < 2) return [];
  const targetTokens = tokenize(pageText(targetPage));
  if (targetTokens.size === 0) return [];

  const out: LinkSuggestion[] = [];
  for (const p of allPages) {
    if (p.id === targetPage.id) continue;
    if (p.status !== "published") continue;
    const fromTokens = tokenize(pageText(p));
    const shared: string[] = [];
    for (const t of targetTokens) {
      if (fromTokens.has(t)) shared.push(t);
    }
    if (shared.length === 0) continue;
    const union = new Set([...fromTokens, ...targetTokens]);
    const score = shared.length / union.size;
    out.push({
      fromPageId: p.id,
      fromTitle: p.title,
      fromSlug: p.slug,
      toPageId: targetPage.id,
      toTitle: targetPage.title,
      toSlug: targetPage.slug,
      sharedKeywords: shared.slice(0, 5).sort((a, b) => b.length - a.length),
      score: Math.round(score * 1000) / 1000,
    });
  }

  return out.sort((a, b) => b.score - a.score).slice(0, topN);
}

/**
 * Detect orphan pages: pages that nobody links to (no anchor mentioning their
 * title or slug in any other page's puck content).
 */
export function detectOrphanPages(allPages: Page[]): Page[] {
  const published = allPages.filter((p) => p.status === "published");
  const orphans: Page[] = [];
  for (const p of published) {
    const slugBare = p.slug.replace(/^\/+|\/+$/g, "");
    const titleLower = p.title.toLowerCase();
    let referenced = false;
    for (const other of published) {
      if (other.id === p.id) continue;
      const flat = JSON.stringify(other.puckData.content ?? "").toLowerCase();
      if (
        (slugBare && flat.includes(slugBare)) ||
        (titleLower.length > 4 && flat.includes(titleLower))
      ) {
        referenced = true;
        break;
      }
    }
    if (!referenced) orphans.push(p);
  }
  return orphans;
}
