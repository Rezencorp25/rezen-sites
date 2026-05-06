"use client";

import { use } from "react";
import dynamic from "next/dynamic";

const AdsClient = dynamic(() => import("./ads-client"), {
  ssr: false,
});

export default function AdsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = use(params);
  return <AdsClient projectId={projectId} />;
}
