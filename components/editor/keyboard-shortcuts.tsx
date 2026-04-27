"use client";

import { useEffect } from "react";
import { usePuck } from "@measured/puck";

/**
 * Global keyboard shortcuts for the editor.
 * - Cmd/Ctrl + S : save
 * - Cmd/Ctrl + P : toggle preview mode
 * - Cmd/Ctrl + K : focus AI prompt bar
 * Undo/Redo is handled natively by Puck (Cmd+Z / Cmd+Shift+Z).
 */
export function EditorKeyboardShortcuts({
  onSave,
}: {
  onSave: () => void;
}) {
  const { dispatch } = usePuck();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      const key = e.key.toLowerCase();

      if (key === "s") {
        e.preventDefault();
        onSave();
      } else if (key === "p" && !e.shiftKey) {
        e.preventDefault();
        dispatch({
          type: "setUi",
          ui: (prev) => ({
            previewMode: prev.previewMode === "edit" ? "interactive" : "edit",
          }),
        });
      } else if (key === "k") {
        e.preventDefault();
        const input = document.querySelector<HTMLInputElement>(
          'form input[placeholder^="Modifica"], form input[placeholder^="Descrivi"]',
        );
        input?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dispatch, onSave]);

  return null;
}
