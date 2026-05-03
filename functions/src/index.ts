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

// Callable
export { runSiteAudit } from "./callable/run-site-audit";

// Triggers
export { leadOnFormSubmitted } from "./triggers/lead-on-form-submitted";
export { leadOnStatusChanged } from "./triggers/lead-on-status-changed";
