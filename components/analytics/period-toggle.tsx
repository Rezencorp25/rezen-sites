"use client";

import { cn } from "@/lib/utils";

export type Period = "daily" | "weekly" | "monthly";

export function PeriodToggle({
  value,
  onChange,
}: {
  value: Period;
  onChange: (v: Period) => void;
}) {
  const options: { value: Period; label: string }[] = [
    { value: "daily", label: "Daily" },
    { value: "weekly", label: "Weekly" },
    { value: "monthly", label: "Monthly" },
  ];
  return (
    <div className="inline-flex items-center gap-1 rounded-lg bg-surface-container-lowest p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            "h-8 rounded-md px-3 text-body-sm font-medium transition-all",
            value === o.value
              ? "bg-surface-container-highest text-on-surface"
              : "text-text-muted hover:text-on-surface",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
