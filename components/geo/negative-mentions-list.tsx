"use client";

import { AlertTriangle, Bot, ChevronRight, Compass, Gem, Sparkles } from "lucide-react";
import {
  GEO_LLM_ACCENT,
  GEO_LLM_LABEL,
  type GeoLlmId,
} from "@/lib/seo/geo-types";
import type { NegativeContextEntry } from "@/lib/ai/sentiment-types";
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
  entries: NegativeContextEntry[];
  /** Click su entry → riapre il drill della query corrispondente. */
  onSelect?: (queryId: string) => void;
};

export function NegativeMentionsList({ entries, onSelect }: Props) {
  if (entries.length === 0) {
    return (
      <div className="rounded-xl bg-surface-container-high p-5">
        <h2 className="mb-2 flex items-center gap-2 text-title-md font-semibold text-on-surface">
          <AlertTriangle className="h-4 w-4 text-emerald-400" />
          Mention negative
          <span className="text-label-sm font-normal text-text-muted">
            (nessuna)
          </span>
        </h2>
        <p className="text-body-sm text-text-muted">
          Nessuna mention negativa rilevata in questo snapshot. Il brand è
          percepito in modo neutrale o positivo dai 4 LLM monitorati.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-surface-container-high p-5">
      <h2 className="mb-1 flex items-center gap-2 text-title-md font-semibold text-on-surface">
        <AlertTriangle className="h-4 w-4 text-rose-400" />
        Mention negative
        <span className="text-label-sm font-normal text-text-muted">
          (top {entries.length} per impatto, click per drill)
        </span>
      </h2>
      <p className="mb-4 text-label-sm text-text-muted">
        Reputation action: queste mention richiedono content correttivo o PR di
        risposta. Score più basso = impatto reputazionale più alto.
      </p>
      <ul className="flex flex-col gap-2">
        {entries.map((e) => {
          const Icon = LLM_ICON[e.llm];
          const accent = GEO_LLM_ACCENT[e.llm];
          return (
            <li key={`${e.queryId}-${e.llm}`}>
              <button
                type="button"
                onClick={onSelect ? () => onSelect(e.queryId) : undefined}
                className={cn(
                  "flex w-full flex-col gap-2 rounded-lg border border-rose-400/20 bg-rose-400/5 p-3 text-left transition-colors",
                  onSelect && "hover:border-rose-400/40 hover:bg-rose-400/10",
                )}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="flex items-center gap-2">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded bg-surface-container-low px-1.5 py-0.5 text-label-sm",
                        ACCENT_TEXT[accent],
                      )}
                    >
                      <Icon className="h-3 w-3" />
                      {GEO_LLM_LABEL[e.llm]}
                    </span>
                    <span className="truncate text-label-md text-on-surface">
                      {e.queryText}
                    </span>
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="rounded bg-rose-400/20 px-1.5 py-0.5 font-mono text-label-sm font-semibold text-rose-300">
                      {e.score}
                    </span>
                    {onSelect && (
                      <ChevronRight className="h-3.5 w-3.5 text-text-muted" />
                    )}
                  </span>
                </div>
                <p className="text-body-sm italic text-on-surface">
                  &ldquo;{e.context}&rdquo;
                </p>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
