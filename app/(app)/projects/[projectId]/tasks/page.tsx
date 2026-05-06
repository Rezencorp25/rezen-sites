"use client";

import { use, useMemo, useState } from "react";
import {
  ListTodo,
  Plus,
  Trash2,
  Clock,
  Coins,
  GitBranch,
  FileDown,
  Calculator,
} from "lucide-react";
import { toast } from "sonner";
import {
  useTasksStore,
  type TaskStatus,
  type TaskPriority,
} from "@/lib/stores/tasks-store";
import { useWorkspaceStore } from "@/lib/stores/workspace-store";
import { useProjectsStore } from "@/lib/stores/projects-store";
import { Input } from "@/components/ui/input";
import { GradientButton } from "@/components/luminous/gradient-button";
import { StatusPill } from "@/components/luminous/status-pill";
import { ExportTasksModal } from "@/components/tasks/export-modal";
import { fmtDateLong } from "@/lib/utils/format-date";

const STATUS_VARIANT: Record<
  TaskStatus,
  "neutral" | "info" | "success" | "warning" | "error"
> = {
  todo: "neutral",
  in_progress: "info",
  done: "success",
  blocked: "error",
};

export default function TasksPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = use(params);
  const allTasks = useTasksStore((s) => s.tasks);
  const add = useTasksStore((s) => s.add);
  const update = useTasksStore((s) => s.update);
  const remove = useTasksStore((s) => s.remove);
  const billing = useWorkspaceStore((s) => s.config.billing);
  const project = useProjectsStore((s) => s.getById(projectId));

  const tasks = useMemo(
    () => allTasks.filter((t) => t.projectId === projectId),
    [allTasks, projectId],
  );

  const totalHours = tasks.reduce((sum, t) => sum + t.hoursSpent, 0);
  const totalCost = totalHours * billing.hourlyRate;

  const totalEstimatedHours = tasks.reduce(
    (sum, t) => sum + (t.estimatedHours ?? 0),
    0,
  );
  const totalEstimatedCost = tasks.reduce(
    (sum, t) =>
      sum + (t.estimatedHours ?? 0) * (t.customRate ?? billing.hourlyRate),
    0,
  );
  const includedCount = tasks.filter((t) => t.customerPriced).length;

  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [dueDate, setDueDate] = useState("");
  const [exportOpen, setExportOpen] = useState(false);

  return (
    <div className="mx-auto max-w-6xl px-10 py-10">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-label-md uppercase tracking-widest text-text-muted">
            <ListTodo className="h-3.5 w-3.5" />
            Tasks
          </div>
          <h1 className="text-headline-md font-bold text-on-surface">
            Tasks &amp; cost allocation
          </h1>
          <p className="text-body-md text-secondary-text">
            {tasks.length} task · {totalHours}h totali · {billing.currency}{" "}
            {totalCost.toFixed(0)} costo allocato
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            if (includedCount === 0) {
              toast.error(
                "Nessuna task selezionata per l'export. Spunta almeno una checkbox 'Include export'.",
              );
              return;
            }
            setExportOpen(true);
          }}
          className="flex items-center gap-2 rounded-md bg-molten-primary/15 px-3.5 py-2 text-label-md font-medium text-molten-primary transition-colors hover:bg-molten-primary/25"
        >
          <FileDown className="h-3.5 w-3.5" />
          Esporta per cliente ({includedCount})
        </button>
      </div>

      <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-4">
        <div className="rounded-xl bg-surface-container-high p-4">
          <div className="flex items-center gap-2 text-label-md text-text-muted">
            <Clock className="h-3.5 w-3.5" />
            Ore registrate
          </div>
          <p className="mt-1 font-mono text-headline-sm font-bold text-on-surface tabular-nums">
            {totalHours}h
          </p>
        </div>
        <div className="rounded-xl bg-surface-container-high p-4">
          <div className="flex items-center gap-2 text-label-md text-text-muted">
            <Coins className="h-3.5 w-3.5" />
            Costo allocato ({billing.currency} {billing.hourlyRate}/h)
          </div>
          <p className="mt-1 font-mono text-headline-sm font-bold text-molten-primary tabular-nums">
            {billing.currency} {totalCost.toFixed(0)}
          </p>
        </div>
        <div className="rounded-xl bg-surface-container-high p-4">
          <div className="flex items-center gap-2 text-label-md text-text-muted">
            <Calculator className="h-3.5 w-3.5" />
            Preventivo cliente
          </div>
          <p className="mt-1 font-mono text-headline-sm font-bold text-on-surface tabular-nums">
            {totalEstimatedHours}h
          </p>
          <p className="font-mono text-label-sm text-molten-primary tabular-nums">
            {billing.currency} {totalEstimatedCost.toFixed(0)}
          </p>
        </div>
        <div className="rounded-xl bg-surface-container-high p-4">
          <div className="flex items-center gap-2 text-label-md text-text-muted">
            <GitBranch className="h-3.5 w-3.5" />
            Esperimenti / branches
          </div>
          <p className="mt-1 font-mono text-headline-sm font-bold text-info tabular-nums">
            0 attivi
          </p>
          <p className="text-label-sm text-text-muted">
            (branching content sopra Versioning store)
          </p>
        </div>
      </div>

      <section className="mb-5 rounded-xl bg-surface-container-high p-5">
        <div className="grid grid-cols-1 gap-2 md:grid-cols-[2fr_120px_140px_auto]">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Nuova task..."
          />
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as TaskPriority)}
            className="h-10 rounded-md bg-surface-container-low px-3 text-body-sm"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
          <Input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="font-mono text-body-sm"
          />
          <GradientButton
            size="md"
            onClick={() => {
              if (!title) {
                toast.error("Titolo obbligatorio");
                return;
              }
              add({
                projectId,
                title,
                description: "",
                status: "todo",
                priority,
                hoursSpent: 0,
                estimatedHours: 0,
                customRate: null,
                customerPriced: true,
                assigneeName: "Te",
                dueDate: dueDate || new Date().toISOString().slice(0, 10),
              });
              toast.success("Task creata");
              setTitle("");
              setDueDate("");
            }}
          >
            <Plus className="h-4 w-4" />
            Crea
          </GradientButton>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl bg-surface-container-high">
        <div className="grid grid-cols-[2fr_90px_100px_110px_80px_90px_90px_120px_40px] gap-3 px-6 py-2 text-label-sm uppercase tracking-wider text-text-muted">
          <span>Titolo</span>
          <span className="text-center">Status</span>
          <span className="text-center">Prio</span>
          <span>Assignee</span>
          <span className="text-right">Ore</span>
          <span className="text-right">Stima</span>
          <span className="text-center" title="Include in export PDF/CSV per cliente">
            Export
          </span>
          <span>Due</span>
          <span />
        </div>
        {tasks.length === 0 ? (
          <p className="px-6 py-12 text-center text-body-md text-text-muted">
            Nessuna task. Tip: gli alert critici possono essere convertiti
            in task con un click (in DOC 3).
          </p>
        ) : (
          tasks.map((t, i) => (
            <div
              key={t.id}
              className={`grid grid-cols-[2fr_90px_100px_110px_80px_90px_90px_120px_40px] items-center gap-3 px-6 py-2 ${
                i % 2 === 0
                  ? "bg-surface-container-lowest"
                  : "bg-surface-container-low"
              }`}
            >
              <span className="text-body-sm text-on-surface">{t.title}</span>
              <span className="flex justify-center">
                <select
                  value={t.status}
                  onChange={(e) =>
                    update(t.id, { status: e.target.value as TaskStatus })
                  }
                  className="h-7 rounded-md bg-surface-container px-2 text-label-md"
                >
                  <option value="todo">todo</option>
                  <option value="in_progress">in_progress</option>
                  <option value="done">done</option>
                  <option value="blocked">blocked</option>
                </select>
              </span>
              <span className="flex justify-center">
                <StatusPill
                  variant={
                    t.priority === "urgent"
                      ? "error"
                      : t.priority === "high"
                        ? "warning"
                        : t.priority === "medium"
                          ? "info"
                          : "neutral"
                  }
                >
                  {t.priority}
                </StatusPill>
              </span>
              <span className="text-body-sm text-secondary-text">
                {t.assigneeName}
              </span>
              <input
                type="number"
                step="0.5"
                min={0}
                value={t.hoursSpent}
                onChange={(e) =>
                  update(t.id, {
                    hoursSpent: parseFloat(e.target.value) || 0,
                  })
                }
                className="h-7 rounded-md bg-surface-container px-2 text-right font-mono text-label-md tabular-nums"
              />
              <input
                type="number"
                step="0.5"
                min={0}
                value={t.estimatedHours}
                onChange={(e) =>
                  update(t.id, {
                    estimatedHours: parseFloat(e.target.value) || 0,
                  })
                }
                className="h-7 rounded-md bg-surface-container px-2 text-right font-mono text-label-md tabular-nums"
                title="Ore preventive per export cliente"
              />
              <label className="flex items-center justify-center">
                <input
                  type="checkbox"
                  checked={t.customerPriced}
                  onChange={(e) =>
                    update(t.id, { customerPriced: e.target.checked })
                  }
                  className="h-4 w-4 cursor-pointer rounded accent-molten-primary"
                  aria-label="Include in export"
                />
              </label>
              <span
                className="font-mono text-label-md text-text-muted"
                suppressHydrationWarning
              >
                {fmtDateLong(t.dueDate)}
              </span>
              <button
                type="button"
                onClick={() => {
                  remove(t.id);
                  toast.success("Task rimossa");
                }}
                className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-surface-container-highest"
                aria-label="Rimuovi"
              >
                <Trash2 className="h-3.5 w-3.5 text-error" />
              </button>
            </div>
          ))
        )}
        <div className="flex items-center justify-between border-t border-outline/10 px-6 py-2 text-label-md text-text-muted">
          <span>
            {tasks.filter((t) => t.status === "done").length} done ·{" "}
            {tasks.filter((t) => t.status === "in_progress").length} in
            progress · {tasks.filter((t) => t.status === "blocked").length}{" "}
            blocked
          </span>
          <span>
            Cost ricaricato a cliente: {billing.currency}{" "}
            {(totalCost * (1 + billing.costMarkup / 100)).toFixed(0)}
          </span>
        </div>
      </section>

      {project && (
        <ExportTasksModal
          open={exportOpen}
          onClose={() => setExportOpen(false)}
          tasks={tasks.filter((t) => t.customerPriced)}
          project={project}
          billing={billing}
        />
      )}
    </div>
  );
}
