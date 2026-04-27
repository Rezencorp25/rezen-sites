"use client";

import Link from "next/link";
import { Eye, PenLine } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  PageStatusPill,
  SeoScorePill,
} from "@/components/luminous/status-pill";
import type { Page } from "@/types";

export function PagesTable({
  pages,
  projectId,
}: {
  pages: Page[];
  projectId: string;
}) {
  return (
    <div className="overflow-hidden rounded-xl bg-surface-container-high">
      <div className="grid grid-cols-[100px_1.4fr_1fr_2fr_110px_90px_80px] items-center gap-4 px-6 py-3 text-label-md uppercase tracking-widest text-text-muted">
        <span>Status</span>
        <span>Titolo</span>
        <span>Slug</span>
        <span>Meta Title</span>
        <span className="text-right">Pageviews (7g)</span>
        <span className="text-right">SEO</span>
        <span />
      </div>
      <div className="flex flex-col">
        {pages.map((p, i) => (
          <div
            key={p.id}
            className={cn(
              "group grid grid-cols-[100px_1.4fr_1fr_2fr_110px_90px_80px] items-center gap-4 px-6 py-4 transition-colors",
              i % 2 === 0
                ? "bg-surface-container-lowest"
                : "bg-surface-container-low",
              "hover:bg-surface-container-highest",
            )}
          >
            <PageStatusPill status={p.status} />
            <div className="flex flex-col truncate">
              <span className="truncate text-body-md font-semibold text-on-surface">
                {p.title}
              </span>
            </div>
            <span className="truncate font-mono text-body-sm text-secondary-text">
              {p.slug}
            </span>
            <span className="truncate text-body-sm text-secondary-text">
              {p.seo.metaTitle || "—"}
            </span>
            <span className="text-right text-body-sm font-medium text-on-surface tabular-nums">
              {p.analytics.pageviews7d.toLocaleString("it-IT")}
            </span>
            <span className="flex justify-end">
              {p.analytics.seoScore > 0 ? (
                <SeoScorePill score={p.analytics.seoScore} />
              ) : (
                <span className="text-text-muted">—</span>
              )}
            </span>
            <span className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Link
                href={`/projects/${projectId}/pages/${p.id}`}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-container hover:bg-surface-container-highest"
                aria-label="Modifica"
              >
                <PenLine className="h-3.5 w-3.5 text-molten-primary" />
              </Link>
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-container hover:bg-surface-container-highest"
                aria-label="Anteprima"
              >
                <Eye className="h-3.5 w-3.5 text-secondary-text" />
              </button>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
