"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

type Selection = {
  selector: string;
  tag: string;
  text: string;
  attrs: { href?: string; src?: string; alt?: string };
};

type Props = {
  selection: Selection;
  dirty: boolean;
  saving: boolean;
  onApplyPatch: (
    prop: "text" | "href" | "src" | "alt",
    value: string,
  ) => void;
  onSave: () => Promise<void>;
  onClose: () => void;
};

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

  // When selection changes (user clicks another element), sync inputs.
  useEffect(() => {
    setLocalText(selection.text);
    setLocalHref(selection.attrs.href ?? "");
    setLocalSrc(selection.attrs.src ?? "");
    setLocalAlt(selection.attrs.alt ?? "");
  }, [selection.selector, selection.text, selection.attrs.href, selection.attrs.src, selection.attrs.alt]);

  const isImg = selection.tag === "IMG";
  const isLink = selection.tag === "A";
  const isTextual = !isImg;

  async function handleSave() {
    try {
      await onSave();
      toast.success("Modifiche salvate sul file HTML");
    } catch (err) {
      toast.error(`Errore salvataggio: ${(err as Error).message}`);
    }
  }

  return (
    <div
      className="absolute right-3 top-14 z-30 flex w-80 flex-col gap-3 rounded-xl border border-outline/40 bg-surface-container/95 p-4 text-on-surface shadow-2xl backdrop-blur"
      style={{ pointerEvents: "auto" }}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
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
          onClick={onClose}
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
          onClick={handleSave}
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
    </div>
  );
}
