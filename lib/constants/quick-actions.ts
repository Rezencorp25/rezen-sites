import type { LucideIcon } from "lucide-react";
import {
  Sparkles,
  Upload,
  Search,
  ListTodo,
  Inbox,
  FileBarChart,
} from "lucide-react";

export type QuickAction = {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  /**
   * Costruisce l'URL di destinazione per il progetto target.
   * Il query param `?action={id}` permette alla pagina target di reagire
   * (es. aprire automaticamente un dialog "nuova X").
   */
  targetRoute: (projectId: string) => string;
};

export const QUICK_ACTIONS: QuickAction[] = [
  {
    id: "new-page-ai",
    label: "Genera pagina con AI",
    description: "Lancia l'agente Page Designer su un brief.",
    icon: Sparkles,
    targetRoute: (id) => `/projects/${id}/pages?action=new-page-ai`,
  },
  {
    id: "publish-pending",
    label: "Pubblica pagina pendente",
    description: "Filtra le pagine in stato draft e pubblica.",
    icon: Upload,
    targetRoute: (id) => `/projects/${id}/pages?action=publish-pending`,
  },
  {
    id: "run-site-audit",
    label: "Lancia Site Audit",
    description: "Health check Lighthouse + SEO.",
    icon: Search,
    targetRoute: (id) => `/projects/${id}/dashboard?action=run-site-audit`,
  },
  {
    id: "new-task",
    label: "Crea task",
    description: "Aggiungi attività con stima ore.",
    icon: ListTodo,
    targetRoute: (id) => `/projects/${id}/tasks?action=new-task`,
  },
  {
    id: "add-lead",
    label: "Aggiungi lead manuale",
    description: "Inserisci un contatto fuori dai form.",
    icon: Inbox,
    targetRoute: (id) => `/projects/${id}/forms?action=add-lead`,
  },
  {
    id: "generate-report",
    label: "Genera report",
    description: "Report sintetico ultimi 30 giorni.",
    icon: FileBarChart,
    targetRoute: (id) => `/projects/${id}/reports?action=generate`,
  },
];
