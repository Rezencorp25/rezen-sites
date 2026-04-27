"use client";

import { useState } from "react";
import { Download, FileCode2, FileDown, Package, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePagesStore } from "@/lib/stores/pages-store";
import { useProjectsStore } from "@/lib/stores/projects-store";
import { useSettingsStore } from "@/lib/stores/settings-store";
import { cn } from "@/lib/utils";
import type { Page } from "@/types";

type Format = "html" | "react" | "nextjs";

export function ExportMenu({
  page,
  projectId,
  projectName,
}: {
  page: Page;
  projectId: string;
  projectName: string;
}) {
  const [busy, setBusy] = useState<Format | null>(null);
  const allPages = usePagesStore((s) => s.pages);
  const project = useProjectsStore((s) => s.getById(projectId));
  const settings = useSettingsStore((s) => s.get(projectId));
  const localBusiness = settings.localBusiness;
  const locale = settings.general.defaultLocale;
  const alternates = settings.general.alternates;
  const consent = settings.consent;

  async function run(format: Format) {
    if (busy) return;
    setBusy(format);
    try {
      const body =
        format === "nextjs"
          ? {
              projectName,
              project,
              localBusiness,
              locale,
              alternates,
              consent,
              pages: allPages.filter(
                (p) => p.projectId === projectId && p.status === "published",
              ),
            }
          : { page, project, localBusiness, locale, alternates, consent };

      if (format === "nextjs" && body.pages!.length === 0) {
        toast.error("Nessuna pagina pubblicata da esportare");
        setBusy(null);
        return;
      }

      const res = await fetch(`/api/export/${format}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(await res.text());
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download =
        res.headers
          .get("content-disposition")
          ?.match(/filename="([^"]+)"/)?.[1] ?? "export";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success(`Export ${labelFor(format)} completato`);
    } catch (err) {
      toast.error(`Export fallito: ${(err as Error).message}`);
    } finally {
      setBusy(null);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-surface-container-high hover:text-on-surface",
        )}
        aria-label="Export"
        title="Export"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-64 bg-surface-container-highest border-none"
      >
        <DropdownMenuItem
          onClick={() => run("html")}
          disabled={busy !== null}
          className="flex items-start gap-3 py-2.5"
        >
          <FileDown className="mt-0.5 h-4 w-4 text-molten-primary" />
          <div className="flex flex-col">
            <span className="text-body-sm font-medium text-on-surface">Scarica HTML</span>
            <span className="text-label-sm text-text-muted">
              Pagina singola, self-contained
            </span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => run("react")}
          disabled={busy !== null}
          className="flex items-start gap-3 py-2.5"
        >
          <FileCode2 className="mt-0.5 h-4 w-4 text-molten-primary" />
          <div className="flex flex-col">
            <span className="text-body-sm font-medium text-on-surface">Scarica React .tsx</span>
            <span className="text-label-sm text-text-muted">
              Componente singolo per progetto esistente
            </span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => run("nextjs")}
          disabled={busy !== null}
          className="flex items-start gap-3 py-2.5"
        >
          <Package className="mt-0.5 h-4 w-4 text-molten-primary" />
          <div className="flex flex-col">
            <span className="text-body-sm font-medium text-on-surface">ZIP Next.js (sito)</span>
            <span className="text-label-sm text-text-muted">
              Progetto completo di tutte le pagine pubblicate
            </span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function labelFor(f: Format) {
  return { html: "HTML", react: "React", nextjs: "Next.js ZIP" }[f];
}
