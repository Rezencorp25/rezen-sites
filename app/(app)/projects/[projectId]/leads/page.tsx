"use client";

import { use } from "react";
import dynamic from "next/dynamic";

/**
 * Client wrapper. La kanban è caricata client-only (ssr:false) per evitare
 * hydration mismatch sui mock leads — i timestamps dei seed sono calcolati
 * con `Date.now()` a module-load, quindi server e client vedrebbero valori
 * diversi. Quando la persistenza passerà a Firestore reale (DOC 3) si potrà
 * tornare a SSR standard.
 */
const LeadsPageClient = dynamic(() => import("./leads-client"), { ssr: false });

export default function LeadsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = use(params);
  return <LeadsPageClient projectId={projectId} />;
}
