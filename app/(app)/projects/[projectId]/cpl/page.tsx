"use client";

import { use } from "react";
import dynamic from "next/dynamic";

const CplClient = dynamic(() => import("./cpl-client"), {
  ssr: false,
});

export default function CplPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = use(params);
  return <CplClient projectId={projectId} />;
}
