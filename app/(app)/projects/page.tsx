"use client";

import { useState } from "react";
import { useProjectsStore } from "@/lib/stores/projects-store";
import { NewProjectDialog } from "@/components/projects/new-project-dialog";
import { ProjectCard } from "@/components/projects/project-card";
import { Plus } from "lucide-react";

export default function ProjectsListPage() {
  const projects = useProjectsStore((s) => s.projects);
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="mx-auto max-w-7xl px-10 py-10">
      <div className="mb-8 flex items-end justify-between gap-6">
        <div className="flex flex-col gap-1">
          <p className="text-label-md uppercase tracking-widest text-text-muted">
            Workspace
          </p>
          <h1 className="text-headline-lg font-bold text-on-surface">
            Progetti
          </h1>
          <p className="text-body-md text-secondary-text">
            {projects.length} siti gestiti dal team REZEN
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        <button
          type="button"
          onClick={() => setDialogOpen(true)}
          className="group relative flex min-h-[280px] flex-col items-center justify-center gap-3 overflow-hidden rounded-2xl border border-dashed border-outline/50 bg-surface-container-lowest transition-all hover:border-molten-primary hover:bg-surface-container-low"
        >
          {/* Animated pulse ring */}
          <span
            className="absolute inset-6 rounded-xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
            style={{
              background:
                "radial-gradient(80% 60% at 50% 50%, rgba(255,98,0,0.18), transparent 70%)",
            }}
          />
          <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-container-high transition-all group-hover:bg-surface-container-highest group-hover:scale-105">
            <Plus className="h-7 w-7 text-molten-primary transition-transform duration-300 group-hover:rotate-90" />
          </div>
          <div className="relative flex flex-col items-center gap-1">
            <span className="text-body-md font-semibold text-on-surface">
              Nuovo Progetto
            </span>
            <span className="text-body-sm text-text-muted">
              Parti vuoto, genera con AI o importa
            </span>
          </div>
        </button>

        {projects.map((p) => (
          <ProjectCard key={p.id} project={p} />
        ))}
      </div>

      <NewProjectDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
