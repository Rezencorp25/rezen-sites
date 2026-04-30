"use client";

import { useRouter, useParams } from "next/navigation";
import { useProjectsStore } from "@/lib/stores/projects-store";
import { useAppStore } from "@/lib/stores/app-store";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronsUpDown } from "lucide-react";
import { PageStatusPill } from "@/components/luminous/status-pill";
import { gradientFor, initialsFor } from "@/lib/utils/hash-gradient";

export function ProjectSwitcher() {
  const router = useRouter();
  const params = useParams<{ projectId?: string }>();
  const projects = useProjectsStore((s) => s.projects);
  const setCurrent = useAppStore((s) => s.setCurrentProjectId);

  const activeId = params?.projectId ?? null;
  if (!activeId) return null;
  const active = projects.find((p) => p.id === activeId);
  if (!active) return null;
  const activeGrad = gradientFor(active.id);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2.5 rounded-lg bg-surface-container-low px-2 py-1.5 text-body-sm hover:bg-surface-container-high transition-colors ring-1 ring-outline/30">
        <span
          className="flex h-6 w-6 items-center justify-center rounded-md text-label-sm font-bold text-on-surface"
          style={{ background: activeGrad.css }}
        >
          {initialsFor(active.name)}
        </span>
        <div className="flex flex-col items-start leading-tight">
          <span className="font-semibold text-on-surface">{active.name}</span>
          <span className="text-label-sm text-text-muted">
            {active.domain}
          </span>
        </div>
        <ChevronsUpDown className="ml-1 h-3.5 w-3.5 text-text-muted" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-80 bg-popover border-none p-1.5"
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-label-md uppercase tracking-wider text-text-muted">
            Switch project
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {projects.map((p) => {
            const g = gradientFor(p.id);
            const isActive = p.id === active.id;
            return (
              <DropdownMenuItem
                key={p.id}
                onSelect={() => {
                  setCurrent(p.id);
                  router.push(`/projects/${p.id}/dashboard`);
                }}
                className="flex items-center gap-3 rounded-lg px-2 py-2 focus:bg-surface-container-high"
              >
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-label-md font-bold text-on-surface"
                  style={{ background: g.css }}
                >
                  {initialsFor(p.name)}
                </span>
                <div className="flex flex-1 flex-col leading-tight min-w-0">
                  <span className="truncate font-semibold text-on-surface">
                    {p.name}
                  </span>
                  <span className="truncate font-mono text-label-sm text-text-muted">
                    {p.domain}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <PageStatusPill status={p.status} />
                  {isActive && (
                    <span className="h-1.5 w-1.5 rounded-full bg-molten-primary-container" />
                  )}
                </div>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
