"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Sparkles, Save, Globe, Share2, MessageSquare, Code, Network, Bot } from "lucide-react";
import { toast } from "sonner";
import { usePagesStore } from "@/lib/stores/pages-store";
import { useProjectsStore } from "@/lib/stores/projects-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { SeoCounter } from "./seo-counter";
import { SerpPreview } from "./serp-preview";
import { SocialPreview } from "./social-preview";
import { articleSchema, organizationSchema } from "@/lib/seo/schema-generator";
import { applySEOFill, type SEOFill } from "@/lib/ai/agents/seo-agent";
import { suggestInternalLinksTo } from "@/lib/seo/internal-linking";
import { scorePagePassages, aggregateAeoScore } from "@/lib/seo/aeo-scorer";
import type { PageSEO } from "@/types";

const TITLE_MIN = 30;
const TITLE_MAX = 60;
const DESC_MIN = 110;
const DESC_MAX = 160;

export function SeoEditor({
  projectId,
  pageId,
}: {
  projectId: string;
  pageId: string;
}) {
  const project = useProjectsStore((s) => s.getById(projectId));
  const page = usePagesStore((s) => s.getById(pageId));
  const updatePage = usePagesStore((s) => s.updatePage);

  const [seo, setSeo] = useState<PageSEO>(
    page?.seo ?? {
      metaTitle: "",
      metaDescription: "",
      canonicalUrl: "",
      indexable: true,
      internalSearch: true,
      og: {},
    },
  );
  const [filling, setFilling] = useState(false);

  const url =
    seo.canonicalUrl ||
    (project && page
      ? `https://${project.domain}/${page.slug}`.replace(/\/+$/, "")
      : "https://example.com/");

  const schemaJson = useMemo(() => {
    if (!project || !page) return "";
    const merged = { ...page, seo };
    const article = articleSchema(project, merged);
    const org = organizationSchema(project);
    return JSON.stringify([org, article], null, 2);
  }, [project, page, seo]);

  const allPages = usePagesStore((s) => s.pages);
  const linkSuggestions = useMemo(() => {
    if (!page) return [];
    const projectPages = allPages.filter((p) => p.projectId === projectId);
    return suggestInternalLinksTo(page, projectPages, 8);
  }, [page, allPages, projectId]);

  const aeoPassages = useMemo(() => {
    if (!page) return [];
    return scorePagePassages(page);
  }, [page]);
  const aeoOverall = useMemo(() => aggregateAeoScore(aeoPassages), [aeoPassages]);

  if (!project || !page) {
    return <div className="p-8 text-text-muted">Pagina non trovata.</div>;
  }

  function patch<K extends keyof PageSEO>(k: K, v: PageSEO[K]) {
    setSeo((cur) => ({ ...cur, [k]: v }));
  }
  function patchOg<K extends keyof NonNullable<PageSEO["og"]>>(
    k: K,
    v: NonNullable<PageSEO["og"]>[K],
  ) {
    setSeo((cur) => ({ ...cur, og: { ...cur.og, [k]: v } }));
  }

  async function handleAIFill() {
    if (!page) return;
    setFilling(true);
    try {
      const res = await fetch("/api/ai/seo-fill", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          page: page.puckData,
          pageTitle: page.title,
          focusKeyword: seo.metaTitle.split("—")[0]?.trim() || page.title,
        }),
      });
      const json = (await res.json()) as { seo: SEOFill; mode: "ai" | "stub" };
      setSeo((cur) => applySEOFill(cur, json.seo));
      toast.success(
        json.mode === "ai" ? "Compilato con AI" : "Compilato (stub — manca chiave AI)",
      );
    } catch (err) {
      toast.error("AI fill fallito: " + (err as Error).message);
    } finally {
      setFilling(false);
    }
  }

  function handleSave() {
    updatePage(pageId, { seo });
    toast.success("SEO salvato");
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <header className="flex items-center justify-between border-b border-outline/20 bg-surface-container px-6 py-3">
        <div className="flex items-center gap-3">
          <Link
            href={`/projects/${projectId}/pages`}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-secondary-text hover:bg-surface-container-high hover:text-on-surface"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex flex-col leading-tight">
            <span className="text-label-sm uppercase tracking-wider text-text-muted">
              SEO Editor
            </span>
            <span className="text-title-md font-semibold text-on-surface">
              {page.title}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleAIFill} disabled={filling}>
            <Sparkles className="mr-2 h-4 w-4" />
            {filling ? "Generazione…" : "AI fill"}
          </Button>
          <Button onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" />
            Salva
          </Button>
        </div>
      </header>

      <div className="grid flex-1 grid-cols-12 gap-6 overflow-y-auto p-6">
        <div className="col-span-12 lg:col-span-7 space-y-5">
          <section className="rounded-xl border border-outline/20 bg-surface-container p-5">
            <h2 className="mb-4 text-title-lg font-semibold">Meta tags</h2>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="metaTitle">Meta title</Label>
                  <SeoCounter
                    value={seo.metaTitle}
                    min={TITLE_MIN}
                    max={TITLE_MAX}
                  />
                </div>
                <Input
                  id="metaTitle"
                  value={seo.metaTitle}
                  onChange={(e) => patch("metaTitle", e.target.value)}
                  placeholder={`${page.title} — ${project.name}`}
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="metaDescription">Meta description</Label>
                  <SeoCounter
                    value={seo.metaDescription}
                    min={DESC_MIN}
                    max={DESC_MAX}
                  />
                </div>
                <Textarea
                  id="metaDescription"
                  value={seo.metaDescription}
                  onChange={(e) => patch("metaDescription", e.target.value)}
                  rows={3}
                  placeholder="Descrizione mostrata da Google sotto il titolo."
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="canonicalUrl">Canonical URL</Label>
                <Input
                  id="canonicalUrl"
                  value={seo.canonicalUrl}
                  onChange={(e) => patch("canonicalUrl", e.target.value)}
                  placeholder={`https://${project.domain}/${page.slug}`}
                />
                <p className="text-label-md text-text-muted">
                  Vuoto = self-referential auto. Compila solo se questa pagina è
                  duplicato di un&apos;altra canonica.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between rounded-md border border-outline/20 px-3 py-2">
                  <div>
                    <Label htmlFor="indexable" className="text-body-sm">
                      Indexable
                    </Label>
                    <p className="text-label-md text-text-muted">
                      Permette a Google di indicizzare la pagina
                    </p>
                  </div>
                  <Switch
                    id="indexable"
                    checked={seo.indexable}
                    onCheckedChange={(v) => patch("indexable", v)}
                  />
                </div>
                <div className="flex items-center justify-between rounded-md border border-outline/20 px-3 py-2">
                  <div>
                    <Label htmlFor="internalSearch" className="text-body-sm">
                      In ricerca interna
                    </Label>
                    <p className="text-label-md text-text-muted">
                      Includi nella search del sito
                    </p>
                  </div>
                  <Switch
                    id="internalSearch"
                    checked={seo.internalSearch}
                    onCheckedChange={(v) => patch("internalSearch", v)}
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-outline/20 bg-surface-container p-5">
            <h2 className="mb-4 text-title-lg font-semibold">
              Autore & E-E-A-T
            </h2>
            <p className="mb-4 text-label-md text-text-muted">
              Boost di credibilità per Google + AI engines (citation, author
              bio, reviewedBy → schema Person/Article).
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="authorName">Autore — nome</Label>
                <Input
                  id="authorName"
                  value={seo.author?.name ?? ""}
                  onChange={(e) =>
                    setSeo((cur) => ({
                      ...cur,
                      author: { ...cur.author, name: e.target.value },
                    }))
                  }
                  placeholder="Mario Rossi"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="authorUrl">Autore — URL profilo</Label>
                <Input
                  id="authorUrl"
                  value={seo.author?.url ?? ""}
                  onChange={(e) =>
                    setSeo((cur) => ({
                      ...cur,
                      author: {
                        name: cur.author?.name ?? "",
                        ...cur.author,
                        url: e.target.value,
                      },
                    }))
                  }
                  placeholder="https://linkedin.com/in/..."
                  className="font-mono text-body-sm"
                />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="authorBio">Bio autore (opz.)</Label>
                <Textarea
                  id="authorBio"
                  rows={2}
                  value={seo.author?.description ?? ""}
                  onChange={(e) =>
                    setSeo((cur) => ({
                      ...cur,
                      author: {
                        name: cur.author?.name ?? "",
                        ...cur.author,
                        description: e.target.value,
                      },
                    }))
                  }
                  placeholder="Senior SEO consultant, 10 anni di esperienza nel settore tech."
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="reviewerName">Reviewed by — nome (opz.)</Label>
                <Input
                  id="reviewerName"
                  value={seo.reviewedBy?.name ?? ""}
                  onChange={(e) =>
                    setSeo((cur) => ({
                      ...cur,
                      reviewedBy: {
                        ...cur.reviewedBy,
                        name: e.target.value,
                      },
                    }))
                  }
                  placeholder="Dott.ssa Anna Bianchi"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="schemaType">Tipo Article</Label>
                <select
                  id="schemaType"
                  value={seo.schemaType ?? "Article"}
                  onChange={(e) =>
                    patch(
                      "schemaType",
                      e.target.value as NonNullable<PageSEO["schemaType"]>,
                    )
                  }
                  className="h-9 w-full rounded-md bg-surface-container-low px-3 text-body-sm"
                >
                  <option value="Article">Article (default)</option>
                  <option value="NewsArticle">NewsArticle</option>
                  <option value="BlogPosting">BlogPosting</option>
                </select>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-outline/20 bg-surface-container p-5">
            <h2 className="mb-4 text-title-lg font-semibold">Open Graph / Social</h2>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="ogTitle">OG Title</Label>
                <Input
                  id="ogTitle"
                  value={seo.og?.title ?? ""}
                  onChange={(e) => patchOg("title", e.target.value)}
                  placeholder={seo.metaTitle || "Eredita meta title"}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ogDescription">OG Description</Label>
                <Textarea
                  id="ogDescription"
                  rows={2}
                  value={seo.og?.description ?? ""}
                  onChange={(e) => patchOg("description", e.target.value)}
                  placeholder={seo.metaDescription || "Eredita meta description"}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ogImage">OG Image (URL 1200x630)</Label>
                <Input
                  id="ogImage"
                  value={seo.og?.image ?? ""}
                  onChange={(e) => patchOg("image", e.target.value)}
                  placeholder="https://..."
                />
              </div>
            </div>
          </section>
        </div>

        <div className="col-span-12 lg:col-span-5 space-y-5">
          <Tabs defaultValue="google">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="google">
                <Globe className="mr-1 h-3.5 w-3.5" />
              </TabsTrigger>
              <TabsTrigger value="facebook">
                <Share2 className="mr-1 h-3.5 w-3.5" />
                FB
              </TabsTrigger>
              <TabsTrigger value="twitter">
                <MessageSquare className="mr-1 h-3.5 w-3.5" />X
              </TabsTrigger>
              <TabsTrigger value="schema">
                <Code className="mr-1 h-3.5 w-3.5" />
              </TabsTrigger>
              <TabsTrigger value="linking">
                <Network className="mr-1 h-3.5 w-3.5" />
              </TabsTrigger>
              <TabsTrigger value="aeo">
                <Bot className="mr-1 h-3.5 w-3.5" />
                AEO
              </TabsTrigger>
            </TabsList>
            <TabsContent value="google" className="mt-4">
              <SerpPreview
                title={seo.metaTitle}
                description={seo.metaDescription}
                url={url}
              />
            </TabsContent>
            <TabsContent value="facebook" className="mt-4">
              <SocialPreview
                variant="facebook"
                title={seo.og?.title ?? seo.metaTitle}
                description={seo.og?.description ?? seo.metaDescription}
                image={seo.og?.image}
                url={url}
              />
            </TabsContent>
            <TabsContent value="twitter" className="mt-4">
              <SocialPreview
                variant="twitter"
                title={seo.og?.title ?? seo.metaTitle}
                description={seo.og?.description ?? seo.metaDescription}
                image={seo.og?.image}
                url={url}
              />
            </TabsContent>
            <TabsContent value="schema" className="mt-4">
              <pre className="max-h-[480px] overflow-auto rounded-lg border border-outline/20 bg-surface-container-lowest p-3 text-label-md font-mono text-secondary-text">
                {schemaJson}
              </pre>
              <p className="mt-2 text-label-md text-text-muted">
                JSON-LD generato — verrà incluso nell&apos;export HTML/Next.js.
                Validare su <span className="text-info">search.google.com/test/rich-results</span>.
              </p>
            </TabsContent>
            <TabsContent value="linking" className="mt-4">
              <div className="rounded-lg border border-outline/20 bg-surface-container-low p-4">
                <h3 className="mb-2 text-body-md font-semibold text-on-surface">
                  Pagine correlate (suggerimenti link interni)
                </h3>
                {linkSuggestions.length === 0 ? (
                  <p className="text-body-sm text-text-muted">
                    Nessun suggerimento — questa è l&apos;unica pagina del progetto
                    o non ci sono keyword in comune.
                  </p>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {linkSuggestions.map((s) => (
                      <li
                        key={s.fromPageId}
                        className="rounded-md border border-outline/20 bg-surface-container px-3 py-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-body-sm text-on-surface">
                            {s.fromSlug}
                          </span>
                          <span className="rounded-full bg-molten-primary-container px-2 py-0.5 text-label-sm font-bold text-on-molten">
                            {(s.score * 100).toFixed(0)}%
                          </span>
                        </div>
                        <p className="mt-0.5 text-label-md text-text-muted">
                          Anchor candidates:{" "}
                          {s.sharedKeywords.map((k) => (
                            <span
                              key={k}
                              className="mr-1 rounded bg-surface-container-highest px-1.5 py-0.5 font-mono text-label-sm"
                            >
                              {k}
                            </span>
                          ))}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
                <p className="mt-3 text-label-md text-text-muted">
                  Suggeriti dalle pagine pubblicate del progetto. Più keyword
                  condivise = score più alto. Inserisci link manualmente in
                  editor Puck.
                </p>
              </div>
            </TabsContent>
            <TabsContent value="aeo" className="mt-4">
              <div className="mb-3 flex items-center justify-between rounded-lg border border-outline/20 bg-surface-container-low p-3">
                <div>
                  <h3 className="text-body-md font-semibold text-on-surface">
                    AEO score
                  </h3>
                  <p className="text-label-md text-text-muted">
                    Quanto la pagina è ottimizzata per AI Overviews / ChatGPT
                    / Perplexity
                  </p>
                </div>
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-full text-title-md font-bold"
                  style={{
                    background:
                      aeoOverall >= 70
                        ? "rgba(94,194,127,0.18)"
                        : aeoOverall >= 50
                          ? "rgba(230,179,64,0.18)"
                          : "rgba(230,107,107,0.18)",
                    color:
                      aeoOverall >= 70
                        ? "#5ec27f"
                        : aeoOverall >= 50
                          ? "#e6b340"
                          : "#e66b6b",
                  }}
                >
                  {aeoOverall}
                </div>
              </div>
              {aeoPassages.length === 0 ? (
                <p className="text-body-sm text-text-muted">
                  Nessun passaggio analizzabile. Aggiungi paragrafi/FAQ.
                </p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {aeoPassages.map((p) => (
                    <li
                      key={p.id}
                      className="rounded-md border border-outline/20 bg-surface-container px-3 py-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="line-clamp-2 text-body-sm text-on-surface">
                          {p.text.slice(0, 160)}
                          {p.text.length > 160 ? "…" : ""}
                        </p>
                        <span
                          className="shrink-0 rounded-full px-2 py-0.5 text-label-sm font-bold"
                          style={{
                            background:
                              p.score >= 70
                                ? "rgba(94,194,127,0.18)"
                                : p.score >= 50
                                  ? "rgba(230,179,64,0.18)"
                                  : "rgba(230,107,107,0.18)",
                            color:
                              p.score >= 70
                                ? "#5ec27f"
                                : p.score >= 50
                                  ? "#e6b340"
                                  : "#e66b6b",
                          }}
                        >
                          {p.score}
                        </span>
                      </div>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {p.signals.map((s, i) => (
                          <span
                            key={i}
                            className="rounded px-1.5 py-0.5 text-label-sm"
                            style={{
                              background:
                                s.kind === "good"
                                  ? "rgba(94,194,127,0.12)"
                                  : "rgba(230,107,107,0.12)",
                              color: s.kind === "good" ? "#5ec27f" : "#e66b6b",
                            }}
                          >
                            {s.label}
                          </span>
                        ))}
                      </div>
                      {p.recommendation && (
                        <p className="mt-1 text-label-md text-text-muted">
                          → {p.recommendation}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
