"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { GradientButton } from "@/components/luminous/gradient-button";
import { Loader2, CheckCircle2, AlertCircle, ExternalLink } from "lucide-react";

/**
 * S7.14 sub-F — Modal "Collega dominio".
 *
 * Flow guidato 4-step:
 *  1) Carica domini dal provider DNS collegato (es. GoDaddy).
 *     Se nessun provider → CTA "Vai a Integrazioni".
 *  2) Selezione dominio + POST /domains/connect → server crea TXT verify.
 *  3) Polling GET /domains/verify finché propagato (max 2min).
 *  4) Auto-trigger POST /domains/register-cert + polling /domains/status
 *     fino a live.
 *
 * Non gestisce la cancellazione mid-flow lato server (orphan TXT) — accept
 * trade-off per MVP. Sub-G pulizia in sprint successivo.
 */

type Step =
  | "loading-providers"
  | "no-provider"
  | "pick-domain"
  | "connecting"
  | "verifying"
  | "registering"
  | "issuing-cert"
  | "live"
  | "failed";

type DomainItem = { name: string; status: string };

export function ConnectDomainModal({
  projectId,
  open,
  onOpenChange,
  onCompleted,
}: {
  projectId: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCompleted?: (domain: string) => void;
}) {
  const [step, setStep] = useState<Step>("loading-providers");
  const [providerId, setProviderId] = useState<string | null>(null);
  const [domains, setDomains] = useState<DomainItem[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [verifyAttempts, setVerifyAttempts] = useState(0);

  // Reset when reopened
  useEffect(() => {
    if (!open) return;
    setStep("loading-providers");
    setError(null);
    setSelected("");
    setVerifyAttempts(0);
    (async () => {
      try {
        const res = await fetch(
          `/api/dns/domains/list?projectId=${projectId}`,
        );
        if (res.status === 404) {
          setStep("no-provider");
          return;
        }
        if (!res.ok) {
          const b = (await res.json()) as { error?: string };
          throw new Error(b.error ?? `errore ${res.status}`);
        }
        const body = (await res.json()) as {
          provider: string;
          domains: DomainItem[];
        };
        setProviderId(body.provider);
        setDomains(body.domains);
        setStep("pick-domain");
      } catch (err) {
        setError((err as Error).message);
        setStep("failed");
      }
    })();
  }, [open, projectId]);

  async function handleConnect() {
    if (!selected) return;
    setStep("connecting");
    try {
      const res = await fetch(`/api/projects/${projectId}/domains/connect`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ domain: selected, provider: providerId }),
      });
      if (!res.ok) {
        const b = (await res.json()) as { error?: string; message?: string };
        throw new Error(b.message ?? b.error ?? `errore ${res.status}`);
      }
      setStep("verifying");
      // Polling verify
      await pollVerify();
    } catch (err) {
      setError((err as Error).message);
      setStep("failed");
    }
  }

  async function pollVerify() {
    for (let i = 0; i < 24; i++) {
      setVerifyAttempts(i + 1);
      try {
        const res = await fetch(`/api/projects/${projectId}/domains/verify`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ domain: selected }),
        });
        if (res.ok) {
          const b = (await res.json()) as { ok: boolean; status: string };
          if (b.ok && b.status === "verified") {
            await triggerRegister();
            return;
          }
        }
      } catch {
        // continua a retry
      }
      await sleep(5000);
    }
    throw new Error(
      "Verifica DNS non completata in 2 minuti. Riprova fra qualche minuto.",
    );
  }

  async function triggerRegister() {
    setStep("registering");
    const res = await fetch(
      `/api/projects/${projectId}/domains/register-cert`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ domain: selected }),
      },
    );
    if (!res.ok) {
      const b = (await res.json()) as { error?: string };
      throw new Error(b.error ?? `errore ${res.status}`);
    }
    setStep("issuing-cert");
    await pollStatus();
  }

  async function pollStatus() {
    for (let i = 0; i < 60; i++) {
      try {
        const res = await fetch(
          `/api/projects/${projectId}/domains/status?domain=${encodeURIComponent(selected)}`,
        );
        if (res.ok) {
          const b = (await res.json()) as { status: string };
          if (b.status === "live") {
            setStep("live");
            onCompleted?.(selected);
            return;
          }
          if (b.status === "failed") {
            setStep("failed");
            setError("Provisioning cert fallito (vedi console Firebase)");
            return;
          }
        }
      } catch {
        // continua
      }
      await sleep(10000);
    }
    setStep("failed");
    setError("Cert SSL non emesso in 10 minuti. Riprova fra poco.");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-surface-container-highest border-none sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Collega dominio custom</DialogTitle>
          <DialogDescription className="text-secondary-text">
            {step === "no-provider"
              ? "Collega prima un provider DNS in Integrazioni."
              : step === "live"
                ? `Dominio collegato: ${selected}`
                : "Selezione dominio dal tuo account DNS provider."}
          </DialogDescription>
        </DialogHeader>

        {step === "loading-providers" && (
          <Centered>
            <Loader2 className="h-5 w-5 animate-spin text-molten-primary" />
            <p className="text-body-sm text-text-muted">Carico domini…</p>
          </Centered>
        )}

        {step === "no-provider" && (
          <div className="flex flex-col gap-3 pt-2">
            <a
              href="/settings/integrations"
              className="inline-flex items-center gap-1.5 rounded-md bg-surface-container-low px-3 py-2 text-body-sm font-medium text-molten-primary hover:bg-surface-container"
            >
              Vai a Integrazioni
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
            <p className="text-label-sm text-text-muted">
              GoDaddy supportato oggi. Cloudflare e Namecheap in arrivo.
            </p>
          </div>
        )}

        {step === "pick-domain" && (
          <div className="flex flex-col gap-3 pt-2">
            <select
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              className="h-10 rounded-md bg-surface-container-low px-3 text-body-sm"
            >
              <option value="">— seleziona un dominio —</option>
              {domains.map((d) => (
                <option key={d.name} value={d.name}>
                  {d.name} ({d.status})
                </option>
              ))}
            </select>
            <p className="text-label-sm text-text-muted">
              Provider connesso: <strong>{providerId}</strong>. I record DNS
              vengono scritti automaticamente — niente manual setup.
            </p>
            <GradientButton
              size="md"
              onClick={handleConnect}
              disabled={!selected}
            >
              Collega
            </GradientButton>
          </div>
        )}

        {(step === "connecting" ||
          step === "verifying" ||
          step === "registering" ||
          step === "issuing-cert") && (
          <Centered>
            <Loader2 className="h-5 w-5 animate-spin text-molten-primary" />
            <p className="text-body-sm text-on-surface font-semibold">
              {step === "connecting" && "Creo TXT verify…"}
              {step === "verifying" &&
                `Aspetto propagazione DNS (tentativo ${verifyAttempts}/24)…`}
              {step === "registering" && "Registro su Firebase App Hosting…"}
              {step === "issuing-cert" && "Emissione cert Let's Encrypt…"}
            </p>
            <p className="text-label-sm text-text-muted text-center">
              {step === "verifying"
                ? "Polling ogni 5s. Solitamente 30s-2min."
                : "Solitamente 1-5 min totali."}
            </p>
          </Centered>
        )}

        {step === "live" && (
          <Centered>
            <CheckCircle2 className="h-8 w-8 text-success" />
            <p className="text-body-md text-on-surface font-semibold">
              {selected} è live
            </p>
            <a
              href={`https://${selected}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-body-sm text-molten-primary underline"
            >
              Apri il sito →
            </a>
          </Centered>
        )}

        {step === "failed" && (
          <Centered>
            <AlertCircle className="h-8 w-8 text-error" />
            <p className="text-body-sm text-on-surface text-center">
              {error ?? "Errore sconosciuto"}
            </p>
            <button
              onClick={() => {
                onOpenChange(false);
                setTimeout(() => {
                  toast.info("Riapri il modal per riprovare");
                }, 200);
              }}
              className="rounded-md bg-surface-container-low px-3 py-1.5 text-body-sm"
            >
              Chiudi
            </button>
          </Centered>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 py-6">{children}</div>
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
