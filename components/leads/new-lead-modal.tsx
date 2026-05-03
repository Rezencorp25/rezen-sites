"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useLeadsStore } from "@/lib/stores/leads-store";
import type { Lead } from "@/lib/leads/types";
import { toast } from "sonner";

export function NewLeadModal({
  projectId,
  open,
  onClose,
}: {
  projectId: string;
  open: boolean;
  onClose: () => void;
}) {
  const add = useLeadsStore((s) => s.add);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");

  function reset() {
    setName("");
    setEmail("");
    setPhone("");
    setMessage("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Nome obbligatorio");
      return;
    }
    const now = new Date();
    const lead: Lead = {
      id: `lead-manual-${Date.now()}`,
      projectId,
      source: "manual",
      fields: {
        name: name.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        message: message.trim() || undefined,
      },
      status: "new",
      statusUpdatedAt: now,
      statusUpdatedBy: "demo-user",
      assignedTo: null,
      assignedToName: null,
      value: null,
      currency: "CHF",
      notes: [],
      tags: [],
      history: [
        {
          id: `evt-${Date.now()}`,
          actorUid: "demo-user",
          actorName: "Admin",
          action: "created",
          description: "Lead creato manualmente",
          createdAt: now,
        },
      ],
      createdAt: now,
      updatedAt: now,
    };
    add(lead);
    toast.success("Lead aggiunto");
    reset();
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-surface-container-highest border-none ring-1 ring-white/10 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-title-lg font-bold text-on-surface">
            Nuovo lead manuale
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 pt-2">
          <Field
            label="Nome *"
            value={name}
            onChange={setName}
            placeholder="Mario Rossi"
            required
          />
          <Field
            label="Email"
            value={email}
            onChange={setEmail}
            placeholder="mario@example.com"
            type="email"
          />
          <Field
            label="Telefono"
            value={phone}
            onChange={setPhone}
            placeholder="+41 79 ..."
          />
          <div className="flex flex-col gap-1">
            <span className="text-label-md text-text-muted">Messaggio</span>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              placeholder="Note libere…"
              className="resize-none rounded-md bg-surface-container-low px-3 py-2 text-body-sm text-on-surface placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-molten-primary"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md px-4 py-2 text-label-md text-text-muted hover:text-on-surface"
            >
              Annulla
            </button>
            <button
              type="submit"
              className="rounded-md bg-molten-primary px-4 py-2 text-label-md font-bold text-on-molten hover:bg-molten-primary-container"
            >
              Crea lead
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-label-md text-text-muted">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="rounded-md bg-surface-container-low px-3 py-2 text-body-sm text-on-surface placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-molten-primary"
      />
    </div>
  );
}
