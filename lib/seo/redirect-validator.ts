import type { Redirect } from "@/types";

export type RedirectIssue =
  | { kind: "loop"; path: string; cycle: string[] }
  | { kind: "chain"; path: string; chain: string[] }
  | { kind: "duplicate"; oldPath: string; ids: string[] };

export type RedirectValidation = {
  issues: RedirectIssue[];
  /** map oldPath -> resolved final path (or last hop before loop) */
  resolved: Map<string, string>;
};

const MAX_CHAIN_HOPS = 3;

/**
 * Validate a project's redirect set. Detects:
 *  - cycles (A → B → A)
 *  - long chains (>3 hops)
 *  - duplicates (same oldPath in multiple active rules)
 */
export function validateRedirects(redirects: Redirect[]): RedirectValidation {
  const active = redirects.filter((r) => r.active);
  const map = new Map<string, Redirect>();
  const dupes = new Map<string, Redirect[]>();
  for (const r of active) {
    const existing = map.get(r.oldPath);
    if (existing) {
      const list = dupes.get(r.oldPath) ?? [existing];
      list.push(r);
      dupes.set(r.oldPath, list);
    } else {
      map.set(r.oldPath, r);
    }
  }

  const issues: RedirectIssue[] = [];
  const resolved = new Map<string, string>();

  for (const [oldPath, ids] of dupes.entries()) {
    issues.push({
      kind: "duplicate",
      oldPath,
      ids: ids.map((r) => r.id),
    });
  }

  for (const r of active) {
    const path = r.oldPath;
    const visited: string[] = [path];
    let cur = r.newPath;
    let safety = 0;
    while (safety < 10) {
      if (visited.includes(cur)) {
        issues.push({ kind: "loop", path, cycle: [...visited, cur] });
        resolved.set(path, cur);
        break;
      }
      visited.push(cur);
      const next = map.get(cur);
      if (!next) {
        resolved.set(path, cur);
        if (visited.length - 1 > MAX_CHAIN_HOPS) {
          issues.push({ kind: "chain", path, chain: visited });
        }
        break;
      }
      cur = next.newPath;
      safety++;
    }
  }

  return { issues, resolved };
}

export function describeIssue(issue: RedirectIssue): string {
  switch (issue.kind) {
    case "loop":
      return `Loop redirect: ${issue.cycle.join(" → ")}`;
    case "chain":
      return `Catena lunga (${issue.chain.length - 1} hop): ${issue.chain.join(" → ")}`;
    case "duplicate":
      return `Duplicato: ${issue.oldPath} (${issue.ids.length} regole attive)`;
  }
}
