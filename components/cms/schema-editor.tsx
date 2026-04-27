"use client";

import { useState } from "react";
import { Plus, Trash2, Type, AlignLeft, Image, Calendar, Hash, ToggleLeft, Link2 } from "lucide-react";
import { toast } from "sonner";
import { useCMSStore } from "@/lib/stores/cms-store";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { GradientButton } from "@/components/luminous/gradient-button";
import type { CMSField, CMSFieldType } from "@/types";

const FIELD_TYPE_META: Record<
  CMSFieldType,
  { label: string; icon: typeof Type }
> = {
  text: { label: "Text", icon: Type },
  richtext: { label: "Rich Text", icon: AlignLeft },
  image: { label: "Image", icon: Image },
  date: { label: "Date", icon: Calendar },
  number: { label: "Number", icon: Hash },
  boolean: { label: "Boolean", icon: ToggleLeft },
  reference: { label: "Reference", icon: Link2 },
};

export function SchemaEditor({
  collectionId,
  initialFields,
}: {
  collectionId: string;
  initialFields: CMSField[];
}) {
  const updateSchema = useCMSStore((s) => s.updateSchema);
  const [fields, setFields] = useState<CMSField[]>(initialFields);

  function save(next: CMSField[]) {
    setFields(next);
    updateSchema(collectionId, next);
  }

  function addField() {
    const id = `field-${Date.now()}`;
    save([
      ...fields,
      {
        id,
        name: `Field ${fields.length + 1}`,
        type: "text",
        required: false,
      },
    ]);
  }

  function removeField(id: string) {
    save(fields.filter((f) => f.id !== id));
    toast.success("Field rimosso");
  }

  function patchField(id: string, patch: Partial<CMSField>) {
    save(fields.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  }

  return (
    <div className="rounded-xl bg-surface-container-high p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-title-md font-semibold text-on-surface">
          Schema ({fields.length} field)
        </h3>
        <GradientButton size="sm" onClick={addField}>
          <Plus className="h-3.5 w-3.5" />
          Aggiungi Field
        </GradientButton>
      </div>
      <div className="flex flex-col gap-2">
        {fields.map((f) => {
          const Icon = FIELD_TYPE_META[f.type].icon;
          return (
            <div
              key={f.id}
              className="grid grid-cols-[28px_1fr_160px_120px_40px] items-center gap-3 rounded-lg bg-surface-container-lowest px-4 py-2.5"
            >
              <Icon className="h-4 w-4 text-molten-primary" />
              <Input
                value={f.name}
                onChange={(e) => patchField(f.id, { name: e.target.value })}
                className="h-9 bg-surface-container border-none"
              />
              <Select
                value={f.type}
                onValueChange={(v) =>
                  patchField(f.id, { type: v as CMSFieldType })
                }
              >
                <SelectTrigger className="h-9 bg-surface-container border-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(FIELD_TYPE_META).map(([key, meta]) => (
                    <SelectItem key={key} value={key}>
                      {meta.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2 justify-between">
                <span className="text-label-sm text-text-muted">Required</span>
                <Switch
                  checked={f.required}
                  onCheckedChange={(v) => patchField(f.id, { required: v })}
                />
              </div>
              <button
                type="button"
                onClick={() => removeField(f.id)}
                className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-surface-container"
                aria-label="Rimuovi"
              >
                <Trash2 className="h-3.5 w-3.5 text-error" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
