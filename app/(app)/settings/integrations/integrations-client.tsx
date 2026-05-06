"use client";

import { useEffect, useState } from "react";
import { KeyRound } from "lucide-react";
import { collection, onSnapshot } from "firebase/firestore";
import { getFirebase } from "@/lib/firebase/client";
import {
  INTEGRATION_PROVIDER_ORDER,
  INTEGRATION_PROVIDERS,
  DEFAULT_WORKSPACE_ID,
  type IntegrationProviderId,
} from "@/lib/integrations/providers";
import { IntegrationCard } from "@/components/integrations/integration-card";
import { ConfigureIntegrationModal } from "@/components/integrations/configure-integration-modal";
import { revokeIntegrationCall, testIntegrationCall } from "@/lib/integrations/test-client";
import { toast } from "sonner";
import type { IntegrationStatus } from "@/types";

type IntegrationDoc = {
  provider: IntegrationProviderId;
  last4: string;
  status: IntegrationStatus;
  verifiedAt?: { toDate(): Date } | null;
  lastError?: string;
};

export default function WorkspaceIntegrationsClient() {
  const [byProvider, setByProvider] = useState<
    Partial<Record<IntegrationProviderId, IntegrationDoc>>
  >({});
  const [loading, setLoading] = useState(true);
  const [configuringProvider, setConfiguringProvider] =
    useState<IntegrationProviderId | null>(null);
  const [busy, setBusy] = useState<{
    provider: IntegrationProviderId;
    op: "test" | "revoke";
  } | null>(null);

  useEffect(() => {
    const { db } = getFirebase();
    const ref = collection(
      db,
      `workspaces/${DEFAULT_WORKSPACE_ID}/integrations`,
    );
    const unsub = onSnapshot(
      ref,
      (snap) => {
        const map: Partial<Record<IntegrationProviderId, IntegrationDoc>> = {};
        snap.forEach((d) => {
          map[d.id as IntegrationProviderId] = {
            ...(d.data() as Omit<IntegrationDoc, "provider">),
            provider: d.id as IntegrationProviderId,
          };
        });
        setByProvider(map);
        setLoading(false);
      },
      () => setLoading(false),
    );
    return () => unsub();
  }, []);

  const handleTest = async (provider: IntegrationProviderId) => {
    setBusy({ provider, op: "test" });
    const t = toast.loading(`Test ${INTEGRATION_PROVIDERS[provider].label}...`);
    try {
      const res = await testIntegrationCall({
        provider,
        scope: "workspace",
        scopeId: DEFAULT_WORKSPACE_ID,
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
    if (!confirm(`Revocare ${INTEGRATION_PROVIDERS[provider].label}?`)) return;
    setBusy({ provider, op: "revoke" });
    const t = toast.loading("Revoca in corso...");
    try {
      await revokeIntegrationCall({
        provider,
        scope: "workspace",
        scopeId: DEFAULT_WORKSPACE_ID,
      });
      toast.success("Integrazione revocata", { id: t });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Errore";
      toast.error(msg, { id: t });
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-10 py-10">
      <header className="mb-6">
        <div className="flex items-center gap-2">
          <KeyRound className="h-5 w-5 text-molten-primary" />
          <h1 className="text-headline-md font-bold text-on-surface">
            Integrazioni API
          </h1>
        </div>
        <p className="mt-1 max-w-2xl text-body-md text-secondary-text">
          Configura le chiavi API per LLM, SEO data, analytics e ads. Sono salvate
          cifrate in Google Secret Manager. Default a livello workspace, validi
          per tutti i progetti — ogni progetto può fare override con chiavi dedicate.
        </p>
      </header>

      {loading ? (
        <p className="text-body-sm text-text-muted">Caricamento integrazioni...</p>
      ) : (
        <div className="flex flex-col gap-3">
          {INTEGRATION_PROVIDER_ORDER.map((providerId) => {
            const doc = byProvider[providerId];
            const status: IntegrationStatus | "missing" = doc?.status ?? "missing";
            const verifiedAt = doc?.verifiedAt?.toDate?.() ?? null;
            return (
              <IntegrationCard
                key={providerId}
                providerId={providerId}
                status={status}
                last4={doc?.last4}
                verifiedAt={verifiedAt}
                lastError={doc?.lastError}
                scope="workspace"
                onConfigure={() => setConfiguringProvider(providerId)}
                onTest={
                  status === "active" || status === "error"
                    ? () => handleTest(providerId)
                    : undefined
                }
                onRevoke={
                  status === "active" || status === "error"
                    ? () => handleRevoke(providerId)
                    : undefined
                }
                busy={busy?.provider === providerId ? busy.op : null}
              />
            );
          })}
        </div>
      )}

      <ConfigureIntegrationModal
        open={configuringProvider !== null}
        providerId={configuringProvider}
        scope="workspace"
        scopeId={DEFAULT_WORKSPACE_ID}
        onClose={() => setConfiguringProvider(null)}
        onSuccess={() => {
          /* Firestore listener aggiorna in real-time */
        }}
      />
    </div>
  );
}
