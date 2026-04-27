"use client";

import { useMemo } from "react";
import { useProjectsStore } from "@/lib/stores/projects-store";
import { MOCK_ALERTS } from "@/lib/mocks/alerts";
import { MOCK_COLLECTIONS, MOCK_CMS_ITEMS } from "@/lib/mocks/cms";
import { MOCK_REDIRECTS, MOCK_VERSIONS } from "@/lib/mocks/misc";
import { VERUMFLOW_PAGES, CARFI_PAGES, BIO_PAGES } from "@/lib/mocks/pages";
import {
  generateFormSubmissions,
} from "@/lib/mocks/forms";
import {
  generateDailyAdSense,
  generateGoogleAds,
} from "@/lib/mocks/analytics";
import {
  generatePageviews,
  devicesMock,
  countriesMock,
  topPagesMock,
} from "@/lib/mocks/pageviews";

const PAGES_BY_PROJECT = {
  "verumflow-ch": VERUMFLOW_PAGES,
  "impresa-edile-carfi": CARFI_PAGES,
  "consulting-bio": BIO_PAGES,
} as const;

const FORM_COUNT_BY_PROJECT = {
  "verumflow-ch": 48,
  "impresa-edile-carfi": 12,
  "consulting-bio": 0,
} as const;

export function useProjectData(projectId: string) {
  const project = useProjectsStore((s) => s.getById(projectId));

  return useMemo(() => {
    const pages =
      PAGES_BY_PROJECT[projectId as keyof typeof PAGES_BY_PROJECT] ?? [];
    const forms = generateFormSubmissions(
      projectId,
      FORM_COUNT_BY_PROJECT[
        projectId as keyof typeof FORM_COUNT_BY_PROJECT
      ] ?? 0,
    );
    const alerts = MOCK_ALERTS.filter((a) => a.projectId === projectId);
    const collections = MOCK_COLLECTIONS.filter(
      (c) => c.projectId === projectId,
    );
    const cmsItems = MOCK_CMS_ITEMS.filter(
      (i) => i.projectId === projectId,
    );
    const redirects = MOCK_REDIRECTS.filter(
      (r) => r.projectId === projectId,
    );
    const versions = MOCK_VERSIONS.filter((v) => v.projectId === projectId);
    const pageviews = generatePageviews(projectId, 30);
    const adsense =
      projectId === "verumflow-ch"
        ? generateDailyAdSense(projectId, 30)
        : [];
    const ads =
      projectId === "verumflow-ch" ? generateGoogleAds(projectId, 30) : [];
    return {
      project,
      pages,
      forms,
      alerts,
      collections,
      cmsItems,
      redirects,
      versions,
      pageviews,
      adsense,
      ads,
      devices: devicesMock(projectId),
      countries: countriesMock(projectId),
      topPages: topPagesMock(projectId),
    };
  }, [project, projectId]);
}
