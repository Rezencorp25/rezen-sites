"use client";

import { httpsCallable } from "firebase/functions";
import { getFirebase } from "@/lib/firebase/client";
import {
  computeLast4,
  INTEGRATION_PROVIDERS,
  type IntegrationProviderId,
} from "./providers";

type IntegrationScope = "workspace" | "project";

type SetResult = { ok: true; last4: string } | { ok: false; error: string };
type TestResult = { ok: true } | { ok: false; error: string };
type RevokeResult = { ok: true };

/**
 * Configura/aggiorna un'integrazione: invia i field a CF set-integration
 * che esegue test live + Secret Manager write + Firestore metadata.
 */
export async function setIntegrationCall(input: {
  provider: IntegrationProviderId;
  scope: IntegrationScope;
  scopeId: string;
  fields: Record<string, string>;
}): Promise<SetResult> {
  const { functions } = getFirebase();
  const def = INTEGRATION_PROVIDERS[input.provider];
  const last4 = computeLast4(def, input.fields);
  const fn = httpsCallable<typeof input & { last4: string }, SetResult>(
    functions,
    "setIntegration",
  );
  const res = await fn({ ...input, last4 });
  return res.data;
}

/**
 * Re-verify un'integrazione esistente (no rewrite secret).
 */
export async function testIntegrationCall(input: {
  provider: IntegrationProviderId;
  scope: IntegrationScope;
  scopeId: string;
}): Promise<TestResult> {
  const { functions } = getFirebase();
  const fn = httpsCallable<typeof input, TestResult>(
    functions,
    "testIntegration",
  );
  const res = await fn(input);
  return res.data;
}

/**
 * Revoca un'integrazione: disabilita Secret Manager + status revoked.
 */
export async function revokeIntegrationCall(input: {
  provider: IntegrationProviderId;
  scope: IntegrationScope;
  scopeId: string;
}): Promise<RevokeResult> {
  const { functions } = getFirebase();
  const fn = httpsCallable<typeof input, RevokeResult>(
    functions,
    "revokeIntegration",
  );
  const res = await fn(input);
  return res.data;
}
