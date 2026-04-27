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
import { usePagesStore } from "@/lib/stores/pages-store";
import { toast } from "sonner";
import type { Page, PuckData } from "@/types";

type Source = "choose" | "ai" | "blank" | "zip" | "framer" | "webflow";

type ImportResponse = {
  page: Page;
  modes?: { design: "ai" | "stub"; seo: "ai" | "stub" };
  mode?: "ai" | "stub";
};

export function AddPageDialog({
  open,
  onOpenChange,
  projectId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  projectId: string;
}) {
  const router = useRouter();
  const addPage = usePagesStore((s) => s.addPage);

  const [mode, setMode] = useState<Source>("choose");
  const [loading, setLoading] = useState(false);

  // shared form state
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [prompt, setPrompt] = useState("");
  const [url, setUrl] = useState("");
  const [hasFile, setHasFile] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  function reset() {
    setMode("choose");
    setLoading(false);
    setTitle("");
    setSlug("");
    setPrompt("");
    setUrl("");
    setHasFile(false);
  }

  function pushAndClose(page: Page, stubNote: boolean) {
    addPage(page);
    if (stubNote) {
      toast.info("Import in stub mode · aggiungi ANTHROPIC_API_KEY per output reale");
    } else {
      toast.success(`Pagina "${page.title}" creata`);
    }
    onOpenChange(false);
    reset();
    router.push(`/projects/${projectId}/pages/${page.id}`);
  }

  async function createBlank() {
    if (!title.trim()) return;
    const now = new Date();
    const page: Page = {
      id: `page-${Date.now()}`,
      projectId,
      title: title.trim(),
      slug: slug.trim() || toSlug(title),
      status: "draft",
      puckData: blankPuckData(title.trim()),
      seo: {
        metaTitle: title.trim(),
        metaDescription: "",
        canonicalUrl: `https://example.com/${slug.trim() || toSlug(title)}`,
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
      createdAt: now,
      updatedAt: now,
    };
    addPage(page);
    toast.success(`Pagina "${page.title}" creata`);
    onOpenChange(false);
    reset();
    router.push(`/projects/${projectId}/pages/${page.id}`);
  }

  async function createAI() {
    if (!title.trim() || !prompt.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/ai/generate-page", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ goal: prompt.trim(), siteName: title.trim() }),
      });
      if (!res.ok) throw new Error(await res.text());
      const { data, mode: m } = (await res.json()) as {
        data: PuckData;
        mode: "ai" | "stub";
      };

      // Run SEO fill too
      const seoRes = await fetch("/api/ai/seo-fill", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ page: data, pageTitle: title.trim() }),
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

      const s = slug.trim() || toSlug(title);
      const now = new Date();
      const page: Page = {
        id: `page-${Date.now()}`,
        projectId,
        title: title.trim(),
        slug: s,
        status: "draft",
        puckData: data,
        seo: {
          metaTitle: seoBody?.seo.metaTitle ?? title.trim(),
          metaDescription: seoBody?.seo.metaDescription ?? "",
          canonicalUrl: `https://example.com/${s}`,
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
        createdAt: now,
        updatedAt: now,
      };
      pushAndClose(page, m === "stub");
    } catch (err) {
      toast.error(`Errore AI: ${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
  }

  async function createFromZip() {
    const file = fileRef.current?.files?.[0];
    if (!file || !title.trim()) return;
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("projectId", projectId);
      fd.append("title", title.trim());
      fd.append("slug", slug.trim() || toSlug(title));
      const res = await fetch("/api/import/design-zip", {
        method: "POST",
        body: fd,
      });
      if (!res.ok) throw new Error(await res.text());
      const body = (await res.json()) as ImportResponse;
      const stub = body.modes?.design === "stub";
      pushAndClose(body.page, Boolean(stub));
    } catch (err) {
      toast.error(`Errore import zip: ${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
  }

  async function createFromUrl(endpoint: "framer-url" | "webflow-url") {
    if (!title.trim() || !url.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/import/${endpoint}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          projectId,
          title: title.trim(),
          slug: slug.trim() || toSlug(title),
          url: url.trim(),
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const body = (await res.json()) as ImportResponse;
      const stub = body.modes?.design === "stub";
      pushAndClose(body.page, Boolean(stub));
    } catch (err) {
      toast.error(`Errore import: ${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
  }

  const chooseCards = [
    {
      key: "ai" as const,
      Icon: Sparkles,
      title: "Genera con AI",
      desc: "Page Designer + Copywriter + SEO",
      featured: true,
    },
    {
      key: "blank" as const,
      Icon: FilePlus,
      title: "Partenza vuota",
      desc: "Canvas Puck vuoto",
    },
    {
      key: "zip" as const,
      Icon: Upload,
      title: "ZIP Claude Design / Stitch",
      desc: "Brief + screenshot → pagina",
    },
    {
      key: "framer" as const,
      Icon: Link2,
      title: "URL Framer pubblico",
      desc: "Scraping + AI restructure",
    },
    {
      key: "webflow" as const,
      Icon: Globe,
      title: "URL Webflow pubblico",
      desc: "Scraping + AI restructure",
    },
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
            {mode === "choose" ? "Crea Nuova Pagina" : headerFor(mode)}
          </DialogTitle>
          <DialogDescription className="text-secondary-text">
            {descFor(mode)}
          </DialogDescription>
        </DialogHeader>

        {mode === "choose" ? (
          <div className="grid gap-2 overflow-y-auto pt-2">
            {chooseCards.map((c) => (
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
                      c.featured
                        ? "h-5 w-5 text-on-molten"
                        : "h-5 w-5 text-secondary-text"
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
            <BackLink onClick={() => setMode("choose")} />

            <TitleSlug
              title={title}
              setTitle={setTitle}
              slug={slug}
              setSlug={setSlug}
            />

            {mode === "ai" && (
              <Textarea
                autoFocus
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder='Es. "landing per agenzia di consulenza energetica, tone professionale, con 3 pricing plan e FAQ"'
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
                  Lo zip deve contenere <code>prompt.md</code> (brief) e opzionalmente <code>screen.png</code>.
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
                disabled={loading || !canSubmit(mode, { title, prompt, url, hasFile })}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Elaboro...
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

function BackLink({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="-mt-1 mb-1 inline-flex items-center gap-1 self-start text-label-md text-secondary-text hover:text-on-surface"
    >
      <ArrowLeft className="h-3.5 w-3.5" />
      Cambia sorgente
    </button>
  );
}

function TitleSlug({
  title,
  setTitle,
  slug,
  setSlug,
}: {
  title: string;
  setTitle: (v: string) => void;
  slug: string;
  setSlug: (v: string) => void;
}) {
  return (
    <div className="grid grid-cols-[1fr_140px] gap-2">
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Nome pagina"
        className="h-10 bg-surface-container-low border-none"
      />
      <Input
        value={slug}
        onChange={(e) => setSlug(e.target.value)}
        placeholder="/slug"
        className="h-10 bg-surface-container-low border-none font-mono text-body-sm"
      />
    </div>
  );
}

function toSlug(s: string) {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function canSubmit(
  mode: Source,
  state: { title: string; prompt: string; url: string; hasFile: boolean },
) {
  if (!state.title.trim()) return false;
  if (mode === "ai") return Boolean(state.prompt.trim());
  if (mode === "blank") return true;
  if (mode === "zip") return state.hasFile;
  if (mode === "framer" || mode === "webflow") return Boolean(state.url.trim());
  return false;
}

function headerFor(mode: Source) {
  switch (mode) {
    case "ai":
      return "Genera con AI";
    case "blank":
      return "Partenza vuota";
    case "zip":
      return "Importa ZIP";
    case "framer":
      return "Importa da Framer";
    case "webflow":
      return "Importa da Webflow";
    default:
      return "";
  }
}

function descFor(mode: Source) {
  switch (mode) {
    case "choose":
      return "Scegli la sorgente: AI, ZIP, URL, o vuoto.";
    case "ai":
      return "Descrivi obiettivo e audience. Orchestrator + SEO fill automatico.";
    case "blank":
      return "Canvas Puck vuoto — componi da zero.";
    case "zip":
      return "Esporta da Claude Design o Stitch: zip con prompt.md + screen.png.";
    case "framer":
      return "URL pubblico Framer. Facciamo scraping dei meta e restructure AI.";
    case "webflow":
      return "URL pubblico Webflow. Facciamo scraping dei meta e restructure AI.";
  }
}

function ctaFor(mode: Source) {
  switch (mode) {
    case "ai":
      return "Genera pagina";
    case "blank":
      return "Crea pagina";
    case "zip":
      return "Importa ZIP";
    case "framer":
      return "Importa da URL";
    case "webflow":
      return "Importa da URL";
    default:
      return "OK";
  }
}

function blankPuckData(title: string): PuckData {
  return {
    root: { props: { title } },
    content: [
      {
        type: "Heading",
        props: {
          id: `heading-${Date.now()}`,
          text: title,
          level: "h1",
          alignment: "left",
          color: "on-surface",
        },
      },
    ],
    zones: {},
  } as PuckData;
}
