"use client";

import { useEffect, useState } from "react";
import { Loader2, X } from "lucide-react";
import {
  INTEGRATION_PROVIDERS,
  type IntegrationProviderId,
} from "@/lib/integrations/providers";
import { setIntegrationCall } from "@/lib/integrations/test-client";
import { ProviderGuideBlock } from "./provider-guide";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  providerId: IntegrationProviderId | null;
  scope: "workspace" | "project";
  scopeId: string;
  onClose: () => void;
  onSuccess: () => void;
};

export function ConfigureIntegrationModal({
  open,
  providerId,
  scope,
  scopeId,
  onClose,
  onSuccess,
}: Props) {
  const def = providerId ? INTEGRATION_PROVIDERS[providerId] : null;
  const [values, setValues] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setValues({});
      setError(null);
      setSubmitting(false);
    }
  }, [open, providerId]);

  if (!open || !def || !providerId) return null;

  const allRequiredFilled = def.fields
    .filter((f) => f.required)
    .every((f) => values[f.key]?.trim());

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    const t = toast.loading(`Test connessione ${def.label}...`);
    try {
      const res = await setIntegrationCall({
        provider: providerId,
        scope,
        scopeId,
        fields: values,
      });
      if (res.ok) {
        toast.success(`${def.label}: chiave salvata e verificata (****${res.last4})`, {
          id: t,
        });
        onSuccess();
        onClose();
      } else {
        setError(res.error);
        toast.error(`Test fallito: ${res.error}`, { id: t });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Errore sconosciuto";
      setError(msg);
      toast.error(`Errore: ${msg}`, { id: t });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-xl bg-surface-container-highest">
        <header className="flex items-center justify-between border-b border-surface-container-low px-6 py-4">
          <div className="flex flex-col gap-0.5">
            <h2 className="text-title-lg font-semibold text-on-surface">
              Configura {def.label}
            </h2>
            <p className="text-label-sm text-text-muted">
              Scope: {scope === "workspace" ? "Workspace (default per tutti i progetti)" : `Progetto ${scopeId}`}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-text-muted hover:bg-surface-container-low hover:text-on-surface"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-6 py-5">
          <ProviderGuideBlock guide={def.guide} />

          <div className="flex flex-col gap-3">
            <h4 className="text-label-md font-semibold uppercase tracking-wider text-text-muted">
              Credenziali
            </h4>
            {def.fields.map((field) => (
              <div key={field.key} className="flex flex-col gap-1.5">
                <label
                  htmlFor={`field-${field.key}`}
                  className="text-label-md font-medium text-on-surface"
                >
                  {field.label}
                  {field.required && <span className="text-rose-300"> *</span>}
                </label>
                {field.type === "json" ? (
                  <textarea
                    id={`field-${field.key}`}
                    value={values[field.key] ?? ""}
                    onChange={(e) =>
                      setValues((v) => ({ ...v, [field.key]: e.target.value }))
                    }
                    placeholder={field.exampleJson ?? field.placeholder}
                    rows={8}
                    className="rounded-md border border-surface-container-low bg-surface-container-lowest px-3 py-2 font-mono text-label-sm text-on-surface placeholder:text-text-muted focus:border-molten-primary focus:outline-none"
                    autoComplete="off"
                    spellCheck={false}
                  />
                ) : (
                  <input
                    id={`field-${field.key}`}
                    type={field.type === "password" ? "password" : "text"}
                    value={values[field.key] ?? ""}
                    onChange={(e) =>
                      setValues((v) => ({ ...v, [field.key]: e.target.value }))
                    }
                    placeholder={field.placeholder}
                    className="rounded-md border border-surface-container-low bg-surface-container-lowest px-3 py-2 text-body-sm text-on-surface placeholder:text-text-muted focus:border-molten-primary focus:outline-none"
                    autoComplete="off"
                    spellCheck={false}
                  />
                )}
                {field.hint && (
                  <p className="text-label-sm text-text-muted">{field.hint}</p>
                )}
              </div>
            ))}
          </div>

          {error && (
            <div className="rounded-md border border-rose-400/30 bg-rose-400/10 p-3 text-body-sm text-rose-200">
              <strong>Test fallito:</strong> {error}
            </div>
          )}
        </div>

        <footer className="flex items-center justify-between border-t border-surface-container-low px-6 py-4">
          <p className="text-label-sm text-text-muted">
            La chiave viene testata live e salvata cifrata in Google Secret Manager.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md bg-zinc-400/10 px-4 py-2 text-label-md font-medium text-text-muted hover:bg-zinc-400/20"
            >
              Annulla
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!allRequiredFilled || submitting}
              className={cn(
                "flex items-center gap-2 rounded-md px-4 py-2 text-label-md font-medium",
                allRequiredFilled && !submitting
                  ? "bg-molten-primary text-on-primary hover:bg-molten-primary/90"
                  : "cursor-not-allowed bg-surface-container-low text-text-muted",
              )}
            >
              {submitting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : null}
              Testa e salva
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
