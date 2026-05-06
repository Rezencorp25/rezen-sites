"use client";

import { use } from "react";
import dynamic from "next/dynamic";

const ProjectIntegrationsClient = dynamic(
  () => import("./integrations-client"),
  { ssr: false },
);

export default function ProjectIntegrationsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = use(params);
  return <ProjectIntegrationsClient projectId={projectId} />;
}
