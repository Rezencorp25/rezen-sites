"use client";

import { use } from "react";
import dynamic from "next/dynamic";

const OnboardingClient = dynamic(() => import("./onboarding-client"), {
  ssr: false,
});

export default function OnboardingPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = use(params);
  return <OnboardingClient projectId={projectId} />;
}
