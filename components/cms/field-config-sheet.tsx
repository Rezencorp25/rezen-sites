"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GradientButton } from "@/components/luminous/gradient-button";
import {
  FIELD_TYPE_REGISTRY,
} from "@/lib/cms/field-types";
import { useCMSStore } from "@/lib/stores/cms-store";
import type {
  CMSField,
  CMSOptionChoice,
  CMSValidationRule,
} from "@/types";
import { isReferenceField } from "@/types/cms";

export function FieldConfigSheet({
  open,
  onOpenChange,
  field,
  projectId,
  onSave,
  onDelete,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  field: CMSField | null;
  projectId: string;
  onSave: (next: CMSField) => void;
  onDelete?: (id: string) => void;
}) {
  const allCollections = useCMSStore((s) => s.collections);
  const refTargets = allCollections.filter(
    (c) => c.projectId === projectId,
  );

  const [draft, setDraft] = useState<CMSField | null>(field);
  const [trackedId, setTrackedId] = useState<string | null>(field?.id ?? null);
  // Re-sync draft quando il prop `field` punta a un nuovo field id (no useEffect → no setState in effect).
  if ((field?.id ?? null) !== trackedId) {
    setTrackedId(field?.id ?? null);
    setDraft(field);
  }

  if (!draft) return null;
  const meta = FIELD_TYPE_REGISTRY[draft.type];
  const Icon = meta.icon;

  function patch(p: Partial<CMSField>) {
    setDraft((d) => (d ? { ...d, ...p } : d));
  }

  function patchValidation(p: Partial<CMSValidationRule>) {
    setDraft((d) =>
      d ? { ...d, validation: { ...(d.validation ?? {}), ...p } } : d,
    );
  }

  function addChoice() {
    const id = `opt-${Date.now()}`;
    const next: CMSOptionChoice[] = [
      ...(draft?.optionChoices ?? []),
      { id, label: "" },
    ];
    patch({ optionChoices: next });
  }

  function patchChoice(id: string, p: Partial<CMSOptionChoice>) {
    const next = (draft?.optionChoices ?? []).map((c) =>
      c.id === id ? { ...c, ...p } : c,
    );
    patch({ optionChoices: next });
  }

  function removeChoice(id: string) {
    const next = (draft?.optionChoices ?? []).filter((c) => c.id !== id);
    patch({ optionChoices: next });
  }

  function commit() {
    if (!draft) return;
    onSave(draft);
    onOpenChange(false);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-[440px] bg-surface-container-highest border-none sm:max-w-md"
      >
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 text-title-md">
            <Icon className="h-4 w-4 text-molten-primary" />
            Campo {meta.label}
          </SheetTitle>
          <SheetDescription className="text-body-sm text-secondary-text">
            {meta.description}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-5 flex flex-col gap-4 px-1">
          <div className="flex flex-col gap-1.5">
            <label className="text-label-md uppercase tracking-widest text-text-muted">
              Nome del campo
            </label>
            <Input
              value={draft.name}
              onChange={(e) => patch({ name: e.target.value })}
              className="h-10 bg-surface-container-low border-none"
              placeholder="Es. Immagine di copertina"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-label-md uppercase tracking-widest text-text-muted">
              Testo di aiuto
            </label>
            <Textarea
              value={draft.helpText ?? ""}
              onChange={(e) => patch({ helpText: e.target.value })}
              rows={2}
              className="resize-none bg-surface-container-low border-none"
              placeholder="Mostrato sotto il campo nell'editor item"
            />
          </div>

          <div className="flex items-center justify-between rounded-lg bg-surface-container-low px-3 py-2.5">
            <span className="text-body-sm text-on-surface">Campo obbligatorio</span>
            <Switch
              checked={draft.required}
              onCheckedChange={(v) => patch({ required: v })}
            />
          </div>

          {(draft.type === "plain-text" || draft.type === "rich-text") && (
            <div className="flex flex-col gap-3 rounded-lg bg-surface-container-low p-3">
              <span className="text-label-md uppercase tracking-widest text-text-muted">
                Validazione
              </span>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="number"
                  value={draft.validation?.minLength ?? ""}
                  onChange={(e) =>
                    patchValidation({
                      minLength: e.target.value
                        ? Number(e.target.value)
                        : undefined,
                    })
                  }
                  className="h-9 bg-surface-container border-none"
                  placeholder="lunghezza min"
                />
                <Input
                  type="number"
                  value={draft.validation?.maxLength ?? ""}
                  onChange={(e) =>
                    patchValidation({
                      maxLength: e.target.value
                        ? Number(e.target.value)
                        : undefined,
                    })
                  }
                  className="h-9 bg-surface-container border-none"
                  placeholder="lunghezza max"
                />
              </div>
              <Input
                value={draft.validation?.pattern ?? ""}
                onChange={(e) =>
                  patchValidation({ pattern: e.target.value || undefined })
                }
                className="h-9 bg-surface-container border-none font-mono text-body-sm"
                placeholder="regex (es. ^[a-z0-9-]+$)"
              />
            </div>
          )}

          {draft.type === "number" && (
            <div className="flex flex-col gap-3 rounded-lg bg-surface-container-low p-3">
              <span className="text-label-md uppercase tracking-widest text-text-muted">
                Intervallo
              </span>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="number"
                  value={draft.validation?.min ?? ""}
                  onChange={(e) =>
                    patchValidation({
                      min: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                  className="h-9 bg-surface-container border-none"
                  placeholder="min"
                />
                <Input
                  type="number"
                  value={draft.validation?.max ?? ""}
                  onChange={(e) =>
                    patchValidation({
                      max: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                  className="h-9 bg-surface-container border-none"
                  placeholder="max"
                />
              </div>
            </div>
          )}

          {draft.type === "option" && (
            <div className="flex flex-col gap-2 rounded-lg bg-surface-container-low p-3">
              <div className="flex items-center justify-between">
                <span className="text-label-md uppercase tracking-widest text-text-muted">
                  Opzioni
                </span>
                <button
                  type="button"
                  onClick={addChoice}
                  className="flex items-center gap-1 text-label-md text-molten-primary hover:brightness-110"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Aggiungi opzione
                </button>
              </div>
              {(draft.optionChoices ?? []).length === 0 && (
                <p className="text-body-sm text-text-muted">
                  Almeno un&apos;opzione è richiesta per pubblicare l&apos;item.
                </p>
              )}
              {(draft.optionChoices ?? []).map((c) => (
                <div key={c.id} className="flex items-center gap-2">
                  <Input
                    value={c.label}
                    onChange={(e) =>
                      patchChoice(c.id, { label: e.target.value })
                    }
                    className="h-9 bg-surface-container border-none"
                    placeholder="Etichetta"
                  />
                  <button
                    type="button"
                    onClick={() => removeChoice(c.id)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-error hover:bg-surface-container"
                    aria-label="Rimuovi opzione"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {isReferenceField(draft.type) && (
            <div className="flex flex-col gap-2 rounded-lg bg-surface-container-low p-3">
              <span className="text-label-md uppercase tracking-widest text-text-muted">
                Collezione di destinazione
              </span>
              {refTargets.length === 0 ? (
                <p className="text-body-sm text-text-muted">
                  Nessuna collezione disponibile in questo progetto. Crea una
                  collezione di destinazione prima di salvare.
                </p>
              ) : (
                <Select
                  value={draft.referenceCollectionId ?? ""}
                  onValueChange={(v) =>
                    patch({ referenceCollectionId: v ?? undefined })
                  }
                >
                  <SelectTrigger className="h-10 bg-surface-container border-none">
                    <SelectValue placeholder="Seleziona collezione" />
                  </SelectTrigger>
                  <SelectContent>
                    {refTargets.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.displayName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}

          <div className="mt-4 flex items-center justify-between gap-2">
            {onDelete && (
              <button
                type="button"
                onClick={() => {
                  onDelete(draft.id);
                  onOpenChange(false);
                }}
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-body-sm text-error hover:bg-surface-container"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Rimuovi campo
              </button>
            )}
            <div className="ml-auto flex items-center gap-2">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="rounded-lg px-3 py-2 text-body-sm text-secondary-text hover:text-on-surface"
              >
                Annulla
              </button>
              <GradientButton size="md" onClick={commit}>
                Salva
              </GradientButton>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
