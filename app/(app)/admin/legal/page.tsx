"use client";

import { useState } from "react";
import {
  ScrollText,
  ExternalLink,
  Accessibility,
  Copy,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

const TEMPLATES = [
  {
    id: "tos",
    title: "Terms of Service",
    description:
      "Template ToS in italiano + inglese, conforme art. 1341-1342 c.c. (clausole vessatorie) e Direttiva UE 2019/2161.",
    files: ["tos-it.md", "tos-en.md"],
  },
  {
    id: "privacy",
    title: "Privacy Policy",
    description:
      "GDPR-compliant: titolari, finalità, base giuridica, diritti interessato (artt. 15-22), DPO contact.",
    files: ["privacy-it.md", "privacy-en.md", "privacy-de.md"],
  },
  {
    id: "cookies",
    title: "Cookie Policy",
    description:
      "Lista cookie tecnici/analytics/marketing con TTL + finalità + opt-out per categoria.",
    files: ["cookies-it.md"],
  },
  {
    id: "dpa",
    title: "DPA (Data Processing Agreement)",
    description:
      "Accordo titolare → responsabile per quando REZEN gestisce dati su mandato cliente.",
    files: ["dpa-it.md"],
  },
  {
    id: "ada",
    title: "ADA Accessibility Statement",
    description:
      "Dichiarazione conformità WCAG 2.2 AA + procedure feedback + reasonable accommodation.",
    files: ["accessibility-statement.md"],
  },
];

const VENDOR_LINKS = [
  { name: "Iubenda", url: "https://www.iubenda.com" },
  { name: "Termly", url: "https://termly.io" },
  { name: "TermsFeed", url: "https://termsfeed.com" },
  { name: "OneTrust", url: "https://onetrust.com" },
];

export default function LegalHubPage() {
  const [generated, setGenerated] = useState<Set<string>>(new Set());

  function generate(id: string) {
    setGenerated((s) => new Set(s).add(id));
    toast.success(`Template "${id}" generato (mock — in DOC 3 produce file reali)`);
  }

  return (
    <div className="mx-auto max-w-5xl px-10 py-10">
      <div className="mb-6">
        <div className="flex items-center gap-2 text-label-md uppercase tracking-widest text-text-muted">
          <ScrollText className="h-3.5 w-3.5" />
          Legal hub
        </div>
        <h1 className="text-headline-md font-bold text-on-surface">
          Legal &amp; compliance templates
        </h1>
        <p className="text-body-md text-secondary-text">
          Template giuridici e accessibilità pronti da personalizzare.
        </p>
      </div>

      <section className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-2">
        {TEMPLATES.map((t) => (
          <div
            key={t.id}
            className="rounded-xl bg-surface-container-high p-5"
          >
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-body-md font-semibold text-on-surface">
                {t.title}
              </h3>
              {generated.has(t.id) && (
                <CheckCircle2 className="h-4 w-4 text-success" />
              )}
            </div>
            <p className="mb-3 text-label-md text-text-muted">
              {t.description}
            </p>
            <div className="mb-3 flex flex-wrap gap-1">
              {t.files.map((f) => (
                <span
                  key={f}
                  className="rounded bg-surface-container-lowest px-1.5 py-0.5 font-mono text-label-sm text-secondary-text"
                >
                  {f}
                </span>
              ))}
            </div>
            <button
              type="button"
              onClick={() => generate(t.id)}
              className="inline-flex items-center gap-1 rounded-md bg-molten-primary-container px-3 py-1.5 text-label-md font-semibold text-on-molten hover:brightness-110"
            >
              {generated.has(t.id) ? "Rigenera" : "Genera template"}
            </button>
          </div>
        ))}
      </section>

      <section className="mb-5 rounded-xl bg-surface-container-high p-6">
        <div className="mb-3 flex items-center gap-2.5">
          <Accessibility className="h-4 w-4 text-molten-primary" />
          <h2 className="text-title-md font-semibold text-on-surface">
            Accessibility checklist (WCAG 2.2 AA)
          </h2>
        </div>
        <p className="mb-4 text-body-sm text-text-muted">
          Audit cross-pagine già attivo (vedi `/alerts`). Checklist pre-go-live:
        </p>
        <ul className="space-y-2">
          <CheckItem
            label="Keyboard navigation"
            description="Tutti i form/menu/modals navigabili via Tab/Shift+Tab. Focus visible."
            done
          />
          <CheckItem
            label="Screen reader labels"
            description="Aria-label su iconebottoni, aria-describedby su input con errori, role attribute corretti."
            done
          />
          <CheckItem
            label="Color contrast 4.5:1"
            description="Testi normali ≥ 4.5:1, testi grandi ≥ 3:1. Verifica con axe-core."
            done={false}
          />
          <CheckItem
            label="Heading hierarchy (H1-H6)"
            description="Già auto-validato dal SEO alert engine."
            done
          />
          <CheckItem
            label="Alt text immagini"
            description="Già enforced via badge nell'editor Puck."
            done
          />
          <CheckItem
            label="Test screen reader (NVDA/JAWS/VoiceOver)"
            description="Manuale, prima del go-live cliente."
            done={false}
          />
        </ul>
      </section>

      <section className="rounded-xl bg-surface-container-high p-6">
        <h2 className="mb-3 text-title-md font-semibold text-on-surface">
          Vendor esterni (alternative)
        </h2>
        <p className="mb-3 text-body-sm text-text-muted">
          Se preferisci comprare templates ready-to-use con aggiornamenti
          legali continui:
        </p>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          {VENDOR_LINKS.map((v) => (
            <a
              key={v.name}
              href={v.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between rounded-md bg-surface-container-low px-3 py-2 text-body-sm text-on-surface hover:bg-surface-container"
            >
              <span>{v.name}</span>
              <ExternalLink className="h-3 w-3 text-text-muted" />
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}

function CheckItem({
  label,
  description,
  done,
}: {
  label: string;
  description: string;
  done: boolean;
}) {
  return (
    <li className="flex items-start gap-3 rounded-md bg-surface-container-low px-3 py-2">
      <span
        className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-sm"
        style={{
          background: done ? "#5ec27f" : "transparent",
          border: done ? "none" : "1px solid #76787c",
        }}
      >
        {done && <span className="text-[10px] font-bold text-on-molten">✓</span>}
      </span>
      <div className="flex-1">
        <p className="text-body-sm font-medium text-on-surface">{label}</p>
        <p className="text-label-md text-text-muted">{description}</p>
      </div>
    </li>
  );
}
