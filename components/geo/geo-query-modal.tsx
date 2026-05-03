"use client";

import {
  Bot,
  CheckCircle2,
  Compass,
  Frown,
  Gem,
  Lightbulb,
  Meh,
  Smile,
  Sparkles,
  Star,
  TrendingDown,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ALL_LLMS,
  GEO_CATEGORY_LABEL,
  GEO_LLM_ACCENT,
  GEO_LLM_LABEL,
  type GeoLlmId,
  type GeoQuery,
} from "@/lib/seo/geo-types";
import type {
  GeoDrill,
  GeoLlmAnswer,
  GeoSuggestion,
} from "@/lib/seo/geo-stub";
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

const ACCENT_BG: Record<"emerald" | "violet" | "blue" | "amber", string> = {
  emerald: "bg-emerald-400/10 border-emerald-400/30",
  violet: "bg-violet-400/10 border-violet-400/30",
  blue: "bg-blue-400/10 border-blue-400/30",
  amber: "bg-amber-400/10 border-amber-400/30",
};

const EFFORT_TONE: Record<GeoSuggestion["effort"], string> = {
  low: "bg-emerald-400/15 text-emerald-300",
  medium: "bg-amber-400/15 text-amber-300",
  high: "bg-rose-400/15 text-rose-300",
};

const EFFORT_LABEL: Record<GeoSuggestion["effort"], string> = {
  low: "low effort",
  medium: "medium effort",
  high: "high effort",
};

const SENTIMENT_ICON = {
  positive: Smile,
  neutral: Meh,
  negative: Frown,
};

const SENTIMENT_TONE: Record<"positive" | "neutral" | "negative", string> = {
  positive: "text-emerald-400",
  neutral: "text-text-muted",
  negative: "text-rose-400",
};

function MentionBadge({ a }: { a: GeoLlmAnswer }) {
  if (!a.mentioned) {
    return (
      <span className="inline-flex items-center gap-1 rounded bg-rose-400/10 px-2 py-0.5 text-label-sm text-rose-300">
        non citato
      </span>
    );
  }
  const SentimentI = a.sentiment ? SENTIMENT_ICON[a.sentiment] : Meh;
  return (
    <div className="flex items-center gap-2">
      <span className="inline-flex items-center gap-1 rounded bg-emerald-400/15 px-2 py-0.5 text-label-sm font-semibold text-emerald-300">
        <Star className="h-3 w-3" /> rank #{a.rank ?? "?"}
      </span>
      {a.sentiment && (
        <span
          className={cn(
            "inline-flex items-center gap-1 text-label-sm",
            SENTIMENT_TONE[a.sentiment],
          )}
          title={`Sentiment: ${a.sentiment}`}
        >
          <SentimentI className="h-3.5 w-3.5" />
          {a.sentiment}
        </span>
      )}
    </div>
  );
}

function LlmAnswerSection({ a }: { a: GeoLlmAnswer }) {
  const Icon = LLM_ICON[a.llm];
  const accent = GEO_LLM_ACCENT[a.llm];
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-lg border p-4",
        ACCENT_BG[accent],
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <h4 className="flex items-center gap-2 text-title-sm font-semibold text-on-surface">
          <Icon className={cn("h-4 w-4", ACCENT_TEXT[accent])} />
          {GEO_LLM_LABEL[a.llm]}
        </h4>
        <MentionBadge a={a} />
      </div>
      <p className="rounded bg-surface-container-low/40 p-3 text-body-sm leading-relaxed text-on-surface">
        {a.answerText}
      </p>
      <div className="flex flex-col gap-1">
        <span className="text-[10px] uppercase tracking-wider text-text-muted">
          Citazioni ({a.citations.length})
        </span>
        <ol className="flex flex-wrap gap-1.5">
          {a.citations.map((c, i) => (
            <li
              key={`${a.llm}-${c.domain}-${i}`}
              className={cn(
                "inline-flex items-center gap-1 rounded px-2 py-0.5 font-mono text-label-sm",
                c.isOwner
                  ? "bg-emerald-400/20 font-semibold text-emerald-300"
                  : "bg-surface-container-low text-text-muted",
              )}
            >
              <span className="text-[10px] text-text-muted">#{i + 1}</span>
              {c.domain}
              {c.isOwner && <Star className="h-2.5 w-2.5" />}
            </li>
          ))}
          {a.citations.length === 0 && (
            <li className="text-label-sm text-text-muted">
              nessuna citazione restituita
            </li>
          )}
        </ol>
      </div>
    </div>
  );
}

