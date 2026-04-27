import { cn } from "@/lib/utils";

const SOURCE_COLORS: Record<string, string> = {
  google: "pill-info",
  linkedin: "pill-info",
  meta: "pill-warning",
  newsletter: "pill-success",
  direct: "pill-neutral",
};

export function UtmPills({
  utm,
}: {
  utm?: { source?: string; medium?: string; campaign?: string };
}) {
  if (!utm || (!utm.source && !utm.medium && !utm.campaign)) {
    return <span className="text-text-muted">—</span>;
  }
  return (
    <div className="flex flex-wrap gap-1">
      {utm.source ? (
        <span
          className={cn(
            "rounded px-2 py-0.5 text-label-sm font-semibold uppercase tracking-wider",
            SOURCE_COLORS[utm.source] ?? "pill-neutral",
          )}
        >
          {utm.source}
        </span>
      ) : null}
      {utm.medium ? (
        <span className="rounded px-2 py-0.5 text-label-sm font-semibold uppercase tracking-wider pill-neutral">
          {utm.medium}
        </span>
      ) : null}
      {utm.campaign ? (
        <span className="rounded px-2 py-0.5 text-label-sm font-medium text-secondary-text">
          {utm.campaign}
        </span>
      ) : null}
    </div>
  );
}
