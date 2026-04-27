"use client";

import { cn } from "@/lib/utils";

type Props = {
  value: string;
  min: number;
  max: number;
  className?: string;
};

export function SeoCounter({ value, min, max, className }: Props) {
  const len = value.length;
  const tone =
    len === 0
      ? "text-text-muted"
      : len < min
        ? "text-warning"
        : len <= max
          ? "text-success"
          : "text-error";
  const label =
    len === 0
      ? `0 / ${max}`
      : len < min
        ? `${len} / ${max} · troppo corto (min ${min})`
        : len > max
          ? `${len} / ${max} · troppo lungo`
          : `${len} / ${max} · ottimo`;
  return <span className={cn("text-label-md font-mono", tone, className)}>{label}</span>;
}
