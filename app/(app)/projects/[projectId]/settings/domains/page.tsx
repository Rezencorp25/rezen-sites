"use client";

import { use, useState } from "react";
import Link from "next/link";
import {
  Globe,
  Lock,
  LockOpen,
  Plus,
  GitMerge,
  Link2,
  Copy,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { useProjectsStore } from "@/lib/stores/projects-store";
import { useSettingsStore } from "@/lib/stores/settings-store";
import { StatusPill } from "@/components/luminous/status-pill";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { GradientButton } from "@/components/luminous/gradient-button";
import { DnsRecordsPanel } from "@/components/seo/dns-records";

export default function SettingsDomainsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = use(params);
  const project = useProjectsStore((s) => s.getById(projectId));
  const settings = useSettingsStore((s) => s.get(projectId));
  const updateSection = useSettingsStore((s) => s.updateSection);
  const [open, setOpen] = useState(false);

  if (!project) return null;

  const ssl = settings.domain.ssl;
  const expiresDate = ssl.expiresAt ? new Date(ssl.expiresAt) : null;
  const daysToExpiry = expiresDate
    ? Math.floor((expiresDate.getTime() - Date.now()) / 86400000)
    : null;
  const expiryTone =
    daysToExpiry === null
      ? "muted"
      : daysToExpiry <= 7
        ? "error"
        : daysToExpiry <= ssl.alertDaysBeforeExpiry
          ? "warning"
          : "success";

  return (
    <div className="mx-auto max-w-5xl px-10 pb-12 pt-2">
      <div className="grid gap-5 grid-cols-1 lg:grid-cols-2">
        <section className="rounded-xl bg-surface-container-high p-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Globe className="h-4 w-4 text-molten-primary" />
              <h2 className="text-title-md font-semibold text-on-surface">
                Base Domain
              </h2>
            </div>
            <StatusPill variant="neutral">READONLY</StatusPill>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-surface-container-lowest px-4 py-3 font-mono text-body-sm text-on-surface">
            <span className="flex-1">{project.baseDomain}</span>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(project.baseDomain);
                toast.success("Base domain copiato");
              }}
              aria-label="Copia"
              className="text-text-muted hover:text-on-surface"
            >
              <Copy className="h-3.5 w-3.5" />
            </button>
          </div>
          <p className="mt-3 text-label-sm text-text-muted">
            Sub-dominio assegnato automaticamente da REZEN. Sempre online e gratuito.
          </p>
        </section>

        <section className="rounded-xl bg-surface-container-high p-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Globe className="h-4 w-4 text-molten-primary" />
              <h2 className="text-title-md font-semibold text-on-surface">
                Custom Domain
              </h2>
            </div>
            {settings.domain.sslActive ? (
              <StatusPill variant="success" className="flex items-center gap-1">
                <Lock className="h-3 w-3" />
                SSL ACTIVE
              </StatusPill>
            ) : (
              <StatusPill variant="warning">
                <LockOpen className="h-3 w-3" />
                SSL PENDING
              </StatusPill>
            )}
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-surface-container-lowest px-4 py-3 font-mono text-body-sm text-on-surface">
            <span className="flex-1">
              {settings.domain.customDomain ||
                project.domain ||
                "— nessun dominio configurato —"}
            </span>
          </div>
          <p className="mt-3 text-label-sm text-text-muted">
            Certificato Let&apos;s Encrypt auto-rinnovato ogni 90 giorni.
          </p>
        </section>

        <section className="rounded-xl bg-surface-container-high p-6 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="h-4 w-4 text-molten-primary" />
              <h2 className="text-title-md font-semibold text-on-surface">
                SSL / TLS
              </h2>
            </div>
            <span
              className="rounded-full px-2 py-0.5 text-label-sm font-bold uppercase"
              style={{
                background:
                  expiryTone === "success"
                    ? "rgba(94,194,127,0.15)"
                    : expiryTone === "warning"
                      ? "rgba(230,179,64,0.15)"
                      : expiryTone === "error"
                        ? "rgba(230,107,107,0.15)"
                        : "rgba(179,181,185,0.15)",
                color:
                  expiryTone === "success"
                    ? "#5ec27f"
                    : expiryTone === "warning"
                      ? "#e6b340"
                      : expiryTone === "error"
                        ? "#e66b6b"
                        : "#b3b5b9",
              }}
            >
              {daysToExpiry !== null
                ? `Scade in ${daysToExpiry}gg`
                : "Non emesso"}
            </span>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="rounded-md bg-surface-container-lowest p-3">
              <p className="text-label-sm uppercase text-text-muted">Issuer</p>
              <p className="mt-1 font-mono text-body-sm text-on-surface">
                {ssl.issuer === "letsencrypt"
                  ? "Let's Encrypt"
                  : ssl.issuer === "cloudflare"
                    ? "Cloudflare"
                    : "Manuale"}
              </p>
            </div>
            <div className="rounded-md bg-surface-container-lowest p-3">
              <p className="text-label-sm uppercase text-text-muted">Emesso</p>
              <p className="mt-1 font-mono text-body-sm text-on-surface">
                {ssl.issuedAt
                  ? new Date(ssl.issuedAt).toLocaleDateString("it-IT")
                  : "—"}
              </p>
            </div>
            <div className="rounded-md bg-surface-container-lowest p-3">
              <p className="text-label-sm uppercase text-text-muted">Scadenza</p>
              <p className="mt-1 font-mono text-body-sm text-on-surface">
                {ssl.expiresAt
                  ? new Date(ssl.expiresAt).toLocaleDateString("it-IT")
                  : "—"}
              </p>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between rounded-md border border-outline/20 px-3 py-2">
            <div>
              <p className="text-body-sm font-semibold text-on-surface">
                Auto-renewal
              </p>
              <p className="text-label-md text-text-muted">
                Rinnovo automatico 30gg prima della scadenza (Let&apos;s Encrypt
                ACME).
              </p>
            </div>
            <Switch
              checked={ssl.autoRenew}
              onCheckedChange={(v) =>
                updateSection(projectId, "domain", {
                  ssl: { ...ssl, autoRenew: v },
                })
              }
            />
          </div>
          <div className="mt-3 flex items-center justify-between rounded-md border border-outline/20 px-3 py-2">
            <div>
              <p className="text-body-sm font-semibold text-on-surface">
                Alert pre-scadenza
              </p>
              <p className="text-label-md text-text-muted">
                Notifica via email/Slack {ssl.alertDaysBeforeExpiry} giorni
                prima della scadenza.
              </p>
            </div>
            <select
              value={ssl.alertDaysBeforeExpiry}
              onChange={(e) =>
                updateSection(projectId, "domain", {
                  ssl: {
                    ...ssl,
                    alertDaysBeforeExpiry: parseInt(e.target.value, 10),
                  },
                })
              }
              className="rounded-md bg-surface-container-low px-3 py-1.5 text-body-sm"
            >
              <option value={7}>7 giorni</option>
              <option value={14}>14 giorni</option>
              <option value={30}>30 giorni</option>
              <option value={60}>60 giorni</option>
            </select>
          </div>
          <button
            type="button"
            onClick={() => {
              const issued = new Date();
              const expires = new Date(Date.now() + 90 * 86400000);
              updateSection(projectId, "domain", {
                ssl: {
                  ...ssl,
                  issuedAt: issued.toISOString(),
                  expiresAt: expires.toISOString(),
                },
              });
              toast.success("Certificato rinnovato (mock 90gg)");
            }}
            className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-surface-container-lowest px-3 py-2 text-body-sm font-medium text-molten-primary hover:bg-surface-container"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Forza rinnovo manuale
          </button>
        </section>

        <DnsRecordsPanel projectId={projectId} />

        <section className="rounded-xl bg-surface-container-high p-6 lg:col-span-2">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="group flex w-full items-center justify-between gap-4 rounded-lg bg-surface-container-lowest px-5 py-4 transition-colors hover:bg-surface-container-low"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-container-high transition-colors group-hover:bg-surface-container-highest">
                <Plus className="h-5 w-5 text-molten-primary" />
              </div>
              <div className="flex flex-col items-start leading-tight">
                <span className="text-body-md font-semibold text-on-surface">
                  Aggiungi Custom Domain
                </span>
                <span className="text-body-sm text-text-muted">
                  Verifica DNS + generazione SSL
                </span>
              </div>
            </div>
            <span className="text-body-sm text-molten-primary">
              Configura →
            </span>
          </button>
        </section>

        <section className="rounded-xl bg-surface-container-high p-6">
          <div className="mb-3 flex items-center gap-2.5">
            <Link2 className="h-4 w-4 text-molten-primary" />
            <h2 className="text-title-md font-semibold text-on-surface">
              Canonical URL
            </h2>
          </div>
          <div className="flex gap-2">
            {(["apex", "www"] as const).map((type) => {
              const active = settings.domain.canonicalDomain === type;
              const label = type === "apex" ? "Apex (senza www)" : "Con www";
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() =>
                    updateSection(projectId, "domain", {
                      canonicalDomain: type,
                    })
                  }
                  className={`flex-1 rounded-lg border-2 px-4 py-3 text-left transition-colors ${
                    active
                      ? "border-molten-primary-container bg-surface-container"
                      : "border-transparent bg-surface-container-lowest hover:bg-surface-container-low"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-body-sm text-on-surface">
                      {type === "apex"
                        ? project.domain
                        : `www.${project.domain}`}
                    </span>
                    {active ? (
                      <CheckCircle2 className="h-4 w-4 text-molten-primary" />
                    ) : null}
                  </div>
                  <span className="text-label-sm text-text-muted">{label}</span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="rounded-xl bg-surface-container-high p-6">
          <div className="mb-3 flex items-center gap-2.5">
            <GitMerge className="h-4 w-4 text-molten-primary" />
            <h2 className="text-title-md font-semibold text-on-surface">
              Redirect Rules
            </h2>
          </div>
          <p className="mb-4 text-body-sm text-secondary-text">
            Gestisci 301 e 302 per mantenere SEO e UX.
          </p>
          <Link
            href={`/projects/${projectId}/settings/redirects`}
            className="inline-flex items-center gap-2 rounded-lg bg-surface-container-lowest px-4 py-2 text-body-sm font-medium text-molten-primary hover:bg-surface-container-low transition-colors"
          >
            Configura Redirects →
          </Link>
        </section>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-surface-container-highest border-none sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Aggiungi Custom Domain</DialogTitle>
            <DialogDescription className="text-secondary-text">
              Inserisci il dominio. Ti mostriamo i record DNS da configurare.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 pt-2">
            <Input
              placeholder="example.ch"
              className="bg-surface-container-low border-none h-11"
            />
            <div className="rounded-lg bg-surface-container-low p-4">
              <div className="mb-2 flex items-center gap-1.5 text-label-md uppercase tracking-widest text-text-muted">
                <AlertCircle className="h-3.5 w-3.5" />
                Step successivi (mock)
              </div>
              <ol className="ml-4 list-decimal space-y-1 text-body-sm text-secondary-text">
                <li>Verifica TXT record</li>
                <li>CNAME → rezen.sites</li>
                <li>Attivazione SSL (~5 min)</li>
              </ol>
            </div>
            <GradientButton
              size="md"
              onClick={() => {
                toast.success("Verifica avviata (mock)");
                setOpen(false);
              }}
            >
              Inizia verifica
            </GradientButton>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
