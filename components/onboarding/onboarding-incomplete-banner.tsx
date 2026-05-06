"use client";

import Link from "next/link";
import { ArrowRight, Settings, Sparkles } from "lucide-react";
import { useOnboardingStore } from "@/lib/stores/onboarding-store";
import {
  ONBOARDING_STEP_TITLE,
  type OnboardingStep,
} from "@/lib/onboarding/types";

type Props = {
  projectId: string;
  /** Modulo che ospita il banner (per messaggio contestuale). */
  module: "seo" | "aeo" | "geo";
};

const MODULE_NAME: Record<Props["module"], string> = {
  seo: "SEO",
  aeo: "AEO",
  geo: "GEO",
};

const MODULE_DETAIL: Record<Props["module"], string> = {
  seo: "I dati che vedi sotto sono generati in stub deterministic — completa il setup per attivare il rank tracking settimanale con le tue keyword reali.",
  aeo: "I dati AEO/SERP feature sotto sono in stub-mode — completa il setup per attivare il monitoring settimanale.",
  geo: "Le query GEO mostrate sotto sono prompt-style derivate da keyword stub — completa il setup per attivare il fetch settimanale dei 4 LLM.",
};

export function OnboardingIncompleteBanner({ projectId, module }: Props) {
  const state = useOnboardingStore((s) => s.byProject[projectId]);
  const isComplete = !!state?.completedAt;
  if (isComplete) return null;

  const currentStep = (state?.step ?? 1) as OnboardingStep;
  const stepTitle = ONBOARDING_STEP_TITLE[currentStep];

  return (
    <Link
      href={`/projects/${projectId}/onboarding`}
      className="group flex items-start gap-3 rounded-xl border border-amber-400/30 bg-amber-400/5 p-4 transition-colors hover:bg-amber-400/10"
    >
      <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
      <div className="flex flex-1 flex-col gap-1">
        <span className="flex flex-wrap items-center gap-2 text-title-sm font-semibold text-amber-100">
          Setup {MODULE_NAME[module]} non completato
          {state && (
            <span className="rounded bg-amber-400/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-300">
              Step {currentStep}/4 · {stepTitle}
            </span>
          )}
        </span>
        <span className="text-body-sm text-amber-50/80">
          {MODULE_DETAIL[module]}
        </span>
      </div>
      <span className="flex shrink-0 items-center gap-1 text-label-md font-semibold text-amber-200 group-hover:text-amber-100">
        <Settings className="h-3.5 w-3.5" />
        Completa setup
        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}
