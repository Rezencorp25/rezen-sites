import type { Page, Project } from "@/types";

/**
 * llms.txt — emerging standard (2024+) for content-aware AI engines.
 * https://llmstxt.org/
 *
 * Format: Markdown header + summary + bulleted page index, optionally with
 * an "Optional" section listing low-priority resources.
 */

export function buildLlmsTxt(opts: {
  project: Project;
  pages: Page[];
  description?: string;
}): string {
  const { project, pages, description } = opts;
  const baseUrl = `https://${project.domain}`.replace(/\/$/, "");
  const lines: string[] = [];

  lines.push(`# ${project.name}`);
  lines.push("");

  if (description) {
    lines.push(`> ${description}`);
    lines.push("");
  }

  const indexable = pages.filter(
    (p) => p.status === "published" && p.seo.indexable,
  );
  const optional = pages.filter(
    (p) => p.status === "published" && !p.seo.indexable,
  );

  if (indexable.length > 0) {
    lines.push("## Pages");
    lines.push("");
    for (const p of indexable.sort((a, b) =>
      a.slug === "/" ? -1 : b.slug === "/" ? 1 : a.title.localeCompare(b.title),
    )) {
      const slug = p.slug.replace(/^\/+/, "");
      const url = slug ? `${baseUrl}/${slug}` : `${baseUrl}/`;
      const desc = p.seo.metaDescription?.trim();
      lines.push(`- [${p.title}](${url})${desc ? `: ${desc}` : ""}`);
    }
    lines.push("");
  }

  if (optional.length > 0) {
    lines.push("## Optional");
    lines.push("");
    for (const p of optional) {
      const slug = p.slug.replace(/^\/+/, "");
      const url = slug ? `${baseUrl}/${slug}` : `${baseUrl}/`;
      lines.push(`- [${p.title}](${url})`);
    }
    lines.push("");
  }

  return lines.join("\n");
}
