/**
 * Tipi condivisi CRM Lead Pipeline.
 *
 * Source of truth duplicato in functions/src/leads/types.ts (Cloud Functions
 * non possono importare cross-package). Mantenere allineato.
 */

export type LeadStatus =
  | "new"
  | "contacted"
  | "qualified"
  | "won"
  | "lost";

export type LeadSource = "form" | "manual" | "api";

export type LeadNote = {
  id: string;
  authorUid: string;
  authorName: string;
  text: string;
  createdAt: Date;
};

export type LeadHistoryEvent = {
  id: string;
  actorUid: string;
  actorName: string;
  action:
    | "created"
    | "status_changed"
    | "assigned"
    | "value_set"
    | "tag_added"
    | "tag_removed"
    | "note_added"
    | "soft_deleted";
  from?: LeadStatus | string | null;
  to?: LeadStatus | string | null;
  description: string;
  createdAt: Date;
};

export type Lead = {
  id: string;
  projectId: string;
  source: LeadSource;
  formId?: string;
  formSubmissionId?: string;
  fields: {
    name: string;
    email?: string;
    phone?: string;
    message?: string;
    [k: string]: string | undefined;
  };
  status: LeadStatus;
  statusUpdatedAt: Date;
  statusUpdatedBy?: string;
  assignedTo?: string | null;
  assignedToName?: string | null;
  value?: number | null;
  currency?: string;
  notes: LeadNote[];
  history: LeadHistoryEvent[];
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  /** GDPR soft-delete: i campi PII vengono sostituiti con [DELETED]. */
  deleted?: boolean;
};
