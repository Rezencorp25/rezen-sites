import { NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";
import { parse } from "@babel/parser";

/**
 * JSX-AST patch endpoint for SPA-rendered imported sites (e.g. Verumflow,
 * Babel-in-browser React apps). Sister of `file/patch/route.ts`:
 *
 *   /file/patch       → applies cheerio patches against .html (static sites)
 *   /file/jsx-patch   → applies AST-surgery patches against .jsx (SPAs)
 *
 * Why a separate route: the static patch path matches CSS selectors against
 * the on-disk HTML. SPAs render markup at runtime so the HTML has only
 * <div id="root"></div> — the selectors never match, save returns 0 applied.
 *
 * Strategy: client sends (tag, text-content-snapshot, optional file hint,
 * prop/value). Server scans .jsx files in the import folder, parses each
 * with @babel/parser, finds JSXElements matching by tag + text. If a unique
 * match is found, performs a surgical byte-range replacement against the
 * source (preserving formatting outside the edited span). If ambiguous (>1
 * match) or none found, reports skip with reason.
 *
 * This is best-effort, not bulletproof:
 *  - Single occurrence only (no .map()-generated lists)
 *  - Loose text matching (trimmed equality)
 *  - Style merging: existing `style={{ ... }}` ObjectExpression preserved,
 *    only the target key updated
 *
 * Out of scope for MVP: rename JSX components, restructure trees, add/remove
 * children, modify conditional branches, multi-occurrence (.map) edits.
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
  /** CSS selector from the bridge (used as a heuristic for file hint). */
  selector: string;
  /** Tag name e.g. "H2", "P", "A", "IMG". */
  tag: string;
  /** Original text content at click time, for matching. Empty for IMG. */
  text?: string;
  prop: "text" | "href" | "src" | "alt" | "style";
  styleProp?: StyleProp;
  value: string;
  /** Optional explicit file hint, e.g. "section-stack-testimonials.jsx". */
  file?: string;
};

function safeResolve(projectId: string, importId: string): string | null {
  if (!/^[a-z0-9-]+$/.test(projectId) || !/^[a-z0-9-]+$/.test(importId)) {
    return null;
  }
  return path.join(
    process.cwd(),
    "public",
    "imports",
    projectId,
    importId,
  );
}

/**
 * Hint candidate .jsx file order from the selector. Selectors like
 * `... #testimonials > h2` → try `section-stack-testimonials.jsx` first.
 * Fallback: alphabetical sweep of all .jsx in folder.
 */
