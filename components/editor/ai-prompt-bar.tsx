"use client";

import { useState } from "react";
import { Sparkles, Loader2, SendHorizontal } from "lucide-react";
import { toast } from "sonner";
import { usePuck } from "@measured/puck";
import { applyAIEdit } from "@/lib/puck/apply-edit";
import { useEditorStore } from "@/lib/stores/editor-store";
import type { AIEdit } from "@/types";

export function AIPromptBar() {
  const { appState, dispatch, selectedItem } = usePuck();
  const aiBusy = useEditorStore((s) => s.aiBusy);
  const setAIBusy = useEditorStore((s) => s.setAIBusy);
  const [value, setValue] = useState("");

  const selectedType = (selectedItem as { type?: string } | null)?.type;
  const selectedId = (selectedItem?.props as { id?: string } | undefined)?.id ?? null;

  const placeholder = selectedType
    ? `Modifica questo ${selectedType}... (es. "rendi il tono più amichevole")`
    : 'Descrivi cosa inserire... (es. "aggiungi una sezione pricing con 3 piani")';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = value.trim();
    if (!text || aiBusy) return;
    setAIBusy(true);
    try {
      const res = await fetch("/api/ai/edit-section", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          page: appState.data,
          selectedId,
          instruction: text,
        }),
      });
      if (!res.ok) {
        throw new Error(await res.text());
      }
      const { edit, mode } = (await res.json()) as {
        edit: AIEdit;
        mode: "ai" | "stub";
      };
      const nextData = applyAIEdit(appState.data, edit);
      dispatch({ type: "setData", data: nextData, recordHistory: true });
      setValue("");
      if (mode === "stub") {
        toast.info("AI in stub mode · aggiungi ANTHROPIC_API_KEY per output reale");
      } else {
        toast.success("Modifica AI applicata");
      }
    } catch (err) {
      toast.error(`Errore AI: ${(err as Error).message}`);
    } finally {
      setAIBusy(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="sticky bottom-0 z-10 border-t border-outline-variant/20 bg-surface-container-low/80 backdrop-blur px-6 py-3"
    >
      <div className="mx-auto flex max-w-3xl items-center gap-2 rounded-xl bg-surface-container-high px-3 py-2 ring-1 ring-outline-variant/20 focus-within:ring-molten-primary">
        <Sparkles className="h-4 w-4 shrink-0 text-molten-primary" />
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          disabled={aiBusy}
          className="flex-1 bg-transparent text-body-sm text-on-surface placeholder:text-text-muted focus:outline-none"
        />
        {selectedType && (
          <span className="hidden rounded-md bg-surface-container-lowest px-2 py-0.5 text-label-sm text-text-muted md:inline">
            contesto: {selectedType}
          </span>
        )}
        <button
          type="submit"
          disabled={aiBusy || !value.trim()}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-on-molten disabled:opacity-40"
          style={{ background: "linear-gradient(135deg,#ffb599,#f56117)" }}
          aria-label="Invia"
        >
          {aiBusy ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <SendHorizontal className="h-3.5 w-3.5" />
          )}
        </button>
      </div>
    </form>
  );
}
