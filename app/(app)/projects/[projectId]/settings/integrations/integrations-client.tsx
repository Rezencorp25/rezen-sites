"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, KeyRound } from "lucide-react";
import { collection, doc, onSnapshot, updateDoc } from "firebase/firestore";
import { getFirebase } from "@/lib/firebase/client";
import {
  INTEGRATION_PROVIDER_ORDER,
  INTEGRATION_PROVIDERS,
  DEFAULT_WORKSPACE_ID,
  type IntegrationProviderId,
} from "@/lib/integrations/providers";
import { IntegrationCard } from "@/components/integrations/integration-card";
import { ConfigureIntegrationModal } from "@/components/integrations/configure-integration-modal";
import {
  revokeIntegrationCall,
  testIntegrationCall,
} from "@/lib/integrations/test-client";
import { toast } from "sonner";
import type { IntegrationStatus } from "@/types";

type IntegrationDoc = {
  last4: string;
  status: IntegrationStatus;
  verifiedAt?: { toDate(): Date } | null;
  lastError?: string;
};

type ProjectOverrides = Partial<
  Record<IntegrationProviderId, { useOverride?: boolean; metadata?: IntegrationDoc }>
>;

export default function ProjectIntegrationsClient({
  projectId,
}: {
  projectId: string;
}) {
  const [workspaceMap, setWorkspaceMap] = useState<
    Partial<Record<IntegrationProviderId, IntegrationDoc>>
  >({});
  const [overrides, setOverrides] = useState<ProjectOverrides>({});
  const [loading, setLoading] = useState(true);
  const [configuringProvider, setConfiguringProvider] =
    useState<IntegrationProviderId | null>(null);
  const [busy, setBusy] = useState<{
    provider: IntegrationProviderId;
    op: "test" | "revoke";
  } | null>(null);

  useEffect(() => {
    const { db } = getFirebase();

    const wsRef = collection(
      db,
      `workspaces/${DEFAULT_WORKSPACE_ID}/integrations`,
    );
    const unsubWs = onSnapshot(wsRef, (snap) => {
      const map: Partial<Record<IntegrationProviderId, IntegrationDoc>> = {};
      snap.forEach((d) => {
        map[d.id as IntegrationProviderId] = d.data() as IntegrationDoc;
      });
      setWorkspaceMap(map);
    });

    const projRef = doc(db, `projects/${projectId}`);
    const unsubProj = onSnapshot(
      projRef,
      (s) => {
        const data = s.data() ?? {};
        const ov =
          (data.integrations?.apiOverrides ?? {}) as ProjectOverrides;
        setOverrides(ov);
        setLoading(false);
      },
      () => setLoading(false),
    );

    return () => {
      unsubWs();
      unsubProj();
    };
  }, [projectId]);

  const handleUseOverride = async (provider: IntegrationProviderId) => {
    setConfiguringProvider(provider);
  };

  const handleUseDefault = async (provider: IntegrationProviderId) => {
    if (!confirm(`Tornare al default workspace per ${INTEGRATION_PROVIDERS[provider].label}?`)) return;
    const { db } = getFirebase();
    try {
      await updateDoc(doc(db, `projects/${projectId}`), {
        [`integrations.apiOverrides.${provider}.useOverride`]: false,
      });
      toast.success("Tornato al default workspace");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Errore";
      toast.error(msg);
    }
  };

  const handleTest = async (provider: IntegrationProviderId) => {
    setBusy({ provider, op: "test" });
    const t = toast.loading(`Test ${INTEGRATION_PROVIDERS[provider].label}...`);
    try {
      const res = await testIntegrationCall({
        provider,
        scope: "project",
        scopeId: projectId,
      });
      if (res.ok) toast.success("Connessione OK", { id: t });
      else toast.error(`Test fallito: ${res.error}`, { id: t });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Errore";
      toast.error(msg, { id: t });
    } finally {
      setBusy(null);
    }
  };

  const handleRevoke = async (provider: IntegrationProviderId) => {
    if (!confirm(`Revocare l'override ${INTEGRATION_PROVIDERS[provider].label}?`)) return;
    setBusy({ provider, op: "revoke" });
    const t = toast.loading("Revoca in corso...");
    try {
      await revokeIntegrationCall({
        provider,
        scope: "project",
        scopeId: projectId,
      });
      toast.success("Override revocato. Tornato al default workspace.", { id: t });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Errore";
      toast.error(msg, { id: t });
    } finally {
      setBusy(null);
    }
  };

  const rows = useMemo(() => {
    return INTEGRATION_PROVIDER_ORDER.map((providerId) => {
      const ov = overrides[providerId];
      const ws = workspaceMap[providerId];
      const isOverride = ov?.useOverride === true;

      let status: IntegrationStatus | "missing" | "inherited" = "missing";
      let last4: string | undefined;
      let verifiedAt: Date | null = null;
      let lastError: string | undefined;

      if (isOverride && ov.metadata) {
        status = ov.metadata.status;
        last4 = ov.metadata.last4;
        verifiedAt = ov.metadata.verifiedAt?.toDate?.() ?? null;
        lastError = ov.metadata.lastError;
      } else if (ws && ws.status === "active") {
        status = "inherited";
        last4 = ws.last4;
        verifiedAt = ws.verifiedAt?.toDate?.() ?? null;
      } else if (ws) {
        status = ws.status;
        last4 = ws.last4;
        verifiedAt = ws.verifiedAt?.toDate?.() ?? null;
      }

      return { providerId, status, last4, verifiedAt, lastError, isOverride };
    });
  }, [overrides, workspaceMap]);

  return (
    <div className="mx-auto max-w-5xl px-10 py-10">
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-molten-primary" />
            <h1 className="text-headline-md font-bold text-on-surface">
              Integrazioni — {projectId}
            </h1>
          </div>
          <p className="mt-1 max-w-2xl text-body-md text-secondary-text">
            Default ereditati dal workspace. Imposta override solo se questo
            progetto richiede chiavi dedicate (es. account Meta separato).
          </p>
        </div>
        <Link
          href="/settings/integrations"
          className="flex shrink-0 items-center gap-1 rounded-md bg-zinc-400/10 px-3 py-2 text-label-md text-text-muted hover:bg-zinc-400/20"
        >
          Default workspace
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </header>

      {loading ? (
        <p className="text-body-sm text-text-muted">Caricamento...</p>
      ) : (
        <div className="flex flex-col gap-3">
          {rows.map((row) => (
            <IntegrationCard
              key={row.providerId}
              providerId={row.providerId}
              status={row.status}
              last4={row.last4}
              verifiedAt={row.verifiedAt}
              lastError={row.lastError}
              scope="project"
              showInheritBadge={row.status === "inherited"}
              onConfigure={() => setConfiguringProvider(row.providerId)}
              onUseOverride={
                row.status === "inherited"
                  ? () => handleUseOverride(row.providerId)
                  : undefined
              }
              onUseDefault={
                row.isOverride && (row.status === "active" || row.status === "error")
                  ? () => handleUseDefault(row.providerId)
                  : undefined
              }
              onTest={
                row.isOverride &&
                (row.status === "active" || row.status === "error")
                  ? () => handleTest(row.providerId)
                  : undefined
              }
              onRevoke={
                row.isOverride &&
                (row.status === "active" || row.status === "error")
                  ? () => handleRevoke(row.providerId)
                  : undefined
              }
              busy={busy?.provider === row.providerId ? busy.op : null}
            />
          ))}
        </div>
      )}

      <ConfigureIntegrationModal
        open={configuringProvider !== null}
        providerId={configuringProvider}
        scope="project"
        scopeId={projectId}
        onClose={() => setConfiguringProvider(null)}
        onSuccess={() => {
          /* Firestore listener aggiorna */
        }}
      />
    </div>
  );
}
