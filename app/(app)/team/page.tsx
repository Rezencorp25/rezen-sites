"use client";

import { useState } from "react";
import { Users, Plus, Shield, ShieldCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  useTeamStore,
  ROLE_PERMISSIONS,
  type Role,
  type TeamMember,
} from "@/lib/stores/team-store";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GradientButton } from "@/components/luminous/gradient-button";
import { StatusPill } from "@/components/luminous/status-pill";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function TeamPage() {
  const members = useTeamStore((s) => s.list());
  const invite = useTeamStore((s) => s.invite);
  const updateRole = useTeamStore((s) => s.updateRole);
  const toggleStatus = useTeamStore((s) => s.toggleStatus);
  const remove = useTeamStore((s) => s.remove);

  return (
    <div className="mx-auto max-w-6xl px-10 py-10">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <div className="flex items-center gap-2 text-label-md uppercase tracking-widest text-text-muted">
            <Users className="h-3.5 w-3.5" />
            Team & permissions
          </div>
          <h1 className="text-headline-md font-bold text-on-surface">
            Team REZEN
          </h1>
          <p className="text-body-md text-secondary-text">
            Gestisci accessi, ruoli e MFA. {members.length} membri totali.
          </p>
        </div>
        <InviteDialog onInvite={invite} />
      </div>

      <section className="overflow-hidden rounded-xl bg-surface-container-high">
        <div className="grid grid-cols-[1.4fr_140px_1fr_100px_60px] gap-4 px-6 py-3 text-label-md uppercase tracking-widest text-text-muted">
          <span>Membro</span>
          <span>Ruolo</span>
          <span>Accesso progetti</span>
          <span className="text-center">Status</span>
          <span />
        </div>
        {members.map((m, i) => (
          <MemberRow
            key={m.id}
            member={m}
            stripe={i % 2 === 0}
            onRoleChange={(r) => updateRole(m.id, r)}
            onToggleStatus={() => {
              toggleStatus(m.id);
              toast.success(
                `Membro ${m.status === "active" ? "disabilitato" : "riattivato"}`,
              );
            }}
            onRemove={() => {
              if (m.role === "super-admin") {
                toast.error("Non puoi rimuovere un super-admin");
                return;
              }
              remove(m.id);
              toast.success("Membro rimosso");
            }}
          />
        ))}
      </section>

      <section className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
        {(Object.keys(ROLE_PERMISSIONS) as Role[]).map((r) => {
          const info = ROLE_PERMISSIONS[r];
          return (
            <div
              key={r}
              className="rounded-xl bg-surface-container-high p-4"
            >
              <div className="mb-1.5 flex items-center gap-2">
                <Shield className="h-3.5 w-3.5 text-molten-primary" />
                <p className="text-body-md font-semibold text-on-surface">
                  {info.label}
                </p>
              </div>
              <p className="text-label-md text-text-muted">
                {info.description}
              </p>
            </div>
          );
        })}
      </section>
    </div>
  );
}

function MemberRow({
  member,
  stripe,
  onRoleChange,
  onToggleStatus,
  onRemove,
}: {
  member: TeamMember;
  stripe: boolean;
  onRoleChange: (r: Role) => void;
  onToggleStatus: () => void;
  onRemove: () => void;
}) {
  return (
    <div
      className={`grid grid-cols-[1.4fr_140px_1fr_100px_60px] items-center gap-4 px-6 py-3 ${
        stripe ? "bg-surface-container-lowest" : "bg-surface-container-low"
      }`}
    >
      <div className="flex flex-col leading-tight">
        <span className="text-body-sm font-semibold text-on-surface">
          {member.name}
        </span>
        <span className="font-mono text-label-sm text-text-muted">
          {member.email}
        </span>
        {member.mfaEnabled && (
          <span className="mt-0.5 inline-flex w-fit items-center gap-1 rounded bg-success-container px-1.5 py-0.5 text-label-sm text-success">
            <ShieldCheck className="h-3 w-3" />
            MFA
          </span>
        )}
      </div>
      <select
        value={member.role}
        onChange={(e) => onRoleChange(e.target.value as Role)}
        className="h-8 rounded-md bg-surface-container-low px-2 text-label-md font-semibold text-on-surface"
      >
        {(Object.keys(ROLE_PERMISSIONS) as Role[]).map((r) => (
          <option key={r} value={r}>
            {ROLE_PERMISSIONS[r].label}
          </option>
        ))}
      </select>
      <span className="font-mono text-label-md text-secondary-text">
        {member.projectAccess === "*"
          ? "Tutti i progetti"
          : member.projectAccess.length === 0
            ? "Nessuno"
            : `${member.projectAccess.length} progetti`}
      </span>
      <span className="flex justify-center">
        {member.status === "active" ? (
          <StatusPill variant="success">Attivo</StatusPill>
        ) : member.status === "pending" ? (
          <StatusPill variant="warning">Pending</StatusPill>
        ) : (
          <StatusPill variant="neutral">Disabilitato</StatusPill>
        )}
      </span>
      <div className="flex items-center justify-end gap-1">
        <button
          type="button"
          onClick={onToggleStatus}
          className="rounded-md px-2 py-1 text-label-md text-secondary-text hover:bg-surface-container-highest"
        >
          {member.status === "active" ? "Off" : "On"}
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-surface-container-highest"
          aria-label="Rimuovi"
        >
          <Trash2 className="h-3.5 w-3.5 text-error" />
        </button>
      </div>
    </div>
  );
}

function InviteDialog({
  onInvite,
}: {
  onInvite: (m: Omit<TeamMember, "id" | "invitedAt" | "status">) => void;
}) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<Role>("editor");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        className="flex items-center gap-2 rounded-lg bg-surface-container-high px-4 py-2.5 text-body-sm font-semibold text-on-surface hover:bg-surface-container-highest transition-colors"
      >
        <Plus className="h-4 w-4 text-molten-primary" />
        Invita membro
      </DialogTrigger>
      <DialogContent className="bg-surface-container-highest border-none sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invita un nuovo membro</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3 pt-2">
          <div className="space-y-1.5">
            <Label className="text-label-md text-secondary-text">Nome</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Mario Rossi"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-label-md text-secondary-text">Email</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="mario@rezencorp.com"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-label-md text-secondary-text">Ruolo</Label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
              className="h-10 w-full rounded-md bg-surface-container-low px-3 text-body-sm"
            >
              {(Object.keys(ROLE_PERMISSIONS) as Role[]).map((r) => (
                <option key={r} value={r}>
                  {ROLE_PERMISSIONS[r].label}
                </option>
              ))}
            </select>
          </div>
          <GradientButton
            size="md"
            onClick={() => {
              if (!email || !name) {
                toast.error("Completa tutti i campi");
                return;
              }
              onInvite({
                email,
                name,
                role,
                projectAccess: role === "super-admin" || role === "admin" ? "*" : [],
                mfaEnabled: false,
              });
              toast.success(`Invito inviato a ${email}`);
              setOpen(false);
              setEmail("");
              setName("");
              setRole("editor");
            }}
          >
            Invia invito
          </GradientButton>
        </div>
      </DialogContent>
    </Dialog>
  );
}
