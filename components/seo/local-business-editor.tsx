"use client";

import { MapPin, Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  useSettingsStore,
  type LocalBusinessSettings,
} from "@/lib/stores/settings-store";

export function LocalBusinessEditor({ projectId }: { projectId: string }) {
  const settings = useSettingsStore((s) => s.get(projectId));
  const updateSection = useSettingsStore((s) => s.updateSection);
  const lb = settings.localBusiness;

  function patch(p: Partial<LocalBusinessSettings>) {
    updateSection(projectId, "localBusiness", p);
  }

  function addServiceArea() {
    patch({ serviceArea: [...lb.serviceArea, ""] });
  }
  function updateServiceArea(i: number, val: string) {
    const next = [...lb.serviceArea];
    next[i] = val;
    patch({ serviceArea: next });
  }
  function removeServiceArea(i: number) {
    patch({ serviceArea: lb.serviceArea.filter((_, idx) => idx !== i) });
  }

  function addOpeningHours() {
    patch({ openingHours: [...lb.openingHours, "Mo-Fr 09:00-18:00"] });
  }
  function updateOpeningHours(i: number, val: string) {
    const next = [...lb.openingHours];
    next[i] = val;
    patch({ openingHours: next });
  }
  function removeOpeningHours(i: number) {
    patch({ openingHours: lb.openingHours.filter((_, idx) => idx !== i) });
  }

  function addSameAs() {
    patch({ sameAs: [...lb.sameAs, ""] });
  }
  function updateSameAs(i: number, val: string) {
    const next = [...lb.sameAs];
    next[i] = val;
    patch({ sameAs: next });
  }
  function removeSameAs(i: number) {
    patch({ sameAs: lb.sameAs.filter((_, idx) => idx !== i) });
  }

  return (
    <section className="rounded-xl bg-surface-container-high p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <MapPin className="h-4 w-4 text-molten-primary" />
          <h2 className="text-title-md font-semibold text-on-surface">
            Local Business (NAP + Schema)
          </h2>
        </div>
        <Switch
          checked={lb.enabled}
          onCheckedChange={(v) => patch({ enabled: v })}
        />
      </div>

      {!lb.enabled ? (
        <p className="text-body-sm text-text-muted">
          Attiva per generare automaticamente schema LocalBusiness JSON-LD nelle
          pagine esportate. Utile per business con presenza fisica (ristoranti,
          studi, agenzie locali).
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Nome legale">
            <Input
              value={lb.legalName}
              onChange={(e) => patch({ legalName: e.target.value })}
              placeholder="(eredita nome progetto)"
            />
          </Field>
          <Field label="Telefono">
            <Input
              value={lb.telephone}
              onChange={(e) => patch({ telephone: e.target.value })}
              placeholder="+41 91 111 22 33"
            />
          </Field>
          <Field label="Email">
            <Input
              type="email"
              value={lb.email}
              onChange={(e) => patch({ email: e.target.value })}
              placeholder="info@dominio.ch"
            />
          </Field>
          <Field label="Fascia prezzo">
            <Input
              value={lb.priceRange}
              onChange={(e) => patch({ priceRange: e.target.value })}
              placeholder="€€ / $$ / CHF"
            />
          </Field>

          <Field label="Indirizzo (via + civico)" full>
            <Input
              value={lb.streetAddress}
              onChange={(e) => patch({ streetAddress: e.target.value })}
              placeholder="Via Centrale 12"
            />
          </Field>

          <Field label="CAP">
            <Input
              value={lb.postalCode}
              onChange={(e) => patch({ postalCode: e.target.value })}
              placeholder="6900"
            />
          </Field>
          <Field label="Località">
            <Input
              value={lb.addressLocality}
              onChange={(e) => patch({ addressLocality: e.target.value })}
              placeholder="Lugano"
            />
          </Field>
          <Field label="Regione/Cantone">
            <Input
              value={lb.addressRegion}
              onChange={(e) => patch({ addressRegion: e.target.value })}
              placeholder="Ticino"
            />
          </Field>
          <Field label="Paese (ISO 3166-1 alpha-2)">
            <Input
              value={lb.addressCountry}
              onChange={(e) => patch({ addressCountry: e.target.value })}
              maxLength={2}
              placeholder="CH"
            />
          </Field>

          <Field label="Latitudine (geo)">
            <Input
              type="number"
              step="0.000001"
              value={lb.geoLat ?? ""}
              onChange={(e) =>
                patch({
                  geoLat: e.target.value ? Number(e.target.value) : undefined,
                })
              }
              placeholder="46.0037"
            />
          </Field>
          <Field label="Longitudine (geo)">
            <Input
              type="number"
              step="0.000001"
              value={lb.geoLng ?? ""}
              onChange={(e) =>
                patch({
                  geoLng: e.target.value ? Number(e.target.value) : undefined,
                })
              }
              placeholder="8.9510"
            />
          </Field>

          <ListField
            label="Orari di apertura (formato OSM, es. Mo-Fr 09:00-18:00)"
            full
            values={lb.openingHours}
            onAdd={addOpeningHours}
            onChange={updateOpeningHours}
            onRemove={removeOpeningHours}
            placeholder="Mo-Fr 09:00-18:00"
          />

          <ListField
            label="Aree servite (es. città, regioni)"
            full
            values={lb.serviceArea}
            onAdd={addServiceArea}
            onChange={updateServiceArea}
            onRemove={removeServiceArea}
            placeholder="Lugano"
          />

          <ListField
            label="Profili social (sameAs URL)"
            full
            values={lb.sameAs}
            onAdd={addSameAs}
            onChange={updateSameAs}
            onRemove={removeSameAs}
            placeholder="https://www.linkedin.com/company/..."
          />
        </div>
      )}
    </section>
  );
}

function Field({
  label,
  full,
  children,
}: {
  label: string;
  full?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${full ? "md:col-span-2" : ""}`}>
      <Label className="text-label-md text-secondary-text">{label}</Label>
      {children}
    </div>
  );
}

function ListField({
  label,
  full,
  values,
  onAdd,
  onChange,
  onRemove,
  placeholder,
}: {
  label: string;
  full?: boolean;
  values: string[];
  onAdd: () => void;
  onChange: (i: number, v: string) => void;
  onRemove: (i: number) => void;
  placeholder?: string;
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${full ? "md:col-span-2" : ""}`}>
      <div className="flex items-center justify-between">
        <Label className="text-label-md text-secondary-text">{label}</Label>
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-label-md text-molten-primary hover:bg-surface-container-highest"
        >
          <Plus className="h-3 w-3" />
          Aggiungi
        </button>
      </div>
      {values.length === 0 ? (
        <p className="rounded-md border border-dashed border-outline/30 px-3 py-2 text-label-md text-text-muted">
          Nessuno
        </p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {values.map((v, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input
                value={v}
                onChange={(e) => onChange(i, e.target.value)}
                placeholder={placeholder}
              />
              <button
                type="button"
                onClick={() => onRemove(i)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-surface-container hover:bg-surface-container-highest"
                aria-label="Rimuovi"
              >
                <X className="h-4 w-4 text-error" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
