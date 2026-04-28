"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type SsoProvider = "none" | "google" | "azure" | "okta" | "saml-generic";

export type WorkspaceConfig = {
  /** Workspace display name */
  name: string;
  /** White-label primary brand */
  brandName: string;
  /** Logo URL (used in app shell + client portals) */
  logoUrl: string;
  /** Hide REZEN branding from app shell + emails */
  hideRezenBranding: boolean;
  /** Custom primary color hex */
  primaryColor: string;
  /** Custom font family */
  fontFamily: string;
  /** Email "from" override */
  emailFromName: string;
  emailFromAddress: string;

  /** SSO config */
  sso: {
    provider: SsoProvider;
    /** Domain allowlist — emails outside this list refused */
    allowedDomains: string[];
    /** SAML metadata URL (when provider=saml-generic) */
    samlMetadataUrl: string;
    /** Just-in-time provisioning */
    jitProvisioning: boolean;
    /** Force SSO (disable email+password) */
    enforceSso: boolean;
  };

  /** Cost allocation per project */
  billing: {
    /** Hourly rate REZEN charges per editor hour */
    hourlyRate: number;
    /** Markup % on AI / hosting / API costs */
    costMarkup: number;
    currency: "CHF" | "EUR" | "USD";
  };
};

const DEFAULT: WorkspaceConfig = {
  name: "REZEN Workspace",
  brandName: "REZEN Sites",
  logoUrl: "",
  hideRezenBranding: false,
  primaryColor: "#ff6200",
  fontFamily: "Inter",
  emailFromName: "REZEN Sites",
  emailFromAddress: "no-reply@rezencorp.com",
  sso: {
    provider: "none",
    allowedDomains: ["rezencorp.com"],
    samlMetadataUrl: "",
    jitProvisioning: true,
    enforceSso: false,
  },
  billing: {
    hourlyRate: 120,
    costMarkup: 25,
    currency: "CHF",
  },
};

type State = { config: WorkspaceConfig };
type Actions = {
  update: (patch: Partial<WorkspaceConfig>) => void;
  updateSso: (patch: Partial<WorkspaceConfig["sso"]>) => void;
  updateBilling: (patch: Partial<WorkspaceConfig["billing"]>) => void;
  reset: () => void;
};

export const useWorkspaceStore = create<State & Actions>()(
  persist(
    (set) => ({
      config: DEFAULT,
      update: (patch) =>
        set((s) => ({ config: { ...s.config, ...patch } })),
      updateSso: (patch) =>
        set((s) => ({
          config: { ...s.config, sso: { ...s.config.sso, ...patch } },
        })),
      updateBilling: (patch) =>
        set((s) => ({
          config: { ...s.config, billing: { ...s.config.billing, ...patch } },
        })),
      reset: () => set({ config: DEFAULT }),
    }),
    {
      name: "rezen-workspace-store",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
