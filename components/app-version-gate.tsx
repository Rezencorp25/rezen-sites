"use client";

import { useEffect } from "react";

/**
 * Bump questo valore quando si modifica la struttura dei mock seed o degli
 * store persistiti, per forzare un wipe localStorage al prossimo load del
 * client. Tutti gli store zustand-persist (rezen.*, rezen-*-store) verranno
 * re-seedati dai mock aggiornati.
 *
 * Eccezioni preservate: cookie consent, sidebar collapsed, demo creds.
 */
const APP_VERSION = "2026-05-10-s7.10-publish-storage";
const VERSION_KEY = "rezen.app_version";

const PRESERVE_KEYS = new Set([
  "cookie_consent_v1",
  "ss-sidebar-expanded",
]);

export function AppVersionGate() {
  useEffect(() => {
    const stored = localStorage.getItem(VERSION_KEY);
    if (stored === APP_VERSION) return;
    const preserved: Record<string, string> = {};
    for (const key of PRESERVE_KEYS) {
      const v = localStorage.getItem(key);
      if (v != null) preserved[key] = v;
    }
    localStorage.clear();
    for (const [k, v] of Object.entries(preserved)) localStorage.setItem(k, v);
    localStorage.setItem(VERSION_KEY, APP_VERSION);
    if (stored !== null) window.location.reload();
  }, []);
  return null;
}
