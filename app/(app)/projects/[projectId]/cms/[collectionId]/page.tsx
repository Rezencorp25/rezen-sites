"use client";

import { use, useMemo, useState } from "react";
import Link from "next/link";
import { fmtDateTime, fmtDateLong } from "@/lib/utils/format-date";
import {
  ArrowLeft,
  Plus,
  Database,
  FileText,
  Settings as SettingsIcon,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { useCMSStore } from "@/lib/stores/cms-store";
import { SchemaEditor } from "@/components/cms/schema-editor";
import {
  PageStatusPill,
  StatusPill,
} from "@/components/luminous/status-pill";
import { GradientButton } from "@/components/luminous/gradient-button";
import { cn } from "@/lib/utils";

type Tab = "items" | "schema" | "settings";

export default function CollectionDetailPage({
  params,
}: {
  params: Promise<{ projectId: string; collectionId: string }>;
}) {
  const { projectId, collectionId } = use(params);
  const allCollections = useCMSStore((s) => s.collections);
  const allItems = useCMSStore((s) => s.items);
  const addItem = useCMSStore((s) => s.addItem);
  const collection = useMemo(
    () => allCollections.find((c) => c.id === collectionId),
    [allCollections, collectionId],
  );
  const items = useMemo(
    () => allItems.filter((i) => i.collectionId === collectionId),
    [allItems, collectionId],
  );
  const [tab, setTab] = useState<Tab>("items");

  const visibleFields = useMemo(
    () => collection?.fields.slice(0, 4) ?? [],
    [collection],
  );

  if (!collection) {
    return (
      <div className="p-10 text-body-md text-text-muted">
        Collezione non trovata.
      </div>
    );
  }

  function createItem() {
    if (!collection) return;
    const emptyData: Record<string, unknown> = {};
    for (const f of collection.fields) {
      emptyData[f.id] =
        f.type === "boolean" ? false : f.type === "number" ? 0 : "";
    }
    addItem(projectId, collectionId, emptyData);
    toast.success("Nuovo item creato (draft)");
  }

  return (
    <div className="mx-auto max-w-7xl px-10 py-10">
      <Link
        href={`/projects/${projectId}/cms`}
        className="mb-4 inline-flex items-center gap-1.5 text-body-sm text-text-muted hover:text-on-surface"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Tutte le collezioni
      </Link>

      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-container-high">
            <Database className="h-6 w-6 text-molten-primary" />
          </div>
          <div className="flex flex-col gap-0.5">
            <h1 className="text-headline-md font-bold text-on-surface">
              {collection.name}
            </h1>
            <p className="font-mono text-body-sm text-text-muted">
              /{collection.slug} · {collection.fields.length} field ·{" "}
              {items.length} items
            </p>
          </div>
        </div>
        <GradientButton size="md" onClick={createItem}>
          <Plus className="h-4 w-4" />
          Nuovo Item
        </GradientButton>
      </div>

      <nav className="mb-5 flex gap-1 rounded-lg bg-surface-container-high p-1 w-fit">
        {(
          [
            { key: "items", label: "Items", icon: FileText },
            { key: "schema", label: "Schema", icon: Database },
            { key: "settings", label: "Settings", icon: SettingsIcon },
          ] as const
        ).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-4 py-2 text-body-sm font-medium transition-colors",
              tab === key
                ? "bg-surface-container-highest text-on-surface"
                : "text-text-muted hover:text-on-surface",
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </nav>

      {tab === "items" ? (
        items.length === 0 ? (
          <div className="rounded-xl bg-surface-container-high px-10 py-16 text-center">
            <Sparkles className="mx-auto mb-3 h-6 w-6 text-molten-primary" />
            <p className="text-body-md font-semibold text-on-surface">
              Nessun item ancora
            </p>
            <p className="text-body-sm text-text-muted">
              Crea il primo item con &quot;Nuovo Item&quot; oppure generalo con AI in F4.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl bg-surface-container-high">
            <div
              className="grid gap-4 px-6 py-3 text-label-md uppercase tracking-widest text-text-muted"
              style={{
                gridTemplateColumns: `90px ${visibleFields
                  .map(() => "1fr")
                  .join(" ")} 130px`,
              }}
            >
              <span>Status</span>
              {visibleFields.map((f) => (
                <span key={f.id}>{f.name}</span>
              ))}
              <span>Updated</span>
            </div>
            {items.map((item, i) => (
              <div
                key={item.id}
                className={cn(
                  "grid items-center gap-4 px-6 py-3",
                  i % 2 === 0
                    ? "bg-surface-container-lowest"
                    : "bg-surface-container-low",
                )}
                style={{
                  gridTemplateColumns: `90px ${visibleFields
                    .map(() => "1fr")
                    .join(" ")} 130px`,
                }}
              >
                <PageStatusPill status={item.status} />
                {visibleFields.map((f) => {
                  const v = item.data[f.id];
                  if (f.type === "boolean") {
                    return (
                      <span key={f.id}>
                        <StatusPill variant={v ? "success" : "neutral"}>
                          {v ? "YES" : "NO"}
                        </StatusPill>
                      </span>
                    );
                  }
                  return (
                    <span
                      key={f.id}
                      className="truncate text-body-sm text-on-surface"
                    >
                      {String(v ?? "—")}
                    </span>
                  );
                })}
                <span className="text-label-sm text-text-muted">
                  {fmtDateTime(item.updatedAt)}
                </span>
              </div>
            ))}
          </div>
        )
      ) : tab === "schema" ? (
        <SchemaEditor
          collectionId={collection.id}
          initialFields={collection.fields}
        />
      ) : (
        <div className="rounded-xl bg-surface-container-high p-6">
          <h3 className="mb-4 text-title-md font-semibold text-on-surface">
            Settings collezione
          </h3>
          <div className="flex flex-col gap-3 text-body-sm text-secondary-text">
            <div className="flex justify-between">
              <span>Slug</span>
              <span className="font-mono text-on-surface">
                /{collection.slug}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Created</span>
              <span className="text-on-surface">
                {fmtDateLong(collection.createdAt)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Project ID</span>
              <span className="font-mono text-on-surface">{projectId}</span>
            </div>
          </div>
          <p className="mt-6 text-label-sm text-text-muted">
            Delete collection + archive: disponibile in DOC 3.
          </p>
        </div>
      )}
    </div>
  );
}
