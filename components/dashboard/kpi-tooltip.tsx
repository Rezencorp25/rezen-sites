"use client";

import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export function KpiTooltip({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger
          aria-label="Definizione KPI"
          className={cn(
            "inline-flex h-4 w-4 items-center justify-center rounded-full text-text-muted transition-colors hover:text-on-surface focus:outline-none focus-visible:text-on-surface focus-visible:ring-2 focus-visible:ring-molten-primary",
            className,
          )}
        >
          <Info className="h-3 w-3" />
        </TooltipTrigger>
        <TooltipContent side="top" sideOffset={6} className="max-w-xs">
          <span className="text-xs leading-relaxed">{text}</span>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
