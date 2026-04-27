"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

const TABS = [
  { label: "Generali", segment: "general" },
  { label: "Dominio", segment: "domains" },
  { label: "Redirects", segment: "redirects" },
  { label: "Staging", segment: "staging" },
  { label: "Tracking", segment: "tracking" },
  { label: "Versions", segment: "versions" },
];

export default function SettingsLayout({ children }: { children: ReactNode }) {
  const params = useParams<{ projectId: string }>();
  const pathname = usePathname() ?? "";
  const projectId = params?.projectId ?? "";

  return (
    <div className="flex h-full flex-col">
      <div className="sticky top-0 z-20 glass px-10 pt-8">
        <h1 className="mb-2 text-headline-md font-bold text-on-surface">
          Site Settings
        </h1>
        <nav className="flex gap-6">
          {TABS.map((tab) => {
            const href = `/projects/${projectId}/settings/${tab.segment}`;
            const active = pathname.endsWith(`/${tab.segment}`);
            return (
              <Link
                key={tab.segment}
                href={href}
                className={cn(
                  "relative pb-3 text-body-md font-medium transition-colors",
                  active
                    ? "text-on-surface"
                    : "text-secondary-text hover:text-on-surface",
                )}
              >
                {tab.label}
                {active && (
                  <span
                    className="absolute left-0 right-0 -bottom-px h-[2px] rounded-full"
                    style={{
                      background:
                        "linear-gradient(90deg,#ffb599,#f56117)",
                    }}
                  />
                )}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}
