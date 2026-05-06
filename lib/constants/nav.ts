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
} from "lucide-react";

export type NavItem = {
  label: string;
  href: (projectId: string) => string;
  icon: typeof LayoutDashboard;
  matchPath: string;
};

export type GlobalNavItem = {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
  matchPath: string;
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

export const PROJECT_NAV: NavItem[] = [
  {
    label: "Dashboard",
    href: (id) => `/projects/${id}/dashboard`,
    icon: LayoutDashboard,
    matchPath: "dashboard",
  },
  {
    label: "Pages",
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
  {
    label: "Analytics",
    href: (id) => `/projects/${id}/analytics`,
    icon: LineChart,
    matchPath: "analytics",
  },
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
    label: "Leads",
    href: (id) => `/projects/${id}/leads`,
    icon: Users,
    matchPath: "leads",
  },
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
    label: "Forms",
    href: (id) => `/projects/${id}/forms`,
    icon: Inbox,
    matchPath: "forms",
  },
  {
    label: "Alerts",
    href: (id) => `/projects/${id}/alerts`,
    icon: AlertTriangle,
    matchPath: "alerts",
  },
  {
    label: "Reports",
    href: (id) => `/projects/${id}/reports`,
    icon: FileBarChart,
    matchPath: "reports",
  },
  {
    label: "Tasks",
    href: (id) => `/projects/${id}/tasks`,
    icon: ListTodo,
    matchPath: "tasks",
  },
  {
    label: "Setup",
    href: (id) => `/projects/${id}/onboarding`,
    icon: Settings,
    matchPath: "onboarding",
  },
  {
    label: "Site Settings",
    href: (id) => `/projects/${id}/settings/general`,
    icon: Settings,
    matchPath: "settings",
  },
];
