"use client";

import { useEffect, useState } from "react";
import { Sparkles, Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { GradientButton } from "@/components/luminous/gradient-button";
import type { Page, PageSEO } from "@/types";
import { cn } from "@/lib/utils";

export function SEOSheet({
  open,
  onOpenChange,
  page,
  onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  page: Page;
  onSave: (seo: PageSEO) => void;
}) {
  const [seo, setSeo] = useState<PageSEO>(page.seo);
  const [focusKeyword, setFocusKeyword] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  // Reset form when sheet opens with a new page's SEO.
  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSeo(page.seo);
    }
  }, [open, page.seo]);

  const titleLen = seo.metaTitle.length;
  const descLen = seo.metaDescription.length;
  const titleOk = titleLen > 20 && titleLen <= 60;
  const descOk = descLen > 50 && descLen <= 160;

  async function fillWithAI() {
    setAiLoading(true);
    try {
      const res = await fetch("/api/ai/seo-fill", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          page: page.puckData,
          pageTitle: page.title,
          focusKeyword: focusKeyword || undefined,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const { seo: fill, mode } = (await res.json()) as {
        seo: {
          metaTitle: string;
          metaDescription: string;
          focusKeyword: string;
          og: { title: string; description: string };
        };
        mode: "ai" | "stub";
      };
      setSeo((prev) => ({
        ...prev,
        metaTitle: fill.metaTitle,
        metaDescription: fill.metaDescription,
        og: {
          ...prev.og,
          title: fill.og.title,
          description: fill.og.description,
        },
      }));
      setFocusKeyword(fill.focusKeyword);
      if (mode === "stub") {
        toast.info("SEO stub applicato · aggiungi API key per AI reale");
      } else {
        toast.success("SEO generato dall'AI");
      }
    } catch (err) {
      toast.error(`Errore: ${(err as Error).message}`);
    } finally {
      setAiLoading(false);
    }
  }

  function handleSave() {
    onSave(seo);
    onOpenChange(false);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full bg-surface-container-highest border-none sm:max-w-lg flex flex-col gap-0"
      >
        <SheetHeader className="border-b border-outline-variant/20 p-5">
          <SheetTitle className="flex items-center gap-2 text-title-lg text-on-surface">
            <Search className="h-4 w-4 text-molten-primary" />
            SEO · {page.title}
          </SheetTitle>
          <SheetDescription className="text-secondary-text">
            Meta tag, Open Graph e keyword focus.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="mb-4 rounded-xl bg-surface-container-high p-3">
            <label className="mb-2 block text-label-md uppercase tracking-widest text-text-muted">
              Focus keyword (opzionale)
            </label>
            <Input
              value={focusKeyword}
              onChange={(e) => setFocusKeyword(e.target.value)}
              placeholder="es. software gestionale"
              className="h-10 bg-surface-container-lowest border-none"
            />
            <GradientButton
              size="sm"
              onClick={fillWithAI}
              disabled={aiLoading}
              className="mt-3 w-full justify-center"
            >
              {aiLoading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Generazione...
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  Fill with AI
                </>
              )}
            </GradientButton>
          </div>

          <Field label="Meta Title" hint={`${titleLen}/60`} hintOk={titleOk}>
            <Input
              value={seo.metaTitle}
              onChange={(e) => setSeo({ ...seo, metaTitle: e.target.value })}
              className="h-10 bg-surface-container-high border-none"
            />
          </Field>

          <Field
            label="Meta Description"
            hint={`${descLen}/160`}
            hintOk={descOk}
          >
            <Textarea
              value={seo.metaDescription}
              onChange={(e) =>
                setSeo({ ...seo, metaDescription: e.target.value })
              }
              rows={3}
              className="bg-surface-container-high border-none resize-none"
            />
          </Field>

          <Field label="Canonical URL">
            <Input
              value={seo.canonicalUrl}
              onChange={(e) =>
                setSeo({ ...seo, canonicalUrl: e.target.value })
              }
              className="h-10 bg-surface-container-high border-none"
            />
          </Field>

          <div className="my-4 flex items-center justify-between rounded-xl bg-surface-container-high p-3">
            <div>
              <p className="text-body-sm font-medium text-on-surface">Indexable</p>
              <p className="text-label-sm text-text-muted">
                Permetti ai motori di ricerca di indicizzare
              </p>
            </div>
            <Switch
              checked={seo.indexable}
              onCheckedChange={(v) => setSeo({ ...seo, indexable: v })}
            />
          </div>

          <div className="mb-4 flex items-center justify-between rounded-xl bg-surface-container-high p-3">
            <div>
              <p className="text-body-sm font-medium text-on-surface">Internal Search</p>
              <p className="text-label-sm text-text-muted">
                Includi nella ricerca interna del sito
              </p>
            </div>
            <Switch
              checked={seo.internalSearch}
              onCheckedChange={(v) => setSeo({ ...seo, internalSearch: v })}
            />
          </div>

          <p className="mb-3 mt-4 text-label-md uppercase tracking-widest text-text-muted">
            Open Graph
          </p>

          <Field label="OG Title">
            <Input
              value={seo.og.title ?? ""}
              onChange={(e) =>
                setSeo({ ...seo, og: { ...seo.og, title: e.target.value } })
              }
              className="h-10 bg-surface-container-high border-none"
            />
          </Field>

          <Field label="OG Description">
            <Textarea
              value={seo.og.description ?? ""}
              onChange={(e) =>
                setSeo({
                  ...seo,
                  og: { ...seo.og, description: e.target.value },
                })
              }
              rows={2}
              className="bg-surface-container-high border-none resize-none"
            />
          </Field>

          <Field label="OG Image URL">
            <Input
              value={seo.og.image ?? ""}
              onChange={(e) =>
                setSeo({ ...seo, og: { ...seo.og, image: e.target.value } })
              }
              placeholder="/og-image.png"
              className="h-10 bg-surface-container-high border-none"
            />
          </Field>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-outline-variant/20 bg-surface-container p-4">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-lg px-4 py-2 text-body-sm text-secondary-text hover:text-on-surface"
          >
            Annulla
          </button>
          <GradientButton size="md" onClick={handleSave}>
            Salva SEO
          </GradientButton>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Field({
  label,
  hint,
  hintOk,
  children,
}: {
  label: string;
  hint?: string;
  hintOk?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-3 flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label className="text-label-md uppercase tracking-widest text-text-muted">
          {label}
        </label>
        {hint && (
          <span
            className={cn(
              "text-label-sm tabular-nums",
              hintOk ? "text-success" : "text-warning",
            )}
          >
            {hint}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}
