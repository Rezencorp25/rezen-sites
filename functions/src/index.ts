/**
 * REZEN Sites — Cloud Functions v2 entry point.
 *
 * Region default: europe-west1 (Compliance Playbook §3.6).
 *
 * Sprint S0 — solo scaffolding. Functions reali (Site Audit, AI Visibility,
 * DataForSEO sync, Lead pipeline) seguiranno negli sprint dedicati.
 */

import { initializeApp } from "firebase-admin/app";

initializeApp();

// Scheduled
export { probeHourly } from "./scheduled/probe";
export { runRankAndAeoTracking } from "./scheduled/run-rank-and-aeo-tracking";
export { runGeoTracking } from "./scheduled/run-geo-tracking";
export { runAiSearchHealth } from "./scheduled/run-ai-search-health";
export { generateMonthlyReports } from "./scheduled/generate-monthly-reports";
export { runMetaAdsSync } from "./scheduled/run-meta-ads-sync";

// Callable
export { runSiteAudit } from "./callable/run-site-audit";
export { generateProjectReport } from "./callable/generate-project-report";
export { setIntegration } from "./callable/set-integration";
export { testIntegration } from "./callable/test-integration";
export { revokeIntegration } from "./callable/revoke-integration";

// Triggers
export { leadOnFormSubmitted } from "./triggers/lead-on-form-submitted";
export { leadOnStatusChanged } from "./triggers/lead-on-status-changed";
