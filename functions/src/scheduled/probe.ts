import { onSchedule } from "firebase-functions/scheduler";
import { logger } from "firebase-functions";

/**
 * Probe scheduled function — verifica che il deploy + scheduler funzionino.
 * Ogni ora scrive un log strutturato con timestamp.
 *
 * Region: europe-west1 (Compliance Playbook §3.6 + §10.4 — coerenza con Firestore EU).
 * Da rimuovere o disabilitare quando funzioni reali in produzione.
 */
export const probeHourly = onSchedule(
  {
    schedule: "every 60 minutes",
    region: "europe-west1",
    timeZone: "Europe/Rome",
  },
  async () => {
    logger.info("probe:tick", {
      ts: new Date().toISOString(),
      version: process.env.K_REVISION ?? "local",
    });
  },
);
