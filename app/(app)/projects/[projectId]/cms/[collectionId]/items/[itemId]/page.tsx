"use client";

import { use, useMemo } from "react";
import Link from "next/link";
import { useCMSStore } from "@/lib/stores/cms-store";
import { ItemEditor } from "@/components/cms/item-editor";

export default function CMSItemEditorPage({
  params,
}: {
  params: Promise<{
    projectId: string;
    collectionId: string;
    itemId: string;
  }>;
}) {
  const { projectId, collectionId, itemId } = use(params);
  const collections = useCMSStore((s) => s.collections);
  const items = useCMSStore((s) => s.items);

  const collection = useMemo(
    () => collections.find((c) => c.id === collectionId),
    [collections, collectionId],
  );
  const item = useMemo(() => items.find((i) => i.id === itemId), [items, itemId]);

  if (!collection || !item) {
    return (
      <div className="mx-auto max-w-3xl px-10 py-16 text-center">
        <p className="text-body-md text-text-muted">
          Item non trovato in questa collezione.
        </p>
        <Link
          href={`/projects/${projectId}/cms`}
          className="mt-2 inline-block text-body-sm text-molten-primary hover:brightness-110"
        >
          ← Tutte le collezioni
        </Link>
      </div>
    );
  }

  return (
    <ItemEditor collection={collection} item={item} projectId={projectId} />
  );
}
