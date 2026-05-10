"use client";

import { use, useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { Render } from "@measured/puck";
import { ArrowLeft, Pencil, Eye, Search } from "lucide-react";
import { useCMSStore } from "@/lib/stores/cms-store";
import { usePagesStore } from "@/lib/stores/pages-store";
import { puckConfig } from "@/lib/puck/config";
import { CmsBindingProvider } from "@/lib/puck/cms-binding";
import { findTemplatePageFor } from "@/lib/cms/collection-template";
import { resolveSeo, SeoMetadataInjector } from "@/lib/cms/seo-resolver";
import { CmsItemStatusPill } from "@/components/luminous/status-pill";
import { SeoTemplatePanel } from "@/components/cms/seo-template-panel";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

export default function CollectionPagePreview({
  params,
}: {
  params: Promise<{
    projectId: string;
    collectionSlug: string;
    itemSlug: string;
  }>;
}) {
  const { projectId, collectionSlug, itemSlug } = use(params);
  const collections = useCMSStore((s) => s.collections);
  const items = useCMSStore((s) => s.items);
  const updateItem = useCMSStore((s) => s.updateItem);
  const pages = usePagesStore((s) => s.pages);

  const [editable, setEditable] = useState(false);
  const [seoOpen, setSeoOpen] = useState(false);

  const collection = useMemo(
    () =>
      collections.find(
        (c) => c.slug === collectionSlug && c.projectId === projectId,
      ),
    [collections, collectionSlug, projectId],
  );

  const item = useMemo(() => {
    if (!collection) return undefined;
    return items.find(
      (i) =>
        i.collectionId === collection.id &&
        i.projectId === projectId &&
        ((i.liveData?.slug as string | undefined) === itemSlug ||
          (i.draftData.slug as string | undefined) === itemSlug),
    );
  }, [items, collection, itemSlug, projectId]);

  const template = useMemo(() => {
    if (!collection) return undefined;
    return findTemplatePageFor(pages, collection.id);
  }, [pages, collection]);

  const onCommit = useCallback(
    (patches: Record<string, unknown>) => {
      if (!item) return;
      updateItem(item.id, {
        draftData: { ...item.draftData, ...patches },
      });
      toast.success("Draft autosaved", { duration: 1200 });
    },
    [item, updateItem],
  );

  const resolvedSeo = useMemo(() => {
    if (!template || !collection || !item) return null;
    return resolveSeo(template.seo, collection, item, itemSlug);
  }, [template, collection, item, itemSlug]);

  if (!collection) {
    return <NotFound message={`Collezione "${collectionSlug}" non trovata`} />;
  }
  if (!item) {
    return (
      <NotFound
        message={`Item "${itemSlug}" non trovato in ${collection.displayName}`}
      />
    );
  }
  if (item.status === "archived") {
    return (
      <NotFound
        message={`Item "${itemSlug}" archiviato — non visibile pubblicamente`}
        backHref={`/projects/${projectId}/cms/${collection.id}/items/${item.id}`}
      />
    );
  }
  if (!template) {
    return (
      <NotFound
        message={`Template Collection Page non trovato per ${collection.displayName}. Crea una nuova collezione per auto-generare il template.`}
        backHref={`/projects/${projectId}/cms/${collection.id}`}
      />
    );
  }

  if (!resolvedSeo) return null;

  return (
    <div className="min-h-screen bg-surface">
      <SeoMetadataInjector
        resolved={resolvedSeo}
        indexable={template.seo.indexable && item.status === "published"}
      />
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-outline-variant/30 bg-surface-container-low px-6 py-3 text-body-sm">
        <Link
          href={`/projects/${projectId}/cms/${collection.id}/items/${item.id}`}
          className="inline-flex items-center gap-1.5 text-text-muted hover:text-on-surface"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Edit item
        </Link>
        <div className="flex items-center gap-3">
          <span className="font-mono text-label-sm text-text-muted">
            /{collection.slug}/{itemSlug}
          </span>
          <CmsItemStatusPill status={item.status} />
          <button
            type="button"
            onClick={() => setSeoOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-surface-container-high px-3 py-1.5 text-label-md text-on-surface hover:bg-surface-container-highest"
            aria-label="SEO settings"
          >
            <Search className="h-3.5 w-3.5" />
            SEO
          </button>
          <label className="flex items-center gap-2 rounded-lg bg-surface-container-high px-3 py-1.5">
            {editable ? (
              <Pencil className="h-3.5 w-3.5 text-molten-primary" />
            ) : (
              <Eye className="h-3.5 w-3.5 text-text-muted" />
            )}
            <span className="text-label-md text-on-surface">
              {editable ? "Editing" : "Preview"}
            </span>
            <Switch checked={editable} onCheckedChange={setEditable} />
          </label>
        </div>
      </header>
      <CmsBindingProvider
        collection={collection}
        item={item}
        editable={editable}
        onCommit={onCommit}
      >
        <Render config={puckConfig} data={template.puckData as never} />
      </CmsBindingProvider>
      <SeoTemplatePanel
        open={seoOpen}
        onOpenChange={setSeoOpen}
        templatePageId={template.id}
        collection={collection}
        resolved={resolvedSeo}
      />
    </div>
  );
}

function NotFound({
  message,
  backHref,
}: {
  message: string;
  backHref?: string;
}) {
  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-3 px-10 text-center">
      <p className="text-body-md text-text-muted">{message}</p>
      <Link
        href={backHref ?? "/projects"}
        className="text-body-sm text-molten-primary hover:brightness-110"
      >
        ← Torna ai progetti
      </Link>
    </div>
  );
}
