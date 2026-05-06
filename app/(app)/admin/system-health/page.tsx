"use client";

import dynamic from "next/dynamic";

const SystemHealthClient = dynamic(() => import("./system-health-client"), {
  ssr: false,
});

export default function SystemHealthPage() {
  return <SystemHealthClient />;
}
