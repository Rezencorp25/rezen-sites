"use client";

import { useState } from "react";
import { Sparkles, FilePlus, Loader2, Database } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { GradientButton } from "@/components/luminous/gradient-button";
import { useCMSStore } from "@/lib/stores/cms-store";
import type { CMSField } from "@/types";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type Mode = "choose" | "ai" | "blank";

const DEFAULT_BLANK_FIELDS: CMSField[] = [
  { id: "title", name: "Title", type: "text", required: true },
  { id: "slug", name: "Slug", type: "text", required: true },
];

/**
 * AI schema heuristic (F3 placeholder). In F4 this will call /api/ai/cms-architect.
 * Today: generate a plausible field set from keywords in the brief.
 */
function inferSchemaFromBrief(brief: string): CMSField[] {
  const q = brief.toLowerCase();
  const fields: CMSField[] = [
    { id: "title", name: "Title", type: "text", required: true },
    { id: "slug", name: "Slug", type: "text", required: true },
    { id: "excerpt", name: "Excerpt", type: "text", required: false },
    { id: "body", name: "Body", type: "richtext", required: true },
  ];
  if (/blog|articol|post|news/.test(q)) {
    fields.push(
      { id: "coverImage", name: "Cover Image", type: "image", required: false },
      { id: "publishedAt", name: "Published At", type: "date", required: true },
      { id: "author", name: "Author", type: "text", required: false },
    );
  }
  if (/prodott|shop|e-commerce|catalogo/.test(q)) {
    fields.push(
      { id: "price", name: "Price", type: "number", required: true },
      { id: "sku", name: "SKU", type: "text", required: true },
      { id: "gallery", name: "Gallery", type: "image", required: false },
      { id: "featured", name: "Featured", type: "boolean", required: false },
    );
  }
  if (/event|evento|corso/.test(q)) {
    fields.push(
      { id: "startDate", name: "Start", type: "date", required: true },
      { id: "location", name: "Location", type: "text", required: false },
    );
  }
  return fields;
}

export function NewCollectionDialog({
  open,
  onOpenChange,
  projectId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  projectId: string;
}) {
  const router = useRouter();
  const addCollection = useCMSStore((s) => s.addCollection);
  const [mode, setMode] = useState<Mode>("choose");
  const [name, setName] = useState("");
  const [brief, setBrief] = useState("");
  const [loading, setLoading] = useState(false);

  function reset() {
    setMode("choose");
    setName("");
    setBrief("");
    setLoading(false);
  }

  async function createBlank() {
    if (!name.trim()) return;
    const created = addCollection(projectId, name.trim(), DEFAULT_BLANK_FIELDS);
    toast.success(`Collezione "${created.name}" creata`);
    onOpenChange(false);
    reset();
    router.push(`/projects/${projectId}/cms/${created.id}`);
  }

  async function createAI() {
    if (!name.trim() || !brief.trim()) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    const fields = inferSchemaFromBrief(brief);
    const created = addCollection(projectId, name.trim(), fields);
    setLoading(false);
    toast.success(
      `Schema generato: ${fields.length} field. In F4 questo userà Claude.`,
    );
    onOpenChange(false);
    reset();
    router.push(`/projects/${projectId}/cms/${created.id}`);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) reset();
      }}
    >
      <DialogContent className="bg-surface-container-highest border-none sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-title-lg">
            <Database className="h-4 w-4 text-molten-primary" />
            Nuova Collezione
          </DialogTitle>
          <DialogDescription className="text-secondary-text">
            {mode === "choose"
              ? "Scegli come definire lo schema."
              : mode === "ai"
                ? "Descrivi la collezione: inferiamo i campi."
                : "Inserisci il nome. Aggiungerai i campi nello schema editor."}
          </DialogDescription>
        </DialogHeader>

        {mode === "choose" ? (
          <div className="grid gap-3 pt-2">
            <button
              type="button"
              onClick={() => setMode("ai")}
              className="group flex items-center gap-4 rounded-xl p-4 text-left transition-all hover:brightness-110"
              style={{
                background:
                  "linear-gradient(135deg, rgba(255,181,153,0.15), rgba(245,97,23,0.1))",
                border: "1px solid rgba(245,97,23,0.3)",
              }}
            >
              <div
                className="flex h-11 w-11 items-center justify-center rounded-lg"
                style={{
                  background: "linear-gradient(135deg,#ffb599,#f56117)",
                }}
              >
                <Sparkles className="h-5 w-5 text-on-molten" />
              </div>
              <div className="flex-1">
                <p className="text-body-md font-semibold text-on-surface">
                  Genera schema con AI
                </p>
                <p className="text-body-sm text-secondary-text">
                  CMS Architect agent inferisce campi dal brief
                </p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setMode("blank")}
              className="group flex items-center gap-4 rounded-xl bg-surface-container-high p-4 text-left transition-colors hover:bg-surface-container"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-surface-container-highest">
                <FilePlus className="h-5 w-5 text-secondary-text" />
              </div>
              <div className="flex-1">
                <p className="text-body-md font-semibold text-on-surface">
                  Schema vuoto
                </p>
                <p className="text-body-sm text-secondary-text">
                  Title + Slug, aggiungi il resto manualmente
                </p>
              </div>
            </button>
          </div>
        ) : mode === "ai" ? (
          <div className="flex flex-col gap-3 pt-2">
            <Input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome collezione (es. Blog Posts)"
              className="h-11 bg-surface-container-low border-none"
            />
            <Textarea
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              placeholder='Es. "Blog di tech italiana con articoli, autore, copertina, tag"'
              rows={4}
              className="resize-none bg-surface-container-low border-none"
            />
            <div className="flex items-center justify-between gap-2 pt-1">
              <button
                type="button"
                onClick={() => setMode("choose")}
                className="text-body-sm text-secondary-text hover:text-on-surface"
              >
                Indietro
              </button>
              <GradientButton
                size="md"
                onClick={createAI}
                disabled={loading || !name.trim() || !brief.trim()}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Genero...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Genera schema
                  </>
                )}
              </GradientButton>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3 pt-2">
            <Input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome collezione"
              className="h-11 bg-surface-container-low border-none"
            />
            <div className="flex items-center justify-between gap-2 pt-1">
              <button
                type="button"
                onClick={() => setMode("choose")}
                className="text-body-sm text-secondary-text hover:text-on-surface"
              >
                Indietro
              </button>
              <GradientButton
                size="md"
                onClick={createBlank}
                disabled={!name.trim()}
              >
                Crea
              </GradientButton>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
