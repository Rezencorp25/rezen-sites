import type { AdSenseRevenue } from "@/types";

export type AdSenseRange = { days: number };

export type AdSenseSummary = {
  revenueTotal: number;
  impressionsTotal: number;
  ctrAvg: number;
  rpmAvg: number;
};

export interface AdSenseService {
  /** Daily/per-page rows */
  getRevenue(projectId: string, range: AdSenseRange): Promise<AdSenseRevenue[]>;
  getSummary(projectId: string, range: AdSenseRange): Promise<AdSenseSummary>;
}
