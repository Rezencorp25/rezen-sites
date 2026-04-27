"use client";

import { use } from "react";
import { SeoEditor } from "@/components/seo/seo-editor";

export default function SeoEditorPage({
  params,
}: {
  params: Promise<{ projectId: string; pageId: string }>;
}) {
  const { projectId, pageId } = use(params);
  return <SeoEditor projectId={projectId} pageId={pageId} />;
}
