import type { Alert } from "@/types";

export const MOCK_ALERTS: Alert[] = [
  {
    id: "a6",
    projectId: "impresa-edile-carfi",
    severity: "info",
    title: "Setup completato",
    description: "Dominio custom attivato e SSL verificato.",
    createdAt: new Date("2026-04-10T12:00:00Z"),
    acknowledged: false,
    fixAction: "manual",
  },
];
