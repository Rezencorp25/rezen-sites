"use client";

import {
  CheckCircle2,
  ExternalLink,
  HelpCircle,
  Image as ImageIcon,
  Quote,
  Sparkles,
  Star,
  Target,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { AeoKeywordRow } from "@/lib/seo/aeo-types";
import type { AeoDrill, AeoFeatureSuggestion } from "@/lib/seo/aeo-stub";
import { cn } from "@/lib/utils";

const INTENT_LABEL: Record<AeoKeywordRow["intent"], string> = {
  informational: "Informational",
  navigational: "Navigational",
  transactional: "Transactional",
  commercial: "Commercial",
};

const INTENT_TONE: Record<AeoKeywordRow["intent"], string> = {
  informational: "bg-blue-400/15 text-blue-300",
  navigational: "bg-violet-400/15 text-violet-300",
  transactional: "bg-emerald-400/15 text-emerald-300",
  commercial: "bg-amber-400/15 text-amber-300",
};

const EFFORT_TONE: Record<AeoFeatureSuggestion["effort"], string> = {
  low: "bg-emerald-400/15 text-emerald-300",
  medium: "bg-amber-400/15 text-amber-300",
  high: "bg-rose-400/15 text-rose-300",
};

const EFFORT_LABEL: Record<AeoFeatureSuggestion["effort"], string> = {
  low: "low effort",
  medium: "medium effort",
  high: "high effort",
};

type Props = {
  keyword: AeoKeywordRow | null;
  drill: AeoDrill | null;
  open: boolean;
  onClose: () => void;
};

function StatusBadge({
  present,
  owned,
}: {
  present: boolean;
  owned?: boolean;
}) {
  if (!present) {
    return (
      <span className="rounded bg-surface-container-low px-2 py-0.5 text-label-sm text-text-muted">
        non presente
      </span>
    );
  }
  if (owned) {
    return (
      <span className="inline-flex items-center gap-1 rounded bg-emerald-400/15 px-2 py-0.5 text-label-sm font-semibold text-emerald-300">
        <Star className="h-3 w-3" /> owned
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded bg-amber-400/15 px-2 py-0.5 text-label-sm text-amber-300">
      <Target className="h-3 w-3" /> opportunità
    </span>
  );
}

function SuggestionList({ items }: { items: AeoFeatureSuggestion[] }) {
  if (items.length === 0) return null;
  return (
    <ul className="flex flex-col gap-1.5">
      {items.map((s) => (
        <li
          key={s.text}
          className="flex items-start gap-2 rounded bg-surface-container-low/40 px-3 py-2"
        >
          <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
          <div className="flex flex-1 flex-col gap-1">
            <span className="text-body-sm text-on-surface">{s.text}</span>
            <span
              className={cn(
                "w-fit rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                EFFORT_TONE[s.effort],
              )}
            >
              {EFFORT_LABEL[s.effort]}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function SerpFeatureModal({ keyword, drill, open, onClose }: Props) {
  if (!keyword) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="!w-[min(90vw,820px)] !max-w-none max-h-[88vh] overflow-y-auto bg-surface-container-high p-0">
        <DialogHeader className="border-b border-surface-container-low p-6">
          <DialogTitle className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "rounded px-1.5 py-0.5 text-[10px] font-bold uppercase",
                  INTENT_TONE[keyword.intent],
                )}
              >
                {INTENT_LABEL[keyword.intent]}
              </span>
              <h2 className="truncate text-title-lg font-bold text-on-surface">
                {keyword.keyword}
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-label-md text-text-muted">
              <span>
                Volume:{" "}
                <span className="font-mono text-on-surface">
                  {keyword.searchVolume.toLocaleString("it-IT")}
                </span>
                /mese
              </span>
              <span>
                Posizione:{" "}
                <span className="font-mono text-on-surface">
                  {keyword.position === 0 ? "fuori top 100" : `#${keyword.position}`}
                </span>
              </span>
              {keyword.url && (
                <a
                  href={keyword.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="flex items-center gap-1 font-mono text-molten-primary hover:underline"
                >
                  URL ranking
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        {drill && (
          <div className="flex flex-col gap-6 p-6">
            <section>
              <div className="mb-3 flex items-center justify-between gap-2">
                <h3 className="flex items-center gap-2 text-title-sm font-semibold text-on-surface">
                  <Sparkles className="h-4 w-4 text-emerald-400" />
                  AI Overview
                </h3>
                <StatusBadge
                  present={drill.aiOverview.present}
                  owned={drill.aiOverview.owned}
                />
              </div>
              {drill.aiOverview.excerpt && (
                <blockquote className="mb-3 flex items-start gap-2 border-l-2 border-emerald-400/40 bg-surface-container-low/40 p-3 text-body-sm italic text-on-surface">
                  <Quote className="mt-1 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                  <span>{drill.aiOverview.excerpt}</span>
                </blockquote>
              )}
              <SuggestionList items={drill.aiOverview.suggestions} />
              {!drill.aiOverview.present && (
                <p className="text-body-sm text-text-muted">
                  Google non genera AI Overview per questa query — nessuna
                  opportunità AEO sul lato AIO.
                </p>
              )}
            </section>

            <section>
              <div className="mb-3 flex items-center justify-between gap-2">
                <h3 className="flex items-center gap-2 text-title-sm font-semibold text-on-surface">
                  <ImageIcon className="h-4 w-4 text-blue-400" />
                  Featured Snippet
                </h3>
                <StatusBadge
                  present={drill.featuredSnippet.present}
                  owned={drill.featuredSnippet.owned}
                />
              </div>
              {drill.featuredSnippet.htmlPreview && (
                <div className="mb-3 rounded border border-surface-container-low bg-surface-container-low/40 p-3 text-body-sm text-on-surface">
                  <span className="mb-2 block text-[10px] uppercase tracking-wider text-text-muted">
                    Anteprima HTML
                  </span>
                  <div
                    className="prose prose-sm prose-invert max-w-none [&_li]:my-0.5 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-1 [&_strong]:text-molten-primary [&_ul]:list-disc [&_ul]:pl-5"
                    // eslint-disable-next-line react/no-danger
                    dangerouslySetInnerHTML={{ __html: drill.featuredSnippet.htmlPreview }}
                  />
                </div>
              )}
              <SuggestionList items={drill.featuredSnippet.suggestions} />
              {!drill.featuredSnippet.present && (
                <p className="text-body-sm text-text-muted">
                  Google non mostra Featured Snippet per questa query — nessuna
                  opportunità su questo fronte.
                </p>
              )}
            </section>

            <section>
              <div className="mb-3 flex items-center justify-between gap-2">
                <h3 className="flex items-center gap-2 text-title-sm font-semibold text-on-surface">
                  <HelpCircle className="h-4 w-4 text-violet-400" />
                  People Also Ask
                </h3>
                <StatusBadge present={drill.paa.present} />
              </div>
              {drill.paa.questions.length > 0 && (
                <ul className="mb-3 flex flex-col gap-1.5">
                  {drill.paa.questions.map((q) => (
                    <li
                      key={q}
                      className="flex items-start gap-2 rounded bg-surface-container-low/40 px-3 py-2 text-body-sm text-on-surface"
                    >
                      <HelpCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-400" />
                      {q}
                    </li>
                  ))}
                </ul>
              )}
              <SuggestionList items={drill.paa.suggestions} />
              {!drill.paa.present && (
                <p className="text-body-sm text-text-muted">
                  Nessuna PAA per questa query.
                </p>
              )}
            </section>

            <p className="border-t border-surface-container-low pt-4 text-[11px] text-text-muted">
              Excerpt + suggerimenti generati da euristica stub. In produzione
              (S6.3) saranno popolati dal parsing live della SERP DataForSEO +
              suggerimenti generati da Claude Haiku in base al gap content
              rilevato.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
