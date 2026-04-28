"use client";

import { use, useMemo, useState } from "react";
import { Search, Plus, CheckSquare, Eye, EyeOff, FileDown, Trash2, Globe } from "lucide-react";
import { toast } from "sonner";
import { usePagesStore } from "@/lib/stores/pages-store";
import { useAuditStore } from "@/lib/stores/audit-store";
import {
  ViewToggle,
  type PagesView,
} from "@/components/pages/view-toggle";
import { PagesTable } from "@/components/pages/pages-table";
import { PagesCards } from "@/components/pages/pages-cards";
import { AddPageDialog } from "@/components/pages/add-page-dialog";
import { GradientButton } from "@/components/luminous/gradient-button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Page } from "@/types";

type StatusFilter = "all" | "published" | "draft";
type IndexableFilter = "all" | "yes" | "no";

export default function PagesListPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = use(params);
  const allPages = usePagesStore((s) => s.pages);
  const bulkUpdate = usePagesStore((s) => s.bulkUpdate);
  const bulkUpdateSEO = usePagesStore((s) => s.bulkUpdateSEO);
  const bulkRemove = usePagesStore((s) => s.bulkRemove);
  const log = useAuditStore((s) => s.log);
  const pages = useMemo(
    () => allPages.filter((p) => p.projectId === projectId),
    [allPages, projectId],
  );

  const [view, setView] = useState<PagesView>("table");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [status, setStatus] = useState<StatusFilter>("all");
  const [indexable, setIndexable] = useState<IndexableFilter>("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const filtered = useMemo<Page[]>(() => {
    return pages.filter((p) => {
      if (status !== "all" && p.status !== status) return false;
      if (indexable === "yes" && !p.seo.indexable) return false;
      if (indexable === "no" && p.seo.indexable) return false;
      if (query) {
        const q = query.toLowerCase();
        if (
          !p.title.toLowerCase().includes(q) &&
          !p.slug.toLowerCase().includes(q) &&
          !p.seo.metaTitle.toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
  }, [pages, status, indexable, query]) as Page[];

  return (
    <div className="mx-auto max-w-7xl px-10 py-10">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-headline-md font-bold text-on-surface">Pagine</h1>
          <p className="text-body-md text-secondary-text">
            Gestisci e ottimizza l&apos;indice delle pagine del tuo sito web.
          </p>
        </div>
        <GradientButton size="md" onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          Aggiungi Pagina
        </GradientButton>
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[280px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cerca tra le pagine..."
            className="h-10 pl-9 bg-surface-container-low border-none"
          />
        </div>

        <Select
          value={status}
          onValueChange={(v) => setStatus(v as StatusFilter)}
        >
          <SelectTrigger className="h-10 w-40 bg-surface-container-low border-none">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Status: Tutti</SelectItem>
            <SelectItem value="published">Status: Published</SelectItem>
            <SelectItem value="draft">Status: Draft</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={indexable}
          onValueChange={(v) => setIndexable(v as IndexableFilter)}
        >
          <SelectTrigger className="h-10 w-44 bg-surface-container-low border-none">
            <SelectValue placeholder="Indexable" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Indexable: Tutti</SelectItem>
            <SelectItem value="yes">Indexable: Sì</SelectItem>
            <SelectItem value="no">Indexable: No</SelectItem>
          </SelectContent>
        </Select>

        <ViewToggle value={view} onChange={setView} />
      </div>

      {filtered.length > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-lg border border-outline/20 bg-surface-container-low px-3 py-2 text-label-md">
          <CheckSquare className="h-3.5 w-3.5 text-molten-primary" />
          <span className="text-secondary-text">
            {selected.size > 0
              ? `${selected.size} selezionate`
              : `Bulk azioni su ${filtered.length} pagine in vista`}
          </span>
          {selected.size === 0 ? (
            <button
              type="button"
              onClick={() => setSelected(new Set(filtered.map((p) => p.id)))}
              className="ml-auto rounded-md px-2 py-1 text-molten-primary hover:bg-surface-container-highest"
            >
              Seleziona tutte ({filtered.length})
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setSelected(new Set())}
                className="ml-2 rounded-md px-2 py-1 text-text-muted hover:bg-surface-container-highest"
              >
                Deseleziona
              </button>
              <div className="ml-auto flex flex-wrap items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    bulkUpdate([...selected], { status: "published" });
                    log({
                      actor: { id: "u-owner", name: "Te" },
                      action: "page.publish",
                      description: `Pubblicate ${selected.size} pagine in bulk`,
                      target: { kind: "project", id: projectId },
                    });
                    toast.success(`${selected.size} pagine pubblicate`);
                  }}
                  className="inline-flex items-center gap-1 rounded-md bg-success-container px-2 py-1 text-success hover:brightness-110"
                >
                  <Globe className="h-3 w-3" />
                  Pubblica
                </button>
                <button
                  type="button"
                  onClick={() => {
                    bulkUpdate([...selected], { status: "draft" });
                    toast.success(`${selected.size} pagine in draft`);
                  }}
                  className="inline-flex items-center gap-1 rounded-md bg-surface-container-high px-2 py-1 text-secondary-text hover:bg-surface-container-highest"
                >
                  Draft
                </button>
                <button
                  type="button"
                  onClick={() => {
                    bulkUpdateSEO([...selected], { indexable: true });
                    toast.success(`Index ON su ${selected.size} pagine`);
                  }}
                  className="inline-flex items-center gap-1 rounded-md bg-info-container px-2 py-1 text-info hover:brightness-110"
                >
                  <Eye className="h-3 w-3" />
                  Index ON
                </button>
                <button
                  type="button"
                  onClick={() => {
                    bulkUpdateSEO([...selected], { indexable: false });
                    toast.success(`Index OFF su ${selected.size} pagine`);
                  }}
                  className="inline-flex items-center gap-1 rounded-md bg-warning-container px-2 py-1 text-warning hover:brightness-110"
                >
                  <EyeOff className="h-3 w-3" />
                  Index OFF
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const selectedPages = filtered.filter((p) =>
                      selected.has(p.id),
                    );
                    const headers = [
                      "id",
                      "title",
                      "slug",
                      "status",
                      "metaTitle",
                      "metaDescription",
                      "indexable",
                      "canonicalUrl",
                    ];
                    const rows = selectedPages.map((p) =>
                      [
                        p.id,
                        p.title,
                        p.slug,
                        p.status,
                        p.seo.metaTitle,
                        p.seo.metaDescription,
                        String(p.seo.indexable),
                        p.seo.canonicalUrl,
                      ]
                        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
                        .join(","),
                    );
                    const csv = [headers.join(","), ...rows].join("\n");
                    const blob = new Blob([csv], {
                      type: "text/csv;charset=utf-8",
                    });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `pages-${projectId}.csv`;
                    a.click();
                    URL.revokeObjectURL(url);
                    toast.success(`Esportate ${selected.size} pagine`);
                  }}
                  className="inline-flex items-center gap-1 rounded-md bg-surface-container-high px-2 py-1 text-on-surface hover:bg-surface-container-highest"
                >
                  <FileDown className="h-3 w-3" />
                  CSV
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (
                      !confirm(
                        `Eliminare ${selected.size} pagine? Operazione irreversibile.`,
                      )
                    ) return;
                    bulkRemove([...selected]);
                    setSelected(new Set());
                    toast.success(`Eliminate ${selected.size} pagine`);
                  }}
                  className="inline-flex items-center gap-1 rounded-md bg-error-container px-2 py-1 text-error hover:brightness-110"
                >
                  <Trash2 className="h-3 w-3" />
                  Elimina
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="rounded-xl bg-surface-container-high px-10 py-16 text-center">
          <p className="text-body-md text-text-muted">
            Nessuna pagina corrisponde ai filtri attuali.
          </p>
        </div>
      ) : view === "table" ? (
        <PagesTable pages={filtered} projectId={projectId} />
      ) : (
        <PagesCards
          pages={filtered}
          projectId={projectId}
          onCreate={() => setDialogOpen(true)}
        />
      )}

      <div className="mt-4 flex items-center justify-between text-label-md text-text-muted">
        <span>
          Visualizzando {filtered.length} di {pages.length} pagine
        </span>
      </div>

      <AddPageDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        projectId={projectId}
      />
    </div>
  );
}
