"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Globe,
  KeyRound,
  Loader2,
  Plus,
  RotateCcw,
  Settings,
  Sparkles,
  Trash2,
  Trophy,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useProjectsStore } from "@/lib/stores/projects-store";
import {
  generateOnboardingId,
  useOnboardingStore,
} from "@/lib/stores/onboarding-store";
import {
  ONBOARDING_STEP_DESC,
  ONBOARDING_STEP_TITLE,
  type OnboardingCompetitor,
  type OnboardingKeyword,
  type OnboardingStep,
  validateStep,
  MAX_COMPETITORS,
  MAX_KEYWORDS,
  MIN_COMPETITORS,
  MIN_KEYWORDS,
  TARGET_KEYWORDS,
} from "@/lib/onboarding/types";
import {
  lookupKeywordsStub,
  suggestCompetitorsStub,
} from "@/lib/onboarding/keywords-lookup-stub";
import type { KeywordIntent } from "@/lib/seo/seo-types";
import { cn } from "@/lib/utils";

const ALL_STEPS: OnboardingStep[] = [1, 2, 3, 4];

const INTENT_LABEL: Record<KeywordIntent, string> = {
  informational: "INFO",
  commercial: "COMM",
  transactional: "TRANS",
  navigational: "NAV",
};

const INTENT_TONE: Record<KeywordIntent, string> = {
  informational: "bg-blue-400/15 text-blue-300",
  commercial: "bg-emerald-400/15 text-emerald-300",
  transactional: "bg-amber-400/15 text-amber-300",
  navigational: "bg-violet-400/15 text-violet-300",
};

const PRIORITY_LABEL: Record<1 | 2 | 3, string> = {
  1: "HIGH",
  2: "MED",
  3: "LOW",
};

const PRIORITY_TONE: Record<1 | 2 | 3, string> = {
  1: "bg-rose-400/15 text-rose-300",
  2: "bg-amber-400/15 text-amber-300",
  3: "bg-surface-container-low text-text-muted",
};

