import {
  LayoutDashboard,
  FileText,
  Database,
  LineChart,
  AlertTriangle,
  Settings,
  Inbox,
  Telescope,
  FileBarChart,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: (projectId: string) => string;
  icon: typeof LayoutDashboard;
  matchPath: string;
};

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
    label: "SEO Research",
    href: (id) => `/projects/${id}/seo-research`,
    icon: Telescope,
    matchPath: "seo-research",
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
    label: "Site Settings",
    href: (id) => `/projects/${id}/settings/general`,
    icon: Settings,
    matchPath: "settings",
  },
];
