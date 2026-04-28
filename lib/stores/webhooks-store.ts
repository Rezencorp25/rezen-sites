"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { NOW_ANCHOR } from "@/lib/mocks/now-anchor";

export type WebhookEvent =
  | "form.submission"
  | "page.publish"
  | "page.unpublish"
  | "version.deploy"
  | "alert.created"
  | "campaign.created"
  | "schedule.released";

export type Webhook = {
  id: string;
  projectId: string;
  /** Human-readable label */
  name: string;
  /** Target URL */
  url: string;
  /** Events to subscribe */
  events: WebhookEvent[];
  /** Optional secret for HMAC signing */
  secret: string;
  active: boolean;
  createdAt: string;
};

export type WebhookDelivery = {
  id: string;
  webhookId: string;
  event: WebhookEvent;
  status: "success" | "failed" | "pending";
  /** HTTP status code from target */
  responseCode?: number;
  /** Latency ms */
  durationMs?: number;
  /** ISO timestamp */
  at: string;
  /** Error message if failed */
  error?: string;
};

const SEED_WEBHOOKS: Webhook[] = [
  {
    id: "wh-1",
    projectId: "verumflow-ch",
    name: "Slack #leads",
    url: "https://hooks.slack.com/services/T00000/B00000/XXXXXX",
    events: ["form.submission", "alert.created"],
    secret: "",
    active: true,
    createdAt: new Date(NOW_ANCHOR - 14 * 86400000).toISOString(),
  },
  {
    id: "wh-2",
    projectId: "verumflow-ch",
    name: "Zapier — CRM HubSpot",
    url: "https://hooks.zapier.com/hooks/catch/12345/xxxxx",
    events: ["form.submission"],
    secret: "rzn_secret_demo",
    active: true,
    createdAt: new Date(NOW_ANCHOR - 7 * 86400000).toISOString(),
  },
];

const SEED_DELIVERIES: WebhookDelivery[] = [
  {
    id: "del-1",
    webhookId: "wh-1",
    event: "form.submission",
    status: "success",
    responseCode: 200,
    durationMs: 142,
    at: new Date(NOW_ANCHOR - 2 * 3600000).toISOString(),
  },
  {
    id: "del-2",
    webhookId: "wh-2",
    event: "form.submission",
    status: "success",
    responseCode: 200,
    durationMs: 287,
    at: new Date(NOW_ANCHOR - 4 * 3600000).toISOString(),
  },
  {
    id: "del-3",
    webhookId: "wh-1",
    event: "alert.created",
    status: "failed",
    responseCode: 500,
    durationMs: 1023,
    at: new Date(NOW_ANCHOR - 24 * 3600000).toISOString(),
    error: "Slack API timeout",
  },
];

type State = {
  webhooks: Webhook[];
  deliveries: WebhookDelivery[];
};

type Actions = {
  add: (
    w: Omit<Webhook, "id" | "createdAt"> & { id?: string },
  ) => string;
  update: (id: string, patch: Partial<Webhook>) => void;
  remove: (id: string) => void;
  toggle: (id: string) => void;
  /** Simulate firing a delivery (mock) */
  testFire: (id: string) => void;
  resetSeed: () => void;
};

export const useWebhooksStore = create<State & Actions>()(
  persist(
    (set) => ({
      webhooks: SEED_WEBHOOKS,
      deliveries: SEED_DELIVERIES,
      add: (w) => {
        const id = w.id ?? `wh-${Date.now()}`;
        set((s) => ({
          webhooks: [
            ...s.webhooks,
            { ...w, id, createdAt: new Date().toISOString() },
          ],
        }));
        return id;
      },
      update: (id, patch) =>
        set((s) => ({
          webhooks: s.webhooks.map((w) => (w.id === id ? { ...w, ...patch } : w)),
        })),
      remove: (id) =>
        set((s) => ({
          webhooks: s.webhooks.filter((w) => w.id !== id),
          deliveries: s.deliveries.filter((d) => d.webhookId !== id),
        })),
      toggle: (id) =>
        set((s) => ({
          webhooks: s.webhooks.map((w) =>
            w.id === id ? { ...w, active: !w.active } : w,
          ),
        })),
      testFire: (id) =>
        set((s) => ({
          deliveries: [
            {
              id: `del-${Date.now()}`,
              webhookId: id,
              event: "form.submission" as WebhookEvent,
              status: "success" as const,
              responseCode: 200,
              durationMs: 156,
              at: new Date().toISOString(),
            },
            ...s.deliveries,
          ].slice(0, 100),
        })),
      resetSeed: () =>
        set({ webhooks: SEED_WEBHOOKS, deliveries: SEED_DELIVERIES }),
    }),
    {
      name: "rezen-webhooks-store",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

export const EVENT_META: Record<WebhookEvent, string> = {
  "form.submission": "Form ricevuto",
  "page.publish": "Pagina pubblicata",
  "page.unpublish": "Pagina depubblicata",
  "version.deploy": "Versione deployata",
  "alert.created": "Alert creato",
  "campaign.created": "Campagna creata",
  "schedule.released": "Schedule rilasciato",
};
