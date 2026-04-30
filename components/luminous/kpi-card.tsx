import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { KpiTooltip } from "@/components/dashboard/kpi-tooltip";

export function KpiCard({
  label,
  value,
  delta,
  deltaLabel,
  icon: Icon,
  progress,
  className,
  tooltip,
}: {
  label: string;
  value: React.ReactNode;
  delta?: number;
  deltaLabel?: string;
  icon?: LucideIcon;
  progress?: number;
  className?: string;
  tooltip?: string;
}) {
  const deltaPositive = (delta ?? 0) >= 0;
  return (
    <div
      className={cn(
        "relative rounded-xl bg-surface-container-high px-6 py-5 flex flex-col gap-3 transition-all hover:bg-surface-container-highest",
        className,
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-1.5">
          <p className="text-label-md font-semibold uppercase tracking-widest text-text-muted">
            {label}
          </p>
          {tooltip ? <KpiTooltip text={tooltip} /> : null}
        </div>
        {Icon ? (
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-container">
            <Icon className="h-4 w-4 text-molten-primary" />
          </span>
        ) : null}
      </div>
      <div className="flex items-baseline gap-2">
        <p className="text-headline-md font-bold leading-none tracking-tight text-on-surface">
          {value}
        </p>
        {typeof delta === "number" ? (
          <span
            className={cn(
              "text-label-md font-semibold",
              deltaPositive ? "text-success" : "text-error",
            )}
          >
            {deltaPositive ? "+" : ""}
            {delta}%
          </span>
        ) : null}
      </div>
      {deltaLabel ? (
        <p className="text-body-sm text-secondary-text">{deltaLabel}</p>
      ) : null}
      {typeof progress === "number" ? (
        <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-surface-container">
          <div
            className="h-full bg-molten-gradient"
            style={{ width: `${Math.min(Math.max(progress, 0), 100)}%`, background: "linear-gradient(135deg,#ffb599,#f56117)" }}
          />
        </div>
      ) : null}
    </div>
  );
}
