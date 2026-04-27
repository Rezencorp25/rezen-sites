"use client";

import { use, useState } from "react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import {
  GitMerge,
  Plus,
  Zap,
  Gauge,
  Activity,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { useRedirectsStore } from "@/lib/stores/redirects-store";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { StatusPill } from "@/components/luminous/status-pill";
import { GradientButton } from "@/components/luminous/gradient-button";

export default function SettingsRedirectsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = use(params);
  const redirects = useRedirectsStore((s) => s.list(projectId));
  const add = useRedirectsStore((s) => s.add);
  const toggle = useRedirectsStore((s) => s.toggle);
  const remove = useRedirectsStore((s) => s.remove);

  const [oldPath, setOldPath] = useState("");
  const [newPath, setNewPath] = useState("");
  const [type, setType] = useState<"301" | "302">("301");

  function handleCreate() {
    if (!oldPath.trim() || !newPath.trim()) {
      toast.error("Completa entrambi i campi");
      return;
    }
    add(projectId, {
      oldPath: oldPath.trim(),
      newPath: newPath.trim(),
      type: (type === "301" ? 301 : 302) as 301 | 302,
      active: true,
    });
    setOldPath("");
    setNewPath("");
    toast.success("Redirect creato");
  }

  return (
    <div className="mx-auto max-w-5xl px-10 pb-12 pt-2">
      <section className="mb-5 rounded-xl bg-surface-container-high p-6">
        <div className="mb-5 flex items-center gap-2.5">
          <Plus className="h-4 w-4 text-molten-primary" />
          <h2 className="text-title-md font-semibold text-on-surface">
            Crea Redirect
          </h2>
        </div>
        <div className="grid gap-4 grid-cols-1 md:grid-cols-[1fr_1fr_120px_auto]">
          <div className="flex flex-col gap-1.5">
            <Label
              htmlFor="old"
              className="text-label-md text-secondary-text"
            >
              Old URL
            </Label>
            <Input
              id="old"
              value={oldPath}
              onChange={(e) => setOldPath(e.target.value)}
              placeholder="/old-path"
              className="h-10 bg-surface-container-low border-none font-mono text-body-sm"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label
              htmlFor="new"
              className="text-label-md text-secondary-text"
            >
              New URL
            </Label>
            <Input
              id="new"
              value={newPath}
              onChange={(e) => setNewPath(e.target.value)}
              placeholder="/new-path"
              className="h-10 bg-surface-container-low border-none font-mono text-body-sm"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-label-md text-secondary-text">Type</Label>
            <Select
              value={type}
              onValueChange={(v) => setType(v as "301" | "302")}
            >
              <SelectTrigger className="h-10 bg-surface-container-low border-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="301">301 Permanent</SelectItem>
                <SelectItem value="302">302 Temporary</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <GradientButton size="md" onClick={handleCreate}>
              Crea
            </GradientButton>
          </div>
        </div>
      </section>

      <section className="mb-5 overflow-hidden rounded-xl bg-surface-container-high">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <GitMerge className="h-4 w-4 text-molten-primary" />
            <h2 className="text-title-md font-semibold text-on-surface">
              Redirect Attivi
            </h2>
          </div>
          <span className="text-label-md text-text-muted">
            {redirects.length} regole
          </span>
        </div>

        {redirects.length === 0 ? (
          <div className="px-6 py-12 text-center text-body-md text-text-muted">
            Nessun redirect configurato.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-[1fr_1fr_90px_110px_90px_60px] items-center gap-4 px-6 py-3 text-label-md uppercase tracking-widest text-text-muted">
              <span>Old URL</span>
              <span>New URL</span>
              <span className="text-center">Type</span>
              <span>Creato</span>
              <span className="text-center">Attivo</span>
              <span />
            </div>
            {redirects.map((r, i) => (
              <div
                key={r.id}
                className={`grid grid-cols-[1fr_1fr_90px_110px_90px_60px] items-center gap-4 px-6 py-3 ${
                  i % 2 === 0
                    ? "bg-surface-container-lowest"
                    : "bg-surface-container-low"
                }`}
              >
                <span className="truncate font-mono text-body-sm text-on-surface">
                  {r.oldPath}
                </span>
                <span className="truncate font-mono text-body-sm text-molten-primary">
                  {r.newPath}
                </span>
                <span className="flex justify-center">
                  <StatusPill
                    variant={r.type === 301 ? "info" : "warning"}
                  >
                    {r.type}
                  </StatusPill>
                </span>
                <span className="text-body-sm text-secondary-text">
                  {format(r.createdAt, "d MMM", { locale: it })}
                </span>
                <span className="flex justify-center">
                  <Switch
                    checked={r.active}
                    onCheckedChange={() => toggle(projectId, r.id)}
                  />
                </span>
                <button
                  type="button"
                  onClick={() => {
                    remove(projectId, r.id);
                    toast.success("Redirect rimosso");
                  }}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-container hover:bg-surface-container-highest"
                  aria-label="Rimuovi"
                >
                  <Trash2 className="h-3.5 w-3.5 text-error" />
                </button>
              </div>
            ))}
          </>
        )}
      </section>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
        <InfoCard
          icon={Zap}
          title="Performance Edge"
          description="Redirect eseguiti sul CDN in <15ms, zero hop server."
        />
        <InfoCard
          icon={Gauge}
          title="SEO Friendly"
          description="301 preservano link equity. Tracciamo automaticamente le catene."
        />
        <InfoCard
          icon={Activity}
          title="Monitoraggio"
          description="Alert automatico su redirect loop, catene > 2 hop, 404 ricorrenti."
        />
      </div>
    </div>
  );
}

function InfoCard({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Zap;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl bg-surface-container-high p-5">
      <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-surface-container-lowest">
        <Icon className="h-4 w-4 text-molten-primary" />
      </div>
      <h3 className="text-body-md font-semibold text-on-surface">{title}</h3>
      <p className="text-body-sm text-secondary-text">{description}</p>
    </div>
  );
}
