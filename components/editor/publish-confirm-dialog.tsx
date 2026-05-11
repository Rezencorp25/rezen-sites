"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Sparkles, Globe, Copy, Check, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useProjectsStore } from "@/lib/stores/projects-store";
import type { Project } from "@/types";

type Props = {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  project: Project | undefined;
  /** The "stock" URL that will be active immediately after publish. */
  defaultPublishUrl: string;
  /** Triggered when user confirms the publish. */
  onConfirm: () => Promise<void> | void;
  /** True while the backend publish call is in flight. */
  publishing: boolean;
};

/**
 * Confirmation modal for the "Pubblica" button.
 *
 * Two-section UX:
 *   1. URL preview — the stock URL the site will be live on once published.
 *      Always shown, copy-to-clipboard.
 *   2. Custom domain — optional. User edits project.domain inline, and we
 *      show DNS instructions (CNAME) so they can point a real domain to
 *      the App Hosting URL. The DNS verification + Firebase Hosting custom
 *      domain hookup itself is a separate sprint (S7.13) — for now we
 *      persist the domain on the project and surface the instructions.
 */
export function PublishConfirmDialog({
  open,
  onOpenChange,
  project,
  defaultPublishUrl,
  onConfirm,
  publishing,
}: Props) {
  const updateProject = useProjectsStore((s) => s.updateProject);
  const [customDomain, setCustomDomain] = useState(project?.domain ?? "");
  const [useCustom, setUseCustom] = useState(
    !!project?.domain && !project.domain.includes(".rezen.sites"),
  );
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (open && project) {
      setCustomDomain(project.domain);
      setUseCustom(!!project.domain && !project.domain.includes(".rezen.sites"));
    }
  }, [open, project]);

  if (!project) return null;

  const appHostingHost = (() => {
    try {
      return new URL(defaultPublishUrl).host;
    } catch {
      return "";
    }
  })();

  async function handleCopy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Impossibile copiare negli appunti");
    }
  }

  function handleSaveDomain() {
    const trimmed = customDomain.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/$/, "");
    if (!project) return;
    if (useCustom && !/^[a-z0-9.-]+\.[a-z]{2,}$/.test(trimmed)) {
      toast.error("Dominio non valido — usa il formato esempio.it o blog.esempio.it");
      return;
    }
    updateProject(project.id, {
      domain: useCustom ? trimmed : `${project.id}.rezen.sites`,
    });
    toast.success(
      useCustom
        ? `Dominio "${trimmed}" associato al progetto`
        : "Dominio custom rimosso — verrà usato l'URL di staging",
    );
  }

  async function handleConfirm() {
    handleSaveDomain();
    await onConfirm();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-molten-primary" />
            Pubblica {project.name}
          </DialogTitle>
          <DialogDescription>
            Stai per caricare la versione corrente del sito su Firebase
            Storage e renderla live.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* URL preview */}
          <section className="space-y-2">
            <p className="text-label-sm font-semibold uppercase tracking-wider text-text-muted">
              URL di staging (sempre attivo)
            </p>
            <div className="flex items-center gap-2 rounded-lg border border-outline/30 bg-surface-container-lowest px-3 py-2">
              <Globe className="h-4 w-4 shrink-0 text-text-muted" />
              <code className="flex-1 truncate font-mono text-body-sm text-on-surface">
                {defaultPublishUrl}
              </code>
              <button
                type="button"
                onClick={() => handleCopy(defaultPublishUrl)}
                className="rounded p-1 text-text-muted hover:bg-surface-container hover:text-on-surface"
                title="Copia URL"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-success" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
              <a
                href={defaultPublishUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded p-1 text-text-muted hover:bg-surface-container hover:text-on-surface"
                title="Apri in nuova scheda"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
            <p className="text-label-xs text-text-muted">
              Questo URL è generato automaticamente e funziona sempre. Non
              richiede configurazione DNS.
            </p>
          </section>

          {/* Custom domain */}
          <section className="space-y-2">
            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-outline/30 bg-surface-container-lowest p-3 hover:border-outline/60">
              <input
                type="checkbox"
                checked={useCustom}
                onChange={(e) => setUseCustom(e.target.checked)}
                className="mt-1"
              />
              <div className="flex-1">
                <p className="text-body-sm font-medium text-on-surface">
                  Collega un dominio custom
                </p>
                <p className="text-label-xs text-text-muted">
                  Punta il tuo dominio (es. esempio.it) al sito tramite un
                  record DNS CNAME. Il DNS può richiedere fino a 24h.
                </p>
              </div>
            </label>

            {useCustom && (
              <div className="space-y-3 rounded-lg border border-outline/30 bg-surface-container-lowest p-3">
                <label className="flex flex-col gap-1">
                  <span className="text-label-xs font-medium uppercase tracking-wider text-text-muted">
                    Dominio
                  </span>
                  <input
                    type="text"
                    value={customDomain}
                    onChange={(e) => setCustomDomain(e.target.value)}
                    placeholder="esempio.it"
                    className="rounded-md border border-outline/40 bg-surface-container-lowest px-2 py-1.5 font-mono text-body-sm focus:border-molten-primary focus:outline-none"
                  />
                </label>
                <div className="space-y-1.5">
                  <p className="text-label-xs font-medium uppercase tracking-wider text-text-muted">
                    Configura questo record DNS
                  </p>
                  <div className="rounded-md border border-outline/30 bg-surface-container px-3 py-2 font-mono text-label-xs text-on-surface">
                    <div className="flex justify-between gap-2">
                      <span className="text-text-muted">Tipo</span>
                      <span>CNAME</span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-text-muted">Nome</span>
                      <span>{customDomain.startsWith("www.") ? "www" : "@"}</span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-text-muted">Valore</span>
                      <span className="truncate">{appHostingHost}</span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-text-muted">TTL</span>
                      <span>3600</span>
                    </div>
                  </div>
                  <p className="text-label-xs text-text-muted">
                    La verifica DNS automatica (HTTPS + custom domain
                    Firebase) sarà disponibile in uno sprint dedicato. Per
                    ora il record CNAME funziona ma richiede setup manuale
                    su Firebase Console.
                  </p>
                </div>
              </div>
            )}
          </section>
        </div>

        <DialogFooter className="gap-2">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={publishing}
            className="rounded-lg px-4 py-2 text-body-sm font-medium text-text-muted hover:bg-surface-container hover:text-on-surface disabled:opacity-50"
          >
            Annulla
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={publishing}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-body-sm font-semibold text-on-molten",
              publishing && "opacity-60 cursor-not-allowed",
            )}
            style={{ background: "linear-gradient(135deg,#ffb599,#f56117)" }}
          >
            {publishing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Pubblicazione…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Pubblica ora
              </>
            )}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
