import type { LucideIcon } from "lucide-react";

export function ModulePlaceholder({
  title,
  description,
  icon: Icon,
  phase,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
  phase: "F2" | "F3" | "F4" | "F5";
}) {
  return (
    <div className="mx-auto flex min-h-full max-w-5xl flex-col items-start justify-center gap-6 px-10 py-20">
      <div
        className="flex h-14 w-14 items-center justify-center rounded-2xl shadow-xl"
        style={{ background: "linear-gradient(135deg,#ffb599,#f56117)" }}
      >
        <Icon className="h-7 w-7 text-on-molten" />
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <h1 className="text-headline-md font-bold text-on-surface">
            {title}
          </h1>
          <span className="rounded-full bg-surface-container-high px-2.5 py-0.5 text-label-sm font-semibold uppercase tracking-widest text-molten-primary">
            {phase}
          </span>
        </div>
        <p className="max-w-xl text-body-md text-secondary-text">
          {description}
        </p>
      </div>
      <div className="rounded-xl bg-surface-container-high px-5 py-4 text-body-sm text-secondary-text">
        Questo modulo verrà implementato nella fase{" "}
        <span className="font-semibold text-on-surface">{phase}</span> del DOC 1.
        Il layout, i dati mock e le API backend sono già pronti.
      </div>
    </div>
  );
}
