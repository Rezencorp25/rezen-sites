"use client";

import { useEffect, useState } from "react";
import { ads } from "@/lib/services/service-factory";
import type { AdsCampaignSummary } from "@/lib/services/ads/types";
import type { GoogleAdsPerformance } from "@/types";

export function useAdsData(projectId: string, days = 30) {
  const [performance, setPerformance] = useState<GoogleAdsPerformance[]>([]);
  const [campaigns, setCampaigns] = useState<AdsCampaignSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      ads.getPerformance(projectId, { days }),
      ads.getCampaignSummary(projectId, { days }),
    ])
      .then(([p, c]) => {
        if (cancelled) return;
        setPerformance(p);
        setCampaigns(c);
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

  return { performance, campaigns, loading };
}
