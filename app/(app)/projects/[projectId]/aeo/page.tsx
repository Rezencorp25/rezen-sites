"use client";

import { use } from "react";
import dynamic from "next/dynamic";

const AeoPageClient = dynamic(() => import("./aeo-client"), { ssr: false });

export default function AeoPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = use(params);
  return <AeoPageClient projectId={projectId} />;
}
