"use client";

import { useEffect, useState } from "react";
import { analytics } from "@/lib/services/service-factory";
import type { AnalyticsSummary } from "@/lib/services/analytics/types";
import type {
  PageviewPoint,
  DeviceShare,
  CountryShare,
  TopPage,
} from "@/lib/mocks/pageviews";

/**
 * Async hook that consumes the analytics service-factory.
 * Mock today, swaps to GA4 at go-live without component changes.
 */
export function useAnalyticsData(projectId: string, days = 30) {
  const [pageviews, setPageviews] = useState<PageviewPoint[]>([]);
  const [devices, setDevices] = useState<DeviceShare[]>([]);
  const [countries, setCountries] = useState<CountryShare[]>([]);
  const [topPages, setTopPages] = useState<TopPage[]>([]);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      analytics.getPageviews(projectId, { days }),
      analytics.getDevices(projectId),
      analytics.getCountries(projectId),
      analytics.getTopPages(projectId),
      analytics.getSummary(projectId, { days }),
    ])
      .then(([pv, dv, co, tp, su]) => {
        if (cancelled) return;
        setPageviews(pv);
        setDevices(dv);
        setCountries(co);
        setTopPages(tp);
        setSummary(su);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [projectId, days]);

  return { pageviews, devices, countries, topPages, summary, loading };
}
