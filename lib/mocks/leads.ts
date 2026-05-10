import type { Lead } from "@/lib/leads/types";

const now = Date.now();
const days = (n: number) => new Date(now - n * 86400_000);
const hours = (n: number) => new Date(now - n * 3600_000);

type LeadSeed = Omit<Partial<Lead>, "fields"> & {
  id: string;
  projectId: string;
  name: string;
  status: Lead["status"];
  fields?: { email?: string; phone?: string; message?: string };
};

function lead(partial: LeadSeed): Lead {
  const created = partial.createdAt ?? days(7);
  return {
    id: partial.id,
    projectId: partial.projectId,
    source: partial.source ?? "form",
    formId: partial.formId ?? "form-contact",
    formSubmissionId: partial.formSubmissionId,
    fields: {
      name: partial.name,
      email: partial.fields?.email ?? `${partial.name.toLowerCase().replace(/\s+/g, ".")}@example.com`,
      phone: partial.fields?.phone,
      message: partial.fields?.message,
      ...partial.fields,
    },
    status: partial.status,
    statusUpdatedAt: partial.statusUpdatedAt ?? created,
    statusUpdatedBy: partial.statusUpdatedBy ?? "demo-user",
    assignedTo: partial.assignedTo ?? null,
    assignedToName: partial.assignedToName ?? null,
    value: partial.value ?? null,
    currency: partial.currency ?? "CHF",
    notes: partial.notes ?? [],
    history: partial.history ?? [
      {
        id: `${partial.id}-h0`,
        actorUid: "system",
        actorName: "Sistema",
        action: "created",
        description: `Lead creato da ${partial.source ?? "form"}`,
        createdAt: created,
      },
    ],
    tags: partial.tags ?? [],
    createdAt: created,
    updatedAt: partial.updatedAt ?? created,
    deleted: false,
  };
}

export const MOCK_LEADS_BY_PROJECT: Record<string, Lead[]> = {
  "verumflow-ch": [],
  "impresa-edile-carfi": [
    lead({
      id: "lead-ic-1",
      projectId: "impresa-edile-carfi",
      name: "Famiglia Rossi",
      status: "new",
      createdAt: hours(8),
      fields: {
        phone: "+41 91 555 12 34",
        message: "Ristrutturazione bagno, preventivo entro fine mese.",
      },
    }),
    lead({
      id: "lead-ic-2",
      projectId: "impresa-edile-carfi",
      name: "Condominio Via Lago 4",
      status: "qualified",
      createdAt: days(4),
      value: 18000,
      tags: ["condominio"],
    }),
    lead({
      id: "lead-ic-3",
      projectId: "impresa-edile-carfi",
      name: "Hotel Belvedere",
      status: "won",
      createdAt: days(22),
      value: 45000,
      assignedTo: "demo-user",
      assignedToName: "Admin",
      tags: ["hospitality"],
    }),
  ],
  "consulting-bio": [
    lead({
      id: "lead-cb-1",
      projectId: "consulting-bio",
      name: "Azienda Agricola Sud",
      status: "new",
      createdAt: days(2),
      fields: { message: "Consulenza certificazione bio, agosto." },
    }),
  ],
};
