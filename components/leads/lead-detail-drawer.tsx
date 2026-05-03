"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Calendar,
  Mail,
  MessageSquare,
  Phone,
  Tag as TagIcon,
  Trash2,
  User,
  X,
} from "lucide-react";
import { useLeadsStore } from "@/lib/stores/leads-store";
import { LEAD_STATUSES, LEAD_STATUS_META } from "@/lib/leads/status-machine";
import type { Lead, LeadStatus } from "@/lib/leads/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const ACTOR = { uid: "demo-user", name: "Admin" };

export function LeadDetailDrawer({
  lead,
  onClose,
}: {
  lead: Lead | null;
  onClose: () => void;
}) {
  const setStatus = useLeadsStore((s) => s.setStatus);
  const setValue = useLeadsStore((s) => s.setValue);
  const addNote = useLeadsStore((s) => s.addNote);
  const addTag = useLeadsStore((s) => s.addTag);
  const removeTag = useLeadsStore((s) => s.removeTag);
  const softDelete = useLeadsStore((s) => s.softDelete);

  const [tab, setTab] = useState<"details" | "notes" | "history">("details");
  const [draftNote, setDraftNote] = useState("");
  const [draftTag, setDraftTag] = useState("");
  const [valueInput, setValueInput] = useState<string>("");

  if (!lead) return null;
  const open = lead !== null;

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 bg-surface-container-highest p-0 sm:max-w-xl"
      >
        <SheetHeader className="flex flex-row items-start justify-between gap-3 border-b border-white/5 px-6 py-5">
          <div className="flex min-w-0 flex-col gap-1">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "h-2 w-2 rounded-full",
                  LEAD_STATUS_META[lead.status].dot,
                )}
              />
              <span
                className={cn(
                  "text-label-sm font-bold uppercase tracking-widest",
                  LEAD_STATUS_META[lead.status].tone,
                )}
              >
                {LEAD_STATUS_META[lead.status].label}
              </span>
            </div>
            <SheetTitle className="text-headline-sm font-bold text-on-surface">
              {lead.fields.name}
            </SheetTitle>
            <SheetDescription className="text-label-md text-text-muted">
              Lead da {lead.source} ·{" "}
              {lead.createdAt.toLocaleDateString("it-IT", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </SheetDescription>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-md text-text-muted hover:bg-surface-container-low hover:text-on-surface"
          >
            <X className="h-4 w-4" />
          </button>
        </SheetHeader>

        {/* Status switcher */}
        <div className="flex flex-wrap gap-1.5 border-b border-white/5 px-6 py-4">
          {LEAD_STATUSES.map((s) => {
            const meta = LEAD_STATUS_META[s];
            const active = s === lead.status;
            return (
              <button
                key={s}
                type="button"
                onClick={() => {
                  setStatus(lead.projectId, lead.id, s, ACTOR);
                  toast.success(`Status → ${meta.label}`);
                }}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-label-sm font-medium transition-colors",
                  active
                    ? cn(meta.bg, meta.tone, "ring-1", meta.ring)
                    : "bg-surface-container-low text-text-muted hover:bg-surface-container",
                )}
              >
                <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
                {meta.label}
              </button>
            );
          })}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/5">
          {(
            [
              { id: "details", label: "Dettagli" },
              { id: "notes", label: `Note · ${lead.notes.length}` },
              { id: "history", label: `Storia · ${lead.history.length}` },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "flex-1 px-4 py-2.5 text-label-md font-semibold transition-colors",
                tab === t.id
                  ? "border-b-2 border-molten-primary text-on-surface"
                  : "text-text-muted hover:text-on-surface",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {tab === "details" && (
            <div className="flex flex-col gap-5">
              <DetailsRow icon={Mail} label="Email" value={lead.fields.email} />
              <DetailsRow icon={Phone} label="Telefono" value={lead.fields.phone} />
              <DetailsRow
                icon={User}
                label="Assegnatario"
                value={lead.assignedToName ?? "Non assegnato"}
              />
              <DetailsRow
                icon={Calendar}
                label="Ultimo update"
                value={lead.updatedAt.toLocaleString("it-IT")}
              />

              {lead.fields.message && (
                <div className="flex flex-col gap-1.5">
                  <span className="flex items-center gap-1.5 text-label-md text-text-muted">
                    <MessageSquare className="h-3.5 w-3.5" />
                    Messaggio
                  </span>
                  <p className="rounded-md bg-surface-container-low px-3 py-2.5 text-body-sm text-on-surface">
                    {lead.fields.message}
                  </p>
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <span className="text-label-md text-text-muted">
                  Valore stimato ({lead.currency ?? "CHF"})
                </span>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={valueInput || (lead.value ?? "")}
                    onChange={(e) => setValueInput(e.target.value)}
                    placeholder="0"
                    className="flex-1 rounded-md bg-surface-container-low px-3 py-2 text-body-sm text-on-surface placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-molten-primary"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const v = valueInput.trim() === "" ? null : Number(valueInput);
                      setValue(lead.projectId, lead.id, v, ACTOR);
                      setValueInput("");
                      toast.success("Valore aggiornato");
                    }}
                    className="rounded-md bg-molten-primary px-4 py-2 text-label-md font-bold text-on-molten hover:bg-molten-primary-container"
                  >
                    Salva
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-label-md text-text-muted">Tag</span>
                <div className="flex flex-wrap gap-1.5">
                  {lead.tags.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => removeTag(lead.projectId, lead.id, t, ACTOR)}
                      className="group flex items-center gap-1 rounded-md bg-surface-container-low px-2 py-1 text-label-sm text-on-surface hover:bg-rose-500/10 hover:text-rose-300"
                    >
                      <TagIcon className="h-3 w-3" />
                      {t}
                      <X className="h-2.5 w-2.5 opacity-0 group-hover:opacity-100" />
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={draftTag}
                    onChange={(e) => setDraftTag(e.target.value)}
                    placeholder="Nuovo tag…"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && draftTag.trim()) {
                        addTag(lead.projectId, lead.id, draftTag.trim(), ACTOR);
                        setDraftTag("");
                      }
                    }}
                    className="flex-1 rounded-md bg-surface-container-low px-3 py-2 text-body-sm text-on-surface placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-molten-primary"
                  />
                </div>
              </div>

              <div className="border-t border-white/5 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    if (
                      confirm(
                        "Soft-delete del lead (GDPR art.17)? Audit log resta, dati PII sostituiti.",
                      )
                    ) {
                      softDelete(lead.projectId, lead.id, ACTOR);
                      toast.success("Lead anonimizzato");
                      onClose();
                    }
                  }}
                  className="flex items-center gap-2 text-label-md text-rose-300 hover:text-rose-200"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Soft-delete (GDPR)
                </button>
              </div>
            </div>
          )}

          {tab === "notes" && (
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-2">
                <textarea
                  value={draftNote}
                  onChange={(e) => setDraftNote(e.target.value)}
                  placeholder="Aggiungi una nota interna…"
                  rows={3}
                  className="w-full resize-none rounded-md bg-surface-container-low px-3 py-2 text-body-sm text-on-surface placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-molten-primary"
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      if (!draftNote.trim()) return;
                      addNote(lead.projectId, lead.id, {
                        id: `note-${Date.now()}`,
                        authorUid: ACTOR.uid,
                        authorName: ACTOR.name,
                        text: draftNote.trim(),
                        createdAt: new Date(),
                      });
                      setDraftNote("");
                      toast.success("Nota aggiunta");
                    }}
                    className="rounded-md bg-molten-primary px-4 py-2 text-label-md font-bold text-on-molten hover:bg-molten-primary-container"
                  >
                    Aggiungi nota
                  </button>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                {lead.notes.length === 0 && (
                  <p className="rounded-md border border-dashed border-white/5 px-3 py-6 text-center text-label-md text-text-muted">
                    Nessuna nota.
                  </p>
                )}
                {lead.notes.map((n) => (
                  <div
                    key={n.id}
                    className="flex flex-col gap-1 rounded-md bg-surface-container-low px-3 py-2.5"
                  >
                    <div className="flex items-baseline justify-between text-label-sm">
                      <span className="font-semibold text-on-surface">{n.authorName}</span>
                      <span className="text-text-muted">
                        {n.createdAt.toLocaleString("it-IT", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="text-body-sm text-on-surface whitespace-pre-wrap">
                      {n.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === "history" && (
            <ol className="flex flex-col gap-2">
              {lead.history.map((h) => (
                <li
                  key={h.id}
                  className="flex gap-3 rounded-md bg-surface-container-low px-3 py-2.5"
                >
                  <div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-molten-primary" />
                  <div className="flex flex-1 flex-col gap-0.5">
                    <p className="text-body-sm text-on-surface">{h.description}</p>
                    <p className="text-label-sm text-text-muted">
                      {h.actorName} ·{" "}
                      {h.createdAt.toLocaleString("it-IT", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function DetailsRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Mail;
  label: string;
  value?: string | null;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-text-muted" />
      <div className="flex flex-col leading-tight">
        <span className="text-label-sm text-text-muted">{label}</span>
        <span className="text-body-sm text-on-surface">{value || "—"}</span>
      </div>
    </div>
  );
}
