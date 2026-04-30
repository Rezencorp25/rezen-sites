"use client";

import type { ReactNode } from "react";
import { useParams } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { AppHeader } from "@/components/app-header";

/**
 * Layout shell client-side che decide se renderizzare la sidebar
 * in base al fatto che siamo o no dentro lo scope di un singolo progetto.
 *
 * Routes con sidebar: /projects/[projectId]/...
 * Routes senza sidebar: /projects (lista), /onboarding, /team, /audit, /admin
 *
 * Quando si entra in un progetto, la sidebar appare con slide-in da sinistra
 * + fade-in (animazione CSS via tw-animate-css). Il pannello principale slitta
 * a destra grazie alla width animation della sidebar.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const params = useParams<{ projectId?: string }>();
  const inProjectScope = Boolean(params?.projectId);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-surface-dim">
      {inProjectScope && (
        <div
          key="project-sidebar"
          className="animate-in slide-in-from-left fade-in duration-300 ease-out"
        >
          <AppSidebar />
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
