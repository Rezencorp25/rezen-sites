import { redirect } from "next/navigation";

export default async function SettingsRootPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  redirect(`/projects/${projectId}/settings/general`);
}
