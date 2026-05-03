"use client";

import { use } from "react";
import dynamic from "next/dynamic";

const GeoPageClient = dynamic(() => import("./geo-client"), { ssr: false });

export default function GeoPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = use(params);
  return <GeoPageClient projectId={projectId} />;
}
