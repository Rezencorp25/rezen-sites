"use client";

import type { ReactNode } from "react";
import { useParams } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { AppHeader } from "@/components/app-header";
import { cn } from "@/lib/utils";

/**
 * Layout shell client-side che gestisce la presenza della sidebar in modo
 * animato premium quando si entra/esce dallo scope di un progetto.
 *
 * Pattern: la sidebar è SEMPRE montata (no conditional mount, evita flicker e
 * preserva auth/state). Si anima il wrapper esterno con `width + opacity` e
 * il wrapper interno con `translate-x` per un effetto layered ease-out.
 *
 * Curva: cubic-bezier(0.22, 1, 0.36, 1) — easeOutExpo, sensazione "premium".
 * Durata: 500ms — abbastanza lunga da percepire il movimento, abbastanza
 * corta da non rallentare la navigazione.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const params = useParams<{ projectId?: string }>();
  const inProjectScope = Boolean(params?.projectId);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-surface-dim">
      <div
        aria-hidden={!inProjectScope}
        className={cn(
          "shrink-0 overflow-hidden",
          "transition-[width,opacity] duration-500",
          "ease-[cubic-bezier(0.22,1,0.36,1)]",
          inProjectScope ? "w-56 opacity-100" : "w-0 opacity-0",
        )}
      >
        <div
          className={cn(
            "h-full",
            "transition-transform duration-500",
            "ease-[cubic-bezier(0.22,1,0.36,1)]",
            "will-change-transform",
            inProjectScope ? "translate-x-0" : "-translate-x-4",
          )}
        >
          <AppSidebar />
        </div>
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
