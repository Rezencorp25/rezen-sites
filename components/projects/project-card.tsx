"use client";

import Link from "next/link";
import { fmtDateShort } from "@/lib/utils/format-date";
import { ArrowUpRight } from "lucide-react";
import { PageStatusPill } from "@/components/luminous/status-pill";
import { gradientFor, initialsFor } from "@/lib/utils/hash-gradient";
import type { Project } from "@/types";

export function ProjectCard({ project }: { project: Project }) {
  const grad = gradientFor(project.id);
  const initials = initialsFor(project.name);

  // Deterministic mini sparkline derived from project id + kpi
  const sparkPoints = useSpark(project.id, project.kpis.organicTraffic30d);

  return (
    <Link
      href={`/projects/${project.id}/dashboard`}
      className="group lift relative flex flex-col overflow-hidden rounded-2xl bg-surface-container-low ring-1 ring-outline/40"
    >
      {/* Cover */}
      <div
        className="relative h-32 overflow-hidden"
        style={{ background: grad.css }}
      >
        {/* Decorative orbs */}
        <div
          className="absolute -right-10 -top-10 h-40 w-40 rounded-full opacity-60 blur-2xl"
          style={{ background: grad.from }}
        />
        <div
          className="absolute -bottom-8 -left-6 h-28 w-28 rounded-full opacity-40 blur-2xl"
          style={{ background: grad.to }}
        />
        <div className="relative flex h-full items-start justify-between p-4">
          <PageStatusPill status={project.status} />
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-black/30 text-on-surface opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
            <ArrowUpRight className="h-3.5 w-3.5" />
          </span>
        </div>
        {/* Initials badge, bottom-left */}
        <div
          className="absolute bottom-3 left-4 flex h-11 w-11 items-center justify-center rounded-xl bg-black/45 backdrop-blur-md ring-1 ring-white/10"
        >
          <span className="text-body-md font-bold tracking-wide text-on-surface">
            {initials}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="flex flex-col gap-0.5">
          <h3 className="truncate text-title-lg font-semibold text-on-surface">
            {project.name}
          </h3>
          <p className="truncate font-mono text-label-md text-text-muted">
            {project.domain}
          </p>
        </div>

        {/* KPI row + sparkline */}
        <div className="grid grid-cols-[1fr_1fr_70px] items-end gap-3">
          <Kpi label="Pageviews" value={project.kpis.organicTraffic30d.toLocaleString("it-IT")} />
          <Kpi label="SEO" value={String(project.kpis.seoScore)} accent={seoTone(project.kpis.seoScore)} />
          <Sparkline points={sparkPoints} />
        </div>

        <div className="flex items-center justify-between border-t border-outline/30 pt-3 text-label-sm text-text-muted">
          <span>
            {project.kpis.pagesPublished} pagine
          </span>
          <span suppressHydrationWarning>{fmtDateShort(project.updatedAt)}</span>
        </div>
      </div>
    </Link>
  );
}

function Kpi({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "success" | "warning" | "error";
}) {
  const color = accent === "success"
    ? "text-success"
    : accent === "warning"
    ? "text-warning"
    : accent === "error"
    ? "text-error"
    : "text-on-surface";
  return (
    <div className="flex flex-col">
      <span className="text-label-sm uppercase tracking-widest text-text-muted">
        {label}
      </span>
      <span className={`text-headline-sm font-bold tabular-nums ${color}`}>{value}</span>
    </div>
  );
}

function seoTone(score: number): "success" | "warning" | "error" {
  if (score >= 75) return "success";
  if (score >= 50) return "warning";
  return "error";
}

function Sparkline({ points }: { points: number[] }) {
  const max = Math.max(1, ...points);
  const w = 70;
  const h = 28;
  const step = w / (points.length - 1 || 1);
  const path = points
    .map((v, i) => {
      const x = i * step;
      const y = h - (v / max) * h;
      return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
  const last = points[points.length - 1];
  const trendUp = last >= (points[points.length - 4] ?? last);
  const stroke = trendUp ? "#5ec27f" : "#e6b340";
  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      className="opacity-80 group-hover:opacity-100"
      aria-hidden
    >
      <path
        d={path}
        fill="none"
        stroke={stroke}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx={(points.length - 1) * step}
        cy={h - (last / max) * h}
        r={1.8}
        fill={stroke}
      />
    </svg>
  );
}

function useSpark(seed: string, baseline: number): number[] {
  // Deterministic pseudo-random wobble based on seed hash.
  let s = 0;
  for (let i = 0; i < seed.length; i++) s = (s * 31 + seed.charCodeAt(i)) | 0;
  const base = Math.max(1, baseline || 100) / 100;
  const out: number[] = [];
  for (let i = 0; i < 14; i++) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    const wobble = ((s % 100) - 50) / 50;
    out.push(Math.max(0.2, 1 + wobble * 0.4) * base);
  }
  return out;
}
