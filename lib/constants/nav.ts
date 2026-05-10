import {
  LayoutDashboard,
  FileText,
  Database,
  LineChart,
  AlertTriangle,
  Settings,
  Globe,
  Inbox,
  Sparkles,
  Telescope,
  FileBarChart,
  ListTodo,
  FolderKanban,
  Users,
  BadgeDollarSign,
  TrendingUp,
  KeyRound,
  Layers,
  Eye,
  Megaphone,
  Wrench,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: (projectId: string) => string;
  icon: LucideIcon;
  matchPath: string;
};

export type GlobalNavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  matchPath: string;
};

export type ProjectNavSection = {
  id: string;
  label: string;
  icon: LucideIcon;
  items: NavItem[];
};

export const GLOBAL_NAV: GlobalNavItem[] = [
  {
    label: "Progetti",
    href: "/projects",
    icon: FolderKanban,
    matchPath: "/projects",
  },
  {
    label: "Integrazioni",
    href: "/settings/integrations",
    icon: KeyRound,
    matchPath: "/settings/integrations",
  },
];

export const DASHBOARD_NAV_ITEM: NavItem = {
  label: "Dashboard",
  href: (id) => `/projects/${id}/dashboard`,
  icon: LayoutDashboard,
  matchPath: "dashboard",
};

export const PROJECT_NAV_SECTIONS: ProjectNavSection[] = [
  {
    id: "site",
    label: "Sito",
    icon: Layers,
    items: [
      {
        label: "Pagine",
        href: (id) => `/projects/${id}/pages`,
        icon: FileText,
        matchPath: "pages",
      },
      {
        label: "CMS",
        href: (id) => `/projects/${id}/cms`,
        icon: Database,
        matchPath: "cms",
      },
    ],
  },
  {
    id: "visibility",
    label: "Visibilità",
    icon: Eye,
    items: [
      {
        label: "SEO",
        href: (id) => `/projects/${id}/seo`,
        icon: Telescope,
        matchPath: "seo",
      },
      {
        label: "AEO",
        href: (id) => `/projects/${id}/aeo`,
        icon: Sparkles,
        matchPath: "aeo",
      },
      {
        label: "GEO",
        href: (id) => `/projects/${id}/geo`,
        icon: Globe,
        matchPath: "geo",
      },
      {
        label: "Analytics",
        href: (id) => `/projects/${id}/analytics`,
        icon: LineChart,
        matchPath: "analytics",
      },
    ],
  },
  {
    id: "growth",
    label: "Crescita",
    icon: Megaphone,
    items: [
      {
        label: "Ads",
        href: (id) => `/projects/${id}/ads`,
        icon: BadgeDollarSign,
        matchPath: "ads",
      },
      {
        label: "CPL & ROAS",
        href: (id) => `/projects/${id}/cpl`,
        icon: TrendingUp,
        matchPath: "cpl",
      },
      {
        label: "Lead",
        href: (id) => `/projects/${id}/leads`,
        icon: Users,
        matchPath: "leads",
      },
      {
        label: "Form",
        href: (id) => `/projects/${id}/forms`,
        icon: Inbox,
        matchPath: "forms",
      },
    ],
  },
  {
    id: "ops",
    label: "Gestione",
    icon: Wrench,
    items: [
      {
        label: "Alert",
        href: (id) => `/projects/${id}/alerts`,
        icon: AlertTriangle,
        matchPath: "alerts",
      },
      {
        label: "Report",
        href: (id) => `/projects/${id}/reports`,
        icon: FileBarChart,
        matchPath: "reports",
      },
      {
        label: "Task",
        href: (id) => `/projects/${id}/tasks`,
        icon: ListTodo,
        matchPath: "tasks",
      },
      {
        label: "Setup iniziale",
        href: (id) => `/projects/${id}/onboarding`,
        icon: Sparkles,
        matchPath: "onboarding",
      },
      {
        label: "Impostazioni",
        href: (id) => `/projects/${id}/settings/general`,
        icon: Settings,
        matchPath: "settings",
      },
    ],
  },
];

export const PROJECT_NAV: NavItem[] = [
  DASHBOARD_NAV_ITEM,
  ...PROJECT_NAV_SECTIONS.flatMap((s) => s.items),
];
