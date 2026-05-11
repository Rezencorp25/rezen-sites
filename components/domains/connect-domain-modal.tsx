"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { GradientButton } from "@/components/luminous/gradient-button";
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
} from "lucide-react";

/**
 * S7.14 — Modal "Collega dominio".
 *
 * Path supportati:
 *   - Manual DNS (default): l'utente inserisce il dominio, noi mostriamo i
 *     record DNS da copy-paste sul pannello del registrar (GoDaddy, ecc.),
 *     polling dns.resolveTxt finché propagato.
 *   - Auto (se Cloudflare configurato in Integrazioni): noi creiamo i record
 *     via API Cloudflare, l'utente non tocca nulla.
 *
 * Step-state machine:
 *   enter-domain → connecting → records-shown (manual only) → verifying →
 *   registering → issuing-cert → live | failed
 */

type Step =
  | "enter-domain"
  | "connecting"
  | "records-shown"
  | "verifying"
  | "registering"
  | "issuing-cert"
  | "live"
  | "failed";

type DnsRecord = {
  type: string;
  name: string;
  value: string;
  ttl?: number;
  purpose?: string;
  autoCreated?: boolean;
};

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
  const [step, setStep] = useState<Step>("enter-domain");
  const [domain, setDomain] = useState("");
  const [mode, setMode] = useState<"auto" | "manual">("manual");
  const [records, setRecords] = useState<DnsRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [verifyAttempts, setVerifyAttempts] = useState(0);

  function reset() {
    setStep("enter-domain");
    setDomain("");
    setMode("manual");
    setRecords([]);
    setError(null);
    setVerifyAttempts(0);
  }

  async function handleConnect() {
    if (!domain) return;
    setError(null);
    setStep("connecting");
    try {
      const res = await fetch(`/api/projects/${projectId}/domains/connect`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ domain, mode }),
      });
      if (!res.ok) {
        const b = (await res.json()) as { error?: string; message?: string };
        throw new Error(b.message ?? b.error ?? `errore ${res.status}`);
      }
      const body = (await res.json()) as {
        recordsCreated: boolean;
        dnsRecordsToAdd: DnsRecord[];
        mode: "auto" | "manual";
      };
      setRecords(body.dnsRecordsToAdd ?? []);
      setMode(body.mode);
      // Auto mode con record già creati → vai direttamente a verify polling.
      // Manual mode → mostra records, aspetta che l'utente li aggiunga.
      if (body.recordsCreated) {
        setStep("verifying");
        pollVerify().catch((err) => {
          setError(err.message);
          setStep("failed");
        });
      } else {
        setStep("records-shown");
      }
    } catch (err) {
      setError((err as Error).message);
      setStep("failed");
    }
  }

  async function handleRecordsAdded() {
    setStep("verifying");
    try {
      await pollVerify();
    } catch (err) {
      setError((err as Error).message);
      setStep("failed");
    }
  }

  async function pollVerify() {
    for (let i = 0; i < 36; i++) {
      // 36*5s = 3 minuti totali — sufficienti per la maggior parte dei TTL DNS
      setVerifyAttempts(i + 1);
      try {
        const res = await fetch(`/api/projects/${projectId}/domains/verify`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ domain }),
        });
        if (res.ok) {
          const b = (await res.json()) as { ok: boolean; status: string };
          if (b.ok && b.status === "verified") {
            await triggerRegister();
            return;
          }
        }
      } catch {
        /* retry */
      }
      await sleep(5000);
    }
    throw new Error(
      "Verifica DNS non completata in 3 minuti. Controlla di aver salvato i record sul registrar (TTL alto può richiedere fino a 30 min).",
    );
  }

  async function triggerRegister() {
    setStep("registering");
    const res = await fetch(
      `/api/projects/${projectId}/domains/register-cert`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ domain }),
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
          `/api/projects/${projectId}/domains/status?domain=${encodeURIComponent(domain)}`,
        );
        if (res.ok) {
          const b = (await res.json()) as { status: string };
          if (b.status === "live") {
            setStep("live");
            onCompleted?.(domain);
            return;
          }
          if (b.status === "failed") {
            setStep("failed");
            setError("Cert SSL non emesso (consulta console Firebase per dettagli)");
            return;
          }
        }
      } catch {
        /* retry */
      }
      await sleep(10000);
    }
    setStep("failed");
    setError("Cert SSL non emesso in 10 minuti. Riprova fra poco.");
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogContent className="bg-surface-container-highest border-none sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Collega dominio custom</DialogTitle>
          <DialogDescription className="text-secondary-text">
            {step === "enter-domain"
              ? "Inserisci il dominio. Mostriamo i record DNS da aggiungere."
              : step === "records-shown"
                ? "Aggiungi questi record DNS nel pannello del tuo registrar."
                : step === "live"
                  ? `${domain} è live`
                  : "Stiamo procedendo…"}
          </DialogDescription>
        </DialogHeader>

        {step === "enter-domain" && (
          <div className="flex flex-col gap-4 pt-2">
            <input
              type="text"
              placeholder="verumflow.com o sub.verumflow.com"
              value={domain}
              onChange={(e) => setDomain(e.target.value.trim().toLowerCase())}
              className="h-11 rounded-md bg-surface-container-low px-3 text-body-sm"
            />
            <div className="rounded-lg bg-surface-container-low p-4 text-label-sm text-text-muted">
              <strong className="text-on-surface">Come funziona</strong>
              <ol className="ml-4 mt-2 list-decimal space-y-1">
                <li>Inserisci il dominio</li>
                <li>Aggiungi 2 record DNS sul tuo registrar (GoDaddy/altri)</li>
                <li>Noi rileviamo + emettiamo SSL automaticamente</li>
              </ol>
              <p className="mt-2">
                Con Cloudflare collegato in Integrazioni, lo step 2 è
                automatico.
              </p>
            </div>
            <GradientButton size="md" onClick={handleConnect} disabled={!domain}>
              Avanti
            </GradientButton>
          </div>
        )}

        {step === "connecting" && (
          <Centered>
            <Loader2 className="h-5 w-5 animate-spin text-molten-primary" />
            <p className="text-body-sm text-text-muted">
              Genero token verify…
            </p>
          </Centered>
        )}

        {step === "records-shown" && (
          <div className="flex flex-col gap-3 pt-2">
            <div className="rounded-md bg-surface-container-low p-3 text-label-sm">
              <strong className="text-on-surface">
                Pannello DNS del tuo registrar
              </strong>
              <p className="mt-1 text-text-muted">
                Vai su GoDaddy → I miei prodotti → DNS → Gestisci zone, e
                aggiungi:
              </p>
            </div>
            <div className="space-y-2">
              {records.map((r, i) => (
                <RecordCard key={i} record={r} />
              ))}
            </div>
            <p className="text-label-sm text-text-muted">
              Salvati i record? Click qui sotto, controlliamo ogni 5 secondi.
              La propagazione richiede in genere 30s – 5 min (raro fino a 30
              min).
            </p>
            <GradientButton size="md" onClick={handleRecordsAdded}>
              Ho aggiunto i record · Verifica
            </GradientButton>
          </div>
        )}

        {(step === "verifying" ||
          step === "registering" ||
          step === "issuing-cert") && (
          <Centered>
            <Loader2 className="h-5 w-5 animate-spin text-molten-primary" />
            <p className="text-body-sm text-on-surface font-semibold text-center">
              {step === "verifying" &&
                `Cerco il TXT sul DNS (tentativo ${verifyAttempts}/36)…`}
              {step === "registering" && "Registro su Firebase App Hosting…"}
              {step === "issuing-cert" && "Emissione cert Let's Encrypt…"}
            </p>
            <p className="text-label-sm text-text-muted text-center">
              {step === "verifying"
                ? "Polling DNS ogni 5s. Solitamente 30s-5min."
                : "Solitamente 1-5 min totali."}
            </p>
          </Centered>
        )}

        {step === "live" && (
          <Centered>
            <CheckCircle2 className="h-8 w-8 text-success" />
            <p className="text-body-md text-on-surface font-semibold">
              {domain} è live
            </p>
            <a
              href={`https://${domain}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-body-sm text-molten-primary underline"
            >
              Apri il sito
              <ExternalLink className="h-3.5 w-3.5" />
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
              onClick={() => reset()}
              className="rounded-md bg-surface-container-low px-3 py-1.5 text-body-sm"
            >
              Riprova
            </button>
          </Centered>
        )}
      </DialogContent>
    </Dialog>
  );
}

function RecordCard({ record }: { record: DnsRecord }) {
  return (
    <div className="rounded-md border border-outline/20 bg-surface-container-low p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="rounded bg-surface-container px-2 py-0.5 text-label-sm font-bold uppercase text-molten-primary">
          {record.type}
        </span>
        {record.autoCreated ? (
          <span className="text-label-sm text-success">
            ✓ Creato automaticamente
          </span>
        ) : (
          <span className="text-label-sm text-text-muted">Da aggiungere</span>
        )}
      </div>
      <Field label="Name / Host" value={record.name} />
      <Field label="Value / Target" value={record.value} />
      {record.ttl && <Field label="TTL" value={String(record.ttl)} />}
      {record.purpose && (
        <p className="mt-1 text-label-sm text-text-muted">{record.purpose}</p>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  const isPlaceholder = value.startsWith("[");
  return (
    <div className="mt-1.5">
      <div className="flex items-center gap-2 text-label-sm text-text-muted">
        {label}
      </div>
      <div className="mt-0.5 flex items-center gap-2 rounded bg-surface-container-lowest px-2 py-1 font-mono text-body-sm">
        <span
          className={`flex-1 break-all ${isPlaceholder ? "text-text-muted italic" : "text-on-surface"}`}
        >
          {value}
        </span>
        {!isPlaceholder && (
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(value);
              toast.success("Copiato");
            }}
            className="text-text-muted hover:text-on-surface"
            aria-label={`Copia ${label}`}
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
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
