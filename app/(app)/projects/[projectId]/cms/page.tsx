"use client";

import { use, useState, useMemo } from "react";
import Link from "next/link";
import { Plus, Database, ArrowUpRight, Sparkles } from "lucide-react";
import { fmtDateShort } from "@/lib/utils/format-date";
import { useCMSStore } from "@/lib/stores/cms-store";
import { NewCollectionDialog } from "@/components/cms/new-collection-dialog";
import { GradientButton } from "@/components/luminous/gradient-button";

export default function CMSListPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = use(params);
  const allCollections = useCMSStore((s) => s.collections);
  const items = useCMSStore((s) => s.items);
  const collections = useMemo(
    () => allCollections.filter((c) => c.projectId === projectId),
    [allCollections, projectId],
  );
  const [open, setOpen] = useState(false);

  return (
    <div className="mx-auto max-w-7xl px-10 py-10">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-label-md uppercase tracking-widest text-text-muted">
            <Database className="h-3.5 w-3.5" />
            Content
          </div>
          <h1 className="text-headline-md font-bold text-on-surface">CMS</h1>
          <p className="text-body-md text-secondary-text">
            Collezioni strutturate per blog, case studies, prodotti.
          </p>
        </div>
        <GradientButton size="md" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" />
          Nuova Collezione
        </GradientButton>
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {collections.map((c) => {
          const count = items.filter((i) => i.collectionId === c.id).length;
          return (
            <Link
              key={c.id}
              href={`/projects/${projectId}/cms/${c.id}`}
              className="group flex flex-col rounded-xl bg-surface-container-high p-5 transition-all hover:bg-surface-container-highest"
            >
              <div className="mb-3 flex items-start justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface-container-lowest">
                  <Database className="h-5 w-5 text-molten-primary" />
                </div>
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-container-lowest opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowUpRight className="h-4 w-4 text-on-surface" />
                </span>
              </div>
              <h3 className="text-title-md font-semibold text-on-surface">
                {c.name}
              </h3>
              <p className="mb-4 font-mono text-label-sm text-text-muted">
                /{c.slug}
              </p>
              <div className="mt-auto flex items-center justify-between">
                <div className="flex flex-col leading-tight">
                  <span className="text-headline-sm font-bold text-on-surface tabular-nums">
                    {count}
                  </span>
                  <span className="text-label-sm uppercase tracking-widest text-text-muted">
                    Items
                  </span>
                </div>
                <span
                  className="text-label-sm text-text-muted"
                  suppressHydrationWarning
                >
                  {fmtDateShort(c.createdAt)}
                </span>
              </div>
            </Link>
          );
        })}

        <button
          type="button"
          onClick={() => setOpen(true)}
          className="group flex min-h-[200px] flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-outline-variant/25 bg-surface-container-lowest transition-all hover:border-molten-primary hover:bg-surface-container-low"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-container-high transition-colors group-hover:bg-surface-container-highest">
            <Sparkles className="h-6 w-6 text-molten-primary" />
          </div>
          <span className="text-body-md font-semibold text-on-surface">
            Nuova Collezione
          </span>
          <span className="text-body-sm text-text-muted">
            Schema AI o partenza vuota
          </span>
        </button>
      </div>

      <NewCollectionDialog
        open={open}
        onOpenChange={setOpen}
        projectId={projectId}
      />
    </div>
  );
}
