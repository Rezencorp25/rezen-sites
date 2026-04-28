"use client";

import { useMemo } from "react";
import { Users } from "lucide-react";

/**
 * Mock cohort retention chart. Builds a 6×6 cohort grid (acquisition week
 * vs week-N retention %) deterministically from projectId.
 */
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

export function CohortTable({ projectId }: { projectId: string }) {
  const cohorts = useMemo(() => {
    const rnd = seeded(projectId.length * 47);
    const weeks = 6;
    const out: { label: string; size: number; retention: number[] }[] = [];
    for (let i = 0; i < weeks; i++) {
      const size = Math.round(80 + rnd() * 220);
      const retention: number[] = [];
      let r = 100;
      for (let j = 0; j < weeks - i; j++) {
        retention.push(Math.round(r));
        r = r * (0.55 + rnd() * 0.25);
      }
      out.push({
        label: `W-${weeks - i}`,
        size,
        retention,
      });
    }
    return out;
  }, [projectId]);

  function colorFor(pct: number): { bg: string; fg: string } {
    if (pct >= 60) return { bg: "rgba(94,194,127,0.45)", fg: "#0f1113" };
    if (pct >= 40) return { bg: "rgba(94,194,127,0.28)", fg: "#5ec27f" };
    if (pct >= 20) return { bg: "rgba(230,179,64,0.25)", fg: "#e6b340" };
    return { bg: "rgba(230,107,107,0.18)", fg: "#e66b6b" };
  }

  return (
    <section className="rounded-xl bg-surface-container-high p-6">
      <div className="mb-3 flex items-center gap-2.5">
        <Users className="h-4 w-4 text-molten-primary" />
        <h2 className="text-title-md font-semibold text-on-surface">
          Cohort retention (utenti)
        </h2>
      </div>
      <p className="mb-4 text-body-sm text-text-muted">
        % di utenti che tornano dopo N settimane dall&apos;acquisizione. Verde =
        engagement forte, rosso = churn.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-label-md">
          <thead>
            <tr className="text-text-muted">
              <th className="text-left font-medium">Coorte</th>
              <th className="text-right font-medium">Size</th>
              {Array.from({ length: 6 }).map((_, i) => (
                <th key={i} className="text-right font-medium">
                  W{i}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cohorts.map((c) => (
              <tr key={c.label} className="border-t border-outline/10">
                <td className="py-1.5 font-mono text-secondary-text">
                  {c.label}
                </td>
                <td className="py-1.5 text-right font-mono text-on-surface tabular-nums">
                  {c.size}
                </td>
                {c.retention.map((pct, i) => {
                  const { bg, fg } = colorFor(pct);
                  return (
                    <td key={i} className="py-1 pl-1">
                      <span
                        className="inline-block w-full rounded px-2 py-1 text-right font-mono tabular-nums"
                        style={{ background: bg, color: fg }}
                      >
                        {pct}%
                      </span>
                    </td>
                  );
                })}
                {Array.from({ length: 6 - c.retention.length }).map((_, i) => (
                  <td key={`empty-${i}`} className="py-1 pl-1" />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
