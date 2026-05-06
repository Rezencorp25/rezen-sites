"use client";

import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  ExternalLink,
  FileSearch,
  Info,
  Map,
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShieldOff,
  XCircle,
} from "lucide-react";
import {
  type AiSearchHealth,
  type AiSearchHealthBand,
  type BotResult,
  type BotStatus,
  BOT_OWNER_LABEL,
  aiSearchHealthBand,
} from "@/lib/seo/ai-search-health-types";
import { groupBotsByOwner } from "@/lib/seo/ai-search-health-stub";
import { cn } from "@/lib/utils";

const BAND_TONE: Record<AiSearchHealthBand, string> = {
  excellent: "text-emerald-400",
  good: "text-blue-400",
  poor: "text-amber-400",
  critical: "text-rose-400",
};

const BAND_RING: Record<AiSearchHealthBand, string> = {
  excellent: "stroke-emerald-400",
  good: "stroke-blue-400",
  poor: "stroke-amber-400",
  critical: "stroke-rose-400",
};

const BAND_LABEL: Record<AiSearchHealthBand, string> = {
  excellent: "Excellent",
  good: "Good",
  poor: "Poor",
  critical: "Critical",
};

const STATUS_TONE: Record<BotStatus, string> = {
  allowed: "bg-emerald-400/15 text-emerald-300 border-emerald-400/30",
  partial: "bg-amber-400/15 text-amber-300 border-amber-400/30",
  blocked: "bg-rose-400/15 text-rose-300 border-rose-400/30",
  unknown: "bg-surface-container-low text-text-muted border-surface-container-low",
};

const STATUS_ICON: Record<BotStatus, typeof Bot> = {
  allowed: ShieldCheck,
  partial: Shield,
  blocked: ShieldOff,
  unknown: ShieldAlert,
};

const STATUS_LABEL: Record<BotStatus, string> = {
  allowed: "Allowed",
  partial: "Partial",
  blocked: "Blocked",
  unknown: "Unknown",
};

function ScoreRing({ score }: { score: number }) {
  const band = aiSearchHealthBand(score);
  const px = 128;
  const radius = 48;
  const stroke = 8;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(0, Math.min(100, score));
  const dashOffset = circumference - (circumference * progress) / 100;
  const center = px / 2;

  return (
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
          className={cn("transition-all duration-500", BAND_RING[band])}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
        <span className={cn("text-display-md font-bold", BAND_TONE[band])}>
          {score}
        </span>
        <span className="mt-1 text-[10px] uppercase tracking-widest text-text-muted">
          / 100
        </span>
      </div>
    </div>
  );
}

function BotRow({ b }: { b: BotResult }) {
  const Icon = STATUS_ICON[b.status];
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 rounded-md border px-3 py-2",
        STATUS_TONE[b.status],
      )}
      title={
        b.blockedPaths.length > 0
          ? `Blocked on: ${b.blockedPaths.join(", ")}`
          : undefined
      }
    >
      <div className="flex min-w-0 items-center gap-2">
        <Icon className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate font-mono text-label-md">{b.bot}</span>
      </div>
      <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider">
        {STATUS_LABEL[b.status]}
      </span>
    </div>
  );
}

function WarningRow({ w }: { w: AiSearchHealth["warnings"][number] }) {
  const Icon =
    w.severity === "critical"
      ? XCircle
      : w.severity === "warning"
        ? AlertTriangle
        : Info;
  const tone =
    w.severity === "critical"
      ? "text-rose-400"
      : w.severity === "warning"
        ? "text-amber-400"
        : "text-blue-400";
  return (
    <li className="flex items-start gap-2 rounded bg-surface-container-low/40 px-3 py-2">
      <Icon className={cn("mt-0.5 h-3.5 w-3.5 shrink-0", tone)} />
      <span className="text-body-sm text-on-surface">{w.message}</span>
    </li>
  );
}

type Props = {
  health: AiSearchHealth;
  domain: string;
};

