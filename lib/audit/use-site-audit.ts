"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import {
  runStubAudit,
  simulatedAuditDelayMs,
  type StubAuditInput,
} from "./audit-stub";
import { useAuditsStore } from "@/lib/stores/audits-store";
import type { SiteAuditDoc } from "./audit-types";

/**
 * Hook orchestratore: avvia un audit (in prototype = stub locale, in prod
 * sostituirà con httpsCallable("runSiteAudit")) e persiste in Zustand.
 */
export function useSiteAudit(projectId: string) {
  const add = useAuditsStore((s) => s.add);
  const [running, setRunning] = useState(false);

  const run = useCallback(
    async (input: StubAuditInput) => {
      if (running) return;
      setRunning(true);
      const toastId = toast.loading(
        `Audit ${input.strategy ?? "mobile"} in corso…`,
      );
      try {
        await new Promise((r) => setTimeout(r, simulatedAuditDelayMs()));
        const result = runStubAudit(input);
        const doc: SiteAuditDoc = {
          ...result,
          id: `local-${Date.now()}`,
          createdAt: new Date(),
        };
        add(projectId, doc);
        toast.success(`Audit completato — score ${doc.healthScore}`, {
          id: toastId,
        });
        return doc;
      } catch (err) {
        console.error(err);
        toast.error("Audit fallito", { id: toastId });
        return null;
      } finally {
        setRunning(false);
      }
    },
    [add, projectId, running],
  );

  return { run, running };
}
