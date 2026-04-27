"use client";

import { use } from "react";
import { PuckEditor } from "@/components/editor/puck-editor";

export default function PageEditorPage({
  params,
}: {
  params: Promise<{ projectId: string; pageId: string }>;
}) {
  const { projectId, pageId } = use(params);
  return <PuckEditor projectId={projectId} pageId={pageId} />;
}
