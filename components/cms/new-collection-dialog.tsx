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
import { usePagesStore } from "@/lib/stores/pages-store";
import {
  inferSingularPlural,
  slugify,
} from "@/lib/cms/collection-id";
import { buildCollectionTemplatePage } from "@/lib/cms/collection-template";
import type { CMSCollection, CMSField } from "@/types";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type Mode = "choose" | "ai" | "blank";

const DEFAULT_BLANK_FIELDS: CMSField[] = [
  { id: "name", name: "Name", type: "plain-text", required: true },
  { id: "slug", name: "Slug", type: "plain-text", required: true },
];

function inferSchemaFromBrief(brief: string): CMSField[] {
  const q = brief.toLowerCase();
  const fields: CMSField[] = [
    { id: "name", name: "Name", type: "plain-text", required: true },
    { id: "slug", name: "Slug", type: "plain-text", required: true },
    { id: "excerpt", name: "Excerpt", type: "plain-text", required: false },
    { id: "body", name: "Body", type: "rich-text", required: true },
  ];
  if (/blog|articol|post|news/.test(q)) {
    fields.push(
      { id: "coverImage", name: "Cover Image", type: "image", required: false },
      {
        id: "publishedAt",
        name: "Published At",
        type: "datetime",
        required: true,
      },
      { id: "author", name: "Author", type: "plain-text", required: false },
    );
  }
  if (/prodott|shop|e-commerce|catalogo/.test(q)) {
    fields.push(
      { id: "price", name: "Price", type: "number", required: true },
      { id: "sku", name: "SKU", type: "plain-text", required: true },
      { id: "gallery", name: "Gallery", type: "multi-image", required: false },
      { id: "featured", name: "Featured", type: "switch", required: false },
    );
  }
  if (/event|evento|corso/.test(q)) {
    fields.push(
      { id: "startDate", name: "Start", type: "datetime", required: true },
      {
        id: "location",
        name: "Location",
        type: "plain-text",
        required: false,
      },
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
  const addPage = usePagesStore((s) => s.addPage);

  function autoCreateTemplate(c: CMSCollection) {
    addPage(buildCollectionTemplatePage(c));
  }
  const [mode, setMode] = useState<Mode>("choose");
  const [name, setName] = useState("");
  const [singular, setSingular] = useState("");
  const [singularDirty, setSingularDirty] = useState(false);
  const [plural, setPlural] = useState("");
  const [pluralDirty, setPluralDirty] = useState(false);
  const [slug, setSlug] = useState("");
  const [slugDirty, setSlugDirty] = useState(false);
  const [brief, setBrief] = useState("");
  const [loading, setLoading] = useState(false);

  function handleNameChange(v: string) {
    setName(v);
    if (!v) return;
    const sp = inferSingularPlural(v);
    if (!singularDirty) setSingular(sp.singular);
    if (!pluralDirty) setPlural(sp.plural);
    if (!slugDirty) setSlug(slugify(sp.singular));
  }

  function reset() {
    setMode("choose");
    setName("");
    setSingular("");
    setSingularDirty(false);
    setPlural("");
    setPluralDirty(false);
    setSlug("");
    setSlugDirty(false);
    setBrief("");
    setLoading(false);
  }

  async function createBlank() {
    if (!name.trim() || !slug.trim()) return;
    const created = addCollection({
      projectId,
      name: name.trim(),
      fields: DEFAULT_BLANK_FIELDS,
      slug: slug.trim(),
      singularName: singular.trim() || undefined,
      pluralName: plural.trim() || undefined,
    });
    autoCreateTemplate(created);
    toast.success(`Collezione "${created.displayName}" creata · template Puck generato`);
    onOpenChange(false);
    reset();
    router.push(`/projects/${projectId}/cms/${created.id}`);
  }

  async function createAI() {
    if (!name.trim() || !brief.trim()) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    const fields = inferSchemaFromBrief(brief);
    const created = addCollection({
      projectId,
      name: name.trim(),
      fields,
      slug: slug.trim() || undefined,
      singularName: singular.trim() || undefined,
      pluralName: plural.trim() || undefined,
    });
    autoCreateTemplate(created);
    setLoading(false);
    toast.success(
      `Schema generato: ${fields.length} field · template Puck creato`,
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
      <DialogContent className="bg-surface-container-highest border-none sm:max-w-xl">
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
                : "Configura nome, slug URL e struttura."}
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
                  Name + Slug, aggiungi il resto manualmente
                </p>
              </div>
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4 pt-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-label-md uppercase tracking-widest text-text-muted">
                Collection name
              </label>
              <Input
                autoFocus
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Es. Blog Posts"
                className="h-10 bg-surface-container-low border-none"
              />
              {(singular || plural) && (
                <div className="flex flex-wrap items-center gap-2 text-label-sm text-text-muted">
                  <span className="rounded-md bg-surface-container px-2 py-1">
                    Plural: <strong>{plural || "—"}</strong>
                  </span>
                  <span className="rounded-md bg-surface-container px-2 py-1">
                    Singular: <strong>{singular || "—"}</strong>
                  </span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-label-md uppercase tracking-widest text-text-muted">
                  Singular
                </label>
                <Input
                  value={singular}
                  onChange={(e) => {
                    setSingular(e.target.value);
                    setSingularDirty(true);
                  }}
                  className="h-9 bg-surface-container-low border-none"
                  placeholder="Es. Blog Post"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-label-md uppercase tracking-widest text-text-muted">
                  Plural
                </label>
                <Input
                  value={plural}
                  onChange={(e) => {
                    setPlural(e.target.value);
                    setPluralDirty(true);
                  }}
                  className="h-9 bg-surface-container-low border-none"
                  placeholder="Es. Blog Posts"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-label-md uppercase tracking-widest text-text-muted">
                Collection URL
              </label>
              <Input
                value={slug}
                onChange={(e) => {
                  setSlug(e.target.value);
                  setSlugDirty(true);
                }}
                className="h-9 bg-surface-container-low border-none font-mono"
                placeholder="blog"
              />
              <p className="font-mono text-label-sm text-text-muted">
                site/{slug || "blog"}/{slugify(singular || "item")}
              </p>
            </div>

            {mode === "ai" && (
              <div className="flex flex-col gap-1.5">
                <label className="text-label-md uppercase tracking-widest text-text-muted">
                  Brief
                </label>
                <Textarea
                  value={brief}
                  onChange={(e) => setBrief(e.target.value)}
                  placeholder='Es. "Blog di tech italiana con articoli, autore, copertina, tag"'
                  rows={3}
                  className="resize-none bg-surface-container-low border-none"
                />
              </div>
            )}

            <div className="mt-1 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setMode("choose")}
                className="text-body-sm text-secondary-text hover:text-on-surface"
              >
                Indietro
              </button>
              <GradientButton
                size="md"
                onClick={mode === "ai" ? createAI : createBlank}
                disabled={
                  loading ||
                  !name.trim() ||
                  !slug.trim() ||
                  (mode === "ai" && !brief.trim())
                }
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Genero...
                  </>
                ) : mode === "ai" ? (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Genera schema
                  </>
                ) : (
                  "Crea"
                )}
              </GradientButton>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
