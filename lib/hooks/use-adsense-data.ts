"use client";

import { useEffect, useState } from "react";
import { adsense } from "@/lib/services/service-factory";
import type { AdSenseSummary } from "@/lib/services/adsense/types";
import type { AdSenseRevenue } from "@/types";

export function useAdSenseData(projectId: string, days = 30) {
  const [revenue, setRevenue] = useState<AdSenseRevenue[]>([]);
  const [summary, setSummary] = useState<AdSenseSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      adsense.getRevenue(projectId, { days }),
      adsense.getSummary(projectId, { days }),
    ])
      .then(([r, s]) => {
        if (cancelled) return;
        setRevenue(r);
        setSummary(s);
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

  return { revenue, summary, loading };
}
