function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

export type PageviewPoint = {
  date: Date;
  pageviews: number;
  sessions: number;
};

/**
 * Deterministic pageview time series with upward trend (mimics Dashboard Stitch).
 */
export function generatePageviews(
  projectId: string,
  days = 30,
): PageviewPoint[] {
  const rnd = seeded(projectId.length * 239 + 13);
  const points: PageviewPoint[] = [];
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (days - 1));
  const base =
    projectId === "verumflow-ch"
      ? 180
      : projectId === "impresa-edile-carfi"
        ? 40
        : 0;
  for (let i = 0; i < days; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    const trend = 1 + (i / days) * 0.55;
    const noise = 0.6 + rnd() * 0.8;
    const weekend = [0, 6].includes(date.getDay()) ? 0.65 : 1;
    const pv = Math.round(base * trend * noise * weekend);
    const sessions = Math.round(pv * (0.6 + rnd() * 0.25));
    points.push({ date, pageviews: pv, sessions });
  }
  return points;
}

export type DeviceShare = { device: string; share: number };
export type CountryShare = { country: string; share: number; code: string };
export type TopPage = {
  path: string;
  views: number;
  bounce: number;
  avgTime: string;
};

export function devicesMock(projectId: string): DeviceShare[] {
  const mobileShare = projectId === "impresa-edile-carfi" ? 0.72 : 0.58;
  const desktopShare = 1 - mobileShare - 0.05;
  return [
    { device: "Mobile", share: mobileShare },
    { device: "Desktop", share: desktopShare },
    { device: "Tablet", share: 0.05 },
  ];
}

export function countriesMock(projectId: string): CountryShare[] {
  if (projectId === "impresa-edile-carfi") {
    return [
      { country: "Svizzera", code: "CH", share: 0.78 },
      { country: "Italia", code: "IT", share: 0.18 },
      { country: "Germania", code: "DE", share: 0.04 },
    ];
  }
  return [
    { country: "Italia", code: "IT", share: 0.52 },
    { country: "Svizzera", code: "CH", share: 0.28 },
    { country: "Germania", code: "DE", share: 0.08 },
    { country: "Francia", code: "FR", share: 0.06 },
    { country: "Stati Uniti", code: "US", share: 0.06 },
  ];
}

export function topPagesMock(projectId: string): TopPage[] {
  if (projectId === "impresa-edile-carfi") {
    return [
      { path: "/", views: 612, bounce: 0.41, avgTime: "2m 12s" },
      { path: "/progetti", views: 354, bounce: 0.52, avgTime: "3m 40s" },
      { path: "/contatti", views: 312, bounce: 0.42, avgTime: "1m 30s" },
      { path: "/servizi", views: 184, bounce: 0.58, avgTime: "2m 08s" },
    ];
  }
  return [
    { path: "/", views: 3120, bounce: 0.42, avgTime: "2m 40s" },
    { path: "/audit", views: 1205, bounce: 0.34, avgTime: "3m 02s" },
    { path: "/blog", views: 876, bounce: 0.48, avgTime: "4m 18s" },
    { path: "/contact", views: 432, bounce: 0.61, avgTime: "1m 24s" },
    { path: "/blog/post-3", views: 388, bounce: 0.44, avgTime: "3m 51s" },
  ];
}
