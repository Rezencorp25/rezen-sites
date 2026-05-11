"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { HexColorPicker } from "react-colorful";
import { toast } from "sonner";

type StyleProp =
  | "color"
  | "backgroundColor"
  | "borderColor"
  | "fontFamily"
  | "fontSize"
  | "fontWeight"
  | "width"
  | "height";

type Selection = {
  selector: string;
  tag: string;
  text: string;
  attrs: { href?: string; src?: string; alt?: string };
  styles?: Partial<Record<StyleProp, string>>;
};

type SaveOutcome = { applied: number; skipped: number };

type Props = {
  selection: Selection;
  dirty: boolean;
  saving: boolean;
  onApplyPatch: (
    prop: "text" | "href" | "src" | "alt" | "style",
    value: string,
    styleProp?: StyleProp,
  ) => void;
  onSave: () => Promise<SaveOutcome | void>;
  onClose: () => void;
};

const SWATCHES: Array<{ key: StyleProp; label: string }> = [
  { key: "color", label: "Testo" },
  { key: "backgroundColor", label: "Sfondo" },
  { key: "borderColor", label: "Bordo" },
];

/**
 * Curated Google Fonts palette. The `family` is the on-the-wire CSS
 * font-family value (with stack); the `gName` matches the route's auto-link
 * injection map. Keep these two in sync with route.ts GOOGLE_FONTS.
 */
const FONT_FAMILIES: Array<{ gName: string; family: string; label: string }> = [
  { gName: "__inherit__", family: "", label: "Default (inherit)" },
  { gName: "Inter", family: "Inter, sans-serif", label: "Inter · sans" },
  { gName: "Manrope", family: "Manrope, sans-serif", label: "Manrope · sans" },
  { gName: "DM Sans", family: "'DM Sans', sans-serif", label: "DM Sans · sans" },
  { gName: "Plus Jakarta Sans", family: "'Plus Jakarta Sans', sans-serif", label: "Plus Jakarta · sans" },
  { gName: "Space Grotesk", family: "'Space Grotesk', sans-serif", label: "Space Grotesk · sans" },
  { gName: "Playfair Display", family: "'Playfair Display', serif", label: "Playfair · serif" },
  { gName: "Lora", family: "Lora, serif", label: "Lora · serif" },
  { gName: "Instrument Serif", family: "'Instrument Serif', serif", label: "Instrument · serif" },
  { gName: "JetBrains Mono", family: "'JetBrains Mono', monospace", label: "JetBrains · mono" },
  { gName: "Bebas Neue", family: "'Bebas Neue', sans-serif", label: "Bebas · display" },
];

const FONT_SIZES = [12, 14, 16, 18, 20, 24, 28, 32, 40, 48, 56, 64, 72, 96];

const FONT_WEIGHTS: Array<{ value: string; label: string }> = [
  { value: "300", label: "300" },
  { value: "400", label: "400" },
  { value: "500", label: "500" },
  { value: "600", label: "600" },
  { value: "700", label: "700" },
  { value: "800", label: "800" },
];

/**
 * Convert any CSS color (rgb/rgba/named) to a #rrggbb string suitable for the
 * color picker. Falls back to a neutral grey when unparseable — the picker
 * still shows it, the user can change it.
 *
 * We do parsing client-side via a hidden canvas; getComputedStyle returns rgb()
 * which the picker doesn't understand directly.
 */