function rankCandidateFiles(allFiles: string[], selector: string): string[] {
  // Extract any #id tokens from the selector
  const idMatches = selector.match(/#([a-zA-Z0-9_-]+)/g) ?? [];
  const ids = idMatches.map((m) => m.slice(1).toLowerCase());
  // Score files: higher score for files whose name contains any extracted id
  return allFiles
    .map((f) => {
      const lower = f.toLowerCase();
      let score = 0;
      for (const id of ids) if (lower.includes(id)) score += 10;
      return { f, score };
    })
    .sort((a, b) => b.score - a.score)
    .map((x) => x.f);
}

type Loc = { start: number; end: number };

type FoundMatch = {
  /** Path of the .jsx file relative to importDir. */
  file: string;
  /** Char range of the matching JSXElement openingElement (or attribute/style). */
  range: Loc;
  /** Char range of the children (for text edits). */
  childrenRange?: Loc;
  /** The source string (loaded once per file). */
  source: string;
};

/**
 * Walk a parsed AST, find JSXElements matching tag (case-insensitive) whose
 * direct text-children trim-match `wantedText`. Returns all matches.
 */
function findJsxMatches(
  ast: ReturnType<typeof parse>,
  tag: string,
  wantedText: string,
): Array<{ range: Loc; childrenRange?: Loc }> {
  const wantedTag = tag.toLowerCase();
  // Normalize both sides: collapse any run of whitespace to single space,
  // trim. The bridge sends DOM textContent which carries raw HTML whitespace
  // (newlines from <br>, indent from formatted source); the AST text walk
  // joins JSXText pieces with no normalization. Both must be normalized to
  // compare reliably.
  const wantedTrim = wantedText.replace(/\s+/g, " ").trim();
  const matches: Array<{ range: Loc; childrenRange?: Loc }> = [];

  // Manual recursive walk over the AST. We avoid @babel/traverse to keep the
  // dependency surface minimal — only need JSXElement nodes.
  function walk(node: unknown) {
    if (!node || typeof node !== "object") return;
    const n = node as Record<string, unknown>;
    if (n.type === "JSXElement") {
      const opening = n.openingElement as
        | { name?: { type?: string; name?: string } }
        | undefined;
      const name =
        opening?.name?.type === "JSXIdentifier"
          ? (opening?.name?.name ?? "").toLowerCase()
          : "";
      if (name === wantedTag) {
        // Walk children recursively to extract all visible text. The browser
        // sees a `<h1>Title <SerifAccent>word</SerifAccent> more</h1>` as a
        // single text node "Title word more", so we need to flatten nested
        // JSXElement children's JSXText too — otherwise tag+text matching
        // fails on every JSX with inline component children.
        const collectText = (nodes: unknown): string => {
          let acc = "";
          if (!Array.isArray(nodes)) return acc;
          for (const c of nodes as Array<Record<string, unknown>>) {
            if (!c) continue;
            if (c.type === "JSXText") {
              acc += (c.value as string) ?? "";
            } else if (
              c.type === "JSXExpressionContainer" &&
              (c.expression as { type?: string })?.type === "StringLiteral"
            ) {
              acc +=
                ((c.expression as { value?: string })?.value as string) ?? "";
            } else if (c.type === "JSXElement") {
              acc += collectText(c.children);
            }
          }
          return acc;
        };
        const children = (n.children ?? []) as Array<{
          type: string;
          start?: number;
          end?: number;
        }>;
        const combined = collectText(children);
        const trimmed = combined.replace(/\s+/g, " ").trim();
        if (
          wantedTrim === "" ||
          trimmed === wantedTrim ||
          trimmed.includes(wantedTrim) ||
          wantedTrim.includes(trimmed)
        ) {
          const nodeAny = n as { start?: number; end?: number };
          if (
            typeof nodeAny.start === "number" &&
            typeof nodeAny.end === "number"
          ) {
            const first = children[0];
            const last = children[children.length - 1];
            const childrenRange =
              first?.start !== undefined && last?.end !== undefined
                ? { start: first.start, end: last.end }
                : undefined;
            matches.push({
              range: { start: nodeAny.start, end: nodeAny.end },
              childrenRange,
            });
          }
        }
      }
    }
    // Recurse into all properties
    for (const k of Object.keys(n)) {
      const v = n[k];
      if (Array.isArray(v)) {
        for (const item of v) walk(item);
      } else if (v && typeof v === "object") {
        walk(v);
      }
    }
  }
  walk(ast);
  return matches;
}

/**
 * Apply a single patch by surgical byte-range edit of the source string.
 * Returns the modified source or null if the patch couldn't be applied.
 */
function applyPatchToSource(
  source: string,
  match: FoundMatch,
  patch: Patch,
): string | null {
  if (patch.prop === "text") {
    if (!match.childrenRange) {
      // No children → JSX element is self-closing or fully empty. We don't
      // synthesize children for now (would require knowing if it's
      // self-closing or paired tag and parsing accordingly).
      return null;
    }
    const escaped = patch.value
      .replace(/\\/g, "\\\\")
      .replace(/\n/g, "\\n");
    // For minimal disruption keep the original whitespace pattern but
    // replace just the inner-text span.
    return (
      source.slice(0, match.childrenRange.start) +
      escaped +
      source.slice(match.childrenRange.end)
    );
  }

  // Attribute edit (href/src/alt) or style update — operate on the opening
  // element. We re-parse just the matched JSXElement substring to find the
  // attribute boundary.
  const elementSrc = source.slice(match.range.start, match.range.end);
  // Locate the opening tag end (first `>` or `/>` not inside a string).
  // For MVP we use a permissive regex; complex attrs with template literals
  // / nested JSX can confuse this and we'll skip them.
  const openingEnd = findOpeningTagEnd(elementSrc);
  if (openingEnd < 0) return null;
  const opening = elementSrc.slice(0, openingEnd + 1); // includes `>` or `/>`

  if (patch.prop === "href" || patch.prop === "src" || patch.prop === "alt") {
    const newOpening = setAttribute(opening, patch.prop, patch.value);
    if (newOpening === null) return null;
    return (
      source.slice(0, match.range.start) +
      newOpening +
      elementSrc.slice(openingEnd + 1) +
      source.slice(match.range.end)
    );
  }

  if (patch.prop === "style" && patch.styleProp) {
    if (!(ALLOWED_STYLE_PROPS as readonly string[]).includes(patch.styleProp)) {
      return null;
    }
    const newOpening = setStyleProperty(opening, patch.styleProp, patch.value);
    if (newOpening === null) return null;
    return (
      source.slice(0, match.range.start) +
      newOpening +
      elementSrc.slice(openingEnd + 1) +
      source.slice(match.range.end)
    );
  }

  return null;
}

/**
 * Find the character index of the `>` that ends the opening JSX tag.
 * Walks the string respecting nested {} expressions and string literals so
 * a `>` inside e.g. `style={{ width: ">" }}` isn't misread as tag-end.
 */
function findOpeningTagEnd(src: string): number {
  let depth = 0; // {} nesting
  let inSingle = false,
    inDouble = false,
    inTpl = false;
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (inSingle) {
      if (c === "'" && src[i - 1] !== "\\") inSingle = false;
      continue;
    }
    if (inDouble) {
      if (c === '"' && src[i - 1] !== "\\") inDouble = false;
      continue;
    }
    if (inTpl) {
      if (c === "`" && src[i - 1] !== "\\") inTpl = false;
      continue;
    }
    if (c === "'") inSingle = true;
    else if (c === '"') inDouble = true;
    else if (c === "`") inTpl = true;
    else if (c === "{") depth++;
    else if (c === "}") depth = Math.max(0, depth - 1);
    else if (c === ">" && depth === 0) return i;
  }
  return -1;
}

