"use client";

import { useEffect, useState } from "react";
import {
  Activity,
  AlertTriangle,
  BadgeDollarSign,
  Bot,
  CheckCircle2,
  Database,
  Globe,
  KeyRound,
  Loader2,
  Search,
  Sparkles,
  XCircle,
} from "lucide-react";
import {
  collection,
  collectionGroup,
  getCountFromServer,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { getFirebase } from "@/lib/firebase/client";
import {
  DEFAULT_WORKSPACE_ID,
  INTEGRATION_PROVIDERS,
  INTEGRATION_PROVIDER_ORDER,
  type IntegrationProviderId,
} from "@/lib/integrations/providers";
import type { IntegrationStatus } from "@/types";
import { cn } from "@/lib/utils";

type CfStatus = {
  label: string;
  icon: typeof Activity;
  cadence: string;
  /** Firestore collectionGroup name to inspect last write */
  collectionGroup: string;
  /** Field for ordering */
  orderField: string;
};

const CF_STATUS_DEFS: CfStatus[] = [
  {
    label: "runRankAndAeoTracking",
    icon: Search,
    cadence: "Daily 03:00 Europe/Rome",
    collectionGroup: "rank_snapshots",
    orderField: "createdAt",
  },
  {
    label: "runGeoTracking",
    icon: Sparkles,
    cadence: "Lun 04:00 Europe/Rome",
    collectionGroup: "geo_snapshots",
    orderField: "createdAt",
  },
  {
    label: "runAiSearchHealth",
    icon: Bot,
    cadence: "Lun 05:00 Europe/Rome",
    collectionGroup: "ai_search_health",
    orderField: "checkedAt",
  },
  {
    label: "runMetaAdsSync",
    icon: BadgeDollarSign,
    cadence: "Daily 06:00 Europe/Rome",
    collectionGroup: "meta_snapshots",
    orderField: "createdAt",
  },
];

type CfRow = {
  def: CfStatus;
  lastRun: Date | null;
  count24h: number;
  loading: boolean;
};

type IntegrationDoc = {
  status: IntegrationStatus;
  last4: string;
  verifiedAt?: { toDate(): Date } | null;
  lastError?: string;
};

type CostDoc = {
  projectId: string;
  totalUsd: number;
  totalCalls: number;
  byLlm?: Record<string, number>;
};

export default function SystemHealthClient() {
  const [cfRows, setCfRows] = useState<CfRow[]>(
    CF_STATUS_DEFS.map((def) => ({
      def,
      lastRun: null,
      count24h: 0,
      loading: true,
    })),
  );
  const [integrations, setIntegrations] = useState<
    Partial<Record<IntegrationProviderId, IntegrationDoc>>
  >({});
  const [costs, setCosts] = useState<CostDoc[]>([]);
  const [costsLoading, setCostsLoading] = useState(true);
  const [counts, setCounts] = useState<{
    projects: number;
    leadsTotal: number;
    alertsOpen: number;
    tasksOpen: number;
  } | null>(null);

  // Fetch CF stats (one-shot at mount)
  useEffect(() => {
    const { db } = getFirebase();
    const oneDayAgo = new Date(Date.now() - 86_400_000);

    Promise.all(
      CF_STATUS_DEFS.map(async (def) => {
        try {
          // Last write
          const qLatest = query(
            collectionGroup(db, def.collectionGroup),
            orderBy(def.orderField, "desc"),
            limit(1),
          );
          const latestSnap = await getDocs(qLatest);
          const lastDoc = latestSnap.docs[0];
          const lastRunRaw = lastDoc?.get(def.orderField) as
            | { toDate(): Date }
            | undefined;
          const lastRun = lastRunRaw?.toDate?.() ?? null;

          // Count last 24h via aggregation
          let count24h = 0;
          try {
            const qCount = query(
              collectionGroup(db, def.collectionGroup),
              where(def.orderField, ">=", oneDayAgo),
            );
            const countAgg = await getCountFromServer(qCount);
            count24h = countAgg.data().count;
          } catch {
            // index missing or other → leave 0
          }

          return { def, lastRun, count24h, loading: false };
        } catch {
          return { def, lastRun: null, count24h: 0, loading: false };
        }
      }),
    ).then(setCfRows);
  }, []);

  // Real-time listener integrations workspace
  useEffect(() => {
    const { db } = getFirebase();
    const ref = collection(
      db,
      `workspaces/${DEFAULT_WORKSPACE_ID}/integrations`,
    );
    const unsub = onSnapshot(ref, (snap) => {
      const map: Partial<Record<IntegrationProviderId, IntegrationDoc>> = {};
      snap.forEach((d) => {
        map[d.id as IntegrationProviderId] = d.data() as IntegrationDoc;
      });
      setIntegrations(map);
    });
    return () => unsub();
  }, []);

  // Costs MTD
  useEffect(() => {
    const { db } = getFirebase();
    const period = new Date();
    const periodKey = `${period.getUTCFullYear()}${String(
      period.getUTCMonth() + 1,
    ).padStart(2, "0")}`;
    const qCosts = query(
      collection(db, "_run_costs"),
      where("period", "==", periodKey),
    );
    getDocs(qCosts)
      .then((snap) => {
        const list: CostDoc[] = [];
        snap.forEach((d) => {
          const data = d.data() as CostDoc;
          list.push(data);
        });
        list.sort((a, b) => b.totalUsd - a.totalUsd);
        setCosts(list);
        setCostsLoading(false);
      })
      .catch(() => setCostsLoading(false));
  }, []);

  // Platform counters
  useEffect(() => {
    const { db } = getFirebase();
    Promise.all([
      getCountFromServer(collection(db, "projects")),
      // Leads + alerts + tasks: collectionGroup
      getCountFromServer(collectionGroup(db, "leads")).catch(() => null),
      getCountFromServer(collectionGroup(db, "alerts")).catch(() => null),
      getCountFromServer(collectionGroup(db, "tasks")).catch(() => null),
    ])
      .then(([projects, leads, alerts, tasks]) =>
        setCounts({
          projects: projects.data().count,
          leadsTotal: leads?.data().count ?? 0,
          alertsOpen: alerts?.data().count ?? 0,
          tasksOpen: tasks?.data().count ?? 0,
        }),
      )
      .catch(() => setCounts(null));
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-10 py-10">
      <header className="mb-6">
        <div className="flex items-center gap-2 text-label-md uppercase tracking-widest text-text-muted">
          <Activity className="h-3.5 w-3.5" />
          System health
        </div>
        <h1 className="text-headline-md font-bold text-on-surface">
          System health & observability
        </h1>
        <p className="text-body-md text-secondary-text">
          Stato Cloud Functions schedulate, integrazioni attive, costi MTD,
          counters platform-wide.
        </p>
      </header>

      <section className="mb-6">
        <h2 className="mb-3 flex items-center gap-2 text-title-md font-semibold text-on-surface">
          <Database className="h-4 w-4 text-molten-primary" />
          Cloud Functions schedulate
        </h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {cfRows.map((row) => (
            <CfCard key={row.def.label} row={row} />
          ))}
        </div>
      </section>

      <section className="mb-6">
        <h2 className="mb-3 flex items-center gap-2 text-title-md font-semibold text-on-surface">
          <KeyRound className="h-4 w-4 text-molten-primary" />
          Integrazioni workspace (default)
        </h2>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-6">
          {INTEGRATION_PROVIDER_ORDER.map((id) => {
            const def = INTEGRATION_PROVIDERS[id];
            const doc = integrations[id];
            const status: IntegrationStatus | "missing" =
              doc?.status ?? "missing";
            return (
              <div
                key={id}
                className={cn(
                  "flex flex-col gap-1 rounded-lg border p-3",
                  status === "active"
                    ? "border-emerald-400/30 bg-emerald-400/5"
                    : status === "error"
                      ? "border-rose-400/30 bg-rose-400/5"
                      : "border-zinc-400/20 bg-zinc-400/5",
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-label-md font-medium text-on-surface">
                    {def.label}
                  </span>
                  {status === "active" ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />
                  ) : status === "error" ? (
                    <XCircle className="h-3.5 w-3.5 text-rose-300" />
                  ) : (
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-300" />
                  )}
                </div>
                {doc?.last4 ? (
                  <span className="font-mono text-label-sm text-text-muted">
                    ****{doc.last4}
                  </span>
                ) : (
                  <span className="text-label-sm text-text-muted">
                    Non configurata
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section className="mb-6">
        <h2 className="mb-3 flex items-center gap-2 text-title-md font-semibold text-on-surface">
          <BadgeDollarSign className="h-4 w-4 text-molten-primary" />
          Costi LLM month-to-date
        </h2>
        {costsLoading ? (
          <p className="text-body-sm text-text-muted">
            <Loader2 className="mr-1 inline h-3 w-3 animate-spin" />
            Caricamento...
          </p>
        ) : costs.length === 0 ? (
          <p className="text-body-sm text-text-muted">
            Nessun costo registrato questo mese (LLM live mode non ancora
            attivo o nessun cliente con chiavi).
          </p>
        ) : (
          <div className="rounded-xl bg-surface-container-high p-4">
            <table className="w-full text-body-sm">
              <thead>
                <tr className="border-b border-surface-container-low text-label-sm uppercase tracking-wider text-text-muted">
                  <th className="px-2 py-2 text-left">Project</th>
                  <th className="px-2 py-2 text-right">Calls</th>
                  <th className="px-2 py-2 text-right">Anthropic $</th>
                  <th className="px-2 py-2 text-right">OpenAI $</th>
                  <th className="px-2 py-2 text-right">Gemini $</th>
                  <th className="px-2 py-2 text-right">Total $</th>
                </tr>
              </thead>
              <tbody>
                {costs.map((c) => (
                  <tr
                    key={c.projectId}
                    className="border-b border-surface-container-low/40"
                  >
                    <td className="px-2 py-2 font-mono text-on-surface">
                      {c.projectId}
                    </td>
                    <td className="px-2 py-2 text-right font-mono tabular-nums text-text-muted">
                      {c.totalCalls}
                    </td>
                    <td className="px-2 py-2 text-right font-mono tabular-nums text-text-muted">
                      {(c.byLlm?.anthropic ?? 0).toFixed(3)}
                    </td>
                    <td className="px-2 py-2 text-right font-mono tabular-nums text-text-muted">
                      {(c.byLlm?.openai ?? 0).toFixed(3)}
                    </td>
                    <td className="px-2 py-2 text-right font-mono tabular-nums text-text-muted">
                      {(c.byLlm?.gemini ?? 0).toFixed(3)}
                    </td>
                    <td className="px-2 py-2 text-right font-mono tabular-nums text-on-surface">
                      ${c.totalUsd.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 flex items-center gap-2 text-title-md font-semibold text-on-surface">
          <Globe className="h-4 w-4 text-molten-primary" />
          Platform counters
        </h2>
        {counts === null ? (
          <p className="text-body-sm text-text-muted">
            <Loader2 className="mr-1 inline h-3 w-3 animate-spin" />
            Caricamento...
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <CounterTile label="Progetti" value={counts.projects} />
            <CounterTile label="Lead totali" value={counts.leadsTotal} />
            <CounterTile label="Alert aperti" value={counts.alertsOpen} />
            <CounterTile label="Tasks open" value={counts.tasksOpen} />
          </div>
        )}
      </section>
    </div>
  );
}

function CfCard({ row }: { row: CfRow }) {
  const Icon = row.def.icon;
  const ageHours = row.lastRun
    ? Math.round((Date.now() - row.lastRun.getTime()) / 3_600_000)
    : null;
  const isStale = ageHours !== null && ageHours > 168;

  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-xl bg-surface-container-high p-4",
        isStale && "border border-amber-400/30",
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-molten-primary" />
          <span className="font-mono text-label-md text-on-surface">
            {row.def.label}
          </span>
        </div>
        {row.loading ? (
          <Loader2 className="h-3 w-3 animate-spin text-text-muted" />
        ) : row.lastRun ? (
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />
        ) : (
          <AlertTriangle className="h-3.5 w-3.5 text-amber-300" />
        )}
      </div>
      <p className="text-label-sm text-text-muted">{row.def.cadence}</p>
      <div className="flex items-center justify-between">
        <span className="text-label-sm text-text-muted">
          Ultimo snapshot:{" "}
          <span className="text-on-surface">
            {row.lastRun
              ? `${row.lastRun.toLocaleString("it-IT")} (${ageHours}h fa)`
              : "—"}
          </span>
        </span>
        <span className="font-mono text-label-sm text-text-muted">
          24h: {row.count24h}
        </span>
      </div>
    </div>
  );
}

function CounterTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-surface-container-high p-4">
      <div className="text-label-sm uppercase tracking-wider text-text-muted">
        {label}
      </div>
      <div className="font-mono text-headline-sm font-bold tabular-nums text-on-surface">
        {value.toLocaleString("it-IT")}
      </div>
    </div>
  );
}