export function AiSearchHealthSection({ health, domain }: Props) {
  const band = aiSearchHealthBand(health.score);
  const grouped = groupBotsByOwner(health.bots);
  const allowedCount = health.bots.filter((b) => b.status === "allowed").length;
  const blockedCount = health.bots.filter((b) => b.status === "blocked").length;

  return (
    <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div className="rounded-xl bg-surface-container-high p-5">
        <div className="mb-3 flex items-center gap-2">
          <FileSearch className="h-4 w-4 text-molten-primary" />
          <h2 className="text-title-sm font-semibold text-on-surface">
            AI Search Health
          </h2>
          <span
            className="text-text-muted"
            title="Score 0-100 di leggibilità del sito da parte dei bot LLM. Combina robots.txt, meta tags, sitemap, llms.txt."
          >
            <Info className="h-3 w-3" />
          </span>
        </div>
        <div className="flex items-center gap-4">
          <ScoreRing score={health.score} />
          <div className="flex flex-col gap-1">
            <span
              className={cn(
                "w-fit rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                BAND_TONE[band],
                "bg-surface-container-low",
              )}
            >
              {BAND_LABEL[band]}
            </span>
            <span className="text-label-sm text-text-muted">
              <span className="font-mono font-semibold text-emerald-400">
                {allowedCount}
              </span>
              /{health.bots.length} bot allowed
            </span>
            {blockedCount > 0 && (
              <span className="text-label-sm text-text-muted">
                <span className="font-mono font-semibold text-rose-400">
                  {blockedCount}
                </span>{" "}
                bot bloccati
              </span>
            )}
            <a
              href={`https://${domain}/robots.txt`}
              target="_blank"
              rel="noreferrer noopener"
              className="mt-1 flex items-center gap-1 text-label-sm text-molten-primary hover:underline"
            >
              robots.txt
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-xl bg-surface-container-high p-5 lg:col-span-2">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-title-sm font-semibold text-on-surface">
            <Bot className="h-4 w-4 text-molten-primary" />
            Bot LLM tester
            <span className="text-label-sm font-normal text-text-muted">
              (11 bot delle 6 famiglie principali)
            </span>
          </h3>
          <div className="flex items-center gap-3 text-label-sm text-text-muted">
            <SignalChip
              label="sitemap"
              ok={health.sitemapFound && (health.sitemapUrlCount ?? 0) > 0}
              info={
                health.sitemapFound
                  ? `${health.sitemapUrlCount ?? 0} URL`
                  : "non trovato"
              }
              icon={Map}
            />
            <SignalChip
              label="llms.txt"
              ok={health.llmsTxtFound}
              info={health.llmsTxtFound ? "presente" : "assente"}
              icon={FileSearch}
            />
            <SignalChip
              label="noai meta"
              ok={health.pagesWithNoaiMeta === 0}
              info={`${health.pagesWithNoaiMeta}/${health.pagesScanned} pagine`}
              icon={ShieldAlert}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {grouped.map((g) => (
            <div key={g.owner} className="flex flex-col gap-1.5">
              <span className="text-[10px] uppercase tracking-wider text-text-muted">
                {BOT_OWNER_LABEL[g.owner] ?? g.owner}
              </span>
              <div className="flex flex-col gap-1">
                {g.bots.map((b) => (
                  <BotRow key={b.bot} b={b} />
                ))}
              </div>
            </div>
          ))}
        </div>

        {health.warnings.length > 0 && (
          <div className="flex flex-col gap-1.5 border-t border-surface-container-low pt-3">
            <h4 className="flex items-center gap-2 text-label-md font-semibold text-on-surface">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
              Warnings ({health.warnings.length})
            </h4>
            <ul className="flex flex-col gap-1">
              {health.warnings.map((w, i) => (
                <WarningRow key={`${w.severity}-${i}`} w={w} />
              ))}
            </ul>
          </div>
        )}

        {health.warnings.length === 0 && (
          <div className="flex items-center gap-2 rounded bg-emerald-400/10 px-3 py-2 text-body-sm text-emerald-300">
            <CheckCircle2 className="h-4 w-4" />
            Nessun warning. Sito perfettamente leggibile dai bot LLM.
          </div>
        )}
      </div>
    </section>
  );
}

function SignalChip({
  label,
  ok,
  info,
  icon: Icon,
}: {
  label: string;
  ok: boolean;
  info: string;
  icon: typeof Bot;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px]",
        ok
          ? "bg-emerald-400/10 text-emerald-300"
          : "bg-rose-400/10 text-rose-300",
      )}
      title={info}
    >
      <Icon className="h-3 w-3" />
      <span className="font-semibold uppercase tracking-wider">{label}</span>
      <span className="opacity-70">· {info}</span>
    </span>
  );
}