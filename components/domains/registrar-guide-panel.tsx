"use client";

import { useState } from "react";
import { ExternalLink, AlertTriangle, ChevronDown } from "lucide-react";
import {
  REGISTRAR_GUIDES,
  REGISTRAR_SLUG_ORDER,
  type RegistrarSlug,
} from "@/lib/registrar-guides";

/**
 * S7.14 — Pannello guida step-by-step DNS specifico per registrar.
 *
 * Usato dentro ConnectDomainModal step "records-shown". L'utente sceglie
 * il proprio registrar dall'elenco, mostra step + field mapping (come
 * GoDaddy chiama "Host", Aruba "Nome host", ecc.) + deep-link al pannello
 * DNS quando disponibile.
 *
 * Default: GoDaddy (mercato target principale Francesco). Auto-switch
 * a "Cloudflare (Manual)" quando l'utente ha configurato Cloudflare
 * provider ma non vuole usarlo per questo dominio.
 */

export function RegistrarGuidePanel({
  defaultSlug = "godaddy",
}: {
  defaultSlug?: RegistrarSlug;
}) {
  const [slug, setSlug] = useState<RegistrarSlug>(defaultSlug);
  const [expanded, setExpanded] = useState(true);
  const guide = REGISTRAR_GUIDES[slug];

  return (
    <div className="rounded-lg border border-outline/20 bg-surface-container-low">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
        aria-expanded={expanded}
      >
        <span className="flex items-center gap-2 text-body-sm font-semibold text-on-surface">
          Guida per il tuo registrar
        </span>
        <ChevronDown
          className={`h-4 w-4 text-text-muted transition-transform ${
            expanded ? "rotate-180" : ""
          }`}
        />
      </button>

      {expanded && (
        <div className="border-t border-outline/20 px-4 py-3">
          <div className="mb-3">
            <label className="text-label-sm text-text-muted">
              Scegli il tuo registrar
            </label>
            <select
              value={slug}
              onChange={(e) => setSlug(e.target.value as RegistrarSlug)}
              className="mt-1 h-9 w-full rounded-md bg-surface-container px-3 text-body-sm"
            >
              {REGISTRAR_SLUG_ORDER.map((s) => (
                <option key={s} value={s}>
                  {REGISTRAR_GUIDES[s].label}
                </option>
              ))}
            </select>
          </div>

          {guide.dnsPanelUrl && (
            <a
              href={guide.dnsPanelUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mb-3 inline-flex items-center gap-1.5 text-label-md text-molten-primary hover:underline"
            >
              Apri pannello DNS di {guide.label}
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}

          <div className="mb-3 rounded-md bg-surface-container-lowest p-2 text-label-sm">
            <p className="font-semibold text-on-surface mb-1">
              Mapping campi
            </p>
            <ul className="space-y-0.5 text-text-muted">
              <li>
                <strong>Name</strong> →{" "}
                <span className="font-mono">{guide.fieldMapping.name}</span>
              </li>
              <li>
                <strong>Value</strong> →{" "}
                <span className="font-mono">{guide.fieldMapping.value}</span>
              </li>
              {guide.fieldMapping.ttl && (
                <li>
                  <strong>TTL</strong> →{" "}
                  <span className="font-mono">{guide.fieldMapping.ttl}</span>
                </li>
              )}
            </ul>
          </div>

          <ol className="ml-4 list-decimal space-y-2 text-body-sm text-on-surface">
            {guide.steps.map((step, i) => (
              <li key={i}>
                <span dangerouslySetInnerHTML={renderBold(step.text)} />
                {step.hint && (
                  <p className="mt-1 text-label-sm text-text-muted">
                    💡 {step.hint}
                  </p>
                )}
              </li>
            ))}
          </ol>

          {guide.warnings && guide.warnings.length > 0 && (
            <div className="mt-3 flex gap-2 rounded-md bg-warning/10 p-3 text-label-sm">
              <AlertTriangle className="h-4 w-4 flex-shrink-0 text-warning" />
              <div className="space-y-1 text-on-surface">
                {guide.warnings.map((w, i) => (
                  <p key={i}>{w}</p>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Mini-renderer per **bold** in stringhe guide. Sostituisce **xxx** con
 * <strong>xxx</strong>. Sanitized: solo testo + tag strong consentiti.
 */
function renderBold(text: string): { __html: string } {
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  const html = escaped.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  return { __html: html };
}
