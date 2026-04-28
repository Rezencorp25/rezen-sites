"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Bell, CheckCheck, ScrollText } from "lucide-react";
import { fmtDateLong, fmtTime } from "@/lib/utils/format-date";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuditStore } from "@/lib/stores/audit-store";

export function NotificationsBell() {
  // Subscribe to stable entries reference; derive slice/count via useMemo
  // so we don't return a new array from the selector every render (would
  // cause React error #185 — infinite re-render loop).
  const allEntries = useAuditStore((s) => s.entries);
  const markAllRead = useAuditStore((s) => s.markAllRead);
  const entries = useMemo(() => allEntries.slice(0, 8), [allEntries]);
  const unread = useMemo(
    () => allEntries.filter((e) => !e.read).length,
    [allEntries],
  );
  const [open, setOpen] = useState(false);

  return (
    <DropdownMenu
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (v) {
          // Optimistic mark-as-read after a beat to avoid flicker
          setTimeout(() => markAllRead(), 800);
        }
      }}
    >
      <DropdownMenuTrigger
        aria-label="Notifiche"
        className="relative flex h-8 w-8 items-center justify-center rounded-lg text-text-muted hover:bg-surface-container-high hover:text-on-surface transition-colors"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute right-1.5 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-molten-primary-container px-1 text-[0.625rem] font-bold text-on-molten">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-96 bg-surface-container-highest border-none p-0"
      >
        <div className="flex items-center justify-between border-b border-outline/20 px-4 py-3">
          <p className="text-body-md font-semibold text-on-surface">
            Activity
          </p>
          {unread > 0 && (
            <button
              type="button"
              onClick={() => markAllRead()}
              className="inline-flex items-center gap-1 text-label-md text-molten-primary hover:text-molten-accent-hover"
            >
              <CheckCheck className="h-3 w-3" />
              Segna tutte come lette
            </button>
          )}
        </div>
        <div className="max-h-96 overflow-y-auto">
          {entries.length === 0 ? (
            <p className="px-4 py-8 text-center text-body-sm text-text-muted">
              Nessuna attività recente.
            </p>
          ) : (
            <ul className="flex flex-col">
              {entries.map((e) => (
                <li
                  key={e.id}
                  className={`border-b border-outline/10 px-4 py-2.5 text-body-sm ${
                    !e.read ? "bg-molten-primary-container/5" : ""
                  }`}
                >
                  <p className="text-on-surface">
                    <span className="font-semibold">{e.actor.name}</span>
                    {" — "}
                    {e.description}
                  </p>
                  <p
                    className="mt-0.5 text-label-sm text-text-muted"
                    suppressHydrationWarning
                  >
                    {fmtDateLong(e.at)} {fmtTime(e.at)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
        <Link
          href="/audit"
          onClick={() => setOpen(false)}
          className="flex items-center justify-center gap-2 border-t border-outline/20 py-2.5 text-body-sm font-medium text-molten-primary hover:bg-surface-container"
        >
          <ScrollText className="h-3.5 w-3.5" />
          Apri audit log completo
        </Link>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
