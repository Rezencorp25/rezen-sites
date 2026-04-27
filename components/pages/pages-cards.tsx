"use client";

import Link from "next/link";
import { Plus, ArrowUpRight, FileText } from "lucide-react";
import {
  PageStatusPill,
  SeoScorePill,
} from "@/components/luminous/status-pill";
import type { Page } from "@/types";

export function PagesCards({
  pages,
  projectId,
  onCreate,
}: {
  pages: Page[];
  projectId: string;
  onCreate: () => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {pages.map((p) => (
        <Link
          key={p.id}
          href={`/projects/${projectId}/pages/${p.id}`}
          className="group flex flex-col overflow-hidden rounded-xl bg-surface-container-high transition-all hover:bg-surface-container-highest"
        >
          <div className="relative aspect-[16/9] w-full overflow-hidden bg-surface-container-low">
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(135deg, rgba(245,97,23,0.25), rgba(28,27,39,0.9))",
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <FileText className="h-10 w-10 text-molten-primary opacity-40" />
            </div>
            <div className="absolute left-4 top-4">
              <PageStatusPill status={p.status} />
            </div>
            <div className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
              <ArrowUpRight className="h-4 w-4 text-white" />
            </div>
            <div className="absolute bottom-4 left-4 right-4">
              <h3 className="truncate text-title-md font-bold text-white">
                {p.title}
              </h3>
              <p className="truncate font-mono text-label-sm text-white/70">
                {p.slug}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between px-5 py-4">
            <div className="flex gap-5">
              <div className="flex flex-col leading-tight">
                <span className="text-label-sm uppercase tracking-widest text-text-muted">
                  Views 7g
                </span>
                <span className="text-body-md font-semibold text-on-surface tabular-nums">
                  {p.analytics.pageviews7d.toLocaleString("it-IT")}
                </span>
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-label-sm uppercase tracking-widest text-text-muted">
                  SEO
                </span>
                <span className="text-body-md font-semibold text-on-surface tabular-nums">
                  {p.analytics.seoScore || "—"}
                </span>
              </div>
            </div>
            {p.analytics.seoScore > 0 ? (
              <SeoScorePill score={p.analytics.seoScore} />
            ) : null}
          </div>
        </Link>
      ))}

      <button
        type="button"
        onClick={onCreate}
        className="group flex min-h-[260px] flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-outline-variant/25 bg-surface-container-lowest transition-all hover:border-molten-primary hover:bg-surface-container-low"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-container-high transition-colors group-hover:bg-surface-container-highest">
          <Plus className="h-6 w-6 text-molten-primary" />
        </div>
        <span className="text-body-md font-semibold text-on-surface">
          Crea Nuova Pagina
        </span>
        <span className="text-body-sm text-text-muted">
          AI o partenza vuota
        </span>
      </button>
    </div>
  );
}
