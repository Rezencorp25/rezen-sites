"use client";

import { ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useSettingsStore } from "@/lib/stores/settings-store";

export function ConsentEditor({ projectId }: { projectId: string }) {
  const settings = useSettingsStore((s) => s.get(projectId));
  const updateSection = useSettingsStore((s) => s.updateSection);
  const c = settings.consent;

  function patch(p: Partial<typeof c>) {
    updateSection(projectId, "consent", p);
  }

  function toggleVendor(k: keyof typeof c.vendors) {
    patch({ vendors: { ...c.vendors, [k]: !c.vendors[k] } });
  }

  return (
    <section className="rounded-xl bg-surface-container-high p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="h-4 w-4 text-molten-primary" />
          <h2 className="text-title-md font-semibold text-on-surface">
            Cookie banner & GDPR consent
          </h2>
        </div>
        <Switch
          checked={c.enabled}
          onCheckedChange={(v) => patch({ enabled: v })}
        />
      </div>

      {!c.enabled ? (
        <p className="text-body-sm text-text-muted">
          Attiva per iniettare automaticamente un cookie banner GDPR-compliant
          (Consent Mode v2) in tutte le pagine esportate. Blocca gli script di
          tracking finché l&apos;utente non dà consenso.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <p className="mb-2 text-label-md text-secondary-text">
              Regimi normativi attivi
            </p>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
              <RegionPill
                label="GDPR"
                desc="EU + CH + UK"
                value={c.regions.gdpr}
                onChange={() =>
                  patch({ regions: { ...c.regions, gdpr: !c.regions.gdpr } })
                }
              />
              <RegionPill
                label="CCPA"
                desc="California"
                value={c.regions.ccpa}
                onChange={() =>
                  patch({ regions: { ...c.regions, ccpa: !c.regions.ccpa } })
                }
              />
              <RegionPill
                label="LGPD"
                desc="Brasil"
                value={c.regions.lgpd}
                onChange={() =>
                  patch({ regions: { ...c.regions, lgpd: !c.regions.lgpd } })
                }
              />
              <RegionPill
                label="PIPEDA"
                desc="Canada"
                value={c.regions.pipeda}
                onChange={() =>
                  patch({
                    regions: { ...c.regions, pipeda: !c.regions.pipeda },
                  })
                }
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-label-md text-secondary-text">
              Lingua banner (lascia vuoto per default progetto)
            </Label>
            <Input
              value={c.locale}
              onChange={(e) => patch({ locale: e.target.value })}
              placeholder={settings.general.defaultLocale}
              className="font-mono"
              maxLength={8}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-label-md text-secondary-text">
              Privacy Policy URL
            </Label>
            <Input
              value={c.privacyPolicyUrl}
              onChange={(e) => patch({ privacyPolicyUrl: e.target.value })}
              placeholder="/privacy"
            />
          </div>
          <div className="flex flex-col gap-1.5 md:col-span-2">
            <Label className="text-label-md text-secondary-text">
              Cookie Policy URL
            </Label>
            <Input
              value={c.cookiePolicyUrl}
              onChange={(e) => patch({ cookiePolicyUrl: e.target.value })}
              placeholder="/cookies"
            />
          </div>

          <div className="md:col-span-2">
            <p className="mb-2 text-label-md text-secondary-text">
              Categorie da gating
            </p>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              <VendorRow
                label="Analytics"
                desc="GA4, Hotjar, statistiche di utilizzo"
                value={c.vendors.analytics}
                onChange={() => toggleVendor("analytics")}
              />
              <VendorRow
                label="Pubblicità"
                desc="Google Ads, Meta Pixel, conversion tracking"
                value={c.vendors.ads}
                onChange={() => toggleVendor("ads")}
              />
              <VendorRow
                label="Marketing"
                desc="Remarketing, audience-building, lookalikes"
                value={c.vendors.marketing}
                onChange={() => toggleVendor("marketing")}
              />
              <VendorRow
                label="Social embed"
                desc="YouTube, Twitter, embed terze parti"
                value={c.vendors.social}
                onChange={() => toggleVendor("social")}
              />
            </div>
          </div>
          <p className="md:col-span-2 text-label-sm text-text-muted">
            Il banner emette `gtag(&apos;consent&apos;, &apos;update&apos;, …)` (Consent Mode v2)
            e attiva l&apos;evento `rezen:consent` su `document` per gating custom.
          </p>
        </div>
      )}
    </section>
  );
}

function VendorRow({
  label,
  desc,
  value,
  onChange,
}: {
  label: string;
  desc: string;
  value: boolean;
  onChange: () => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-md border border-outline/20 px-3 py-2">
      <div>
        <p className="text-body-sm font-semibold text-on-surface">{label}</p>
        <p className="text-label-md text-text-muted">{desc}</p>
      </div>
      <Switch checked={value} onCheckedChange={onChange} />
    </div>
  );
}

function RegionPill({
  label,
  desc,
  value,
  onChange,
}: {
  label: string;
  desc: string;
  value: boolean;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`flex flex-col items-start rounded-md border px-3 py-2 text-left transition-colors ${
        value
          ? "border-molten-primary-container bg-surface-container"
          : "border-outline/20 bg-surface-container-low hover:bg-surface-container"
      }`}
    >
      <span className="text-body-sm font-semibold text-on-surface">
        {label}
        {value && (
          <span className="ml-2 inline-block rounded-full bg-success-container px-1.5 py-0.5 text-label-sm text-success">
            ON
          </span>
        )}
      </span>
      <span className="text-label-md text-text-muted">{desc}</span>
    </button>
  );
}
