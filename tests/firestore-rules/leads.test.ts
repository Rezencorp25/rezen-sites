import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import {
  assertFails,
  assertSucceeds,
} from "@firebase/rules-unit-testing";
import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import {
  authedContext,
  clearData,
  getEnv,
  teardown,
  unauthenticatedContext,
} from "./setup";

describe("Firestore rules: projects/{id}/leads/{leadId}", () => {
  beforeAll(async () => {
    await getEnv();
  });

  afterAll(async () => {
    await teardown();
  });

  beforeEach(async () => {
    await clearData();
  });

  const PROJECT = "demo-project";
  const LEAD = "lead-1";
  const VALID_LEAD = {
    status: "new",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  it("deny anonymous read", async () => {
    const anon = unauthenticatedContext();
    await assertFails(
      getDoc(doc(anon.firestore(), `projects/${PROJECT}/leads/${LEAD}`)),
    );
  });

  it("allow authenticated user read", async () => {
    const user = authedContext("u-alice", "user");
    await assertSucceeds(
      getDoc(doc(user.firestore(), `projects/${PROJECT}/leads/${LEAD}`)),
    );
  });

  it("allow authenticated user create with required fields", async () => {
    const user = authedContext("u-alice", "user");
    await assertSucceeds(
      setDoc(
        doc(user.firestore(), `projects/${PROJECT}/leads/${LEAD}`),
        VALID_LEAD,
      ),
    );
  });

  it("deny create when required fields missing", async () => {
    const user = authedContext("u-alice", "user");
    await assertFails(
      setDoc(doc(user.firestore(), `projects/${PROJECT}/leads/${LEAD}`), {
        notes: "no required fields",
      }),
    );
  });

  it("deny non-admin delete", async () => {
    const user = authedContext("u-alice", "user");
    // pre-create con admin
    const admin = authedContext("u-admin", "admin");
    await setDoc(
      doc(admin.firestore(), `projects/${PROJECT}/leads/${LEAD}`),
      VALID_LEAD,
    );
    await assertFails(
      deleteDoc(doc(user.firestore(), `projects/${PROJECT}/leads/${LEAD}`)),
    );
  });

  it("allow admin delete", async () => {
    const admin = authedContext("u-admin", "admin");
    await setDoc(
      doc(admin.firestore(), `projects/${PROJECT}/leads/${LEAD}`),
      VALID_LEAD,
    );
    await assertSucceeds(
      deleteDoc(doc(admin.firestore(), `projects/${PROJECT}/leads/${LEAD}`)),
    );
  });
});
