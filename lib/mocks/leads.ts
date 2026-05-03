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
  "verumflow-ch": [
    lead({
      id: "lead-vf-1",
      projectId: "verumflow-ch",
      name: "Marco Rossi",
      status: "new",
      createdAt: hours(4),
      tags: ["enterprise"],
      fields: { phone: "+41 79 123 45 67", message: "Vorrei una demo del CMS." },
    }),
    lead({
      id: "lead-vf-2",
      projectId: "verumflow-ch",
      name: "Lucia Bianchi",
      status: "new",
      createdAt: days(1),
      fields: { message: "Quanto costa il piano agenzia?" },
    }),
    lead({
      id: "lead-vf-3",
      projectId: "verumflow-ch",
      name: "Studio Legale Conti",
      status: "contacted",
      createdAt: days(3),
      assignedTo: "demo-user",
      assignedToName: "Admin",
      tags: ["legal"],
    }),
    lead({
      id: "lead-vf-4",
      projectId: "verumflow-ch",
      name: "Hotel Lago",
      status: "qualified",
      createdAt: days(5),
      value: 2400,
      assignedTo: "demo-user",
      assignedToName: "Admin",
      tags: ["hospitality", "preventivo"],
    }),
    lead({
      id: "lead-vf-5",
      projectId: "verumflow-ch",
      name: "Ristorante Da Mario",
      status: "qualified",
      createdAt: days(6),
      value: 1200,
      tags: ["food"],
    }),
    lead({
      id: "lead-vf-6",
      projectId: "verumflow-ch",
      name: "Boutique Viale",
      status: "won",
      createdAt: days(12),
      value: 3800,
      assignedTo: "demo-user",
      assignedToName: "Admin",
      tags: ["retail"],
    }),
    lead({
      id: "lead-vf-7",
      projectId: "verumflow-ch",
      name: "Tecnostudio SA",
      status: "won",
      createdAt: days(20),
      value: 5400,
      tags: ["b2b"],
    }),
    lead({
      id: "lead-vf-8",
      projectId: "verumflow-ch",
      name: "Carlo Marchi",
      status: "lost",
      createdAt: days(15),
      notes: [
        {
          id: "note-vf8-1",
          authorUid: "demo-user",
          authorName: "Admin",
          text: "Budget non coerente, consigliato piano starter di un competitor.",
          createdAt: days(14),
        },
      ],
    }),
  ],
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
