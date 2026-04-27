/**
 * Deterministic hash → HSL pair for generating per-project gradient covers.
 * Same input always returns same gradient — stable across reloads.
 */
function stringHash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function gradientFor(id: string): {
  from: string;
  to: string;
  css: string;
} {
  const h = stringHash(id);
  const hue1 = h % 360;
  const hue2 = (hue1 + 28 + (h % 40)) % 360;
  const from = `hsl(${hue1} 55% 42%)`;
  const to = `hsl(${hue2} 65% 28%)`;
  return {
    from,
    to,
    css: `radial-gradient(120% 140% at 100% 0%, ${from} 0%, ${to} 45%, #0f1113 85%)`,
  };
}

export function initialsFor(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "·";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
