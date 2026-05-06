"use client";

import {
  ArrowDownRight,
  ArrowUpRight,
  Frown,
  Heart,
  Meh,
  Smile,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";
import type {
  SentimentAttribute,
  SentimentDistribution,
  SentimentSnapshot,
} from "@/lib/ai/sentiment-types";
import { cn } from "@/lib/utils";

type Tone = "good" | "neutral" | "warn" | "poor";

function scoreTone(score: number): Tone {
  if (score >= 30) return "good";
  if (score >= 0) return "neutral";
  if (score >= -30) return "warn";
  return "poor";
}

const TONE_TEXT: Record<Tone, string> = {
  good: "text-emerald-400",
  neutral: "text-blue-400",
  warn: "text-amber-400",
  poor: "text-rose-400",
};

const TONE_RING: Record<Tone, string> = {
  good: "stroke-emerald-400",
  neutral: "stroke-blue-400",
  warn: "stroke-amber-400",
  poor: "stroke-rose-400",
};

function ScoreRing({
  score,
  prevScore,
}: {
  score: number;
  prevScore: number | null;
}) {
  const tone = scoreTone(score);
  const px = 128;
  const radius = 48;
  const stroke = 8;
  const circumference = 2 * Math.PI * radius;
  // Score range -100/+100 → progress 0-100% (50% al neutro 0)
  const progress = Math.max(0, Math.min(100, (score + 100) / 2));
  const dashOffset = circumference - (circumference * progress) / 100;
  const center = px / 2;
  const delta = prevScore !== null ? score - prevScore : null;

  return (
    <div className="flex items-center gap-4">
      <div
        className="relative flex shrink-0 items-center justify-center"
        style={{ width: px, height: px }}
      >
        <svg className="-rotate-90" viewBox={`0 0 ${px} ${px}`} width={px} height={px}>
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            strokeWidth={stroke}
            className="stroke-surface-container-low"
          />
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            className={cn("transition-all duration-500", TONE_RING[tone])}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
          <span className={cn("text-display-md font-bold", TONE_TEXT[tone])}>
            {score > 0 ? "+" : ""}
            {score}
          </span>
          <span className="mt-1 text-[10px] uppercase tracking-widest text-text-muted">
            -100 / +100
          </span>
        </div>
      </div>
      <div className="flex flex-col gap-1">
        {delta !== null && delta !== 0 ? (
          <span
            className={cn(
              "flex items-center gap-0.5 text-label-md font-semibold",
              delta > 0 ? "text-emerald-400" : "text-rose-400",
            )}
          >
            {delta > 0 ? (
              <ArrowUpRight className="h-3.5 w-3.5" />
            ) : (
              <ArrowDownRight className="h-3.5 w-3.5" />
            )}
            {delta > 0 ? "+" : ""}
            {delta} vs precedente
          </span>
        ) : (
          <span className="text-label-md text-text-muted">stabile</span>
        )}
        <p className="max-w-[12rem] text-label-sm text-text-muted">
          aggregato cross-LLM e cross-query del sentiment delle mention del cliente
        </p>
      </div>
    </div>
  );
}

function DistributionBar({ d }: { d: SentimentDistribution }) {
  if (d.total === 0) {
    return (
      <p className="text-label-sm text-text-muted">
        Nessuna mention con sentiment classificato.
      </p>
    );
  }
  const posPct = (d.positive / d.total) * 100;
  const neuPct = (d.neutral / d.total) * 100;
  const negPct = (d.negative / d.total) * 100;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-surface-container-low">
        <div
          className="h-full bg-emerald-400 transition-all duration-500"
          style={{ width: `${posPct}%` }}
          title={`Positive: ${d.positive}/${d.total}`}
        />
        <div
          className="h-full bg-blue-400/60 transition-all duration-500"
          style={{ width: `${neuPct}%` }}
          title={`Neutral: ${d.neutral}/${d.total}`}
        />
        <div
          className="h-full bg-rose-400 transition-all duration-500"
          style={{ width: `${negPct}%` }}
          title={`Negative: ${d.negative}/${d.total}`}
        />
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-label-sm">
        <span className="flex items-center gap-1.5 text-emerald-400">
          <Smile className="h-3.5 w-3.5" />
          <span className="font-mono font-semibold">{d.positive}</span>
          <span className="text-text-muted">positive ({posPct.toFixed(0)}%)</span>
        </span>
        <span className="flex items-center gap-1.5 text-blue-400">
          <Meh className="h-3.5 w-3.5" />
          <span className="font-mono font-semibold">{d.neutral}</span>
          <span className="text-text-muted">neutral ({neuPct.toFixed(0)}%)</span>
        </span>
        <span className="flex items-center gap-1.5 text-rose-400">
          <Frown className="h-3.5 w-3.5" />
          <span className="font-mono font-semibold">{d.negative}</span>
          <span className="text-text-muted">negative ({negPct.toFixed(0)}%)</span>
        </span>
      </div>
    </div>
  );
}

function AttributePill({ a }: { a: SentimentAttribute }) {
  const Icon = a.polarity === "positive" ? ThumbsUp : ThumbsDown;
  const tone =
    a.polarity === "positive"
      ? "bg-emerald-400/10 text-emerald-300 border-emerald-400/20"
      : "bg-rose-400/10 text-rose-300 border-rose-400/20";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-label-sm",
        tone,
      )}
    >
      <Icon className="h-3 w-3" />
      {a.label}
      <span className="font-mono text-[10px] opacity-70">×{a.count}</span>
    </span>
  );
}

type Props = {
  sentiment: SentimentSnapshot;
};

export function SentimentSection({ sentiment }: Props) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div className="rounded-xl bg-surface-container-high p-5">
        <div className="mb-3 flex items-center gap-2">
          <Heart className="h-4 w-4 text-rose-400" />
          <h2 className="text-title-sm font-semibold text-on-surface">
            AI Brand Sentiment
          </h2>
          <span
            className="text-text-muted"
            title="Aggregato cross-LLM. Score = (positive - negative) / total × 100"
          >
            <Sparkles className="h-3 w-3" />
          </span>
        </div>
        <ScoreRing
          score={sentiment.score}
          prevScore={sentiment.prevScore}
        />
      </div>

      <div className="flex flex-col gap-3 rounded-xl bg-surface-container-high p-5 lg:col-span-2">
        <h3 className="flex items-center gap-2 text-title-sm font-semibold text-on-surface">
          Distribuzione mention
          <span className="text-label-sm font-normal text-text-muted">
            ({sentiment.distribution.total} mention totali)
          </span>
        </h3>
        <DistributionBar d={sentiment.distribution} />

        <h3 className="mt-2 text-title-sm font-semibold text-on-surface">
          Top attributi rilevati
        </h3>
        {sentiment.attributes.length === 0 ? (
          <p className="text-label-sm text-text-muted">
            Nessun attributo rilevato in questo snapshot.
          </p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {sentiment.attributes.map((a) => (
              <AttributePill key={a.label} a={a} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
