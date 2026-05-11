import { NextResponse } from "next/server";
import { pingGithubApp } from "@/lib/github/app-client";

/**
 * GET /api/github/ping
 *
 * Diagnostic: verifies the GitHub App credentials are configured and the
 * installation can talk to the API. Returns { ok, appName, installationLogin }.
 * Use after deploying to confirm Firebase Secrets are bound correctly.
 */

export const runtime = "nodejs";

export async function GET() {
  const result = await pingGithubApp();
  return NextResponse.json(result, { status: result.ok ? 200 : 500 });
}
