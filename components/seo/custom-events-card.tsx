"use client";

import { useMemo, useState } from "react";
import { ListChecks, Plus, Trash2, Star } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useEventsStore, type CustomEvent } from "@/lib/stores/events-store";

const TRIGGER_OPTIONS: CustomEvent["trigger"][] = [
  "click",
  "view",
  "submit",
  "scroll",
  "custom",
];

export function CustomEventsCard({ projectId }: { projectId: string }) {
  const allEvents = useEventsStore((s) => s.events);
  const events = useMemo(
    () => allEvents.filter((e) => e.projectId === projectId),
    [allEvents, projectId],
  );
  const add = useEventsStore((s) => s.add);
  const update = useEventsStore((s) => s.update);
  const remove = useEventsStore((s) => s.remove);

  const [name, setName] = useState("");
  const [trigger, setTrigger] = useState<CustomEvent["trigger"]>("click");
  const [selector, setSelector] = useState("");
  const [isConversion, setIsConversion] = useState(false);

  return (
    <section className="rounded-xl bg-surface-container-high p-6">
      <div className="mb-4 flex items-center gap-2.5">
        <ListChecks className="h-4 w-4 text-molten-primary" />
        <h2 className="text-title-md font-semibold text-on-surface">
          GA4 Custom events
        </h2>
      </div>
      <p className="mb-3 text-body-sm text-text-muted">
        Eventi custom da inviare a GA4. I conversioni vengono importate
        automaticamente in Google Ads come Conversion Action.
      </p>

      <div className="mb-4 grid grid-cols-1 gap-2 md:grid-cols-[1fr_120px_1fr_auto]">
        <Input
          value={name}
          onChange={(e) =>
            setName(
              e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 40),
            )
          }
          placeholder="form_submit"
          className="font-mono"
        />
        <select
          value={trigger}
          onChange={(e) => setTrigger(e.target.value as CustomEvent["trigger"])}
          className="h-10 rounded-md bg-surface-container-low px-3 text-body-sm"
        >
          {TRIGGER_OPTIONS.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <Input
          value={selector}
          onChange={(e) => setSelector(e.target.value)}
          placeholder={
            trigger === "scroll"
              ? "75 (% scroll)"
              : trigger === "view"
                ? "/pricing-plans"
                : "form.contact"
          }
          className="font-mono"
        />
        <button
          type="button"
          onClick={() => {
            if (!name || !selector) {
              toast.error("Nome + selector obbligatori");
              return;
            }
            add({
              projectId,
              name,
              trigger,
              selector,
              isConversion,
            });
            toast.success("Evento creato");
            setName("");
            setSelector("");
            setIsConversion(false);
          }}
          className="flex items-center gap-1 rounded-md bg-surface-container-lowest px-3 py-2 text-body-sm font-semibold text-molten-primary hover:bg-surface-container"
        >
          <Plus className="h-3.5 w-3.5" />
          Crea
        </button>
        <div className="flex items-center gap-2 md:col-span-4">
          <Label className="text-label-md text-secondary-text">
            Conversion event:
          </Label>
          <Switch
            checked={isConversion}
            onCheckedChange={setIsConversion}
          />
        </div>
      </div>

      {events.length === 0 ? (
        <p className="rounded-md border border-dashed border-outline/30 px-3 py-2 text-label-md text-text-muted">
          Nessun evento custom. Aggiungi sopra (es. `form_submit`,
          `cta_click`).
        </p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-outline/20">
          <div className="grid grid-cols-[1fr_90px_1.4fr_120px_80px_50px] gap-3 bg-surface-container-low px-3 py-2 text-label-sm uppercase tracking-wider text-text-muted">
            <span>Nome</span>
            <span>Trigger</span>
            <span>Selector</span>
            <span className="text-right">Conv (30d)</span>
            <span className="text-center">Conv?</span>
            <span />
          </div>
          {events.map((e, i) => (
            <div
              key={e.id}
              className={`grid grid-cols-[1fr_90px_1.4fr_120px_80px_50px] items-center gap-3 px-3 py-2 ${
                i % 2 === 0
                  ? "bg-surface-container-lowest"
                  : "bg-surface-container-low"
              }`}
            >
              <span className="font-mono text-body-sm text-on-surface">
                {e.name}
              </span>
              <span className="text-label-md text-secondary-text">
                {e.trigger}
              </span>
              <span className="truncate font-mono text-label-md text-secondary-text">
                {e.selector}
              </span>
              <span className="text-right font-mono text-body-sm text-on-surface tabular-nums">
                {e.count30d.toLocaleString("it-IT")}
              </span>
              <span className="flex items-center justify-center gap-1">
                {e.isConversion ? (
                  <Star className="h-3.5 w-3.5 fill-warning text-warning" />
                ) : (
                  <Switch
                    checked={false}
                    onCheckedChange={() =>
                      update(e.id, { isConversion: true })
                    }
                  />
                )}
              </span>
              <button
                type="button"
                onClick={() => {
                  remove(e.id);
                  toast.success("Evento rimosso");
                }}
                className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-surface-container-highest"
                aria-label="Rimuovi"
              >
                <Trash2 className="h-3.5 w-3.5 text-error" />
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
