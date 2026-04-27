"use client";

import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { PROJECT_NAV } from "@/lib/constants/nav";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Flame } from "lucide-react";

export function AppSidebar() {
  const pathname = usePathname();
  const params = useParams<{ projectId?: string }>();
  const projectId = params?.projectId ?? "verumflow-ch";

  return (
    <aside className="flex h-full w-56 shrink-0 flex-col bg-surface-container border-r border-outline/20">
      <div className="flex h-12 items-center gap-2.5 px-4">
        <div
          className="flex h-7 w-7 items-center justify-center rounded-lg shadow-lg shadow-molten-primary-container/20"
          style={{
            background: "linear-gradient(135deg, #ff8533 0%, #ff6200 100%)",
          }}
        >
          <Flame className="h-3.5 w-3.5 text-on-molten" />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-body-sm font-bold text-on-surface">
            REZEN Sites
          </span>
          <span className="text-[0.625rem] uppercase tracking-widest text-text-muted">
            powered by VerumFlow
          </span>
        </div>
      </div>

      <div className="mx-4 mb-2 mt-1 h-px bg-outline/20" />

      <nav className="flex-1 overflow-y-auto px-2.5 py-2">
        <ul className="flex flex-col gap-0.5">
          {PROJECT_NAV.map(({ label, href, icon: Icon, matchPath }) => {
            const target = href(projectId);
            const active = pathname?.includes(`/${matchPath}`);
            return (
              <li key={label}>
                <Link
                  href={target}
                  className={cn(
                    "group relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-body-sm font-medium transition-all",
                    active
                      ? "bg-surface-container-high text-on-surface"
                      : "text-secondary-text hover:bg-surface-container-low hover:text-on-surface",
                  )}
                >
                  {active && (
                    <span className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-r-full bg-molten-primary-container" />
                  )}
                  <Icon
                    className={cn(
                      "h-4 w-4 shrink-0 transition-colors",
                      active
                        ? "text-molten-primary"
                        : "text-text-muted group-hover:text-on-surface",
                    )}
                  />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="m-2.5 flex items-center gap-2.5 rounded-xl bg-surface-container-high p-2 pr-3">
        <Avatar className="h-8 w-8">
          <AvatarFallback
            className="text-label-md font-bold"
            style={{
              background: "linear-gradient(135deg,#ff8533,#ff6200)",
              color: "#0f1113",
            }}
          >
            AA
          </AvatarFallback>
        </Avatar>
        <div className="flex min-w-0 flex-1 flex-col leading-tight">
          <span className="truncate text-body-sm font-semibold text-on-surface">
            Admin
          </span>
          <span className="truncate text-label-sm text-text-muted">
            demo@rezen.dev
          </span>
        </div>
        <span
          className="rounded-full px-1.5 py-0.5 text-[0.625rem] font-bold uppercase tracking-wider"
          style={{
            background: "linear-gradient(135deg,#ff8533,#ff6200)",
            color: "#0f1113",
          }}
        >
          PRO
        </span>
      </div>
    </aside>
  );
}
