"use client";

import { useMemo, useState } from "react";
import { Plus, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { useCMSStore } from "@/lib/stores/cms-store";
import { GradientButton } from "@/components/luminous/gradient-button";
import { FieldTypePicker } from "@/components/cms/field-type-picker";
import { FieldConfigSheet } from "@/components/cms/field-config-sheet";
import { FIELD_TYPE_REGISTRY } from "@/lib/cms/field-types";
import { isReferenceField } from "@/types/cms";
import type { CMSField, CMSFieldType } from "@/types";

const BAKED_IN_IDS = new Set(["name", "slug"]);

export function SchemaEditor({
  collectionId,
  projectId,
  initialFields,
}: {
  collectionId: string;
  projectId: string;
  initialFields: CMSField[];
}) {
  const updateSchema = useCMSStore((s) => s.updateSchema);
  const [fields, setFields] = useState<CMSField[]>(initialFields);
  const [picking, setPicking] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const editingField = useMemo(
    () => fields.find((f) => f.id === editingId) ?? null,
    [fields, editingId],
  );

  const baked = fields.filter((f) => BAKED_IN_IDS.has(f.id));
  const custom = fields.filter((f) => !BAKED_IN_IDS.has(f.id));
  const refCount = custom.filter((f) => isReferenceField(f.type)).length;

  function save(next: CMSField[]) {
    setFields(next);
    updateSchema(collectionId, next);
  }

  function addField(type: CMSFieldType) {
    if (isReferenceField(type) && refCount >= 20) {
      toast.error("Limite di 20 reference per collezione raggiunto");
      return;
    }
    const id = `field-${Date.now()}`;
    const meta = FIELD_TYPE_REGISTRY[type];
    const next: CMSField = {
      id,
      name: meta.label,
      type,
      required: false,
    };
    const all = [...fields, next];
    save(all);
    setPicking(false);
    setEditingId(id);
  }

  function updateField(next: CMSField) {
    save(fields.map((f) => (f.id === next.id ? next : f)));
    toast.success("Campo aggiornato");
  }

  function removeField(id: string) {
    if (BAKED_IN_IDS.has(id)) {
      toast.error("Nome e Slug sono campi di sistema, non rimovibili");
      return;
    }
    save(fields.filter((f) => f.id !== id));
    toast.success("Campo rimosso");
  }

  return (
    <div className="rounded-xl bg-surface-container-high p-6">
      <FieldGroup
        title="Campi di base"
        fields={baked}
        onPick={() => setEditingId(null)}
      >
        {baked.map((f) => (
          <FieldRow key={f.id} field={f} bakedIn onClick={undefined} />
        ))}
      </FieldGroup>

      <div className="mt-5 flex items-center justify-between">
        <h4 className="text-label-md uppercase tracking-widest text-text-muted">
          Campi personalizzati
        </h4>
        <span
          className={
            refCount >= 18
              ? "text-label-sm text-warning"
              : "text-label-sm text-text-muted"
          }
        >
          {custom.length} {custom.length === 1 ? "campo" : "campi"} · {refCount}/20 reference
          {refCount >= 18 ? " · vicino al limite" : ""}
        </span>
      </div>

      <div className="mt-2 flex flex-col">
        {custom.length === 0 && !picking && (
          <p className="rounded-lg bg-surface-container-lowest px-4 py-6 text-center text-body-sm text-text-muted">
            Nessun campo personalizzato. Aggiungi il primo qui sotto.
          </p>
        )}
        {custom.map((f) => (
          <FieldRow key={f.id} field={f} onClick={() => setEditingId(f.id)} />
        ))}
      </div>

      <div className="mt-3">
        {!picking ? (
          <GradientButton size="sm" onClick={() => setPicking(true)}>
            <Plus className="h-3.5 w-3.5" />
            Aggiungi campo
          </GradientButton>
        ) : (
          <div className="mt-2">
            <FieldTypePicker
              onPick={addField}
              onCancel={() => setPicking(false)}
            />
          </div>
        )}
      </div>

      <FieldConfigSheet
        open={editingId !== null}
        onOpenChange={(v) => !v && setEditingId(null)}
        field={editingField}
        projectId={projectId}
        onSave={updateField}
        onDelete={removeField}
      />
    </div>
  );
}

function FieldGroup({
  title,
  fields,
  children,
}: {
  title: string;
  fields: CMSField[];
  onPick?: () => void;
  children: React.ReactNode;
}) {
  if (fields.length === 0) return null;
  return (
    <div className="flex flex-col gap-2">
      <h4 className="text-label-md uppercase tracking-widest text-text-muted">
        {title}
      </h4>
      <div className="flex flex-col">{children}</div>
    </div>
  );
}

function FieldRow({
  field,
  bakedIn,
  onClick,
}: {
  field: CMSField;
  bakedIn?: boolean;
  onClick?: () => void;
}) {
  const meta = FIELD_TYPE_REGISTRY[field.type];
  const Icon = meta.icon;
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={`grid grid-cols-[28px_1fr_120px_24px] items-center gap-3 rounded-lg px-4 py-2.5 text-left transition-colors ${
        onClick
          ? "cursor-pointer bg-surface-container-lowest hover:bg-surface-container"
          : "bg-surface-container-lowest"
      }`}
    >
      <Icon className="h-4 w-4 text-molten-primary" />
      <span className="flex items-center gap-2 text-body-sm text-on-surface">
        {field.name}
        <span className="text-label-sm text-text-muted">({meta.label})</span>
      </span>
      <span className="text-label-sm text-text-muted">
        {bakedIn
          ? "Obbligatorio (sistema)"
          : field.required
            ? "Obbligatorio"
            : "Opzionale"}
      </span>
      {onClick ? <ChevronRight className="h-3.5 w-3.5 text-text-muted" /> : <span />}
    </Tag>
  );
}
