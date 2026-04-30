"use client";

import { useRouter } from "next/navigation";
import { useProjectsStore } from "@/lib/stores/projects-store";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { gradientFor, initialsFor } from "@/lib/utils/hash-gradient";
import { ChevronRight } from "lucide-react";
import type { QuickAction } from "@/lib/constants/quick-actions";

/**
 * Modal di selezione progetto target dopo che l'utente ha scelto un'azione
 * rapida dal FAB nel workspace.
 *
 * Click su un progetto → router.push verso la route specifica dell'azione,
 * così la pagina target può intercettare il query param `?action=` e auto-aprire
 * il flow corrispondente.
 */
export function QuickActionsTargetModal({
  action,
  onClose,
}: {
  action: QuickAction | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const projects = useProjectsStore((s) => s.projects);

  const isOpen = action !== null;

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-surface-container-highest/95 backdrop-blur-xl border-none ring-1 ring-white/10 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-title-lg font-bold text-on-surface">
            Su quale sito?
          </DialogTitle>
          {action ? (
            <p className="text-body-sm text-secondary-text">
              Azione selezionata:{" "}
              <span className="font-semibold text-on-surface">
                {action.label}
              </span>
            </p>
          ) : null}
        </DialogHeader>

        <div className="flex max-h-[60vh] flex-col gap-1 overflow-y-auto pt-2">
          {projects.map((p) => {
            const grad = gradientFor(p.id);
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  if (!action) return;
                  router.push(action.targetRoute(p.id));
                  onClose();
                }}
                className="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-surface-container-low transition-colors"
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-label-md font-bold text-on-surface ring-1 ring-white/5"
                  style={{ background: grad.css }}
                >
                  {initialsFor(p.name)}
                </span>
                <div className="flex min-w-0 flex-1 flex-col leading-tight">
                  <span className="truncate text-body-sm font-semibold text-on-surface">
                    {p.name}
                  </span>
                  <span className="truncate font-mono text-label-sm text-text-muted">
                    {p.domain}
                  </span>
                </div>
                <ChevronRight className="h-4 w-4 text-text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-molten-primary" />
              </button>
            );
          })}

          {projects.length === 0 ? (
            <p className="px-3 py-6 text-center text-body-sm text-text-muted">
              Nessun progetto disponibile. Crea il primo dalla home.
            </p>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
