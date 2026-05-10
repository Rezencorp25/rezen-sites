import { cn } from "@/lib/utils";

type PillVariant = "success" | "warning" | "error" | "info" | "neutral";

const variants: Record<PillVariant, string> = {
  success: "pill-success",
  warning: "pill-warning",
  error: "pill-error",
  info: "pill-info",
  neutral: "pill-neutral",
};

export function StatusPill({
  variant = "neutral",
  className,
  children,
}: {
  variant?: PillVariant;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-label-md font-semibold uppercase tracking-wider",
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function SeverityPill({
  severity,
  className,
  children,
}: {
  severity: "critical" | "warning" | "info" | "ok";
  className?: string;
  children?: React.ReactNode;
}) {
  const map = {
    critical: { variant: "error" as const, label: "CRITICAL" },
    warning: { variant: "warning" as const, label: "WARNING" },
    info: { variant: "info" as const, label: "INFO" },
    ok: { variant: "success" as const, label: "OK" },
  }[severity];
  return (
    <StatusPill variant={map.variant} className={className}>
      {children ?? map.label}
    </StatusPill>
  );
}

export function SeoScorePill({ score }: { score: number }) {
  const variant: PillVariant =
    score >= 80 ? "success" : score >= 60 ? "warning" : "error";
  return <StatusPill variant={variant}>{score}</StatusPill>;
}

export function PageStatusPill({
  status,
}: {
  status: "draft" | "published" | "staging" | "production";
}) {
  const map = {
    published: { variant: "success" as const, label: "PUBBLICATO" },
    production: { variant: "success" as const, label: "PRODUZIONE" },
    staging: { variant: "info" as const, label: "STAGING" },
    draft: { variant: "neutral" as const, label: "BOZZA" },
  }[status];
  return <StatusPill variant={map.variant}>{map.label}</StatusPill>;
}

export function CmsItemStatusPill({
  status,
}: {
  status: "draft" | "queued" | "published" | "scheduled" | "archived";
}) {
  const map = {
    published: { variant: "success" as const, label: "PUBBLICATO" },
    queued: { variant: "info" as const, label: "IN CODA" },
    scheduled: { variant: "info" as const, label: "PROGRAMMATO" },
    draft: { variant: "neutral" as const, label: "BOZZA" },
    archived: { variant: "warning" as const, label: "ARCHIVIATO" },
  }[status];
  return <StatusPill variant={map.variant}>{map.label}</StatusPill>;
}
