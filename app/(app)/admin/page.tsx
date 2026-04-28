"use client";

import { Building, Lock, Coins, Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  useWorkspaceStore,
  type SsoProvider,
} from "@/lib/stores/workspace-store";

export default function AdminPage() {
  const config = useWorkspaceStore((s) => s.config);
  const update = useWorkspaceStore((s) => s.update);
  const updateSso = useWorkspaceStore((s) => s.updateSso);
  const updateBilling = useWorkspaceStore((s) => s.updateBilling);

  function addAllowedDomain() {
    updateSso({ allowedDomains: [...config.sso.allowedDomains, ""] });
  }
  function updateAllowedDomain(i: number, val: string) {
    const next = [...config.sso.allowedDomains];
    next[i] = val;
    updateSso({ allowedDomains: next });
  }
  function removeAllowedDomain(i: number) {
    updateSso({
      allowedDomains: config.sso.allowedDomains.filter((_, idx) => idx !== i),
    });
  }

  return (
    <div className="mx-auto max-w-5xl px-10 py-10">
      <div className="mb-6">
        <div className="flex items-center gap-2 text-label-md uppercase tracking-widest text-text-muted">
          <Building className="h-3.5 w-3.5" />
          Workspace admin
        </div>
        <h1 className="text-headline-md font-bold text-on-surface">
          Workspace settings
        </h1>
        <p className="text-body-md text-secondary-text">
          Branding, SSO &amp; billing per tutto il workspace.
        </p>
      </div>

      <section className="mb-5 rounded-xl bg-surface-container-high p-6">
        <h2 className="mb-4 text-title-md font-semibold text-on-surface">
          White-label / branding
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-label-md text-secondary-text">
              Workspace name
            </Label>
            <Input
              value={config.name}
              onChange={(e) => update({ name: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-label-md text-secondary-text">
              Brand name (visibile a clienti)
            </Label>
            <Input
              value={config.brandName}
              onChange={(e) => update({ brandName: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-label-md text-secondary-text">
              Logo URL
            </Label>
            <Input
              value={config.logoUrl}
              onChange={(e) => update({ logoUrl: e.target.value })}
              placeholder="https://cdn.example.com/logo.svg"
              className="font-mono text-body-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-label-md text-secondary-text">
              Primary color
            </Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={config.primaryColor}
                onChange={(e) => update({ primaryColor: e.target.value })}
                className="h-10 w-14 rounded-md bg-surface-container-low"
              />
              <Input
                value={config.primaryColor}
                onChange={(e) => update({ primaryColor: e.target.value })}
                className="font-mono"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-label-md text-secondary-text">
              Font family
            </Label>
            <Input
              value={config.fontFamily}
              onChange={(e) => update({ fontFamily: e.target.value })}
              placeholder="Inter, sans-serif"
              className="font-mono"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-label-md text-secondary-text">
              Email mittente — Da
            </Label>
            <Input
              value={config.emailFromName}
              onChange={(e) => update({ emailFromName: e.target.value })}
            />
          </div>
          <div className="md:col-span-2 space-y-1.5">
            <Label className="text-label-md text-secondary-text">
              Email mittente — Indirizzo
            </Label>
            <Input
              type="email"
              value={config.emailFromAddress}
              onChange={(e) => update({ emailFromAddress: e.target.value })}
              className="font-mono text-body-sm"
            />
          </div>
          <div className="md:col-span-2 flex items-center justify-between rounded-md border border-outline/20 px-3 py-2">
            <div>
              <p className="text-body-sm font-semibold text-on-surface">
                Nascondi branding REZEN
              </p>
              <p className="text-label-md text-text-muted">
                Rimuove &ldquo;Powered by REZEN&rdquo; da app shell + email
                client. Richiede piano Agency.
              </p>
            </div>
            <Switch
              checked={config.hideRezenBranding}
              onCheckedChange={(v) => update({ hideRezenBranding: v })}
            />
          </div>
        </div>
      </section>

      <section className="mb-5 rounded-xl bg-surface-container-high p-6">
        <div className="mb-4 flex items-center gap-2.5">
          <Lock className="h-4 w-4 text-molten-primary" />
          <h2 className="text-title-md font-semibold text-on-surface">
            Single Sign-On (SSO)
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-label-md text-secondary-text">
              Provider
            </Label>
            <select
              value={config.sso.provider}
              onChange={(e) =>
                updateSso({ provider: e.target.value as SsoProvider })
              }
              className="h-10 w-full rounded-md bg-surface-container-low px-3 text-body-sm"
            >
              <option value="none">Nessuno (email + password)</option>
              <option value="google">Google Workspace</option>
              <option value="azure">Azure AD / Microsoft 365</option>
              <option value="okta">Okta</option>
              <option value="saml-generic">SAML 2.0 generic</option>
            </select>
          </div>
          {config.sso.provider === "saml-generic" && (
            <div className="space-y-1.5">
              <Label className="text-label-md text-secondary-text">
                SAML metadata URL
              </Label>
              <Input
                value={config.sso.samlMetadataUrl}
                onChange={(e) =>
                  updateSso({ samlMetadataUrl: e.target.value })
                }
                placeholder="https://idp.example.com/metadata.xml"
                className="font-mono text-body-sm"
              />
            </div>
          )}
          <div className="md:col-span-2">
            <div className="mb-1.5 flex items-center justify-between">
              <Label className="text-label-md text-secondary-text">
                Domini email autorizzati
              </Label>
              <button
                type="button"
                onClick={addAllowedDomain}
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-label-md text-molten-primary hover:bg-surface-container-highest"
              >
                <Plus className="h-3 w-3" />
                Aggiungi
              </button>
            </div>
            <div className="flex flex-col gap-1.5">
              {config.sso.allowedDomains.map((d, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    value={d}
                    onChange={(e) => updateAllowedDomain(i, e.target.value)}
                    placeholder="rezencorp.com"
                    className="font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => removeAllowedDomain(i)}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-surface-container hover:bg-surface-container-highest"
                    aria-label="Rimuovi"
                  >
                    <X className="h-4 w-4 text-error" />
                  </button>
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between rounded-md border border-outline/20 px-3 py-2">
            <div>
              <p className="text-body-sm font-semibold text-on-surface">
                JIT provisioning
              </p>
              <p className="text-label-md text-text-muted">
                Auto-crea account al primo login SSO
              </p>
            </div>
            <Switch
              checked={config.sso.jitProvisioning}
              onCheckedChange={(v) => updateSso({ jitProvisioning: v })}
            />
          </div>
          <div className="flex items-center justify-between rounded-md border border-outline/20 px-3 py-2">
            <div>
              <p className="text-body-sm font-semibold text-on-surface">
                Enforce SSO
              </p>
              <p className="text-label-md text-text-muted">
                Disabilita email+password (solo SSO)
              </p>
            </div>
            <Switch
              checked={config.sso.enforceSso}
              onCheckedChange={(v) => updateSso({ enforceSso: v })}
            />
          </div>
        </div>
      </section>

      <section className="rounded-xl bg-surface-container-high p-6">
        <div className="mb-4 flex items-center gap-2.5">
          <Coins className="h-4 w-4 text-molten-primary" />
          <h2 className="text-title-md font-semibold text-on-surface">
            Billing &amp; cost allocation
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="space-y-1.5">
            <Label className="text-label-md text-secondary-text">
              Hourly rate ({config.billing.currency})
            </Label>
            <Input
              type="number"
              value={config.billing.hourlyRate}
              onChange={(e) =>
                updateBilling({
                  hourlyRate: parseInt(e.target.value, 10) || 0,
                })
              }
              className="font-mono"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-label-md text-secondary-text">
              Cost markup (%)
            </Label>
            <Input
              type="number"
              value={config.billing.costMarkup}
              onChange={(e) =>
                updateBilling({
                  costMarkup: parseInt(e.target.value, 10) || 0,
                })
              }
              className="font-mono"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-label-md text-secondary-text">
              Currency
            </Label>
            <select
              value={config.billing.currency}
              onChange={(e) =>
                updateBilling({
                  currency: e.target.value as "CHF" | "EUR" | "USD",
                })
              }
              className="h-10 w-full rounded-md bg-surface-container-low px-3 text-body-sm"
            >
              <option value="CHF">CHF</option>
              <option value="EUR">EUR</option>
              <option value="USD">USD</option>
            </select>
          </div>
        </div>
        <p className="mt-3 text-label-md text-text-muted">
          Le ore registrate nei progetti vengono fatturate al tariffario
          orario. I costi AI/hosting/API esterni sono ricaricati col
          markup configurato.
        </p>
      </section>
    </div>
  );
}
