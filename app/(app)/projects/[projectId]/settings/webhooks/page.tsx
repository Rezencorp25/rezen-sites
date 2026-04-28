"use client";

import { use, useMemo, useState } from "react";
import { Webhook as WebhookIcon, Plus, Send, Trash2, Copy } from "lucide-react";
import { toast } from "sonner";
import {
  useWebhooksStore,
  EVENT_META,
  type WebhookEvent,
} from "@/lib/stores/webhooks-store";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { GradientButton } from "@/components/luminous/gradient-button";
import { StatusPill } from "@/components/luminous/status-pill";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { fmtDateLong, fmtTime } from "@/lib/utils/format-date";

const ALL_EVENTS: WebhookEvent[] = [
  "form.submission",
  "page.publish",
  "page.unpublish",
  "version.deploy",
  "alert.created",
  "campaign.created",
  "schedule.released",
];

export default function WebhooksPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = use(params);
  const allWebhooks = useWebhooksStore((s) => s.webhooks);
  const allDeliveries = useWebhooksStore((s) => s.deliveries);
  const add = useWebhooksStore((s) => s.add);
  const remove = useWebhooksStore((s) => s.remove);
  const toggle = useWebhooksStore((s) => s.toggle);
  const testFire = useWebhooksStore((s) => s.testFire);

  const webhooks = useMemo(
    () => allWebhooks.filter((w) => w.projectId === projectId),
    [allWebhooks, projectId],
  );
  const recentDeliveries = useMemo(() => {
    const ids = new Set(webhooks.map((w) => w.id));
    return allDeliveries.filter((d) => ids.has(d.webhookId)).slice(0, 10);
  }, [allDeliveries, webhooks]);

  return (
    <div className="mx-auto max-w-5xl px-10 pb-12 pt-2">
      <div className="mb-5 flex items-end justify-between">
        <div>
          <div className="flex items-center gap-2 text-label-md uppercase tracking-widest text-text-muted">
            <WebhookIcon className="h-3.5 w-3.5" />
            Webhooks
          </div>
          <h1 className="text-headline-md font-bold text-on-surface">
            Webhook outbound
          </h1>
          <p className="text-body-md text-secondary-text">
            Notifiche real-time verso Slack, Zapier, Make, CRM custom.
          </p>
        </div>
        <NewWebhookDialog projectId={projectId} onAdd={add} />
      </div>

      <section className="mb-5 overflow-hidden rounded-xl bg-surface-container-high">
        <div className="grid grid-cols-[2fr_1.5fr_100px_70px_60px] gap-4 px-6 py-3 text-label-md uppercase tracking-widest text-text-muted">
          <span>Endpoint</span>
          <span>Eventi</span>
          <span className="text-center">Test</span>
          <span className="text-center">Attivo</span>
          <span />
        </div>
        {webhooks.length === 0 ? (
          <p className="px-6 py-12 text-center text-body-md text-text-muted">
            Nessun webhook. Aggiungi il primo per ricevere notifiche real-time.
          </p>
        ) : (
          webhooks.map((w, i) => (
            <div
              key={w.id}
              className={`grid grid-cols-[2fr_1.5fr_100px_70px_60px] items-center gap-4 px-6 py-3 ${
                i % 2 === 0
                  ? "bg-surface-container-lowest"
                  : "bg-surface-container-low"
              }`}
            >
              <div className="flex flex-col leading-tight">
                <span className="text-body-sm font-semibold text-on-surface">
                  {w.name}
                </span>
                <span className="truncate font-mono text-label-sm text-text-muted">
                  {w.url}
                </span>
              </div>
              <div className="flex flex-wrap gap-1">
                {w.events.map((e) => (
                  <span
                    key={e}
                    className="rounded bg-info-container px-1.5 py-0.5 text-label-sm text-info"
                  >
                    {EVENT_META[e]}
                  </span>
                ))}
              </div>
              <button
                type="button"
                onClick={() => {
                  testFire(w.id);
                  toast.success("Test fire registrato");
                }}
                className="flex items-center justify-center gap-1 rounded-md bg-surface-container px-2 py-1 text-label-md hover:bg-surface-container-highest"
              >
                <Send className="h-3 w-3" />
                Test
              </button>
              <span className="flex justify-center">
                <Switch
                  checked={w.active}
                  onCheckedChange={() => toggle(w.id)}
                />
              </span>
              <button
                type="button"
                onClick={() => {
                  remove(w.id);
                  toast.success("Webhook rimosso");
                }}
                className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-surface-container-highest"
                aria-label="Rimuovi"
              >
                <Trash2 className="h-3.5 w-3.5 text-error" />
              </button>
            </div>
          ))
        )}
      </section>

      <section className="overflow-hidden rounded-xl bg-surface-container-high">
        <div className="flex items-center justify-between px-6 py-3">
          <h2 className="text-title-md font-semibold text-on-surface">
            Delivery log (ultimi 10)
          </h2>
          <span className="text-label-md text-text-muted">
            {recentDeliveries.length} eventi
          </span>
        </div>
        {recentDeliveries.length === 0 ? (
          <p className="px-6 py-12 text-center text-body-md text-text-muted">
            Nessuna delivery registrata.
          </p>
        ) : (
          <div className="divide-y divide-outline/10">
            {recentDeliveries.map((d) => {
              const wh = webhooks.find((w) => w.id === d.webhookId);
              return (
                <div
                  key={d.id}
                  className="grid grid-cols-[1.5fr_120px_80px_80px_140px] items-center gap-4 px-6 py-2.5 text-body-sm"
                >
                  <span className="truncate text-secondary-text">
                    <span className="font-semibold text-on-surface">
                      {wh?.name ?? d.webhookId}
                    </span>
                    {" · "}
                    {EVENT_META[d.event]}
                  </span>
                  <StatusPill
                    variant={
                      d.status === "success"
                        ? "success"
                        : d.status === "failed"
                          ? "error"
                          : "warning"
                    }
                  >
                    {d.status}
                  </StatusPill>
                  <span className="font-mono text-label-md text-text-muted tabular-nums">
                    {d.responseCode ?? "—"}
                  </span>
                  <span className="font-mono text-label-md text-text-muted tabular-nums">
                    {d.durationMs ?? "—"}ms
                  </span>
                  <span
                    className="text-right font-mono text-label-md text-text-muted"
                    suppressHydrationWarning
                  >
                    {fmtDateLong(d.at)} {fmtTime(d.at)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function NewWebhookDialog({
  projectId,
  onAdd,
}: {
  projectId: string;
  onAdd: ReturnType<typeof useWebhooksStore.getState>["add"];
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [secret, setSecret] = useState("");
  const [events, setEvents] = useState<Set<WebhookEvent>>(
    new Set(["form.submission"]),
  );

  function toggleEvent(e: WebhookEvent) {
    const next = new Set(events);
    if (next.has(e)) next.delete(e);
    else next.add(e);
    setEvents(next);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="flex items-center gap-2 rounded-lg bg-surface-container-high px-4 py-2.5 text-body-sm font-semibold text-on-surface hover:bg-surface-container-highest transition-colors">
        <Plus className="h-4 w-4 text-molten-primary" />
        Nuovo webhook
      </DialogTrigger>
      <DialogContent className="bg-surface-container-highest border-none sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nuovo webhook</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3 pt-2">
          <div className="space-y-1.5">
            <Label className="text-label-md text-secondary-text">Nome</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Slack #leads"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-label-md text-secondary-text">URL</Label>
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://hooks.slack.com/..."
              className="font-mono text-body-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-label-md text-secondary-text">
              Secret HMAC (opz)
              <button
                type="button"
                onClick={() => {
                  const random = `rzn_wh_${Math.random().toString(36).slice(2, 12)}`;
                  setSecret(random);
                  navigator.clipboard.writeText(random);
                  toast.success("Secret generato e copiato");
                }}
                className="ml-2 inline-flex items-center gap-1 text-molten-primary"
              >
                <Copy className="h-3 w-3" />
                Genera
              </button>
            </Label>
            <Input
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder="rzn_wh_..."
              className="font-mono text-body-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-label-md text-secondary-text">Eventi</Label>
            <div className="flex flex-wrap gap-1.5">
              {ALL_EVENTS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => toggleEvent(e)}
                  className={`rounded-full px-2.5 py-1 text-label-md transition-colors ${
                    events.has(e)
                      ? "bg-molten-primary-container text-on-molten"
                      : "bg-surface-container-low text-text-muted hover:bg-surface-container-high"
                  }`}
                >
                  {EVENT_META[e]}
                </button>
              ))}
            </div>
          </div>
          <GradientButton
            size="md"
            onClick={() => {
              if (!name || !url) {
                toast.error("Nome + URL obbligatori");
                return;
              }
              if (events.size === 0) {
                toast.error("Seleziona almeno 1 evento");
                return;
              }
              onAdd({
                projectId,
                name,
                url,
                events: [...events],
                secret,
                active: true,
              });
              toast.success("Webhook creato");
              setOpen(false);
              setName("");
              setUrl("");
              setSecret("");
              setEvents(new Set(["form.submission"]));
            }}
          >
            Crea webhook
          </GradientButton>
        </div>
      </DialogContent>
    </Dialog>
  );
}
