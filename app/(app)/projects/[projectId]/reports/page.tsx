"use client";

import { use } from "react";
import dynamic from "next/dynamic";

const ReportsClient = dynamic(() => import("./reports-client"), {
  ssr: false,
});

export default function ReportsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = use(params);
  return <ReportsClient projectId={projectId} />;
}
