import type { ReactNode } from "react";
import { AppShell } from "@/components/app-shell";
import { TooltipProvider } from "@/components/ui/tooltip";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <TooltipProvider delay={200}>
      <AppShell>{children}</AppShell>
    </TooltipProvider>
  );
}
