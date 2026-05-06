"use client";

import dynamic from "next/dynamic";

const WorkspaceIntegrationsClient = dynamic(
  () => import("./integrations-client"),
  { ssr: false },
);

export default function WorkspaceIntegrationsPage() {
  return <WorkspaceIntegrationsClient />;
}
