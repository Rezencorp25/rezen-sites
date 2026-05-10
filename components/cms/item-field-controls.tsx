"use client";

import { Image as ImageIcon, Paperclip, Plus, X } from "lucide-react";
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
import { ReferencePicker } from "@/components/cms/reference-picker";
import { MultiReferencePicker } from "@/components/cms/multi-reference-picker";
import type { CMSField } from "@/types";

export type ItemFieldControlProps = {
  field: CMSField;
  value: unknown;
  onChange: (next: unknown) => void;
  projectId: string;
};

export function ItemFieldControl(props: ItemFieldControlProps) {
  const { field } = props;
  switch (field.type) {
    case "plain-text":
      return <PlainTextControl {...props} />;
    case "rich-text":
      return <RichTextControl {...props} />;
    case "image":
      return <ImageControl {...props} />;
    case "multi-image":
      return <MultiImageControl {...props} />;
    case "video-link":
    case "link":
      return <UrlControl {...props} />;
    case "email":
      return <EmailControl {...props} />;
    case "phone":
      return <PlainTextControl {...props} />;
    case "number":
      return <NumberControl {...props} />;
    case "datetime":
      return <DateTimeControl {...props} />;
    case "switch":
      return <SwitchControl {...props} />;
    case "color":
      return <ColorControl {...props} />;
    case "option":
      return <OptionControl {...props} />;
    case "file":
      return <FileControl {...props} />;
    case "reference":
      return <ReferenceControl {...props} />;
    case "multi-reference":
      return <MultiReferenceControl {...props} />;
  }
}

function PlainTextControl({ field, value, onChange }: ItemFieldControlProps) {
  const multi = field.validation?.multiline;
  const max = field.validation?.maxLength;
  const v = typeof value === "string" ? value : "";
  if (multi) {
    return (
      <Textarea
        value={v}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        maxLength={max}
        className="resize-none bg-surface-container-low border-none"
        placeholder={field.helpText}
      />
    );
  }
  return (
    <Input
      value={v}
      onChange={(e) => onChange(e.target.value)}
      maxLength={max}
      className="h-10 bg-surface-container-low border-none"
      placeholder={field.helpText}
    />
  );
}

function RichTextControl({ field, value, onChange }: ItemFieldControlProps) {
  const v = typeof value === "string" ? value : "";
  return (
    <div className="flex flex-col gap-1.5">
      <Textarea
        value={v}
        onChange={(e) => onChange(e.target.value)}
        rows={6}
        className="resize-y min-h-[140px] bg-surface-container-low border-none font-mono text-body-sm"
        placeholder={field.helpText ?? "Markdown / HTML — Tiptap WYSIWYG arriva in S7.5"}
      />
      <p className="text-label-sm text-text-muted">
        {v.length} caratteri · WYSIWYG editor in arrivo (S7.5)
      </p>
    </div>
  );
}

type ImageRef = { fileId: string; url: string; alt?: string };

function isImageRef(v: unknown): v is ImageRef {
  return (
    typeof v === "object" &&
    v !== null &&
    "url" in v &&
    typeof (v as { url: unknown }).url === "string"
  );
}

