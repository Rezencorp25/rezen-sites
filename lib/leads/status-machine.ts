import type { LeadStatus } from "./types";

export const LEAD_STATUSES: readonly LeadStatus[] = [
  "new",
  "contacted",
  "qualified",
  "won",
  "lost",
] as const;

export const LEAD_STATUS_META: Record<
  LeadStatus,
  { label: string; tone: string; bg: string; ring: string; dot: string }
> = {
  new: {
    label: "Nuovi",
    tone: "text-sky-300",
    bg: "bg-sky-500/8",
    ring: "ring-sky-500/25",
    dot: "bg-sky-400",
  },
  contacted: {
    label: "Contattati",
    tone: "text-violet-300",
    bg: "bg-violet-500/8",
    ring: "ring-violet-500/25",
    dot: "bg-violet-400",
  },
  qualified: {
    label: "Qualificati",
    tone: "text-amber-300",
    bg: "bg-amber-500/8",
    ring: "ring-amber-500/25",
    dot: "bg-amber-400",
  },
  won: {
    label: "Won",
    tone: "text-emerald-300",
    bg: "bg-emerald-500/8",
    ring: "ring-emerald-500/25",
    dot: "bg-emerald-400",
  },
  lost: {
    label: "Lost",
    tone: "text-rose-300",
    bg: "bg-rose-500/8",
    ring: "ring-rose-500/25",
    dot: "bg-rose-400",
  },
};

/**
 * Transizioni permesse. Il prototipo è permissivo (qualunque transizione tra
 * stati attivi); blocco solo i tentativi di "rianimare" un lead chiuso (won/lost
 * → tornare a new) per evitare incoerenze nel log.
 */
const TERMINAL: LeadStatus[] = ["won", "lost"];

export function canTransition(
  from: LeadStatus,
  to: LeadStatus,
): boolean {
  if (from === to) return false;
  if (TERMINAL.includes(from) && to === "new") return false;
  return true;
}

export function isTerminal(s: LeadStatus): boolean {
  return TERMINAL.includes(s);
}
