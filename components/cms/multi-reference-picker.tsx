"use client";

import { useMemo } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, X, Database } from "lucide-react";
import { useCMSStore } from "@/lib/stores/cms-store";
import { ReferencePicker } from "@/components/cms/reference-picker";
import type { CMSItem } from "@/types";

function itemLabel(it: CMSItem): string {
  const data = it.liveData ?? it.draftData;
  return String(data.name ?? data.title ?? it.id);
}

export function MultiReferencePicker({
  targetCollectionId,
  projectId,
  values,
  onChange,
}: {
  targetCollectionId: string;
  projectId: string;
  values: string[];
  onChange: (next: string[]) => void;
}) {
  const allCollections = useCMSStore((s) => s.collections);
  const allItems = useCMSStore((s) => s.items);
  const target = allCollections.find((c) => c.id === targetCollectionId);

  const targetItems = useMemo(
    () =>
      allItems.filter(
        (i) =>
          i.collectionId === targetCollectionId && i.projectId === projectId,
      ),
    [allItems, targetCollectionId, projectId],
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = values.indexOf(String(active.id));
    const newIndex = values.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    onChange(arrayMove(values, oldIndex, newIndex));
  }

  function add(id: string) {
    if (values.includes(id)) return;
    onChange([...values, id]);
  }

  function remove(id: string) {
    onChange(values.filter((v) => v !== id));
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg bg-surface-container-low p-3">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={values}
          strategy={horizontalListSortingStrategy}
        >
          <div className="flex flex-wrap gap-1.5">
            {values.length === 0 && (
              <p className="text-body-sm text-text-muted">
                Nessun {target?.singularName ?? "item"} selezionato.
              </p>
            )}
            {values.map((id) => {
              const it = targetItems.find((i) => i.id === id);
              const label = it ? itemLabel(it) : id;
              return (
                <SortableChip
                  key={id}
                  id={id}
                  label={label}
                  onRemove={() => remove(id)}
                />
              );
            })}
          </div>
        </SortableContext>
      </DndContext>

      <ReferencePicker
        targetCollectionId={targetCollectionId}
        projectId={projectId}
        selected={null}
        excludeId={undefined}
        onSelect={add}
        placeholder={`Aggiungi ${target?.singularName ?? "item"}…`}
      />
    </div>
  );
}

function SortableChip({
  id,
  label,
  onRemove,
}: {
  id: string;
  label: string;
  onRemove: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });
  return (
    <span
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.6 : 1,
      }}
      className="inline-flex items-center gap-1.5 rounded-full bg-surface-container px-2.5 py-1 text-label-md text-on-surface"
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="cursor-grab text-text-muted hover:text-on-surface"
        aria-label="Riordina"
      >
        <GripVertical className="h-3 w-3" />
      </button>
      <Database className="h-3 w-3 text-molten-primary" />
      {label}
      <button
        type="button"
        onClick={onRemove}
        aria-label="Rimuovi"
        className="text-text-muted hover:text-on-surface"
      >
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}
