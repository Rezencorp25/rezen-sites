"use client";

import { use } from "react";
import dynamic from "next/dynamic";

const AlertsClient = dynamic(() => import("./alerts-client"), {
  ssr: false,
});

export default function AlertsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = use(params);
  return <AlertsClient projectId={projectId} />;
}
