"use client";

import { use } from "react";
import dynamic from "next/dynamic";

const RankTrackingClient = dynamic(() => import("./rank-tracking-client"), {
  ssr: false,
});

export default function RankTrackingPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = use(params);
  return <RankTrackingClient projectId={projectId} />;
}
