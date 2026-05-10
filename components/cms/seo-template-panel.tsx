"use client";

import { useMemo } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePagesStore } from "@/lib/stores/pages-store";
import { compatibleFieldOptions } from "@/lib/puck/cms-binding";
import type { CMSCollection, PageSEO } from "@/types";

type Resolved = {
  title: string;
  description: string;
  ogImage?: string;
  canonical?: string;
};

const TITLE_MAX = 60;
const DESC_MAX = 160;

export function SeoTemplatePanel({
  open,
  onOpenChange,
  templatePageId,
  collection,
  resolved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  templatePageId: string;
  collection: CMSCollection;
  resolved: Resolved;
}) {
  const pages = usePagesStore((s) => s.pages);
  const updatePage = usePagesStore((s) => s.updatePage);
  const template = pages.find((p) => p.id === templatePageId);
  const seo = template?.seo;

  const textOptions = useMemo(
    () => compatibleFieldOptions(collection.fields, "text"),
    [collection.fields],
  );
  const imageOptions = useMemo(
    () => compatibleFieldOptions(collection.fields, "image"),
    [collection.fields],
  );

  if (!seo || !template) return null;

  function setBinding(
    key: keyof NonNullable<PageSEO["bindings"]>,
    value: string | undefined,
  ) {
    if (!template) return;
    const nextBindings = { ...(template.seo.bindings ?? {}), [key]: value };
    updatePage(template.id, {
      seo: { ...template.seo, bindings: nextBindings },
    });
  }

  function setIndexable(v: boolean) {
    if (!template) return;
    updatePage(template.id, { seo: { ...template.seo, indexable: v } });
  }

  function setStaticTitle(v: string) {
    if (!template) return;
    updatePage(template.id, { seo: { ...template.seo, metaTitle: v } });
  }

  function setStaticDescription(v: string) {
    if (!template) return;
    updatePage(template.id, {
      seo: { ...template.seo, metaDescription: v },
    });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-[460px] bg-surface-container-highest border-none sm:max-w-md"
      >
        <SheetHeader>
          <SheetTitle className="text-title-md">SEO settings</SheetTitle>
          <SheetDescription className="text-body-sm text-secondary-text">
            Configura come title / description / OG image vengono pescati
            dall&apos;item. Bindings hanno priorità sui valori statici.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-5 flex flex-col gap-4 px-1">
          <BindingRow
            label="Title source"
            options={textOptions}
            value={seo.bindings?.metaTitle}
            onChange={(v) => setBinding("metaTitle", v)}
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-label-md uppercase tracking-widest text-text-muted">
              Static fallback title
            </label>
            <Input
              value={seo.metaTitle}
              onChange={(e) => setStaticTitle(e.target.value)}
              className="h-9 bg-surface-container-low border-none"
            />
          </div>

          <BindingRow
            label="Description source"
            options={textOptions}
            value={seo.bindings?.metaDescription}
            onChange={(v) => setBinding("metaDescription", v)}
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-label-md uppercase tracking-widest text-text-muted">
              Static fallback description
            </label>
            <Input
              value={seo.metaDescription}
              onChange={(e) => setStaticDescription(e.target.value)}
              className="h-9 bg-surface-container-low border-none"
            />
          </div>

          <BindingRow
            label="OG image source"
            options={imageOptions}
            value={seo.bindings?.ogImage}
            onChange={(v) => setBinding("ogImage", v)}
          />

          <BindingRow
            label="Canonical slug source"
            options={textOptions}
            value={seo.bindings?.canonical}
            onChange={(v) => setBinding("canonical", v)}
          />

          <div className="flex items-center justify-between rounded-lg bg-surface-container-low px-3 py-2.5">
            <span className="text-body-sm text-on-surface">Indexable</span>
            <Switch
              checked={seo.indexable}
              onCheckedChange={setIndexable}
            />
          </div>

          <Preview resolved={resolved} />
        </div>
      </SheetContent>
    </Sheet>
  );
}

function BindingRow({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: ReturnType<typeof compatibleFieldOptions>;
  value: string | undefined;
  onChange: (v: string | undefined) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-label-md uppercase tracking-widest text-text-muted">
        {label}
      </label>
      <Select
        value={value ?? "__static"}
        onValueChange={(v) =>
          onChange(!v || v === "__static" ? undefined : v)
        }
      >
        <SelectTrigger className="h-9 bg-surface-container-low border-none">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__static">Static fallback</SelectItem>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function Preview({ resolved }: { resolved: Resolved }) {
  const titleLen = resolved.title.length;
  const descLen = resolved.description.length;
  return (
    <div className="mt-3 flex flex-col gap-2 rounded-lg bg-surface-container-low p-3">
      <span className="text-label-md uppercase tracking-widest text-text-muted">
        Live preview
      </span>
      <div className="rounded-md bg-surface-container px-3 py-2">
        <p className="truncate text-body-sm font-semibold text-on-surface">
          {resolved.title}
        </p>
        <p className="text-label-sm text-molten-primary">
          {resolved.canonical}
        </p>
        <p className="mt-0.5 line-clamp-2 text-body-sm text-secondary-text">
          {resolved.description}
        </p>
      </div>
      <div className="flex items-center justify-between text-label-sm">
        <span
          className={
            titleLen > TITLE_MAX ? "text-warning" : "text-text-muted"
          }
        >
          Title: {titleLen}/{TITLE_MAX}
          {titleLen > TITLE_MAX && " · troppo lungo"}
        </span>
        <span
          className={descLen > DESC_MAX ? "text-warning" : "text-text-muted"}
        >
          Description: {descLen}/{DESC_MAX}
          {descLen > DESC_MAX && " · troppo lungo"}
        </span>
      </div>
    </div>
  );
}

