"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Eye,
  Archive as ArchiveIcon,
  RotateCcw,
  ChevronDown,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { useCMSStore } from "@/lib/stores/cms-store";
import { GradientButton } from "@/components/luminous/gradient-button";
import { CmsItemStatusPill } from "@/components/luminous/status-pill";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ItemFieldControl } from "@/components/cms/item-field-controls";
import { defaultValueFor } from "@/lib/cms/field-types";
import { slugify } from "@/lib/cms/collection-id";
import { validateItemData } from "@/lib/cms/zod-validator";
import type { CMSCollection, CMSItem, CMSItemFieldData } from "@/types";

const BAKED_IN_IDS = new Set(["name", "slug"]);

export function ItemEditor({
  collection,
  item,
  projectId,
}: {
  collection: CMSCollection;
  item: CMSItem;
  projectId: string;
}) {
  const router = useRouter();
  const updateItem = useCMSStore((s) => s.updateItem);
  const setItemStatus = useCMSStore((s) => s.setItemStatus);
  const restoreVersion = useCMSStore((s) => s.restoreVersion);
  const removeItem = useCMSStore((s) => s.removeItem);

  const [draft, setDraft] = useState<CMSItemFieldData>(() => {
    const seeded: CMSItemFieldData = {};
    for (const f of collection.fields) {
      seeded[f.id] = item.draftData[f.id] ?? defaultValueFor(f.type);
    }
    return seeded;
  });
  const [slugDirty, setSlugDirty] = useState(
    Boolean(item.draftData.slug && item.draftData.slug !== ""),
  );

  function patch(id: string, value: unknown) {
    setDraft((d) => {
      const next = { ...d, [id]: value };
      // Auto-slug from name finché lo slug non è stato editato manualmente.
      if (id === "name" && !slugDirty) {
        const auto = slugify(String(value ?? ""));
        if (auto) next.slug = auto;
      }
      return next;
    });
    if (id === "slug") setSlugDirty(true);
  }

  const hasUnsavedChanges = useMemo(() => {
    for (const f of collection.fields) {
      const a = draft[f.id];
      const b = item.draftData[f.id] ?? defaultValueFor(f.type);
      if (JSON.stringify(a) !== JSON.stringify(b)) return true;
    }
    return false;
  }, [collection.fields, item.draftData, draft]);

  const hasDraftDivergence = useMemo(() => {
    if (!item.liveData) return false;
    for (const f of collection.fields) {
      const a = draft[f.id];
      const b = item.liveData[f.id] ?? defaultValueFor(f.type);
      if (JSON.stringify(a) !== JSON.stringify(b)) return true;
    }
    return false;
  }, [collection.fields, draft, item.liveData]);

  const previewUrl = useMemo(() => {
    const slug = String(draft.slug ?? slugify(String(draft.name ?? "")));
    return `/${collection.slug}/${slug}`;
  }, [collection.slug, draft.slug, draft.name]);

  function saveDraft(silent = false) {
    const validation = validateItemData(collection.fields, draft);
    if (!validation.ok) {
      toast.error(`Validazione: ${validation.errors[0]?.message ?? "errore"}`);
      return false;
    }
    updateItem(item.id, { draftData: draft });
    if (!silent) toast.success("Draft salvato");
    return true;
  }

  function publishNow() {
    if (!saveDraft(true)) return;
    setItemStatus(item.id, "queued");
    toast.success("Queued · publish CF in arrivo (~1.5s)");
  }

  function archive() {
    setItemStatus(item.id, "archived");
    toast.info("Item archiviato");
  }

  function restore() {
    setItemStatus(item.id, "draft");
    toast.success("Item ripristinato in draft");
  }

  function deletePermanent() {
    if (!confirm("Eliminare definitivamente questo item? Operazione irreversibile.")) return;
    removeItem(item.id);
    router.push(`/projects/${projectId}/cms/${collection.id}`);
  }

  const headerLabel = useMemo(() => {
    if (item.status === "published" && hasDraftDivergence) {
      return "Published · draft changes";
    }
    if (item.status === "published") return "Published";
    return null;
  }, [item.status, hasDraftDivergence]);

  const customFields = collection.fields.filter((f) => !BAKED_IN_IDS.has(f.id));
  const nameField = collection.fields.find((f) => f.id === "name");
  const slugField = collection.fields.find((f) => f.id === "slug");

  return (
    <div className="mx-auto max-w-5xl px-10 py-10">
      <Link
        href={`/projects/${projectId}/cms/${collection.id}`}
        className="mb-4 inline-flex items-center gap-1.5 text-body-sm text-text-muted hover:text-on-surface"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        {collection.pluralName}
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-headline-md font-bold text-on-surface">
            {String(draft.name ?? "Nuovo item")}
          </h1>
          <p className="font-mono text-body-sm text-text-muted">
            {collection.singularName} · {previewUrl}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end gap-1">
            <CmsItemStatusPill status={item.status} />
            {headerLabel && (
              <span className="text-label-sm text-text-muted">
                {headerLabel}
              </span>
            )}
          </div>
          {item.status === "archived" ? (
            <GradientButton size="md" onClick={restore}>
              <RotateCcw className="h-3.5 w-3.5" />
              Restore
            </GradientButton>
          ) : (
            <div className="flex items-stretch overflow-hidden rounded-xl">
              <GradientButton size="md" onClick={publishNow}>
                {item.status === "published" && hasDraftDivergence
                  ? "Publish changes"
                  : item.status === "published"
                    ? "Re-publish"
                    : "Publish now"}
              </GradientButton>
              <DropdownMenu>
                <DropdownMenuTrigger
                  className="flex items-center justify-center bg-molten-primary px-2 text-on-molten hover:brightness-110"
                  aria-label="Altre azioni"
                >
                  <ChevronDown className="h-4 w-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => saveDraft()}>
                    Save draft
                  </DropdownMenuItem>
                  {(item.versions ?? []).length > 0 && (
                    <>
                      <div className="px-2 pt-2 text-label-sm uppercase tracking-widest text-text-muted">
                        Restore version
                      </div>
                      {(item.versions ?? [])
                        .slice()
                        .reverse()
                        .slice(0, 5)
                        .map((v) => (
                          <DropdownMenuItem
                            key={v.id}
                            onClick={() => {
                              restoreVersion(item.id, v.id);
                              toast.success("Versione ripristinata in draft");
                            }}
                          >
                            {new Date(v.snapshotAt).toLocaleString()}
                          </DropdownMenuItem>
                        ))}
                    </>
                  )}
                  <DropdownMenuItem
                    onClick={archive}
                    className="text-warning"
                  >
                    <ArchiveIcon className="mr-2 h-3.5 w-3.5" />
                    Archive
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={deletePermanent}
                    className="text-error"
                  >
                    Delete permanent
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </div>

      {hasUnsavedChanges && (
        <div className="mb-4 rounded-lg bg-warning/10 px-4 py-2.5 text-body-sm text-warning">
          Modifiche non salvate · usa Save draft o Publish now
        </div>
      )}

      <div className="rounded-xl bg-surface-container-high p-6">
        <h3 className="mb-3 text-label-md uppercase tracking-widest text-text-muted">
          Basic info
        </h3>

        <div className="flex flex-col gap-4">
          {nameField && (
            <FieldRow field={nameField}>
              <Input
                value={String(draft.name ?? "")}
                onChange={(e) => patch("name", e.target.value)}
                className="h-10 bg-surface-container-low border-none"
                placeholder="Es. Wilson Tomales"
              />
            </FieldRow>
          )}
          {slugField && (
            <FieldRow field={slugField} hint={`site${previewUrl}`}>
              <Input
                value={String(draft.slug ?? "")}
                onChange={(e) => patch("slug", e.target.value)}
                className="h-10 bg-surface-container-low border-none font-mono"
              />
            </FieldRow>
          )}
        </div>

        {customFields.length > 0 && (
          <>
            <h3 className="mb-3 mt-6 text-label-md uppercase tracking-widest text-text-muted">
              Custom fields
            </h3>
            <div className="flex flex-col gap-4">
              {customFields.map((f) => (
                <FieldRow key={f.id} field={f}>
                  <ItemFieldControl
                    field={f}
                    value={draft[f.id]}
                    onChange={(v) => patch(f.id, v)}
                    projectId={projectId}
                  />
                </FieldRow>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        {item.liveData ? (
          <p className="flex items-center gap-1.5 text-label-sm text-text-muted">
            <Eye className="h-3 w-3" />
            Versione live: {String(item.liveData.name ?? "—")} · ultimo publish{" "}
            {item.lastPublishedAt
              ? new Date(item.lastPublishedAt).toLocaleString()
              : "—"}
          </p>
        ) : (
          <span />
        )}
        <Link
          href={`/preview/${projectId}/${collection.slug}/${String(
            draft.slug ?? "",
          )}`}
          target="_blank"
          className="inline-flex items-center gap-1.5 rounded-lg bg-surface-container-high px-3 py-1.5 text-label-md text-on-surface hover:bg-surface-container-highest"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          View live preview
        </Link>
      </div>
    </div>
  );
}

function FieldRow({
  field,
  hint,
  children,
}: {
  field: { name: string; required: boolean; helpText?: string };
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="flex items-center gap-1.5 text-label-md uppercase tracking-widest text-text-muted">
        {field.name}
        {field.required && <span className="text-molten-primary">*</span>}
      </label>
      {children}
      {(field.helpText || hint) && (
        <p className="text-label-sm text-text-muted">
          {field.helpText ?? hint}
        </p>
      )}
    </div>
  );
}
