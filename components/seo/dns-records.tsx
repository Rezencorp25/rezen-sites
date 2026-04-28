"use client";

import { Copy, ServerCog, Mail } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSettingsStore } from "@/lib/stores/settings-store";

const MX_PRESETS: Record<
  string,
  { label: string; mx: string[]; spfHint: string }
> = {
  google: {
    label: "Google Workspace",
    mx: ["1 SMTP.GOOGLE.COM"],
    spfHint: "v=spf1 include:_spf.google.com ~all",
  },
  microsoft365: {
    label: "Microsoft 365",
    mx: ["0 {tenant}.mail.protection.outlook.com"],
    spfHint: "v=spf1 include:spf.protection.outlook.com -all",
  },
  fastmail: {
    label: "Fastmail",
    mx: ["10 in1-smtp.messagingengine.com", "20 in2-smtp.messagingengine.com"],
    spfHint: "v=spf1 include:spf.messagingengine.com ?all",
  },
  infomaniak: {
    label: "Infomaniak (Swiss)",
    mx: ["10 mail.infomaniak.com", "20 mail2.infomaniak.com"],
    spfHint: "v=spf1 include:spf.infomaniak.ch -all",
  },
};

function CopyableRow({
  type,
  name,
  value,
  ttl,
}: {
  type: string;
  name: string;
  value: string;
  ttl?: string;
}) {
  return (
    <div className="grid grid-cols-[80px_140px_1fr_60px_36px] items-center gap-2 rounded-md bg-surface-container-lowest px-3 py-2">
      <span className="rounded bg-info-container px-2 py-0.5 text-center font-mono text-label-sm font-bold text-info">
        {type}
      </span>
      <span className="truncate font-mono text-label-md text-secondary-text">
        {name}
      </span>
      <span className="truncate font-mono text-label-md text-on-surface">
        {value}
      </span>
      <span className="text-right font-mono text-label-md text-text-muted">
        {ttl ?? "3600"}
      </span>
      <button
        type="button"
        onClick={() => {
          navigator.clipboard.writeText(value);
          toast.success(`${type} record copiato`);
        }}
        className="flex h-7 w-7 items-center justify-center rounded-md text-text-muted hover:bg-surface-container-high hover:text-on-surface"
        aria-label="Copia"
      >
        <Copy className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export function DnsRecordsPanel({ projectId }: { projectId: string }) {
  const settings = useSettingsStore((s) => s.get(projectId));
  const updateSection = useSettingsStore((s) => s.updateSection);
  const customDomain =
    settings.domain.customDomain || settings.general.siteUrl.replace(/^https?:\/\//, "").replace(/\/$/, "") ||
    "example.ch";
  const apex = customDomain.replace(/^www\./, "");
  const mxPreset =
    settings.domain.emailAuth.mxProvider !== "custom" &&
    settings.domain.emailAuth.mxProvider !== "none"
      ? MX_PRESETS[settings.domain.emailAuth.mxProvider]
      : null;

  return (
    <section className="rounded-xl bg-surface-container-high p-6 lg:col-span-2">
      <div className="mb-4 flex items-center gap-2.5">
        <ServerCog className="h-4 w-4 text-molten-primary" />
        <h2 className="text-title-md font-semibold text-on-surface">
          DNS records — site hosting
        </h2>
      </div>
      <div className="mb-1 grid grid-cols-[80px_140px_1fr_60px_36px] gap-2 px-3 text-label-sm uppercase tracking-widest text-text-muted">
        <span>Tipo</span>
        <span>Nome</span>
        <span>Valore</span>
        <span className="text-right">TTL</span>
        <span />
      </div>
      <div className="space-y-1.5">
        <CopyableRow type="A" name="@" value="151.101.1.7" />
        <CopyableRow type="A" name="@" value="151.101.65.7" />
        <CopyableRow type="CNAME" name="www" value={apex} />
        <CopyableRow
          type="TXT"
          name="_rezen-verify"
          value="rezen-verify=k7q8m4xp2"
        />
      </div>
      <p className="mt-3 text-label-sm text-text-muted">
        Imposta questi record nel pannello DNS del registrar (Cloudflare, GoDaddy, OVH…).
        Propagazione 5min – 24h.
      </p>

      <div className="mt-6 mb-4 flex items-center gap-2.5">
        <Mail className="h-4 w-4 text-molten-primary" />
        <h2 className="text-title-md font-semibold text-on-surface">
          Email auth — SPF / DKIM / DMARC
        </h2>
      </div>

      <div className="mb-4">
        <Label className="mb-1 text-label-md text-secondary-text">
          Provider email
        </Label>
        <select
          value={settings.domain.emailAuth.mxProvider}
          onChange={(e) =>
            updateSection(projectId, "domain", {
              emailAuth: {
                ...settings.domain.emailAuth,
                mxProvider: e.target.value as
                  | "google"
                  | "microsoft365"
                  | "fastmail"
                  | "infomaniak"
                  | "custom"
                  | "none",
              },
            })
          }
          className="h-10 w-full rounded-md bg-surface-container-low px-3 text-body-sm"
        >
          <option value="none">Nessun email su questo dominio</option>
          <option value="google">Google Workspace</option>
          <option value="microsoft365">Microsoft 365</option>
          <option value="fastmail">Fastmail</option>
          <option value="infomaniak">Infomaniak (Swiss)</option>
          <option value="custom">Custom / altro provider</option>
        </select>
      </div>

      {mxPreset && (
        <div className="mb-3">
          <p className="mb-1 text-label-md text-text-muted">
            MX record da impostare:
          </p>
          <div className="space-y-1.5">
            {mxPreset.mx.map((m) => (
              <CopyableRow key={m} type="MX" name="@" value={m} />
            ))}
          </div>
        </div>
      )}

      <div className="mt-3 grid grid-cols-1 gap-3">
        <div className="space-y-1.5">
          <Label className="text-label-md text-secondary-text">
            SPF (TXT @)
          </Label>
          <Input
            value={settings.domain.emailAuth.spf}
            onChange={(e) =>
              updateSection(projectId, "domain", {
                emailAuth: { ...settings.domain.emailAuth, spf: e.target.value },
              })
            }
            placeholder={mxPreset?.spfHint ?? "v=spf1 -all"}
            className="font-mono text-body-sm"
          />
          <p className="text-label-md text-text-muted">
            Pubblica come record TXT su `@`. Solo 1 record SPF per dominio
            (combinare include).
          </p>
        </div>

        <div className="space-y-1.5">
          <Label className="text-label-md text-secondary-text">
            DKIM (TXT selector._domainkey)
          </Label>
          <Input
            value={settings.domain.emailAuth.dkim}
            onChange={(e) =>
              updateSection(projectId, "domain", {
                emailAuth: { ...settings.domain.emailAuth, dkim: e.target.value },
              })
            }
            placeholder="v=DKIM1; k=rsa; p=MIIBIjANBg..."
            className="font-mono text-body-sm"
          />
          <p className="text-label-md text-text-muted">
            Il selettore varia per provider (es. `google._domainkey`,
            `selector1._domainkey`).
          </p>
        </div>

        <div className="space-y-1.5">
          <Label className="text-label-md text-secondary-text">
            DMARC (TXT _dmarc)
          </Label>
          <Input
            value={settings.domain.emailAuth.dmarc}
            onChange={(e) =>
              updateSection(projectId, "domain", {
                emailAuth: { ...settings.domain.emailAuth, dmarc: e.target.value },
              })
            }
            placeholder="v=DMARC1; p=quarantine; rua=mailto:dmarc@example.ch"
            className="font-mono text-body-sm"
          />
          <p className="text-label-md text-text-muted">
            Inizia con `p=none` (monitoring), poi `quarantine`, infine
            `reject`.
          </p>
        </div>
      </div>
    </section>
  );
}