type Props = {
  query: GeoQuery | null;
  drill: GeoDrill | null;
  open: boolean;
  onClose: () => void;
};

export function GeoQueryModal({ query, drill, open, onClose }: Props) {
  if (!query) return null;

  const mentionedCount =
    drill?.answers.filter((a) => a.mentioned).length ?? 0;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="!w-[min(94vw,960px)] !max-w-none max-h-[88vh] overflow-y-auto bg-surface-container-high p-0">
        <DialogHeader className="border-b border-surface-container-low p-6">
          <DialogTitle className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded bg-molten-primary/15 px-1.5 py-0.5 text-[10px] font-bold uppercase text-molten-primary">
                {GEO_CATEGORY_LABEL[query.category]}
              </span>
              <h2 className="text-title-lg font-bold text-on-surface">
                {query.query}
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-label-md text-text-muted">
              <span>
                Volume:{" "}
                <span className="font-mono text-on-surface">
                  {query.searchVolume.toLocaleString("it-IT")}
                </span>
                /mese
              </span>
              <span>
                Mention cross-LLM:{" "}
                <span className="font-mono text-on-surface">
                  {mentionedCount}/{ALL_LLMS.length}
                </span>
              </span>
            </div>
          </DialogTitle>
        </DialogHeader>

        {drill && (
          <div className="flex flex-col gap-6 p-6">
            <section>
              <h3 className="mb-3 flex items-center gap-2 text-title-md font-semibold text-on-surface">
                Risposte LLM
                <span className="text-label-sm font-normal text-text-muted">
                  (citazioni in ordine restituito dal motore)
                </span>
              </h3>
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                {drill.answers.map((a) => (
                  <LlmAnswerSection key={a.llm} a={a} />
                ))}
              </div>
            </section>

            {drill.gaps.length > 0 && (
              <section>
                <h3 className="mb-3 flex items-center gap-2 text-title-md font-semibold text-on-surface">
                  <TrendingDown className="h-4 w-4 text-rose-400" />
                  Gap Analysis
                  <span className="text-label-sm font-normal text-text-muted">
                    (chi vince dove tu non sei citato)
                  </span>
                </h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {drill.gaps.map((g) => (
                    <div
                      key={g.llm}
                      className="rounded-lg border border-rose-400/20 bg-rose-400/5 p-4"
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <span
                          className={cn(
                            "flex items-center gap-1.5 text-label-md font-semibold",
                            ACCENT_TEXT[GEO_LLM_ACCENT[g.llm]],
                          )}
                        >
                          {GEO_LLM_LABEL[g.llm]}
                        </span>
                        <span className="text-label-sm text-rose-300">
                          assente
                        </span>
                      </div>
                      {g.topCompetitors.length === 0 ? (
                        <p className="text-label-sm text-text-muted">
                          Nessun competitor citato — opportunità di first-mover.
                        </p>
                      ) : (
                        <ol className="flex flex-col gap-1.5">
                          {g.topCompetitors.map((c) => (
                            <li
                              key={`${g.llm}-${c.domain}`}
                              className="flex items-center justify-between rounded bg-surface-container-low/40 px-2.5 py-1.5"
                            >
                              <span className="flex items-center gap-2 truncate font-mono text-label-md text-on-surface">
                                <span className="text-text-muted">
                                  #{c.rank}
                                </span>
                                {c.domain}
                              </span>
                            </li>
                          ))}
                        </ol>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section>
              <h3 className="mb-3 flex items-center gap-2 text-title-md font-semibold text-on-surface">
                <Lightbulb className="h-4 w-4 text-amber-400" />
                Suggerimenti azione
                <span className="text-label-sm font-normal text-text-muted">
                  (selezionati in base al pattern di mention osservato)
                </span>
              </h3>
              <ul className="flex flex-col gap-1.5">
                {drill.suggestions.map((s) => (
                  <li
                    key={s.text}
                    className="flex items-start gap-2 rounded bg-surface-container-low/40 px-3 py-2"
                  >
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                    <div className="flex flex-1 flex-col gap-1">
                      <span className="text-body-sm text-on-surface">
                        {s.text}
                      </span>
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
            </section>

            <p className="border-t border-surface-container-low pt-4 text-[11px] text-text-muted">
              Risposte LLM + sentiment + suggerimenti generati da euristica stub.
              In produzione (S6b.3) saranno popolati dal parsing live della
              DataForSEO LLM Mentions API + suggerimenti generati da Claude
              Haiku in base al gap content rilevato.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
