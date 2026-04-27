"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  FilePlus,
  Loader2,
  Upload,
  Link2,
  Globe,
  ArrowLeft,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { GradientButton } from "@/components/luminous/gradient-button";
import { useProjectsStore } from "@/lib/stores/projects-store";
import { usePagesStore } from "@/lib/stores/pages-store";
import { toast } from "sonner";
import type { Project, Page, PuckData } from "@/types";

type Source = "choose" | "ai" | "blank" | "zip" | "framer" | "webflow";
type ImportResponse = {
  page: Page;
  modes?: { design: "ai" | "stub"; seo: "ai" | "stub" };
};

export function NewProjectDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const router = useRouter();
  const addProject = useProjectsStore((s) => s.addProject);
  const addPage = usePagesStore((s) => s.addPage);

  const [mode, setMode] = useState<Source>("choose");
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState("");
  const [domain, setDomain] = useState("");
  const [prompt, setPrompt] = useState("");
  const [url, setUrl] = useState("");
  const [hasFile, setHasFile] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  function reset() {
    setMode("choose");
    setLoading(false);
    setName("");
    setDomain("");
    setPrompt("");
    setUrl("");
    setHasFile(false);
  }

  function buildProject(id: string): Project {
    const now = new Date();
    const slug = slugify(name);
    return {
      id,
      name,
      domain: domain || `${slug}.rezen.sites`,
      stagingDomain: `staging-${slug}.rezen.sites`,
      baseDomain: domain || `${slug}.rezen.sites`,
      thumbnail: "/mock-images/thumb-verumflow.svg",
      status: "draft",
      createdAt: now,
      updatedAt: now,
      kpis: {
        pagesPublished: 0,
        organicTraffic30d: 0,
        adsenseRevenue30d: 0,
        seoScore: 0,
      },
      integrations: {},
    };
  }

  function pushAndClose(projectId: string, firstPageId?: string, stubNote?: boolean) {
    if (stubNote) {
      toast.info(
        "Progetto creato in stub mode · aggiungi ANTHROPIC_API_KEY per output reale",
      );
    } else {
      toast.success(`Progetto "${name}" creato`);
    }
    onOpenChange(false);
    reset();
    if (firstPageId) {
      router.push(`/projects/${projectId}/pages/${firstPageId}`);
    } else {
      router.push(`/projects/${projectId}/dashboard`);
    }
  }

  async function createBlank() {
    if (!name.trim()) return;
    const projectId = `proj-${Date.now()}`;
    const project = buildProject(projectId);
    addProject(project);

    const homePage: Page = {
      id: `page-${Date.now()}`,
      projectId,
      title: "Home",
      slug: "/",
      status: "draft",
      puckData: blankPuckData(name),
      seo: {
        metaTitle: name,
        metaDescription: "",
        canonicalUrl: `https://${project.domain}/`,
        indexable: true,
        internalSearch: true,
        og: {},
      },
      analytics: {
        pageviews7d: 0,
        pageviews30d: 0,
        bounceRate: 0,
        avgPosition: 0,
        topKeyword: "",
        seoScore: 50,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    addPage(homePage);
    pushAndClose(projectId, homePage.id, false);
  }

  async function createAI() {
    if (!name.trim() || !prompt.trim()) return;
    setLoading(true);
    try {
      const projectId = `proj-${Date.now()}`;
      const project = buildProject(projectId);
      addProject(project);

      const res = await fetch("/api/ai/generate-page", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ goal: prompt, siteName: name }),
      });
      if (!res.ok) throw new Error(await res.text());
      const { data, mode: m } = (await res.json()) as {
        data: PuckData;
        mode: "ai" | "stub";
      };

      const seoRes = await fetch("/api/ai/seo-fill", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ page: data, pageTitle: name }),
      });
      const seoBody = seoRes.ok
        ? ((await seoRes.json()) as {
            seo: {
              metaTitle: string;
              metaDescription: string;
              og: { title: string; description: string };
            };
          })
        : null;

      const homePage: Page = {
        id: `page-${Date.now()}`,
        projectId,
        title: "Home",
        slug: "/",
        status: "draft",
        puckData: data,
        seo: {
          metaTitle: seoBody?.seo.metaTitle ?? name,
          metaDescription: seoBody?.seo.metaDescription ?? "",
          canonicalUrl: `https://${project.domain}/`,
          indexable: true,
          internalSearch: true,
          og: {
            title: seoBody?.seo.og.title,
            description: seoBody?.seo.og.description,
          },
        },
        analytics: {
          pageviews7d: 0,
          pageviews30d: 0,
          bounceRate: 0,
          avgPosition: 0,
          topKeyword: "",
          seoScore: 60,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      addPage(homePage);
      pushAndClose(projectId, homePage.id, m === "stub");
    } catch (err) {
      toast.error(`Errore: ${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
  }

  async function createFromZip() {
    const file = fileRef.current?.files?.[0];
    if (!file || !name.trim()) return;
    setLoading(true);
    try {
      const projectId = `proj-${Date.now()}`;
      const project = buildProject(projectId);
      addProject(project);

      const fd = new FormData();
      fd.append("file", file);
      fd.append("projectId", projectId);
      fd.append("title", "Home");
      fd.append("slug", "/");
      const res = await fetch("/api/import/design-zip", { method: "POST", body: fd });
      if (!res.ok) throw new Error(await res.text());
      const body = (await res.json()) as ImportResponse;
      addPage(body.page);
      pushAndClose(projectId, body.page.id, body.modes?.design === "stub");
    } catch (err) {
      toast.error(`Errore: ${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
  }

  async function createFromUrl(endpoint: "framer-url" | "webflow-url") {
    if (!name.trim() || !url.trim()) return;
    setLoading(true);
    try {
      const projectId = `proj-${Date.now()}`;
      const project = buildProject(projectId);
      addProject(project);

      const res = await fetch(`/api/import/${endpoint}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          projectId,
          title: "Home",
          slug: "/",
          url: url.trim(),
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const body = (await res.json()) as ImportResponse;
      addPage(body.page);
      pushAndClose(projectId, body.page.id, body.modes?.design === "stub");
    } catch (err) {
      toast.error(`Errore: ${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
  }

  const cards = [
    { key: "ai" as const, Icon: Sparkles, title: "Genera con AI", desc: "Intero progetto da brief", featured: true },
    { key: "blank" as const, Icon: FilePlus, title: "Progetto vuoto", desc: "Una Home vuota da comporre" },
    { key: "zip" as const, Icon: Upload, title: "ZIP Claude Design / Stitch", desc: "Import brief + screenshot" },
    { key: "framer" as const, Icon: Link2, title: "URL Framer pubblico", desc: "Scraping + AI restructure" },
    { key: "webflow" as const, Icon: Globe, title: "URL Webflow pubblico", desc: "Scraping + AI restructure" },
  ];

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) reset();
      }}
    >
      <DialogContent className="bg-surface-container-highest border-none sm:max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-title-lg text-on-surface">
            {mode === "choose" ? "Nuovo Progetto" : headerFor(mode)}
          </DialogTitle>
          <DialogDescription className="text-secondary-text">
            {descFor(mode)}
          </DialogDescription>
        </DialogHeader>

        {mode === "choose" ? (
          <div className="grid gap-2 overflow-y-auto pt-2">
            {cards.map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={() => setMode(c.key)}
                className={
                  c.featured
                    ? "group flex items-center gap-4 rounded-xl p-4 text-left transition-all hover:brightness-110"
                    : "group flex items-center gap-4 rounded-xl bg-surface-container-high p-4 text-left transition-colors hover:bg-surface-container"
                }
                style={
                  c.featured
                    ? {
                        background:
                          "linear-gradient(135deg, rgba(255,181,153,0.15), rgba(245,97,23,0.1))",
                        border: "1px solid rgba(245,97,23,0.3)",
                      }
                    : undefined
                }
              >
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-lg"
                  style={
                    c.featured
                      ? { background: "linear-gradient(135deg,#ffb599,#f56117)" }
                      : undefined
                  }
                >
                  <c.Icon
                    className={
                      c.featured ? "h-5 w-5 text-on-molten" : "h-5 w-5 text-secondary-text"
                    }
                  />
                </div>
                <div className="flex-1">
                  <p className="text-body-md font-semibold text-on-surface">{c.title}</p>
                  <p className="text-body-sm text-secondary-text">{c.desc}</p>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-3 overflow-y-auto pt-2">
            <button
              type="button"
              onClick={() => setMode("choose")}
              className="-mt-1 mb-1 inline-flex items-center gap-1 self-start text-label-md text-secondary-text hover:text-on-surface"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Cambia sorgente
            </button>

            <div className="grid grid-cols-[1fr_160px] gap-2">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nome progetto"
                className="h-10 bg-surface-container-low border-none"
              />
              <Input
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="dominio.ch (opz)"
                className="h-10 bg-surface-container-low border-none font-mono text-body-sm"
              />
            </div>

            {mode === "ai" && (
              <Textarea
                autoFocus
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder='Es. "Sito per studio architettura svizzero, tono minimal, portfolio + contatti"'
                rows={4}
                className="resize-none bg-surface-container-low border-none text-body-sm"
              />
            )}

            {mode === "zip" && (
              <div className="flex flex-col gap-2">
                <input
                  ref={fileRef}
                  type="file"
                  accept=".zip"
                  onChange={(e) => setHasFile(Boolean(e.target.files?.length))}
                  className="block w-full cursor-pointer rounded-lg bg-surface-container-low px-3 py-2.5 text-body-sm text-on-surface file:mr-3 file:rounded-md file:border-0 file:bg-surface-container-high file:px-3 file:py-1.5 file:text-body-sm file:text-on-surface hover:file:bg-surface-container-highest"
                />
                <p className="text-label-sm text-text-muted">
                  Contenuto atteso: <code>prompt.md</code> + opzionale <code>screen.png</code>.
                </p>
              </div>
            )}

            {(mode === "framer" || mode === "webflow") && (
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder={
                  mode === "framer"
                    ? "https://tuo-sito.framer.website"
                    : "https://tuo-sito.webflow.io"
                }
                className="h-10 bg-surface-container-low border-none"
              />
            )}

            <div className="mt-auto flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="rounded-lg px-3 py-2 text-body-sm text-secondary-text hover:text-on-surface"
              >
                Annulla
              </button>
              <GradientButton
                size="md"
                onClick={() => {
                  if (mode === "ai") return createAI();
                  if (mode === "blank") return createBlank();
                  if (mode === "zip") return createFromZip();
                  if (mode === "framer") return createFromUrl("framer-url");
                  if (mode === "webflow") return createFromUrl("webflow-url");
                }}
                disabled={loading || !canSubmit(mode, { name, prompt, url, hasFile })}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creo progetto...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    {ctaFor(mode)}
                  </>
                )}
              </GradientButton>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function canSubmit(
  mode: Source,
  state: { name: string; prompt: string; url: string; hasFile: boolean },
) {
  if (!state.name.trim()) return false;
  if (mode === "ai") return Boolean(state.prompt.trim());
  if (mode === "blank") return true;
  if (mode === "zip") return state.hasFile;
  if (mode === "framer" || mode === "webflow") return Boolean(state.url.trim());
  return false;
}

function slugify(s: string) {
  return (
    s
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "site"
  );
}

function headerFor(mode: Source) {
  switch (mode) {
    case "ai":
      return "Genera progetto con AI";
    case "blank":
      return "Progetto vuoto";
    case "zip":
      return "Importa progetto da ZIP";
    case "framer":
      return "Importa progetto da Framer";
    case "webflow":
      return "Importa progetto da Webflow";
    default:
      return "";
  }
}

function descFor(mode: Source) {
  switch (mode) {
    case "choose":
      return "Scegli la sorgente per il nuovo sito.";
    case "ai":
      return "Brief → orchestrator crea home + SEO automatico.";
    case "blank":
      return "Crea un progetto nuovo con una Home vuota.";
    case "zip":
      return "Dallo ZIP esportato da Claude Design o Stitch.";
    case "framer":
      return "URL pubblico Framer → scraping + AI restructure.";
    case "webflow":
      return "URL pubblico Webflow → scraping + AI restructure.";
  }
}

function ctaFor(mode: Source) {
  switch (mode) {
    case "ai":
      return "Crea con AI";
    case "blank":
      return "Crea progetto";
    case "zip":
      return "Importa ZIP";
    case "framer":
      return "Importa URL";
    case "webflow":
      return "Importa URL";
    default:
      return "OK";
  }
}

function blankPuckData(name: string): PuckData {
  return {
    root: { props: { title: name } },
    content: [
      {
        type: "Heading",
        props: {
          id: `heading-${Date.now()}`,
          text: name,
          level: "h1",
          alignment: "left",
          color: "on-surface",
        },
      },
    ],
    zones: {},
  } as PuckData;
}
