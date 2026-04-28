"use client";

import Link from "next/link";
import {
  Sparkles,
  CheckCircle2,
  Circle,
  ArrowRight,
  PlayCircle,
} from "lucide-react";

const STEPS = [
  {
    title: "1. Crea il primo progetto",
    description:
      "Scegli AI / vuoto / import ZIP / Framer / Webflow. AI orchestrator genera home + SEO automatico.",
    cta: "Vai a Progetti",
    href: "/projects",
    done: false,
  },
  {
    title: "2. Configura tracking GA4 + Meta",
    description:
      "Wizard step-by-step in /settings/tracking con validazione formati ID.",
    cta: "Setup tracking",
    href: "/projects/verumflow-ch/settings/tracking",
    done: true,
  },
  {
    title: "3. Personalizza Local Business + LangPaese",
    description:
      "Indirizzo, hreflang, recensioni → schema.org auto-iniettato in export.",
    cta: "Setup Local",
    href: "/projects/verumflow-ch/settings/general",
    done: true,
  },
  {
    title: "4. Imposta GDPR consent + Privacy",
    description:
      "Consent banner Mode v2 + DSAR email + data residency.",
    cta: "Compliance",
    href: "/projects/verumflow-ch/settings/general",
    done: false,
  },
  {
    title: "5. Pubblica la prima pagina",
    description:
      "Editor Puck → SEO editor → Pubblica → check su /alerts per warnings.",
    cta: "Inizia editing",
    href: "/projects/verumflow-ch/pages",
    done: false,
  },
  {
    title: "6. Invita team + setup workspace",
    description:
      "Aggiungi membri, definisci ruoli, configura SSO se Enterprise.",
    cta: "Workspace admin",
    href: "/admin",
    done: false,
  },
  {
    title: "7. Esporta primo report cliente",
    description:
      "Custom report builder → seleziona widget → schedule monthly delivery.",
    cta: "Setup reports",
    href: "/projects/verumflow-ch/reports",
    done: false,
  },
];

const VIDEO_TUTORIALS = [
  { title: "Onboarding 5 min", duration: "5:23" },
  { title: "AI page generation", duration: "8:14" },
  { title: "SEO editor deep-dive", duration: "12:01" },
  { title: "Local SEO + multi-location", duration: "9:45" },
  { title: "Tracking + conversion setup", duration: "11:30" },
];

export default function OnboardingPage() {
  const completed = STEPS.filter((s) => s.done).length;

  return (
    <div className="mx-auto max-w-5xl px-10 py-10">
      <div className="mb-6 flex items-center gap-3">
        <div
          className="flex h-12 w-12 items-center justify-center rounded-xl"
          style={{ background: "linear-gradient(135deg,#ff8533,#ff6200)" }}
        >
          <Sparkles className="h-6 w-6 text-on-molten" />
        </div>
        <div>
          <p className="text-label-md uppercase tracking-widest text-text-muted">
            Welcome
          </p>
          <h1 className="text-headline-md font-bold text-on-surface">
            Setup REZEN Sites in 7 step
          </h1>
        </div>
      </div>

      <div className="mb-6 rounded-xl bg-surface-container-high p-4">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-body-sm font-semibold text-on-surface">
            Progress: {completed} / {STEPS.length}
          </p>
          <p className="font-mono text-label-md text-text-muted">
            ETA setup completo: ~30 min
          </p>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-surface-container-lowest">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${(completed / STEPS.length) * 100}%`,
              background: "linear-gradient(90deg,#ff8533,#ff6200)",
            }}
          />
        </div>
      </div>

      <div className="space-y-3">
        {STEPS.map((s) => (
          <Link
            key={s.title}
            href={s.href}
            className="flex items-start gap-4 rounded-xl bg-surface-container-high p-5 transition-colors hover:bg-surface-container-highest"
          >
            {s.done ? (
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" />
            ) : (
              <Circle className="mt-0.5 h-5 w-5 shrink-0 text-text-muted" />
            )}
            <div className="flex-1">
              <p className="text-body-md font-semibold text-on-surface">
                {s.title}
              </p>
              <p className="text-body-sm text-secondary-text">
                {s.description}
              </p>
            </div>
            <span className="flex items-center gap-1 text-label-md font-medium text-molten-primary">
              {s.cta}
              <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </Link>
        ))}
      </div>

      <section className="mt-8 rounded-xl bg-surface-container-high p-6">
        <div className="mb-3 flex items-center gap-2.5">
          <PlayCircle className="h-4 w-4 text-molten-primary" />
          <h2 className="text-title-md font-semibold text-on-surface">
            Video tutorial
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          {VIDEO_TUTORIALS.map((v) => (
            <div
              key={v.title}
              className="flex items-center gap-3 rounded-md bg-surface-container-low px-3 py-2"
            >
              <PlayCircle className="h-5 w-5 text-molten-primary" />
              <div className="flex-1">
                <p className="text-body-sm font-medium text-on-surface">
                  {v.title}
                </p>
                <p className="font-mono text-label-sm text-text-muted">
                  {v.duration}
                </p>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-label-md text-text-muted">
          Video produzione in DOC 3 (Loom / YouTube unlisted).
        </p>
      </section>
    </div>
  );
}
