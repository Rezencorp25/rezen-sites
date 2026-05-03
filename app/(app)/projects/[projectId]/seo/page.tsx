"use client";

import { use } from "react";
import dynamic from "next/dynamic";

const SeoPageClient = dynamic(() => import("./seo-client"), { ssr: false });

export default function SeoPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = use(params);
  return <SeoPageClient projectId={projectId} />;
}
