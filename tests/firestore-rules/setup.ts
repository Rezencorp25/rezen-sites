import {
  initializeTestEnvironment,
  type RulesTestEnvironment,
  type RulesTestContext,
} from "@firebase/rules-unit-testing";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const PROJECT_ID = "rezen-sites-rules-test";
const FIRESTORE_EMULATOR_HOST =
  process.env.FIRESTORE_EMULATOR_HOST ?? "127.0.0.1:8080";

let env: RulesTestEnvironment | null = null;

export async function getEnv(): Promise<RulesTestEnvironment> {
  if (env) return env;
  const rules = readFileSync(
    resolve(__dirname, "../../firestore.rules"),
    "utf-8",
  );
  const [host, port] = FIRESTORE_EMULATOR_HOST.split(":");
  env = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules,
      host,
      port: Number(port),
    },
  });
  return env;
}

export async function teardown(): Promise<void> {
  if (env) {
    await env.cleanup();
    env = null;
  }
}

export async function clearData(): Promise<void> {
  const e = await getEnv();
  await e.clearFirestore();
}

export type Role = "admin" | "user" | null;

export function authedContext(uid: string, role: Role): RulesTestContext {
  if (!env) throw new Error("env not initialized");
  return env.authenticatedContext(uid, role ? { role } : undefined);
}

export function unauthenticatedContext(): RulesTestContext {
  if (!env) throw new Error("env not initialized");
  return env.unauthenticatedContext();
}

export function adminSdkContext(): RulesTestContext {
  if (!env) throw new Error("env not initialized");
  // withSecurityRulesDisabled simula Admin SDK (bypass rules)
  return env.authenticatedContext("admin-sdk", { role: "admin" });
}