function toHex(input: string | undefined): string {
  if (!input) return "#888888";
  const s = input.trim();
  if (!s) return "#888888";
  if (/^#[0-9a-f]{6}$/i.test(s)) return s.toLowerCase();
  if (/^#[0-9a-f]{3}$/i.test(s)) {
    return (
      "#" +
      s
        .slice(1)
        .split("")
        .map((c) => c + c)
        .join("")
        .toLowerCase()
    );
  }
  // rgb / rgba
  const m = s.match(/rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/i);
  if (m) {
    const r = Number(m[1]).toString(16).padStart(2, "0");
    const g = Number(m[2]).toString(16).padStart(2, "0");
    const b = Number(m[3]).toString(16).padStart(2, "0");
    return `#${r}${g}${b}`;
  }
  return "#888888";
}

/**
 * Inline editor panel for elements selected inside an imported-site iframe.
 *
 * Renders a floating right-side panel inside the IframeEmbed render. Lives in
 * the Puck canvas so we don't have to plumb selection state through the editor
 * shell. The panel uses inline pointer-events:auto for the same reason the
 * IframeEmbed toolbar does (Puck's [data-puck-component] * { pe: none }).
 */
export function ImportedSiteInlineEditor({
  selection,
  dirty,
  saving,
  onApplyPatch,
  onSave,
  onClose,
}: Props) {
  const [localText, setLocalText] = useState(selection.text);
  const [localHref, setLocalHref] = useState(selection.attrs.href ?? "");
  const [localSrc, setLocalSrc] = useState(selection.attrs.src ?? "");
  const [localAlt, setLocalAlt] = useState(selection.attrs.alt ?? "");
  const [aspectLock, setAspectLock] = useState(true);
  /** Which color swatch popover is open. null = none. */
  const [openPicker, setOpenPicker] = useState<StyleProp | null>(null);
  const pickerRef = useRef<HTMLDivElement | null>(null);

  // When selection changes (user clicks another element), sync inputs.
  useEffect(() => {
    setLocalText(selection.text);
    setLocalHref(selection.attrs.href ?? "");
    setLocalSrc(selection.attrs.src ?? "");
    setLocalAlt(selection.attrs.alt ?? "");
    setOpenPicker(null);
  }, [
    selection.selector,
    selection.text,
    selection.attrs.href,
    selection.attrs.src,
    selection.attrs.alt,
  ]);

  // Close color popover on outside click.
  useEffect(() => {
    if (!openPicker) return;
    function onDocClick(e: MouseEvent) {
      const target = e.target as Node | null;
      if (pickerRef.current && target && !pickerRef.current.contains(target)) {
        setOpenPicker(null);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [openPicker]);

  const isImg = selection.tag === "IMG";
  const isLink = selection.tag === "A";
  const isTextual = !isImg;

  const swatchValues = useMemo(() => {
    const styles = selection.styles ?? {};
    return {
      color: toHex(styles.color),
      backgroundColor: toHex(styles.backgroundColor),
      borderColor: toHex(styles.borderColor),
    } as Record<"color" | "backgroundColor" | "borderColor", string>;
  }, [selection.styles]);

  /**
   * Match the current selection.styles.fontFamily against our curated list.
   * Computed fontFamily strings are messy (`"Inter", sans-serif`, quotes
   * inconsistent across browsers) — we normalize to the first family token
   * and compare lowercased.
   */
  const currentFontGName = useMemo(() => {
    const ff = selection.styles?.fontFamily ?? "";
    if (!ff) return "__inherit__";
    const first = ff
      .split(",")[0]
      .replace(/['"]/g, "")
      .trim()
      .toLowerCase();
    const found = FONT_FAMILIES.find((f) => f.gName.toLowerCase() === first);
    return found?.gName ?? "__inherit__";
  }, [selection.styles]);

  const currentFontSize = useMemo(() => {
    const fs = selection.styles?.fontSize ?? "";
    const m = fs.match(/(\d+(?:\.\d+)?)/);
    return m ? Math.round(Number(m[1])) : 0;
  }, [selection.styles]);

  const currentFontWeight = selection.styles?.fontWeight ?? "";

  // Image dimensions (inline style only; we don't echo computed because the
  // user wants to edit the explicit value, not the layout-derived one).
  const currentImgWidth = useMemo(() => {
    const w = selection.styles?.width ?? "";
    const m = w.match(/(\d+(?:\.\d+)?)/);
    return m ? Math.round(Number(m[1])) : 0;
  }, [selection.styles]);
  const currentImgHeight = useMemo(() => {
    const h = selection.styles?.height ?? "";
    const m = h.match(/(\d+(?:\.\d+)?)/);
    return m ? Math.round(Number(m[1])) : 0;
  }, [selection.styles]);
  /** Original aspect ratio of the image to lock proportional scaling. */
  const imgAspect = currentImgWidth && currentImgHeight
    ? currentImgWidth / currentImgHeight
    : 1;

  async function handleSave() {
    try {
      const outcome = (await onSave()) as SaveOutcome | void;
      if (outcome && outcome.applied === 0 && outcome.skipped > 0) {
        // Common case: site is a client-rendered SPA (e.g. React + Babel
        // in-browser). The selector doesn't match anything in the static
        // HTML because the markup lives in .jsx templates fetched at runtime.
        toast.warning(
          "Patch non applicate — il sito sembra essere renderizzato lato client (SPA). Usa 'Modifica file' sui .jsx per editare il sorgente.",
          { duration: 6000 },
        );
      } else if (outcome && outcome.skipped > 0) {
        toast.success(
          `${outcome.applied} modifica${outcome.applied === 1 ? "" : "e"} salvata${outcome.applied === 1 ? "" : "e"} · ${outcome.skipped} saltate`,
        );
      } else {
        toast.success("Modifiche salvate sul file HTML");
      }
    } catch (err) {
      toast.error(`Errore salvataggio: ${(err as Error).message}`);
    }
  }

  // SSR guard: createPortal must be called only on the client. During the
  // first render (hydration), document doesn't exist on server. Return null
  // until mounted client-side.
  if (typeof document === "undefined") return null;

  // Portal'd to document.body to escape Puck's _DraggableComponent wrapper.
  // Puck installs a capture-phase click listener on its DraggableComponent
  // that calls stopPropagation() when the block is selected — that eats
  // every click inside the wrapper, even with onClickCapture on our buttons.
  // Rendering outside the wrapper bypasses Puck entirely.
  return createPortal(
    <div
      className="fixed z-[60] flex w-80 flex-col gap-3 rounded-xl border border-outline/40 bg-surface-container/95 p-4 text-on-surface shadow-2xl backdrop-blur"
      style={{ pointerEvents: "auto", top: 96, right: 296 }}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="text-label-sm font-semibold uppercase tracking-wider text-text-muted">
            Elemento {selection.tag.toLowerCase()}
          </div>
          <div
            className="truncate font-mono text-label-xs text-text-muted"
            title={selection.selector}
          >
            {selection.selector}
          </div>
        </div>
        <button
          type="button"
          onClickCapture={onClose}
          style={{ pointerEvents: "auto", cursor: "pointer" }}
          className="rounded p-1 text-text-muted hover:bg-surface-container-high hover:text-on-surface"
          title="Chiudi"
        >
          ✕
        </button>
      </div>

      {isTextual && (
        <label className="flex flex-col gap-1">
          <span className="text-label-xs font-medium uppercase tracking-wider text-text-muted">
            Testo
          </span>
          <textarea
            value={localText}
            onChange={(e) => setLocalText(e.target.value)}
            onBlur={() => {
              if (localText !== selection.text) onApplyPatch("text", localText);
            }}
            rows={3}
            style={{ pointerEvents: "auto" }}
            className="w-full resize-y rounded-md border border-outline/30 bg-surface-container-lowest px-2 py-1.5 text-body-sm text-on-surface focus:border-molten-primary focus:outline-none"
          />
        </label>
      )}

      {isLink && (
        <label className="flex flex-col gap-1">
          <span className="text-label-xs font-medium uppercase tracking-wider text-text-muted">
            href
          </span>
          <input
            type="text"
            value={localHref}
            onChange={(e) => setLocalHref(e.target.value)}
            onBlur={() => {
              if (localHref !== (selection.attrs.href ?? ""))
                onApplyPatch("href", localHref);
            }}
            style={{ pointerEvents: "auto" }}
            className="w-full rounded-md border border-outline/30 bg-surface-container-lowest px-2 py-1.5 text-body-sm text-on-surface focus:border-molten-primary focus:outline-none"
          />
        </label>
      )}

      {isImg && (
        <>
          <label className="flex flex-col gap-1">
            <span className="text-label-xs font-medium uppercase tracking-wider text-text-muted">
              src
            </span>
            <input
              type="text"
              value={localSrc}
              onChange={(e) => setLocalSrc(e.target.value)}
              onBlur={() => {
                if (localSrc !== (selection.attrs.src ?? ""))
                  onApplyPatch("src", localSrc);
              }}
              style={{ pointerEvents: "auto" }}
              className="w-full rounded-md border border-outline/30 bg-surface-container-lowest px-2 py-1.5 text-body-sm text-on-surface focus:border-molten-primary focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-label-xs font-medium uppercase tracking-wider text-text-muted">
              alt
            </span>
            <input
              type="text"
              value={localAlt}
              onChange={(e) => setLocalAlt(e.target.value)}
              onBlur={() => {
                if (localAlt !== (selection.attrs.alt ?? ""))
                  onApplyPatch("alt", localAlt);
              }}
              style={{ pointerEvents: "auto" }}
              className="w-full rounded-md border border-outline/30 bg-surface-container-lowest px-2 py-1.5 text-body-sm text-on-surface focus:border-molten-primary focus:outline-none"
            />
          </label>
        </>
      )}

      {/* Stile — colori (testo / sfondo / bordo).
          Su <img> mostriamo solo Bordo (testo/sfondo non ha senso). */}
      <div className="flex flex-col gap-1.5" ref={pickerRef}>
        <span className="text-label-xs font-medium uppercase tracking-wider text-text-muted">
          Stile · colori
        </span>
        <div className="flex items-center gap-2">
          {SWATCHES.filter((s) => !isImg || s.key === "borderColor").map(
            (sw) => (
              <button
                key={sw.key}
                type="button"
                onClickCapture={(e) => {
                  e.stopPropagation();
                  setOpenPicker((prev) =>
                    prev === sw.key ? null : sw.key,
                  );
                }}
                style={{ pointerEvents: "auto", cursor: "pointer" }}
                className="group flex flex-1 flex-col items-center gap-1 rounded-md border border-outline/30 bg-surface-container-lowest p-2 hover:border-outline/60"
                title={`Cambia colore ${sw.label.toLowerCase()}`}
              >
                <span
                  className="h-6 w-full rounded border border-outline/30"
                  style={{
                    background: swatchValues[
                      sw.key as keyof typeof swatchValues
                    ],
                  }}
                />
                <span className="text-label-xs text-text-muted">
                  {sw.label}
                </span>
              </button>
            ),
          )}
        </div>

        {openPicker && (
          <div
            className="relative"
            style={{ pointerEvents: "auto" }}
            onPointerDownCapture={(e) => e.stopPropagation()}
          >
            <div className="mt-1 flex flex-col gap-2 rounded-lg border border-outline/40 bg-surface-container-highest p-3 shadow-xl">
              <HexColorPicker
                color={swatchValues[openPicker as keyof typeof swatchValues]}
                onChange={(next) => onApplyPatch("style", next, openPicker)}
                style={{ width: "100%", height: 140 }}
              />
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={swatchValues[openPicker as keyof typeof swatchValues]}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (/^#[0-9a-f]{6}$/i.test(v)) {
                      onApplyPatch("style", v, openPicker);
                    }
                  }}
                  style={{ pointerEvents: "auto" }}
                  className="flex-1 rounded-md border border-outline/30 bg-surface-container-lowest px-2 py-1 font-mono text-label-sm focus:border-molten-primary focus:outline-none"
                />
                <button
                  type="button"
                  onClickCapture={(e) => {
                    e.stopPropagation();
                    onApplyPatch("style", "", openPicker);
                  }}
                  style={{ pointerEvents: "auto", cursor: "pointer" }}
                  className="rounded-md border border-outline/30 px-2 py-1 text-label-xs text-text-muted hover:bg-surface-container hover:text-on-surface"
                  title="Rimuovi colore (torna al default CSS)"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tipografia — family + size + weight. Su <img> non ha senso. */}
      {isTextual && (
        <div className="flex flex-col gap-2">
          <span className="text-label-xs font-medium uppercase tracking-wider text-text-muted">
            Stile · tipografia
          </span>
          {/* Family */}
          <label className="flex flex-col gap-1">
            <span className="text-label-xs text-text-muted">Famiglia</span>
            <select
              value={currentFontGName}
              onChangeCapture={(e) => {
                e.stopPropagation();
                const gName = (e.target as HTMLSelectElement).value;
                const entry = FONT_FAMILIES.find((f) => f.gName === gName);
                onApplyPatch("style", entry?.family ?? "", "fontFamily");
              }}
              style={{ pointerEvents: "auto" }}
              className="rounded-md border border-outline/30 bg-surface-container-lowest px-2 py-1.5 text-body-sm text-on-surface focus:border-molten-primary focus:outline-none"
            >
              {FONT_FAMILIES.map((f) => (
                <option key={f.gName} value={f.gName}>
                  {f.label}
                </option>
              ))}
            </select>
          </label>
          {/* Size + Weight side by side */}
          <div className="flex items-end gap-2">
            <label className="flex flex-1 flex-col gap-1">
              <span className="text-label-xs text-text-muted">
                Size {currentFontSize ? `· ${currentFontSize}px` : ""}
              </span>
              <select
                value={currentFontSize || ""}
                onChangeCapture={(e) => {
                  e.stopPropagation();
                  const v = (e.target as HTMLSelectElement).value;
                  onApplyPatch("style", v ? `${v}px` : "", "fontSize");
                }}
                style={{ pointerEvents: "auto" }}
                className="rounded-md border border-outline/30 bg-surface-container-lowest px-2 py-1.5 text-body-sm focus:border-molten-primary focus:outline-none"
              >
                <option value="">—</option>
                {FONT_SIZES.map((s) => (
                  <option key={s} value={s}>
                    {s}px
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-1 flex-col gap-1">
              <span className="text-label-xs text-text-muted">Weight</span>
              <select
                value={currentFontWeight}
                onChangeCapture={(e) => {
                  e.stopPropagation();
                  const v = (e.target as HTMLSelectElement).value;
                  onApplyPatch("style", v, "fontWeight");
                }}
                style={{ pointerEvents: "auto" }}
                className="rounded-md border border-outline/30 bg-surface-container-lowest px-2 py-1.5 text-body-sm focus:border-molten-primary focus:outline-none"
              >
                <option value="">—</option>
                {FONT_WEIGHTS.map((w) => (
                  <option key={w.value} value={w.value}>
                    {w.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      )}

      {/* Dimensioni — solo per IMG. L'utente può anche trascinare le 8
          maniglie sull'immagine; questi input sono per regolazione fine. */}
      {isImg && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-label-xs font-medium uppercase tracking-wider text-text-muted">
              Stile · dimensioni
            </span>
            <label className="flex items-center gap-1.5 text-label-xs text-text-muted">
              <input
                type="checkbox"
                checked={aspectLock}
                onChange={(e) => setAspectLock(e.target.checked)}
                style={{ pointerEvents: "auto" }}
              />
              <span>Aspect lock</span>
            </label>
          </div>
          <div className="flex items-end gap-2">
            <label className="flex flex-1 flex-col gap-1">
              <span className="text-label-xs text-text-muted">Width</span>
              <input
                type="number"
                value={currentImgWidth || ""}
                onChange={(e) => {
                  const w = Math.max(20, Number(e.target.value) || 0);
                  onApplyPatch("style", `${w}px`, "width");
                  if (aspectLock && imgAspect && currentImgHeight) {
                    onApplyPatch("style", `${Math.round(w / imgAspect)}px`, "height");
                  }
                }}
                style={{ pointerEvents: "auto" }}
                className="rounded-md border border-outline/30 bg-surface-container-lowest px-2 py-1.5 text-body-sm focus:border-molten-primary focus:outline-none"
                placeholder="auto"
                min={20}
                max={3000}
              />
            </label>
            <label className="flex flex-1 flex-col gap-1">
              <span className="text-label-xs text-text-muted">Height</span>
              <input
                type="number"
                value={currentImgHeight || ""}
                onChange={(e) => {
                  const h = Math.max(20, Number(e.target.value) || 0);
                  onApplyPatch("style", `${h}px`, "height");
                  if (aspectLock && imgAspect && currentImgWidth) {
                    onApplyPatch("style", `${Math.round(h * imgAspect)}px`, "width");
                  }
                }}
                style={{ pointerEvents: "auto" }}
                className="rounded-md border border-outline/30 bg-surface-container-lowest px-2 py-1.5 text-body-sm focus:border-molten-primary focus:outline-none"
                placeholder="auto"
                min={20}
                max={3000}
              />
            </label>
            <button
              type="button"
              onClickCapture={(e) => {
                e.stopPropagation();
                onApplyPatch("style", "", "width");
                onApplyPatch("style", "", "height");
              }}
              style={{ pointerEvents: "auto", cursor: "pointer" }}
              className="rounded-md border border-outline/30 px-2 py-1.5 text-label-xs text-text-muted hover:bg-surface-container hover:text-on-surface"
              title="Rimuovi width/height (torna alle dimensioni native)"
            >
              Reset
            </button>
          </div>
          <p className="text-label-xs text-text-muted">
            Suggerimento: trascina le 8 maniglie sull'immagine. Tieni Shift per
            sbloccare/bloccare il rapporto.
          </p>
        </div>
      )}

      <p className="text-label-xs text-text-muted">
        Suggerimento: doppio-click sul sito per editare il testo inline. I
        cambiamenti sono live sul render — clicca Salva per persistere.
      </p>

      <div className="flex items-center justify-between gap-2 pt-1">
        <span className="text-label-xs text-text-muted">
          {dirty ? "Modifiche non salvate" : "Nessuna modifica"}
        </span>
        <button
          type="button"
          onClickCapture={(e) => {
            e.stopPropagation();
            void handleSave();
          }}
          disabled={!dirty || saving}
          style={{ pointerEvents: "auto", cursor: dirty && !saving ? "pointer" : "not-allowed" }}
          className={`rounded-md px-3 py-1.5 text-label-sm font-medium ${
            dirty && !saving
              ? "bg-molten-primary text-on-primary hover:bg-molten-accent-hover"
              : "bg-surface-container-high text-text-muted"
          }`}
        >
          {saving ? "Salvataggio..." : "Salva"}
        </button>
      </div>
    </div>,
    document.body,
  );
}
