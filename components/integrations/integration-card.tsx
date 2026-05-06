"use client";

import { useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Cog,
  KeyRound,
  Loader2,
  RefreshCw,
  Trash2,
  XCircle,
} from "lucide-react";
import {
  INTEGRATION_PROVIDERS,
  type IntegrationProviderId,
} from "@/lib/integrations/providers";
import type { IntegrationStatus } from "@/types";
import { cn } from "@/lib/utils";

type Props = {
  providerId: IntegrationProviderId;
  status: IntegrationStatus | "missing" | "inherited";
  last4?: string;
  verifiedAt?: Date | null;
  lastError?: string;
  /** Mostra "Eredita da workspace" quando project scope + non override. */
  showInheritBadge?: boolean;
  onConfigure: () => void;
  onTest?: () => void;
  onRevoke?: () => void;
  onUseOverride?: () => void;
  onUseDefault?: () => void;
  /** Mostra toggle override (solo project scope). */
  scope: "workspace" | "project";
  busy?: "test" | "revoke" | null;
};

const STATUS_TONE: Record<IntegrationStatus | "missing" | "inherited", string> =
  {
    active: "bg-emerald-400/15 text-emerald-300 border-emerald-400/30",
    error: "bg-rose-400/15 text-rose-300 border-rose-400/30",
    revoked: "bg-zinc-400/15 text-zinc-300 border-zinc-400/30",
    missing: "bg-amber-400/15 text-amber-300 border-amber-400/30",
    inherited: "bg-sky-400/15 text-sky-300 border-sky-400/30",
  };

const STATUS_LABEL: Record<
  IntegrationStatus | "missing" | "inherited",
  string
> = {
  active: "Attiva",
  error: "Errore",
  revoked: "Revocata",
  missing: "Non configurata",
  inherited: "Da workspace",
};

const STATUS_ICON: Record<
  IntegrationStatus | "missing" | "inherited",
  typeof CheckCircle2
> = {
  active: CheckCircle2,
  error: XCircle,
  revoked: AlertCircle,
  missing: AlertCircle,
  inherited: KeyRound,
};

const DIFFICULTY_LABEL = ["", "Banale", "Medio", "Avanzato", "Complex", "Hard"];

export function IntegrationCard({
  providerId,
  status,
  last4,
  verifiedAt,
  lastError,
  showInheritBadge,
  onConfigure,
  onTest,
  onRevoke,
  onUseOverride,
  onUseDefault,
  scope,
  busy,
}: Props) {
  const def = INTEGRATION_PROVIDERS[providerId];
  const StatusIcon = STATUS_ICON[status];
  const [showError, setShowError] = useState(false);

  return (
    <div className="flex flex-col gap-3 rounded-xl bg-surface-container-high p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h3 className="text-title-md font-semibold text-on-surface">
              {def.label}
            </h3>
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                STATUS_TONE[status],
              )}
            >
              <StatusIcon className="h-3 w-3" />
              {STATUS_LABEL[status]}
            </span>
            <span className="text-label-sm text-text-muted">
              · setup {DIFFICULTY_LABEL[def.difficulty]}
            </span>
          </div>
          <p className="text-body-sm text-text-muted">{def.description}</p>
          {last4 && status !== "missing" && (
            <p className="font-mono text-label-sm text-text-muted">
              ****{last4} ·{" "}
              {verifiedAt
                ? `verificata ${verifiedAt.toLocaleDateString("it-IT")}`
                : "non verificata"}
            </p>
          )}
          {showInheritBadge && (
            <p className="text-label-sm text-sky-300">
              Sta usando la chiave default del workspace
            </p>
          )}
          {status === "error" && lastError && (
            <button
              type="button"
              onClick={() => setShowError((v) => !v)}
              className="text-left text-label-sm text-rose-300 underline-offset-2 hover:underline"
            >
              {showError
                ? `⚠ ${lastError}`
                : "⚠ Errore nell'ultimo test — clicca per dettagli"}
            </button>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {scope === "project" &&
            status === "inherited" &&
            onUseOverride && (
              <button
                type="button"
                onClick={onUseOverride}
                className="rounded-md bg-molten-primary/15 px-2.5 py-1.5 text-label-sm font-medium text-molten-primary transition-colors hover:bg-molten-primary/25"
              >
                Usa chiave dedicata
              </button>
            )}
          {scope === "project" && status !== "inherited" && onUseDefault && (
            <button
              type="button"
              onClick={onUseDefault}
              className="rounded-md bg-zinc-400/10 px-2.5 py-1.5 text-label-sm font-medium text-text-muted transition-colors hover:bg-zinc-400/20"
            >
              Usa default workspace
            </button>
          )}
          {onTest && (status === "active" || status === "error") && (
            <button
              type="button"
              onClick={onTest}
              disabled={busy === "test"}
              className="flex items-center gap-1 rounded-md bg-zinc-400/10 px-2.5 py-1.5 text-label-sm text-text-muted transition-colors hover:bg-zinc-400/20 disabled:opacity-50"
            >
              {busy === "test" ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <RefreshCw className="h-3 w-3" />
              )}
              Test
            </button>
          )}
          <button
            type="button"
            onClick={onConfigure}
            className="flex items-center gap-1 rounded-md bg-molten-primary/15 px-2.5 py-1.5 text-label-sm font-medium text-molten-primary transition-colors hover:bg-molten-primary/25"
          >
            <Cog className="h-3 w-3" />
            {status === "missing" || status === "revoked"
              ? "Configura"
              : "Modifica"}
          </button>
          {onRevoke && (status === "active" || status === "error") && (
            <button
              type="button"
              onClick={onRevoke}
              disabled={busy === "revoke"}
              className="flex items-center gap-1 rounded-md bg-rose-400/10 px-2.5 py-1.5 text-label-sm text-rose-300 transition-colors hover:bg-rose-400/20 disabled:opacity-50"
              aria-label="Revoca"
            >
              {busy === "revoke" ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Trash2 className="h-3 w-3" />
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
