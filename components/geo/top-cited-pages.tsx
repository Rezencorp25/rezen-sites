"use client";

import { useState } from "react";
import {
  Bot,
  ChevronDown,
  ChevronRight,
  Compass,
  ExternalLink,
  FileText,
  Gem,
  Sparkles,
} from "lucide-react";
import {
  GEO_LLM_ACCENT,
  GEO_LLM_LABEL,
  type GeoLlmId,
} from "@/lib/seo/geo-types";
import type { CitedPageEntry } from "@/lib/seo/citations";
import { cn } from "@/lib/utils";

const LLM_ICON: Record<GeoLlmId, typeof Bot> = {
  chatgpt: Sparkles,
  perplexity: Compass,
  gemini: Gem,
  claude: Bot,
};

const ACCENT_TEXT: Record<"emerald" | "violet" | "blue" | "amber", string> = {
  emerald: "text-emerald-400",
  violet: "text-violet-400",
  blue: "text-blue-400",
  amber: "text-amber-400",
};

type Props = {
  pages: CitedPageEntry[];
  /** Click su query nell'expand → riapre drill modal della query. */
  onSelectQuery?: (queryId: string) => void;
};

export function TopCitedPages({ pages, onSelectQuery }: Props) {
  const [expandedUrl, setExpandedUrl] = useState<string | null>(null);

  if (pages.length === 0) {
    return (
      <div className="flex flex-col gap-2 rounded-xl bg-surface-container-high p-5">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-blue-400" />
          <h2 className="text-title-md font-semibold text-on-surface">
            Top Cited Pages
          </h2>
        </div>
        <p className="text-body-sm text-text-muted">
          Nessuna pagina cliente è stata citata con link cliccabile dagli LLM.
          Lavora sul citation rate per popolare questa lista.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl bg-surface-container-high p-5">
      <div className="flex items-center gap-2">
        <FileText className="h-4 w-4 text-blue-400" />
        <h2 className="text-title-md font-semibold text-on-surface">
          Top Cited Pages
        </h2>
        <span className="text-label-sm font-normal text-text-muted">
          (top {pages.length}, click per dettaglio LLM/query)
        </span>
      </div>

      <ul className="flex flex-col gap-1.5">
        {pages.map((p, i) => {
          const isExpanded = expandedUrl === p.url;
          return (
            <li key={p.url}>
              <button
                type="button"
                onClick={() => setExpandedUrl(isExpanded ? null : p.url)}
                className="flex w-full items-center gap-3 rounded-md bg-surface-container-low px-3 py-2 text-left transition-colors hover:bg-surface-container-low/80"
              >
                <span className="w-5 font-mono text-label-sm text-text-muted">
                  #{i + 1}
                </span>
                <span className="flex-1 truncate font-mono text-label-md text-on-surface">
                  {p.path}
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  {p.citingLlms.map((llm, idx) => {
                    const Icon = LLM_ICON[llm];
                    return (
                      <Icon
                        key={`${llm}-${idx}`}
                        className={cn("h-3.5 w-3.5", ACCENT_TEXT[GEO_LLM_ACCENT[llm]])}
                      />
                    );
                  })}
                  <span className="rounded bg-blue-400/15 px-1.5 py-0.5 font-mono text-label-sm font-semibold text-blue-300">
                    ×{p.count}
                  </span>
                  {isExpanded ? (
                    <ChevronDown className="h-3.5 w-3.5 text-text-muted" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5 text-text-muted" />
                  )}
                </span>
              </button>

              {isExpanded && (
                <div className="ml-8 mt-1.5 flex flex-col gap-1 rounded-md border border-surface-container-low p-2.5">
                  <div className="mb-1 flex items-center gap-1.5">
                    <a
                      href={p.url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="flex items-center gap-1 text-label-sm text-molten-primary hover:underline"
                    >
                      Apri URL
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                  <ul className="flex flex-col gap-1">
                    {p.queries.map((q, idx) => {
                      const Icon = LLM_ICON[q.llm];
                      const accent = GEO_LLM_ACCENT[q.llm];
                      return (
                        <li
                          key={`${q.id}-${q.llm}-${idx}`}
                          className="flex items-center gap-2"
                        >
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 rounded bg-surface-container-low px-1.5 py-0.5 text-label-sm",
                              ACCENT_TEXT[accent],
                            )}
                          >
                            <Icon className="h-3 w-3" />
                            {GEO_LLM_LABEL[q.llm]}
                          </span>
                          <button
                            type="button"
                            onClick={() => onSelectQuery?.(q.id)}
                            className="truncate text-left text-label-md text-on-surface hover:text-molten-primary"
                          >
                            {q.query}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