function ImageControl({ value, onChange, field }: ItemFieldControlProps) {
  const ref = isImageRef(value) ? value : null;
  return (
    <div className="flex items-center gap-3 rounded-lg bg-surface-container-low p-3">
      {ref ? (
        <>
          <div
            className="h-14 w-14 rounded-lg bg-cover bg-center"
            style={{ backgroundImage: `url(${ref.url})` }}
          />
          <div className="flex-1 flex-col">
            <p className="truncate text-body-sm text-on-surface">{ref.url}</p>
            {ref.alt && (
              <p className="text-label-sm text-text-muted">alt: {ref.alt}</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => onChange(null)}
            className="rounded-md px-2 py-1 text-label-md text-error hover:bg-surface-container"
          >
            Delete
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={() => {
            const url = window.prompt(
              "URL immagine (S7.5 farà upload Storage reale)",
            );
            if (!url) return;
            onChange({ fileId: `mock-${Date.now()}`, url });
          }}
          className="flex w-full items-center gap-3 text-left text-body-sm text-text-muted"
        >
          <span className="flex h-14 w-14 items-center justify-center rounded-lg bg-surface-container">
            <ImageIcon className="h-5 w-5 text-molten-primary" />
          </span>
          <span>Carica immagine · {field.helpText ?? "JPG/PNG max 4MB"}</span>
        </button>
      )}
    </div>
  );
}

function MultiImageControl({ value, onChange }: ItemFieldControlProps) {
  const arr: ImageRef[] = Array.isArray(value)
    ? (value.filter(isImageRef) as ImageRef[])
    : [];
  return (
    <div className="flex flex-col gap-2 rounded-lg bg-surface-container-low p-3">
      {arr.length === 0 && (
        <p className="text-body-sm text-text-muted">Nessuna immagine.</p>
      )}
      <div className="grid grid-cols-3 gap-2">
        {arr.map((it, i) => (
          <div
            key={`${it.fileId}-${i}`}
            className="relative aspect-square rounded-md bg-cover bg-center"
            style={{ backgroundImage: `url(${it.url})` }}
          >
            <button
              type="button"
              onClick={() => onChange(arr.filter((_, j) => j !== i))}
              className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-surface-container-highest text-on-surface"
              aria-label="Rimuovi"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => {
          const url = window.prompt("URL immagine");
          if (!url) return;
          onChange([...arr, { fileId: `mock-${Date.now()}`, url }]);
        }}
        className="flex items-center gap-1.5 self-start rounded-lg bg-surface-container px-3 py-1.5 text-label-md text-on-surface hover:bg-surface-container-high"
      >
        <Plus className="h-3.5 w-3.5" />
        Aggiungi immagine
      </button>
    </div>
  );
}

function UrlControl({ field, value, onChange }: ItemFieldControlProps) {
  return (
    <Input
      type="url"
      value={typeof value === "string" ? value : ""}
      onChange={(e) => onChange(e.target.value)}
      className="h-10 bg-surface-container-low border-none"
      placeholder={field.helpText ?? "https://"}
    />
  );
}

function EmailControl({ field, value, onChange }: ItemFieldControlProps) {
  return (
    <Input
      type="email"
      value={typeof value === "string" ? value : ""}
      onChange={(e) => onChange(e.target.value)}
      className="h-10 bg-surface-container-low border-none"
      placeholder={field.helpText ?? "name@domain.com"}
    />
  );
}

function NumberControl({ field, value, onChange }: ItemFieldControlProps) {
  return (
    <Input
      type="number"
      value={typeof value === "number" ? value : ""}
      onChange={(e) =>
        onChange(e.target.value === "" ? null : Number(e.target.value))
      }
      min={field.validation?.min}
      max={field.validation?.max}
      className="h-10 bg-surface-container-low border-none"
      placeholder={field.helpText}
    />
  );
}

function DateTimeControl({ value, onChange }: ItemFieldControlProps) {
  let v = "";
  if (typeof value === "string" && value) {
    // Date-only ("2026-04-10") → estendiamo con T00:00 per compat datetime-local.
    v = value.includes("T") ? value.slice(0, 16) : `${value}T00:00`;
  } else if (value instanceof Date) {
    v = value.toISOString().slice(0, 16);
  }
  return (
    <Input
      type="datetime-local"
      value={v}
      onChange={(e) => onChange(e.target.value)}
      className="h-10 bg-surface-container-low border-none"
    />
  );
}

function SwitchControl({ field, value, onChange }: ItemFieldControlProps) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-surface-container-low px-3 py-2.5">
      <span className="text-body-sm text-on-surface">
        {value ? "YES" : "NO"}
      </span>
      <Switch
        checked={Boolean(value)}
        onCheckedChange={(v) => onChange(v)}
        aria-label={field.name}
      />
    </div>
  );
}

function ColorControl({ value, onChange }: ItemFieldControlProps) {
  const v = typeof value === "string" ? value : "#000000";
  return (
    <div className="flex items-center gap-2 rounded-lg bg-surface-container-low p-2">
      <input
        type="color"
        value={v}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-12 cursor-pointer rounded-md border-none bg-transparent"
      />
      <Input
        value={v}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 flex-1 bg-surface-container border-none font-mono text-body-sm"
      />
    </div>
  );
}

function OptionControl({ field, value, onChange }: ItemFieldControlProps) {
  const choices = field.optionChoices ?? [];
  if (choices.length === 0) {
    return (
      <p className="rounded-lg bg-surface-container-low px-3 py-2.5 text-body-sm text-text-muted">
        Configura le choices nello schema editor per popolare il dropdown.
      </p>
    );
  }
  return (
    <Select
      value={typeof value === "string" ? value : ""}
      onValueChange={(v) => onChange(v)}
    >
      <SelectTrigger className="h-10 bg-surface-container-low border-none">
        <SelectValue placeholder="Seleziona…" />
      </SelectTrigger>
      <SelectContent>
        {choices.map((c) => (
          <SelectItem key={c.id} value={c.id}>
            {c.label || c.id}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

type FileRef = { fileId: string; url: string; name?: string };

function isFileRef(v: unknown): v is FileRef {
  return (
    typeof v === "object" &&
    v !== null &&
    "url" in v &&
    typeof (v as { url: unknown }).url === "string"
  );
}

function FileControl({ value, onChange, field }: ItemFieldControlProps) {
  const ref = isFileRef(value) ? value : null;
  return (
    <div className="flex items-center gap-3 rounded-lg bg-surface-container-low p-3">
      {ref ? (
        <>
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-container">
            <Paperclip className="h-4 w-4 text-molten-primary" />
          </span>
          <div className="flex-1 truncate">
            <p className="truncate text-body-sm text-on-surface">
              {ref.name ?? ref.url}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onChange(null)}
            className="rounded-md px-2 py-1 text-label-md text-error hover:bg-surface-container"
          >
            Delete
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={() => {
            const url = window.prompt(
              "URL file (S7.5 farà upload Storage reale)",
            );
            if (!url) return;
            onChange({ fileId: `mock-${Date.now()}`, url });
          }}
          className="flex w-full items-center gap-3 text-left text-body-sm text-text-muted"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-container">
            <Paperclip className="h-4 w-4 text-molten-primary" />
          </span>
          <span>Carica file · {field.helpText ?? "PDF/DOC max 4MB"}</span>
        </button>
      )}
    </div>
  );
}

function ReferenceControl({ field, value, onChange, projectId }: ItemFieldControlProps) {
  if (!field.referenceCollectionId) {
    return (
      <p className="rounded-lg bg-surface-container-low px-3 py-2.5 text-body-sm text-text-muted">
        Configura la target collection nello schema editor.
      </p>
    );
  }
  return (
    <ReferencePicker
      targetCollectionId={field.referenceCollectionId}
      projectId={projectId}
      selected={typeof value === "string" ? value : null}
      onSelect={(id) => onChange(id)}
      onClear={() => onChange(null)}
    />
  );
}

function MultiReferenceControl({
  field,
  value,
  onChange,
  projectId,
}: ItemFieldControlProps) {
  if (!field.referenceCollectionId) {
    return (
      <p className="rounded-lg bg-surface-container-low px-3 py-2.5 text-body-sm text-text-muted">
        Configura la target collection nello schema editor.
      </p>
    );
  }
  const arr: string[] = Array.isArray(value)
    ? value.filter((v): v is string => typeof v === "string")
    : [];
  return (
    <MultiReferencePicker
      targetCollectionId={field.referenceCollectionId}
      projectId={projectId}
      values={arr}
      onChange={onChange}
    />
  );
}
