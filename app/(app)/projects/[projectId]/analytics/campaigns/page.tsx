"use client";

import { use, useState } from "react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { Megaphone, Plus, Pause, Play, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  useCampaignsStore,
  PLATFORM_META,
  type CampaignPlatform,
  type CampaignObjective,
  type CampaignStatus,
} from "@/lib/stores/campaigns-store";
import { useAuditStore } from "@/lib/stores/audit-store";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { GradientButton } from "@/components/luminous/gradient-button";
import { StatusPill } from "@/components/luminous/status-pill";

const STATUS_VARIANT: Record<
  CampaignStatus,
  "neutral" | "info" | "success" | "warning" | "error"
> = {
  draft: "neutral",
  active: "success",
  paused: "warning",
  ended: "neutral",
};

export default function CampaignsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = use(params);
  const campaigns = useCampaignsStore((s) => s.list(projectId));
  const update = useCampaignsStore((s) => s.update);
  const remove = useCampaignsStore((s) => s.remove);
  const log = useAuditStore((s) => s.log);

  const totals = campaigns.reduce(
    (acc, c) => ({
      activeCount: acc.activeCount + (c.status === "active" ? 1 : 0),
      dailyBudget: acc.dailyBudget + (c.status === "active" ? c.dailyBudget : 0),
      totalSpent: acc.totalSpent + c.totalSpent,
    }),
    { activeCount: 0, dailyBudget: 0, totalSpent: 0 },
  );

  return (
    <div className="mx-auto max-w-7xl px-10 py-10">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <div className="flex items-center gap-2 text-label-md uppercase tracking-widest text-text-muted">
            <Megaphone className="h-3.5 w-3.5" />
            Campaigns
          </div>
          <h1 className="text-headline-md font-bold text-on-surface">
            Paid Media Campaigns
          </h1>
          <p className="text-body-md text-secondary-text">
            {totals.activeCount} attive · CHF {totals.dailyBudget}/giorno · CHF{" "}
            {totals.totalSpent.toFixed(0)} spesi totali
          </p>
        </div>
        <NewCampaignDialog projectId={projectId} />
      </div>

      {campaigns.length === 0 ? (
        <div className="rounded-xl border border-dashed border-outline/30 px-8 py-16 text-center">
          <Megaphone className="mx-auto mb-3 h-8 w-8 text-text-muted" />
          <p className="text-body-md text-secondary-text">
            Nessuna campagna ancora. Crea la prima con &ldquo;Nuova campagna&rdquo;.
          </p>
        </div>
      ) : (
        <section className="overflow-hidden rounded-xl bg-surface-container-high">
          <div className="grid grid-cols-[2fr_120px_140px_120px_100px_100px_60px] gap-4 px-6 py-3 text-label-md uppercase tracking-widest text-text-muted">
            <span>Nome</span>
            <span>Platform</span>
            <span>Objective</span>
            <span className="text-right">Budget/gg</span>
            <span className="text-right">Spent</span>
            <span className="text-center">Status</span>
            <span />
          </div>
          {campaigns.map((c, i) => (
            <div
              key={c.id}
              className={`grid grid-cols-[2fr_120px_140px_120px_100px_100px_60px] items-center gap-4 px-6 py-3 ${
                i % 2 === 0
                  ? "bg-surface-container-lowest"
                  : "bg-surface-container-low"
              }`}
            >
              <div className="flex flex-col leading-tight">
                <span className="text-body-sm font-semibold text-on-surface">
                  {c.name}
                </span>
                <span className="font-mono text-label-sm text-text-muted">
                  {c.landingUrl}
                </span>
              </div>
              <span
                className="inline-flex w-fit rounded px-2 py-0.5 text-label-sm font-bold text-on-molten"
                style={{ background: PLATFORM_META[c.platform].color }}
              >
                {PLATFORM_META[c.platform].label}
              </span>
              <span className="text-body-sm capitalize text-secondary-text">
                {c.objective}
              </span>
              <span className="text-right font-mono text-body-sm text-on-surface tabular-nums">
                CHF {c.dailyBudget}
              </span>
              <span className="text-right font-mono text-body-sm text-secondary-text tabular-nums">
                CHF {c.totalSpent.toFixed(0)}
              </span>
              <span className="flex justify-center">
                <StatusPill variant={STATUS_VARIANT[c.status]}>
                  {c.status}
                </StatusPill>
              </span>
              <div className="flex items-center justify-end gap-1">
                {c.status === "active" ? (
                  <button
                    type="button"
                    onClick={() => {
                      update(c.id, { status: "paused" });
                      log({
                        actor: { id: "u-owner", name: "Te" },
                        action: "campaign.pause",
                        description: `Campagna "${c.name}" in pausa`,
                        target: { kind: "campaign", id: c.id, name: c.name },
                      });
                      toast.success("Campagna in pausa");
                    }}
                    aria-label="Pausa"
                    className="flex h-7 w-7 items-center justify-center rounded-md text-warning hover:bg-surface-container-highest"
                  >
                    <Pause className="h-3.5 w-3.5" />
                  </button>
                ) : c.status === "paused" ? (
                  <button
                    type="button"
                    onClick={() => {
                      update(c.id, { status: "active" });
                      toast.success("Campagna riattivata");
                    }}
                    aria-label="Riattiva"
                    className="flex h-7 w-7 items-center justify-center rounded-md text-success hover:bg-surface-container-highest"
                  >
                    <Play className="h-3.5 w-3.5" />
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => {
                    remove(c.id);
                    toast.success("Campagna rimossa");
                  }}
                  aria-label="Rimuovi"
                  className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-surface-container-highest"
                >
                  <Trash2 className="h-3.5 w-3.5 text-error" />
                </button>
              </div>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}

function NewCampaignDialog({ projectId }: { projectId: string }) {
  const add = useCampaignsStore((s) => s.add);
  const log = useAuditStore((s) => s.log);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [platform, setPlatform] = useState<CampaignPlatform>("google-ads");
  const [objective, setObjective] = useState<CampaignObjective>("leads");
  const [dailyBudget, setDailyBudget] = useState(20);
  const [landingUrl, setLandingUrl] = useState("");
  const [audienceNotes, setAudienceNotes] = useState("");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="flex items-center gap-2 rounded-lg bg-surface-container-high px-4 py-2.5 text-body-sm font-semibold text-on-surface hover:bg-surface-container-highest transition-colors">
        <Plus className="h-4 w-4 text-molten-primary" />
        Nuova campagna
      </DialogTrigger>
      <DialogContent className="bg-surface-container-highest border-none sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nuova campagna</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3 pt-2">
          <div className="space-y-1.5">
            <Label className="text-label-md text-secondary-text">Nome</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Lead gen Q2 2026"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-label-md text-secondary-text">
                Platform
              </Label>
              <select
                value={platform}
                onChange={(e) =>
                  setPlatform(e.target.value as CampaignPlatform)
                }
                className="h-10 w-full rounded-md bg-surface-container-low px-3 text-body-sm"
              >
                {(Object.keys(PLATFORM_META) as CampaignPlatform[]).map((p) => (
                  <option key={p} value={p}>
                    {PLATFORM_META[p].label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-label-md text-secondary-text">
                Objective
              </Label>
              <select
                value={objective}
                onChange={(e) =>
                  setObjective(e.target.value as CampaignObjective)
                }
                className="h-10 w-full rounded-md bg-surface-container-low px-3 text-body-sm"
              >
                <option value="awareness">Awareness</option>
                <option value="traffic">Traffic</option>
                <option value="leads">Leads</option>
                <option value="sales">Sales</option>
                <option value="brand">Brand</option>
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-label-md text-secondary-text">
              Budget giornaliero (CHF)
            </Label>
            <Input
              type="number"
              min={1}
              value={dailyBudget}
              onChange={(e) => setDailyBudget(parseInt(e.target.value, 10) || 0)}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-label-md text-secondary-text">
              Landing page
            </Label>
            <Input
              value={landingUrl}
              onChange={(e) => setLandingUrl(e.target.value)}
              placeholder="https://example.ch/landing"
              className="font-mono text-body-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-label-md text-secondary-text">
              Note audience (opz.)
            </Label>
            <Textarea
              rows={2}
              value={audienceNotes}
              onChange={(e) => setAudienceNotes(e.target.value)}
              placeholder="Età, interessi, lookalike..."
            />
          </div>
          <GradientButton
            size="md"
            onClick={() => {
              if (!name || !landingUrl) {
                toast.error("Nome + landing obbligatori");
                return;
              }
              const id = add({
                projectId,
                name,
                platform,
                objective,
                status: "draft",
                dailyBudget,
                startDate: new Date().toISOString().slice(0, 10),
                landingUrl,
                audienceNotes,
              });
              log({
                actor: { id: "u-owner", name: "Te" },
                action: "campaign.create",
                description: `Creata campagna ${PLATFORM_META[platform].label} "${name}"`,
                target: { kind: "campaign", id, name },
              });
              toast.success("Campagna creata in draft");
              setOpen(false);
              setName("");
              setLandingUrl("");
              setAudienceNotes("");
            }}
          >
            Crea campagna
          </GradientButton>
        </div>
      </DialogContent>
    </Dialog>
  );
}
