/**
 * Hash collection ID stile Webflow (es. "65e445c87b7e5e5ac14407b4").
 * 24 hex chars, MongoDB-like — usato come identificatore stabile
 * cross-environment (mock locale → Firestore live).
 */

export function generateCollectionHashId(): string {
  const ts = Math.floor(Date.now() / 1000)
    .toString(16)
    .padStart(8, "0");
  const rand = Array.from({ length: 16 }, () =>
    Math.floor(Math.random() * 16).toString(16),
  ).join("");
  return ts + rand;
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 256);
}

export function inferSingularPlural(name: string): {
  singular: string;
  plural: string;
} {
  const trimmed = name.trim();
  if (trimmed.endsWith("ies")) {
    return { singular: trimmed.slice(0, -3) + "y", plural: trimmed };
  }
  if (trimmed.endsWith("s") && !trimmed.endsWith("ss")) {
    return { singular: trimmed.slice(0, -1), plural: trimmed };
  }
  return { singular: trimmed, plural: trimmed + "s" };
}
