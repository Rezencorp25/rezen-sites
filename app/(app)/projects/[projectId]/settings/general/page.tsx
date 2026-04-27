"use client";

import { use, useEffect } from "react";
import { Upload, Globe, Search, Bot } from "lucide-react";
import { toast } from "sonner";
import { useProjectsStore } from "@/lib/stores/projects-store";
import { useSettingsStore } from "@/lib/stores/settings-store";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

export default function SettingsGeneralPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = use(params);
  const project = useProjectsStore((s) => s.getById(projectId));
  const settings = useSettingsStore((s) => s.get(projectId));
  const updateSection = useSettingsStore((s) => s.updateSection);

  // Hydrate defaults from the seeded project.
  useEffect(() => {
    if (project && !settings.general.siteTitle) {
      updateSection(projectId, "general", {
        siteTitle: project.name,
        siteUrl: `https://${project.domain}`,
        description: `Sito ufficiale ${project.name}.`,
      });
    }
  }, [project, projectId, settings.general.siteTitle, updateSection]);

  if (!project) return null;

  return (
    <div className="mx-auto max-w-5xl px-10 pb-12 pt-2">
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-[1.3fr_1fr]">
        <div className="flex flex-col gap-6">
          <section className="rounded-xl bg-surface-container-high p-6">
            <div className="mb-5 flex items-center gap-2.5">
              <Globe className="h-4 w-4 text-molten-primary" />
              <h2 className="text-title-md font-semibold text-on-surface">
                Sito
              </h2>
            </div>
            <div className="flex flex-col gap-4">
              <Field
                label="Titolo sito"
                htmlFor="title"
                hint="Visibile come default in tutte le pagine (override per pagina in SEO editor)."
              >
                <Input
                  id="title"
                  value={settings.general.siteTitle}
                  onChange={(e) =>
                    updateSection(projectId, "general", {
                      siteTitle: e.target.value,
                    })
                  }
                  className="bg-surface-container-low border-none h-10"
                />
              </Field>
              <Field label="URL principale" htmlFor="url">
                <Input
                  id="url"
                  value={settings.general.siteUrl}
                  onChange={(e) =>
                    updateSection(projectId, "general", {
                      siteUrl: e.target.value,
                    })
                  }
                  className="bg-surface-container-low border-none h-10 font-mono text-body-sm"
                />
              </Field>
              <Field label="Descrizione globale" htmlFor="desc">
                <Textarea
                  id="desc"
                  rows={3}
                  value={settings.general.description}
                  onChange={(e) =>
                    updateSection(projectId, "general", {
                      description: e.target.value,
                    })
                  }
                  className="bg-surface-container-low border-none"
                />
              </Field>
            </div>
          </section>

          <section className="rounded-xl bg-surface-container-high p-6">
            <div className="mb-4 flex items-center gap-2.5">
              <Bot className="h-4 w-4 text-molten-primary" />
              <h2 className="text-title-md font-semibold text-on-surface">
                Search Engines
              </h2>
            </div>
            <ToggleRow
              label="Indexable"
              description="Permette ai motori di ricerca di indicizzare il sito."
              value={settings.general.indexable}
              onChange={(v) =>
                updateSection(projectId, "general", { indexable: v })
              }
            />
            <ToggleRow
              label="Canonical URL"
              description="Imposta canonical automatici su ogni pagina per evitare duplicati."
              value={settings.general.canonical}
              onChange={(v) =>
                updateSection(projectId, "general", { canonical: v })
              }
            />
          </section>

          <section className="rounded-xl bg-surface-container-high p-6">
            <h2 className="mb-4 text-title-md font-semibold text-on-surface">
              Immagini Social
            </h2>
            <button
              type="button"
              onClick={() => toast.success("Upload — mock action")}
              className="flex min-h-[140px] w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-outline-variant/25 bg-surface-container-lowest transition-colors hover:border-molten-primary hover:bg-surface-container-low"
            >
              <Upload className="h-5 w-5 text-molten-primary" />
              <span className="text-body-sm font-medium text-on-surface">
                Clicca o trascina per caricare (1200 × 630)
              </span>
              <span className="text-label-sm text-text-muted">
                Usato come default per Open Graph + Twitter Card
              </span>
            </button>
          </section>
        </div>

        <div className="flex flex-col gap-6">
          <section className="rounded-xl bg-surface-container-high p-6">
            <div className="mb-3 flex items-center gap-2.5">
              <Search className="h-4 w-4 text-molten-primary" />
              <h2 className="text-title-md font-semibold text-on-surface">
                Google Search Preview
              </h2>
            </div>
            <div className="rounded-lg bg-surface-container-lowest p-4">
              <p className="font-mono text-label-sm text-success">
                {settings.general.siteUrl || "https://example.ch"}
              </p>
              <p className="mt-0.5 truncate text-body-md text-info underline-offset-2 hover:underline">
                {settings.general.siteTitle || "Titolo sito"}
              </p>
              <p className="mt-1 line-clamp-2 text-body-sm text-secondary-text">
                {settings.general.description ||
                  "Descrizione globale che apparirà negli snippet di Google."}
              </p>
            </div>
          </section>

          <section className="rounded-xl bg-surface-container-high p-6">
            <h2 className="mb-3 text-title-md font-semibold text-on-surface">
              robots.txt
            </h2>
            <pre className="overflow-x-auto rounded-lg bg-surface-container-lowest p-4 font-mono text-label-sm leading-6 text-success">
{`User-agent: *
${settings.general.indexable ? "Allow: /" : "Disallow: /"}

Sitemap: ${settings.general.siteUrl || "https://example.ch"}/sitemap.xml`}
            </pre>
            <p className="mt-2 text-label-sm text-text-muted">
              Generato automaticamente. Override manuale disponibile in DOC 3.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={htmlFor} className="text-label-md text-secondary-text">
        {label}
      </Label>
      {children}
      {hint ? (
        <p className="text-label-sm text-text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

function ToggleRow({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <div className="flex flex-col leading-tight">
        <span className="text-body-md font-semibold text-on-surface">
          {label}
        </span>
        <span className="text-body-sm text-secondary-text">{description}</span>
      </div>
      <Switch checked={value} onCheckedChange={onChange} />
    </div>
  );
}
