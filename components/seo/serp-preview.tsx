"use client";

type Props = {
  title: string;
  description: string;
  url: string;
};

const TITLE_TRUNC = 60;
const DESC_TRUNC = 160;

function truncate(s: string, n: number): string {
  if (s.length <= n) return s;
  return s.slice(0, n - 1).trimEnd() + "…";
}

export function SerpPreview({ title, description, url }: Props) {
  const displayTitle = truncate(title || "Titolo della pagina", TITLE_TRUNC);
  const displayDesc = truncate(
    description ||
      "La meta description appare qui sotto il titolo. Tienila sotto i 160 caratteri.",
    DESC_TRUNC,
  );
  const displayUrl = url.replace(/^https?:\/\//, "").replace(/\/$/, "");

  return (
    <div className="rounded-lg border border-outline/30 bg-surface-container-low p-5">
      <div className="mb-2 flex items-center gap-1.5 text-label-sm text-text-muted">
        <span className="inline-block h-4 w-4 rounded-full bg-molten-primary-container" />
        <span className="font-medium text-secondary-text">{displayUrl.split("/")[0]}</span>
        <span>›</span>
        <span className="truncate">{displayUrl}</span>
      </div>
      <h3 className="mb-1 text-[1.25rem] font-medium leading-tight text-info">
        {displayTitle}
      </h3>
      <p className="text-body-sm leading-snug text-secondary-text">{displayDesc}</p>
    </div>
  );
}
