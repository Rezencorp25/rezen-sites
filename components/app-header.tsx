"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Bell, Search, HelpCircle, ChevronRight } from "lucide-react";
import { ProjectSwitcher } from "./project-switcher";
import { Input } from "@/components/ui/input";

const SEGMENT_LABELS: Record<string, string> = {
  projects: "Projects",
  dashboard: "Dashboard",
  pages: "Pages",
  cms: "CMS",
  analytics: "Analytics",
  adsense: "AdSense",
  "google-ads": "Google Ads",
  alerts: "Alerts",
  forms: "Forms",
  settings: "Settings",
  general: "Generali",
  domains: "Dominio",
  redirects: "Redirects",
  staging: "Staging",
  tracking: "Tracking",
  seo: "SEO",
};

function useBreadcrumbs() {
  const pathname = usePathname() ?? "/";
  const segs = pathname.split("/").filter(Boolean);
  const crumbs: { label: string; href?: string }[] = [];
  let acc = "";
  for (const s of segs) {
    acc += `/${s}`;
    // Skip project id segments — keep just the human-readable labels
    if (SEGMENT_LABELS[s]) {
      crumbs.push({ label: SEGMENT_LABELS[s], href: acc });
    }
  }
  return crumbs;
}

export function AppHeader() {
  const crumbs = useBreadcrumbs();

  return (
    <header className="glass sticky top-0 z-30 flex h-12 items-center justify-between gap-4 px-5 border-b border-border/60">
      <nav className="flex items-center gap-1 text-body-sm text-secondary-text">
        {crumbs.length === 0 ? (
          <span>Overview</span>
        ) : (
          crumbs.map((c, i) => (
            <span key={c.href ?? i} className="flex items-center gap-1">
              {i > 0 && (
                <ChevronRight className="h-3 w-3 text-text-muted" />
              )}
              {c.href && i < crumbs.length - 1 ? (
                <Link
                  href={c.href}
                  className="hover:text-on-surface transition-colors"
                >
                  {c.label}
                </Link>
              ) : (
                <span className="font-medium text-on-surface">{c.label}</span>
              )}
            </span>
          ))
        )}
      </nav>

      <div className="relative hidden md:block w-72">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted" />
        <Input
          placeholder="Cerca progetto, pagina, CMS... ⌘K"
          className="h-8 pl-8 pr-3 bg-surface-container-low border-none text-body-sm placeholder:text-text-muted/70"
        />
      </div>

      <div className="flex items-center gap-1.5">
        <button
          aria-label="Aiuto"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted hover:bg-surface-container-high hover:text-on-surface transition-colors"
        >
          <HelpCircle className="h-4 w-4" />
        </button>
        <button
          aria-label="Notifiche"
          className="relative flex h-8 w-8 items-center justify-center rounded-lg text-text-muted hover:bg-surface-container-high hover:text-on-surface transition-colors"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-molten-primary-container ring-2 ring-surface-dim" />
        </button>
        <div className="mx-1 h-5 w-px bg-outline/30" />
        <ProjectSwitcher />
      </div>
    </header>
  );
}