export default function OnboardingClient({ projectId }: { projectId: string }) {
  const router = useRouter();
  const project = useProjectsStore((s) => s.getById(projectId));
  const state = useOnboardingStore((s) => s.byProject[projectId]);
  const ensureDraft = useOnboardingStore((s) => s.ensureDraft);
  const setSiteBasics = useOnboardingStore((s) => s.setSiteBasics);
  const setKeywords = useOnboardingStore((s) => s.setKeywords);
  const setCompetitors = useOnboardingStore((s) => s.setCompetitors);
  const setStep = useOnboardingStore((s) => s.setStep);
  const activate = useOnboardingStore((s) => s.activate);
  const reset = useOnboardingStore((s) => s.reset);

  const [bulkText, setBulkText] = useState("");
  const [newCompetitor, setNewCompetitor] = useState("");

  useEffect(() => {
    if (project?.domain) {
      ensureDraft({ projectId, domain: project.domain });
    }
  }, [projectId, project?.domain, ensureDraft]);

  const stepError = useMemo(
    () => (state ? validateStep(state.step, state) : null),
    [state],
  );

  if (!project) {
    return (
      <div className="p-10 text-body-md text-text-muted">Progetto non trovato.</div>
    );
  }
  if (!state) {
    return (
      <div className="flex h-full items-center justify-center p-10">
        <div className="flex items-center gap-3 text-body-sm text-text-muted">
          <Loader2 className="h-4 w-4 animate-spin" />
          Inizializzazione wizard…
        </div>
      </div>
    );
  }

  const handleBulkAdd = () => {
    const lines = bulkText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 1);
    if (lines.length === 0) return;
    const enriched = lookupKeywordsStub(lines);
    const next: OnboardingKeyword[] = [
      ...state.keywords,
      ...enriched.map((k) => ({
        id: generateOnboardingId("kw"),
        keyword: k.keyword,
        searchVolume: k.searchVolume,
        intent: k.intent,
        priority: 2 as const,
      })),
    ].slice(0, MAX_KEYWORDS);
    setKeywords(projectId, next);
    setBulkText("");
    toast.success(`${enriched.length} keyword aggiunte`);
  };

  const handleSuggestCompetitors = () => {
    const domain = state.siteBasics?.domain ?? project.domain;
    const suggestions = suggestCompetitorsStub({
      domain,
      keywords: state.keywords.map((k) => k.keyword),
    });
    const existing = new Set(state.competitors.map((c) => c.domain.toLowerCase()));
    const additions: OnboardingCompetitor[] = suggestions
      .filter((d) => !existing.has(d.toLowerCase()))
      .map((d) => ({
        id: generateOnboardingId("comp"),
        domain: d,
        label: null,
        fromSuggestion: true,
      }));
    if (additions.length === 0) {
      toast.info("Nessun nuovo competitor da suggerire");
      return;
    }
    const next = [...state.competitors, ...additions].slice(0, MAX_COMPETITORS);
    setCompetitors(projectId, next);
    toast.success(`${additions.length} competitor suggeriti aggiunti`);
  };

  const handleAddCompetitor = () => {
    const d = newCompetitor.trim().toLowerCase();
    if (!d) return;
    if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(d)) {
      toast.error("Dominio non valido (es. example.com)");
      return;
    }
    if (state.competitors.some((c) => c.domain.toLowerCase() === d)) {
      toast.warning("Competitor già presente");
      return;
    }
    if (state.competitors.length >= MAX_COMPETITORS) {
      toast.error(`Max ${MAX_COMPETITORS} competitor`);
      return;
    }
    setCompetitors(projectId, [
      ...state.competitors,
      {
        id: generateOnboardingId("comp"),
        domain: d,
        label: null,
        fromSuggestion: false,
      },
    ]);
    setNewCompetitor("");
  };

  const handleNext = () => {
    if (stepError) {
      toast.error(stepError);
      return;
    }
    if (state.step < 4) setStep(projectId, (state.step + 1) as OnboardingStep);
  };

  const handleBack = () => {
    if (state.step > 1) setStep(projectId, (state.step - 1) as OnboardingStep);
  };

  const handleActivate = () => {
    const err = validateStep(4, state);
    if (err) {
      toast.error(err);
      return;
    }
    activate(projectId);
    toast.success("Onboarding completato — tracking attivo");
    router.push(`/projects/${projectId}/seo`);
  };

  const handleReset = () => {
    if (!confirm("Resettare tutto l'onboarding? L'azione non è reversibile.")) return;
    reset(projectId);
    toast.info("Onboarding resettato");
  };

  return (
    <div className="flex h-full flex-col gap-6 px-10 py-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-molten-primary" />
            <h1 className="text-headline-md font-bold text-on-surface">Setup tracking</h1>
            {state.completedAt && (
              <span className="rounded-full bg-emerald-400/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-emerald-300">
                Completato
              </span>
            )}
          </div>
          <p className="text-body-sm text-secondary-text">
            Configura keyword e competitor reali. Le Cloud Functions
            settimanali useranno questi dati invece dello stub generico. Wizard a
            4 step — i dati restano in draft finché non attivi.
          </p>
        </div>
        {state.completedAt && (
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-2 rounded-md bg-surface-container-low px-3 py-2 text-label-md text-text-muted hover:text-rose-400"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </button>
        )}
      </header>

      <Stepper current={state.step} />

      <div className="rounded-xl bg-surface-container-high p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-title-lg font-bold text-on-surface">
              Step {state.step} · {ONBOARDING_STEP_TITLE[state.step]}
            </h2>
            <p className="text-body-sm text-text-muted">
              {ONBOARDING_STEP_DESC[state.step]}
            </p>
          </div>
          <span className="text-label-sm text-text-muted">
            {state.step}/4
          </span>
        </div>

        {state.step === 1 && (
          <Step1SiteBasics
            value={
              state.siteBasics ?? {
                domain: project.domain,
                countryCode: "CH",
                languageCode: "it",
                brandName: "",
              }
            }
            onChange={(b) => setSiteBasics(projectId, b)}
          />
        )}

        {state.step === 2 && (
          <Step2Keywords
            keywords={state.keywords}
            bulkText={bulkText}
            onBulkChange={setBulkText}
            onBulkAdd={handleBulkAdd}
            onChange={(next) => setKeywords(projectId, next)}
          />
        )}

        {state.step === 3 && (
          <Step3Competitors
            competitors={state.competitors}
            newCompetitor={newCompetitor}
            onNewChange={setNewCompetitor}
            onAdd={handleAddCompetitor}
            onSuggest={handleSuggestCompetitors}
            onChange={(next) => setCompetitors(projectId, next)}
          />
        )}

        {state.step === 4 && (
          <Step4Review state={state} onActivate={handleActivate} />
        )}

        {stepError && state.step !== 4 && (
          <div className="mt-4 flex items-center gap-2 rounded bg-rose-400/10 px-3 py-2 text-label-md text-rose-300">
            <X className="h-3.5 w-3.5" />
            {stepError}
          </div>
        )}

        <div className="mt-6 flex items-center justify-between border-t border-surface-container-low pt-4">
          <button
            type="button"
            onClick={handleBack}
            disabled={state.step === 1}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-2 text-label-md",
              state.step === 1
                ? "cursor-not-allowed text-text-muted"
                : "text-on-surface hover:bg-surface-container-low",
            )}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Indietro
          </button>

          {state.step < 4 ? (
            <button
              type="button"
              onClick={handleNext}
              disabled={!!stepError}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-4 py-2 text-label-md font-medium",
                stepError
                  ? "cursor-not-allowed bg-surface-container-low text-text-muted"
                  : "bg-molten-primary/15 text-molten-primary hover:bg-molten-primary/25",
              )}
            >
              Avanti
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleActivate}
              disabled={!!validateStep(4, state)}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-4 py-2 text-label-md font-bold",
                validateStep(4, state)
                  ? "cursor-not-allowed bg-surface-container-low text-text-muted"
                  : state.completedAt
                    ? "bg-emerald-400/15 text-emerald-300 hover:bg-emerald-400/25"
                    : "bg-emerald-400/20 text-emerald-300 hover:bg-emerald-400/30",
              )}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              {state.completedAt ? "Aggiorna setup" : "Attiva tracking"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Stepper({ current }: { current: OnboardingStep }) {
  return (
    <ol className="flex items-center gap-2">
      {ALL_STEPS.map((s) => {
        const done = s < current;
        const active = s === current;
        return (
          <li key={s} className="flex flex-1 items-center gap-2">
            <div
              className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-label-sm font-bold",
                done && "bg-emerald-400/20 text-emerald-300",
                active && "bg-molten-primary/20 text-molten-primary ring-2 ring-molten-primary/40",
                !done && !active && "bg-surface-container-low text-text-muted",
              )}
            >
              {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : s}
            </div>
            <span
              className={cn(
                "truncate text-label-md",
                active ? "font-semibold text-on-surface" : "text-text-muted",
              )}
            >
              {ONBOARDING_STEP_TITLE[s]}
            </span>
            {s < 4 && (
              <span
                className={cn(
                  "h-px flex-1",
                  done ? "bg-emerald-400/40" : "bg-surface-container-low",
                )}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}

// ---------- Step 1 ----------

function Step1SiteBasics({
  value,
  onChange,
}: {
  value: NonNullable<ReturnType<typeof useOnboardingStore.getState>["byProject"][string]["siteBasics"]>;
  onChange: (
    v: NonNullable<ReturnType<typeof useOnboardingStore.getState>["byProject"][string]["siteBasics"]>,
  ) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <Field label="Dominio" hint="Senza https://, es. example.com">
        <input
          type="text"
          value={value.domain}
          onChange={(e) => onChange({ ...value, domain: e.target.value.trim().toLowerCase() })}
          className="w-full rounded-md bg-surface-container-low px-3 py-2 font-mono text-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-molten-primary/40"
          placeholder="example.com"
        />
      </Field>
      <Field label="Brand name" hint="Display name del brand (es. VerumFlow)">
        <input
          type="text"
          value={value.brandName}
          onChange={(e) => onChange({ ...value, brandName: e.target.value })}
          className="w-full rounded-md bg-surface-container-low px-3 py-2 text-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-molten-primary/40"
          placeholder="VerumFlow"
        />
      </Field>
      <Field label="Country code" hint="ISO 3166-1 alpha-2 (CH, IT, US…)">
        <input
          type="text"
          value={value.countryCode}
          maxLength={2}
          onChange={(e) => onChange({ ...value, countryCode: e.target.value.toUpperCase().trim() })}
          className="w-full rounded-md bg-surface-container-low px-3 py-2 font-mono uppercase text-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-molten-primary/40"
          placeholder="CH"
        />
      </Field>
      <Field label="Lingua" hint="ISO 639-1 (it, en, de, fr…)">
        <input
          type="text"
          value={value.languageCode}
          maxLength={5}
          onChange={(e) => onChange({ ...value, languageCode: e.target.value.toLowerCase().trim() })}
          className="w-full rounded-md bg-surface-container-low px-3 py-2 font-mono text-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-molten-primary/40"
          placeholder="it"
        />
      </Field>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-label-md font-semibold text-on-surface">{label}</span>
      {hint && <span className="text-label-sm text-text-muted">{hint}</span>}
      {children}
    </label>
  );
}

// ---------- Step 2 ----------

function Step2Keywords({
  keywords,
  bulkText,
  onBulkChange,
  onBulkAdd,
  onChange,
}: {
  keywords: OnboardingKeyword[];
  bulkText: string;
  onBulkChange: (v: string) => void;
  onBulkAdd: () => void;
  onChange: (next: OnboardingKeyword[]) => void;
}) {
  const removeKw = (id: string) => onChange(keywords.filter((k) => k.id !== id));
  const updateKw = (id: string, patch: Partial<OnboardingKeyword>) =>
    onChange(keywords.map((k) => (k.id === id ? { ...k, ...patch } : k)));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label className="text-label-md font-semibold text-on-surface">
          Bulk import keyword
          <span className="ml-2 font-normal text-text-muted">
            (1 per riga; volume + intent stimati automaticamente)
          </span>
        </label>
        <textarea
          value={bulkText}
          onChange={(e) => onBulkChange(e.target.value)}
          rows={4}
          placeholder={"agenzia web ticino\ncms ai-driven 2026\nmiglior site builder pmi"}
          className="w-full rounded-md bg-surface-container-low px-3 py-2 font-mono text-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-molten-primary/40"
        />
        <div className="flex items-center justify-between">
          <span className="text-label-sm text-text-muted">
            <span
              className={cn(
                "font-mono font-semibold",
                keywords.length < MIN_KEYWORDS
                  ? "text-rose-300"
                  : keywords.length >= TARGET_KEYWORDS
                    ? "text-emerald-300"
                    : "text-amber-300",
              )}
            >
              {keywords.length}
            </span>
            {" / "}
            <span className="font-mono">{TARGET_KEYWORDS}</span> target (min{" "}
            {MIN_KEYWORDS}, max {MAX_KEYWORDS})
          </span>
          <button
            type="button"
            onClick={onBulkAdd}
            disabled={!bulkText.trim()}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-label-md",
              bulkText.trim()
                ? "bg-molten-primary/15 text-molten-primary hover:bg-molten-primary/25"
                : "cursor-not-allowed bg-surface-container-low text-text-muted",
            )}
          >
            <Plus className="h-3.5 w-3.5" />
            Aggiungi al set
          </button>
        </div>
      </div>

      {keywords.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-surface-container-low">
          <table className="w-full text-label-md">
            <thead className="bg-surface-container-low/60 text-[10px] uppercase tracking-wider text-text-muted">
              <tr>
                <th className="p-2 text-left">Keyword</th>
                <th className="p-2 text-right">Volume</th>
                <th className="p-2 text-center">Intent</th>
                <th className="p-2 text-center">Priorità</th>
                <th className="p-2"></th>
              </tr>
            </thead>
            <tbody>
              {keywords.map((k) => (
                <tr key={k.id} className="border-t border-surface-container-low/60">
                  <td className="p-2 font-mono text-body-sm text-on-surface">
                    <input
                      type="text"
                      value={k.keyword}
                      onChange={(e) => updateKw(k.id, { keyword: e.target.value })}
                      className="w-full bg-transparent focus:outline-none"
                    />
                  </td>
                  <td className="p-2 text-right font-mono text-body-sm text-on-surface">
                    {k.searchVolume?.toLocaleString("it-IT") ?? "—"}
                  </td>
                  <td className="p-2 text-center">
                    {k.intent && (
                      <span
                        className={cn(
                          "rounded px-1.5 py-0.5 text-[10px] font-bold tracking-wider",
                          INTENT_TONE[k.intent],
                        )}
                      >
                        {INTENT_LABEL[k.intent]}
                      </span>
                    )}
                  </td>
                  <td className="p-2 text-center">
                    <select
                      value={k.priority}
                      onChange={(e) =>
                        updateKw(k.id, {
                          priority: Number(e.target.value) as 1 | 2 | 3,
                        })
                      }
                      className={cn(
                        "rounded px-1.5 py-0.5 text-[10px] font-bold tracking-wider focus:outline-none",
                        PRIORITY_TONE[k.priority],
                      )}
                    >
                      <option value={1}>HIGH</option>
                      <option value={2}>MED</option>
                      <option value={3}>LOW</option>
                    </select>
                  </td>
                  <td className="p-2 text-right">
                    <button
                      type="button"
                      onClick={() => removeKw(k.id)}
                      className="text-text-muted hover:text-rose-400"
                      title="Rimuovi"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ---------- Step 3 ----------

function Step3Competitors({
  competitors,
  newCompetitor,
  onNewChange,
  onAdd,
  onSuggest,
  onChange,
}: {
  competitors: OnboardingCompetitor[];
  newCompetitor: string;
  onNewChange: (v: string) => void;
  onAdd: () => void;
  onSuggest: () => void;
  onChange: (next: OnboardingCompetitor[]) => void;
}) {
  const remove = (id: string) => onChange(competitors.filter((c) => c.id !== id));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label className="text-label-md font-semibold text-on-surface">
          Aggiungi competitor (3-8 domini)
          <span className="ml-2 font-normal text-text-muted">
            usati come pool reale dalle CF GEO
          </span>
        </label>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={newCompetitor}
            onChange={(e) => onNewChange(e.target.value.trim().toLowerCase())}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                onAdd();
              }
            }}
            placeholder="competitor.com"
            className="flex-1 min-w-[12rem] rounded-md bg-surface-container-low px-3 py-2 font-mono text-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-molten-primary/40"
          />
          <button
            type="button"
            onClick={onAdd}
            disabled={!newCompetitor || competitors.length >= MAX_COMPETITORS}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-2 text-label-md",
              newCompetitor && competitors.length < MAX_COMPETITORS
                ? "bg-molten-primary/15 text-molten-primary hover:bg-molten-primary/25"
                : "cursor-not-allowed bg-surface-container-low text-text-muted",
            )}
          >
            <Plus className="h-3.5 w-3.5" />
            Aggiungi
          </button>
          <button
            type="button"
            onClick={onSuggest}
            disabled={competitors.length >= MAX_COMPETITORS}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-2 text-label-md",
              competitors.length < MAX_COMPETITORS
                ? "bg-amber-400/15 text-amber-300 hover:bg-amber-400/25"
                : "cursor-not-allowed bg-surface-container-low text-text-muted",
            )}
            title="Suggerisce 3 competitor da SERP top 10 sulle tue keyword (stub deterministic)"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Suggerisci da SERP
          </button>
        </div>
        <span className="text-label-sm text-text-muted">
          <span
            className={cn(
              "font-mono font-semibold",
              competitors.length < MIN_COMPETITORS
                ? "text-rose-300"
                : "text-emerald-300",
            )}
          >
            {competitors.length}
          </span>
          {" / "}
          <span className="font-mono">{MAX_COMPETITORS}</span> (min{" "}
          {MIN_COMPETITORS})
        </span>
      </div>

      {competitors.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {competitors.map((c) => (
            <span
              key={c.id}
              className={cn(
                "inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-label-md",
                c.fromSuggestion
                  ? "border-amber-400/30 bg-amber-400/10 text-amber-200"
                  : "border-surface-container-low bg-surface-container-low text-on-surface",
              )}
            >
              {c.fromSuggestion && <Sparkles className="h-3 w-3" />}
              <span className="font-mono">{c.domain}</span>
              <button
                type="button"
                onClick={() => remove(c.id)}
                className="text-text-muted hover:text-rose-400"
                title="Rimuovi"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------- Step 4 ----------

function Step4Review({
  state,
  onActivate: _onActivate,
}: {
  state: NonNullable<ReturnType<typeof useOnboardingStore.getState>["byProject"][string]>;
  onActivate: () => void;
}) {
  const totalVolume = state.keywords.reduce(
    (s, k) => s + (k.searchVolume ?? 0),
    0,
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <ReviewBlock
          icon={Globe}
          title="Site basics"
          rows={[
            ["Dominio", state.siteBasics?.domain ?? "—"],
            ["Brand", state.siteBasics?.brandName ?? "—"],
            ["Country", state.siteBasics?.countryCode ?? "—"],
            ["Lingua", state.siteBasics?.languageCode ?? "—"],
          ]}
        />
        <ReviewBlock
          icon={Sparkles}
          title="Keywords"
          rows={[
            ["Totale", `${state.keywords.length}`],
            ["Volume aggregato", `${totalVolume.toLocaleString("it-IT")}/mese`],
            [
              "High priority",
              `${state.keywords.filter((k) => k.priority === 1).length}`,
            ],
            [
              "Commercial intent",
              `${state.keywords.filter((k) => k.intent === "commercial").length}`,
            ],
          ]}
        />
        <ReviewBlock
          icon={Trophy}
          title="Competitor"
          rows={[
            ["Totale", `${state.competitors.length}`],
            [
              "Da SERP suggest",
              `${state.competitors.filter((c) => c.fromSuggestion).length}`,
            ],
            [
              "Manuali",
              `${state.competitors.filter((c) => !c.fromSuggestion).length}`,
            ],
          ]}
        />
        <div className="rounded-xl border border-emerald-400/30 bg-emerald-400/5 p-4">
          <div className="mb-2 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-300" />
            <h3 className="text-title-sm font-semibold text-emerald-200">
              Cosa succede dopo
            </h3>
          </div>
          <ul className="flex flex-col gap-1.5 text-label-md text-on-surface">
            <li>• runRankAndAeoTracking userà queste keyword (Lun 03:00)</li>
            <li>• runGeoTracking deriverà 12-15 prompt-style query (Lun 04:00)</li>
            <li>• runAiSearchHealth scansionerà robots.txt (Lun 05:00)</li>
            <li>• Snapshot live appariranno in /seo /aeo /geo dal lunedì successivo</li>
          </ul>
        </div>
      </div>

      <div className="rounded-xl border border-sky-400/30 bg-sky-400/5 p-5">
        <div className="mb-2 flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-sky-300" />
          <h3 className="text-title-sm font-semibold text-sky-100">
            Integrazioni API (opzionale)
          </h3>
        </div>
        <p className="mb-3 text-body-sm text-text-muted">
          Senza chiavi API i moduli SEO/GEO/AEO girano in stub mode con dati
          deterministici. Per dati reali (Anthropic/OpenAI/Gemini per /geo,
          DataForSEO per /seo, GA4 per /analytics, AdSense per revenue), configura
          le chiavi nelle Integrazioni — può essere fatto anche dopo l&apos;attivazione.
        </p>
        <div className="flex flex-wrap gap-2">
          <a
            href="/settings/integrations"
            target="_blank"
            rel="noopener"
            className="inline-flex items-center gap-1 rounded-md bg-sky-400/15 px-3 py-1.5 text-label-md text-sky-200 hover:bg-sky-400/25"
          >
            Default workspace
            <ArrowUpRight className="h-3 w-3" />
          </a>
          <a
            href="settings/integrations"
            target="_blank"
            rel="noopener"
            className="inline-flex items-center gap-1 rounded-md bg-sky-400/15 px-3 py-1.5 text-label-md text-sky-200 hover:bg-sky-400/25"
          >
            Override per questo progetto
            <ArrowUpRight className="h-3 w-3" />
          </a>
        </div>
      </div>

      <p className="text-label-sm text-text-muted">
        Dopo l&apos;attivazione potrai modificare keyword e competitor da{" "}
        <span className="font-mono">/projects/{state.siteBasics?.domain}/settings</span>{" "}
        — ma le modifiche vengono prese dalla CF al run successivo.
      </p>
    </div>
  );
}

function ReviewBlock({
  icon: Icon,
  title,
  rows,
}: {
  icon: typeof Globe;
  title: string;
  rows: Array<[string, string]>;
}) {
  return (
    <div className="rounded-xl bg-surface-container-low p-4">
      <div className="mb-2 flex items-center gap-2">
        <Icon className="h-4 w-4 text-molten-primary" />
        <h3 className="text-title-sm font-semibold text-on-surface">{title}</h3>
      </div>
      <dl className="flex flex-col gap-1.5">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between text-label-md">
            <dt className="text-text-muted">{label}</dt>
            <dd className="font-mono text-on-surface">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
