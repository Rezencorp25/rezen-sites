"use client";

import { toast } from "sonner";
import { Zap, Upload, RefreshCw, Plus, Activity } from "lucide-react";

const ACTIONS = [
  {
    id: "new-post",
    label: "Nuovo Post",
    icon: Plus,
    variant: "primary" as const,
  },
  {
    id: "publish-preview",
    label: "Pubblica Preview",
    icon: Upload,
    variant: "ghost" as const,
  },
  {
    id: "sync-cms",
    label: "Sincronizza CMS",
    icon: RefreshCw,
    variant: "ghost" as const,
  },
];

export function QuickActions() {
  return (
    <div className="flex flex-col rounded-xl bg-surface-container-high">
      <div className="flex items-center gap-2.5 px-6 py-5">
        <Zap className="h-5 w-5 text-molten-primary" />
        <h3 className="text-title-md font-semibold text-on-surface">
          Azioni Rapide
        </h3>
      </div>
      <div className="flex flex-col gap-2 px-3 pb-4">
        {ACTIONS.map((action) => {
          const Icon = action.icon;
          if (action.variant === "primary") {
            return (
              <button
                key={action.id}
                type="button"
                onClick={() => toast.success(`${action.label} — mock action`)}
                className="flex items-center justify-between rounded-lg px-5 py-3 text-body-md font-semibold text-on-molten shadow-lg transition-all hover:brightness-110"
                style={{
                  background:
                    "linear-gradient(135deg,#ffb599 0%, #f56117 100%)",
                }}
              >
                <span className="flex items-center gap-2.5">
                  <Icon className="h-4 w-4" />
                  {action.label}
                </span>
              </button>
            );
          }
          return (
            <button
              key={action.id}
              type="button"
              onClick={() => toast.success(`${action.label} — mock action`)}
              className="flex items-center justify-between rounded-lg bg-surface-container-lowest px-5 py-3 text-body-md font-medium text-on-surface hover:bg-surface-container-low transition-colors"
            >
              <span className="flex items-center gap-2.5">
                <Icon className="h-4 w-4 text-secondary-text" />
                {action.label}
              </span>
            </button>
          );
        })}
      </div>
      <div className="mx-3 mb-3 flex items-center gap-2.5 rounded-lg bg-surface-container-lowest px-4 py-3">
        <Activity className="h-4 w-4 text-success" />
        <div className="flex flex-col leading-tight">
          <span className="text-label-sm uppercase tracking-widest text-text-muted">
            Health Check
          </span>
          <span className="text-body-sm font-semibold text-on-surface">
            Connessione CMS ottimizzata
          </span>
        </div>
      </div>
    </div>
  );
}