/**
 * Set an attribute in a JSX opening tag. Returns the modified opening tag
 * or null when modification is unsafe. Adds the attribute before `>` if it
 * didn't exist; replaces the value if it did.
 *
 *   setAttribute('<a href="/x">', 'href', '/y')  →  '<a href="/y">'
 *   setAttribute('<a>',           'href', '/y')  →  '<a href="/y">'
 */
function setAttribute(opening: string, name: string, value: string): string | null {
  const escaped = value.replace(/"/g, "&quot;");
  // Existing literal-string attribute: name="..."
  const literalRe = new RegExp(`(\\b${name}\\s*=\\s*)"([^"]*)"`);
  if (literalRe.test(opening)) {
    return opening.replace(literalRe, `$1"${escaped}"`);
  }
  // Existing expression attribute: name={...} — not supported (could break
  // dynamic bindings). Skip.
  const exprRe = new RegExp(`\\b${name}\\s*=\\s*\\{`);
  if (exprRe.test(opening)) return null;
  // No existing attribute: insert before the closing `>` or `/>`.
  const selfClose = opening.endsWith("/>");
  const cut = selfClose ? opening.length - 2 : opening.length - 1;
  return (
    opening.slice(0, cut).replace(/\s+$/, "") +
    ` ${name}="${escaped}"` +
    (selfClose ? " />" : ">")
  );
}

/**
 * Update one key inside the JSX `style={{ key: value, … }}` ObjectExpression.
 * Operates on raw source via regex — handles common patterns (single line,
 * multi-line), bails out on nested expressions / template literals to stay
 * safe. Falls back to adding a fresh `style={{ key: 'value' }}` attr if
 * none existed.
 */
function setStyleProperty(
  opening: string,
  prop: string,
  value: string,
): string | null {
  // Match `style={{ ... }}` allowing arbitrary whitespace and content
  const styleRe = /(\bstyle\s*=\s*\{\{)([\s\S]*?)(\}\})/;
  const escapedValue = value.replace(/'/g, "\\'");
  if (styleRe.test(opening)) {
    return opening.replace(styleRe, (_, open, body, close) => {
      // Check if `prop` exists inside body (loose — quoted or unquoted key)
      const propRe = new RegExp(
        `((?:[,\\{]\\s*)|(?:^\\s*))(?:["']?${prop}["']?\\s*:\\s*)([^,}]+)`,
      );
      if (propRe.test(body)) {
        if (!value) {
          // Remove property + any trailing comma/whitespace
          const removeRe = new RegExp(
            `,?\\s*["']?${prop}["']?\\s*:\\s*[^,}]+,?`,
          );
          return open + body.replace(removeRe, "").replace(/^\s*,\s*/, "") + close;
        }
        return (
          open +
          body.replace(propRe, `$1${prop}: '${escapedValue}'`) +
          close
        );
      }
      // Add new property
      if (!value) return open + body + close;
      const trimmed = body.trim();
      const sep = trimmed.length > 0 && !trimmed.endsWith(",") ? "," : "";
      return open + body.replace(/\s*$/, "") + `${sep} ${prop}: '${escapedValue}' ` + close;
    });
  }
  // No style attribute → add one before tag-end
  if (!value) return opening; // nothing to do
  const selfClose = opening.endsWith("/>");
  const cut = selfClose ? opening.length - 2 : opening.length - 1;
  return (
    opening.slice(0, cut).replace(/\s+$/, "") +
    ` style={{ ${prop}: '${escapedValue}' }}` +
    (selfClose ? " />" : ">")
  );
}

async function listJsxFiles(importDir: string): Promise<string[]> {
  try {
    const entries = await fs.readdir(importDir, { withFileTypes: true });
    return entries
      .filter((e) => e.isFile() && /\.jsx$/i.test(e.name))
      .map((e) => e.name);
  } catch {
    return [];
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ projectId: string; importId: string }> },
) {
  const { projectId, importId } = await params;
  const maybeImportDir = safeResolve(projectId, importId);
  if (!maybeImportDir) {
    return NextResponse.json({ error: "invalid path" }, { status: 400 });
  }
  const importDir: string = maybeImportDir;
  const body = (await req.json()) as { patches?: Patch[] };
  if (!Array.isArray(body.patches) || body.patches.length === 0) {
    return NextResponse.json({ error: "patches array richiesto" }, { status: 400 });
  }
  if (body.patches.length > MAX_PATCHES) {
    return NextResponse.json(
      { error: `troppe patches (max ${MAX_PATCHES})` },
      { status: 413 },
    );
  }

  const jsxFiles = await listJsxFiles(importDir);
  if (jsxFiles.length === 0) {
    return NextResponse.json(
      { error: "nessun file .jsx trovato in importDir" },
      { status: 404 },
    );
  }

  // Cache: parse each candidate file once even if it gets multiple patches.
  const fileCache = new Map<
    string,
    { source: string; ast: ReturnType<typeof parse> }
  >();

  async function loadFile(name: string) {
    if (fileCache.has(name)) return fileCache.get(name)!;
    const full = path.join(importDir, name);
    const stat = await fs.stat(full);
    if (stat.size > MAX_FILE_BYTES) throw new Error(`${name} troppo grande`);
    const source = await fs.readFile(full, "utf-8");
    const ast = parse(source, {
      sourceType: "module",
      plugins: ["jsx"],
      ranges: true,
      errorRecovery: true,
    });
    const entry = { source, ast };
    fileCache.set(name, entry);
    return entry;
  }

  const applied: Array<{ patch: Patch; file: string }> = [];
  const skipped: Array<{ patch: Patch; reason: string }> = [];

  // Track per-file mutated source so subsequent patches against the same file
  // operate on the latest version. We re-parse only if subsequent patches
  // are positional-dependent (which they aren't currently — all matching is
  // by tag+text against the original AST). For safety we keep separate
  // `current` source string and apply offsets against it.
  const fileWrites = new Map<string, string>();

  for (const patch of body.patches) {
    try {
      if (typeof patch?.selector !== "string" || typeof patch?.tag !== "string") {
        skipped.push({ patch, reason: "patch malformata (selector/tag mancanti)" });
        continue;
      }
      const candidates = patch.file
        ? [patch.file].filter((f) => jsxFiles.includes(f))
        : rankCandidateFiles(jsxFiles, patch.selector);
      if (candidates.length === 0) {
        skipped.push({ patch, reason: "nessun .jsx candidato" });
        continue;
      }
      const wantedText = patch.text ?? "";
      let foundMatch: FoundMatch | null = null;
      for (const fname of candidates) {
        const { source, ast } = await loadFile(fname);
        const matches = findJsxMatches(ast, patch.tag, wantedText);
        if (matches.length === 1) {
          foundMatch = {
            file: fname,
            range: matches[0].range,
            childrenRange: matches[0].childrenRange,
            source,
          };
          break;
        }
        if (matches.length > 1) {
          // Ambiguous — record and try next candidate (maybe another file
          // has a unique one)
          continue;
        }
      }
      if (!foundMatch) {
        skipped.push({ patch, reason: "nessun match univoco JSX (testo cambiato? .map() multi-istanza?)" });
        continue;
      }
      const currentSource =
        fileWrites.get(foundMatch.file) ?? foundMatch.source;
      const newSource = applyPatchToSource(
        currentSource,
        { ...foundMatch, source: currentSource },
        patch,
      );
      if (newSource === null) {
        skipped.push({
          patch,
          reason: `patch non applicabile (prop=${patch.prop} su ${foundMatch.file})`,
        });
        continue;
      }
      fileWrites.set(foundMatch.file, newSource);
      applied.push({ patch, file: foundMatch.file });
    } catch (err) {
      skipped.push({ patch, reason: `errore: ${(err as Error).message}` });
    }
  }

  // Persist all modified files in parallel
  try {
    await Promise.all(
      Array.from(fileWrites.entries()).map(([fname, src]) =>
        fs.writeFile(path.join(importDir, fname), src, "utf-8"),
      ),
    );
  } catch (err) {
    console.error("[api/imports/jsx-patch] write failed", {
      err: (err as Error).message,
    });
    return NextResponse.json(
      { error: `write failed: ${(err as Error).message}` },
      { status: 500 },
    );
  }

  return NextResponse.json({
    applied: applied.length,
    skipped: skipped.length,
    files: Array.from(fileWrites.keys()),
    appliedDetails: applied.slice(0, 10).map((a) => ({
      file: a.file,
      tag: a.patch.tag,
      prop: a.patch.prop,
    })),
    skippedDetails: skipped.slice(0, 10),
    updatedAt: new Date().toISOString(),
  });
}
