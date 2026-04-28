"use client";

import { useMemo } from "react";
import { Activity, GitCompare } from "lucide-react";

/**
 * Mock form heatmap + A/B variant comparison.
 *
 * Real implementation at go-live integrates Microsoft Clarity / Hotjar
 * for true field-level interaction tracking.
 */

const FIELDS = [
  { name: "Nome", interaction: 92, abandon: 8 },
  { name: "Email", interaction: 88, abandon: 12 },
  { name: "Telefono", interaction: 64, abandon: 38 },
  { name: "Azienda", interaction: 71, abandon: 22 },
  { name: "Messaggio", interaction: 81, abandon: 18 },
];

export function FormHeatmap({ projectId }: { projectId: string }) {
  // Deterministic per-project shuffle of field perf
  const fields = useMemo(() => {
    const seed = projectId.length;
    return FIELDS.map((f, i) => ({
      ...f,
      interaction: Math.max(40, f.interaction - ((seed + i * 7) % 12)),
      abandon: Math.min(60, f.abandon + ((seed + i * 11) % 12)),
    }));
  }, [projectId]);

  return (
    <section className="rounded-xl bg-surface-container-high p-6">
      <div className="mb-3 flex items-center gap-2.5">
        <Activity className="h-4 w-4 text-molten-primary" />
        <h2 className="text-title-md font-semibold text-on-surface">
          Form heatmap (Microsoft Clarity-style)
        </h2>
      </div>
      <p className="mb-4 text-body-sm text-text-muted">
        % utenti che interagiscono con ogni campo + drop-off rate. Identifica
        i campi che frenano la conversione.
      </p>
      <div className="space-y-2">
        {fields.map((f) => (
          <div
            key={f.name}
            className="grid grid-cols-[120px_1fr_50px] items-center gap-3"
          >
            <span className="text-body-sm font-semibold text-on-surface">
              {f.name}
            </span>
            <div className="flex h-6 overflow-hidden rounded-full bg-surface-container-lowest">
              <div
                className="flex h-full items-center justify-end px-2 text-label-sm font-bold"
                style={{
                  width: `${f.interaction}%`,
                  background:
                    "linear-gradient(90deg, rgba(94,194,127,0.18), rgba(94,194,127,0.5))",
                  color: "#5ec27f",
                }}
              >
                {f.interaction}%
              </div>
              <div
                className="flex h-full items-center justify-end px-2 text-label-sm font-bold"
                style={{
                  width: `${f.abandon}%`,
                  background: "rgba(230,107,107,0.25)",
                  color: "#e66b6b",
                }}
              >
                {f.abandon}%
              </div>
            </div>
            <span
              className="text-right font-mono text-label-md tabular-nums"
              style={{
                color: f.abandon > 30 ? "#e66b6b" : f.abandon > 20 ? "#e6b340" : "#5ec27f",
              }}
            >
              {f.abandon > 30 ? "🔴" : f.abandon > 20 ? "🟡" : "🟢"}
            </span>
          </div>
        ))}
      </div>
      <p className="mt-3 text-label-sm text-text-muted">
        Verde = interaction · Rosso = drop-off. Field con drop &gt; 30% sono
        candidati per rimozione o riformulazione.
      </p>
    </section>
  );
}

export function FormAbTest({ projectId }: { projectId: string }) {
  // Deterministic mock A/B variants
  const seed = projectId.length;
  const variants = [
    {
      label: "A · Form lungo (8 campi)",
      submissions: 38 + (seed % 12),
      conversionRate: 4.2,
      avgTimeS: 92,
      isWinner: false,
    },
    {
      label: "B · Form corto (4 campi)",
      submissions: 67 + (seed % 18),
      conversionRate: 7.4,
      avgTimeS: 41,
      isWinner: true,
    },
  ];

  return (
    <section className="rounded-xl bg-surface-container-high p-6">
      <div className="mb-3 flex items-center gap-2.5">
        <GitCompare className="h-4 w-4 text-molten-primary" />
        <h2 className="text-title-md font-semibold text-on-surface">
          Form A/B testing
        </h2>
        <span className="ml-auto rounded bg-info-container px-2 py-0.5 text-label-sm text-info">
          7 giorni · 50/50 split
        </span>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {variants.map((v) => (
          <div
            key={v.label}
            className={`rounded-lg border p-4 ${
              v.isWinner
                ? "border-success/40 bg-success-container/30"
                : "border-outline/20 bg-surface-container-low"
            }`}
          >
            <div className="mb-2 flex items-center justify-between">
              <p className="text-body-md font-semibold text-on-surface">
                {v.label}
              </p>
              {v.isWinner && (
                <span className="rounded-full bg-success-container px-2 py-0.5 text-label-sm font-bold text-success">
                  🏆 Winner
                </span>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <p className="text-label-sm uppercase text-text-muted">
                  Submissions
                </p>
                <p className="font-mono text-headline-sm font-bold text-on-surface tabular-nums">
                  {v.submissions}
                </p>
              </div>
              <div>
                <p className="text-label-sm uppercase text-text-muted">
                  Conv. rate
                </p>
                <p
                  className="font-mono text-headline-sm font-bold tabular-nums"
                  style={{
                    color: v.isWinner ? "#5ec27f" : "#b3b5b9",
                  }}
                >
                  {v.conversionRate.toFixed(1)}%
                </p>
              </div>
              <div>
                <p className="text-label-sm uppercase text-text-muted">
                  Avg time
                </p>
                <p className="font-mono text-headline-sm font-bold text-on-surface tabular-nums">
                  {v.avgTimeS}s
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
