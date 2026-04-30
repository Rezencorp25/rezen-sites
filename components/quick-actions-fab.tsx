"use client";

import { useState } from "react";
import { Sparkles, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { QUICK_ACTIONS, type QuickAction } from "@/lib/constants/quick-actions";
import { QuickActionsTargetModal } from "@/components/quick-actions-target-modal";

/**
 * Floating Action Button con design liquid-glass molten.
 * Posizionato bottom-right del workspace progetti.
 *
 * Flow:
 *   1. Click FAB → apre dropdown con lista QuickActions
 *   2. Selezione azione → apre modal "su quale progetto?"
 *   3. Selezione progetto → naviga a action.targetRoute(projectId)
 */
export function QuickActionsFab() {
  const [open, setOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<QuickAction | null>(
    null,
  );

  return (
    <>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger
          aria-label="Azioni rapide"
          className={cn(
            "fixed bottom-6 right-6 z-40",
            "group flex h-14 w-14 items-center justify-center rounded-2xl",
            "border border-white/15 backdrop-blur-xl",
            "shadow-2xl shadow-molten-primary/30 transition-all duration-300",
            "hover:scale-105 hover:shadow-molten-primary/50",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-molten-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface-dim",
            "data-[state=open]:scale-105",
          )}
          style={{
            background:
              "linear-gradient(135deg, rgba(255,133,51,0.85) 0%, rgba(255,98,0,0.85) 100%)",
            boxShadow:
              "0 10px 30px -8px rgba(255,98,0,0.5), inset 0 1px 0 rgba(255,255,255,0.25)",
          }}
        >
          <Sparkles className="h-6 w-6 text-on-molten transition-transform duration-300 group-data-[state=open]:rotate-12" />
          <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-surface-container-highest ring-2 ring-surface-dim">
            <ChevronUp className="h-2.5 w-2.5 text-on-surface" />
          </span>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          side="top"
          sideOffset={12}
          className={cn(
            "w-80 p-2 border-none",
            "bg-surface-container-highest/85 backdrop-blur-xl",
            "shadow-2xl shadow-molten-primary/20 ring-1 ring-white/10",
          )}
        >
          <div className="mb-1 px-3 pt-1.5 pb-2">
            <p className="text-label-md font-bold uppercase tracking-widest text-text-muted">
              Azioni rapide
            </p>
            <p className="text-label-sm text-text-muted">
              Scegli cosa fare, poi su quale sito.
            </p>
          </div>

          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <DropdownMenuItem
                key={action.id}
                onSelect={(e) => {
                  e.preventDefault();
                  setSelectedAction(action);
                  setOpen(false);
                }}
                className={cn(
                  "flex items-start gap-3 rounded-lg px-3 py-2.5 cursor-pointer",
                  "focus:bg-surface-container-low",
                )}
              >
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-container-low ring-1 ring-white/5">
                  <Icon className="h-4 w-4 text-molten-primary" />
                </span>
                <div className="flex flex-col leading-tight min-w-0">
                  <span className="text-body-sm font-semibold text-on-surface">
                    {action.label}
                  </span>
                  <span className="text-label-sm text-text-muted">
                    {action.description}
                  </span>
                </div>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      <QuickActionsTargetModal
        action={selectedAction}
        onClose={() => setSelectedAction(null)}
      />
    </>
  );
}
