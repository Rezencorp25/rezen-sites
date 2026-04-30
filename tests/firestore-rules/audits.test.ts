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
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import {
  authedContext,
  clearData,
  getEnv,
  teardown,
  unauthenticatedContext,
} from "./setup";

describe("Firestore rules: audit immutability", () => {
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

  describe("projects/{id}/leads/{leadId}/_audit/{eventId}", () => {
    const PATH = `projects/${PROJECT}/leads/lead-1/_audit/evt-1`;
    const VALID = {
      action: "lead.created",
      description: "test",
      createdAt: serverTimestamp(),
    };

    it("deny anonymous read", async () => {
      const anon = unauthenticatedContext();
      await assertFails(getDoc(doc(anon.firestore(), PATH)));
    });

    it("allow authenticated user read", async () => {
      const user = authedContext("u-alice", "user");
      await assertSucceeds(getDoc(doc(user.firestore(), PATH)));
    });

    it("deny create from any client (admin or user)", async () => {
      const admin = authedContext("u-admin", "admin");
      const user = authedContext("u-alice", "user");
      await assertFails(setDoc(doc(user.firestore(), PATH), VALID));
      await assertFails(setDoc(doc(admin.firestore(), PATH), VALID));
    });

    it("deny update", async () => {
      const admin = authedContext("u-admin", "admin");
      // anche se il documento non esiste, le rules valutano l'azione
      await assertFails(
        updateDoc(doc(admin.firestore(), PATH), { description: "tampered" }),
      );
    });

    it("deny delete", async () => {
      const admin = authedContext("u-admin", "admin");
      await assertFails(deleteDoc(doc(admin.firestore(), PATH)));
    });
  });

  describe("projects/{id}/audits/{auditId} (Site Audit storico)", () => {
    const PATH = `projects/${PROJECT}/audits/audit-1`;

    it("allow authenticated read", async () => {
      const user = authedContext("u-alice", "user");
      await assertSucceeds(getDoc(doc(user.firestore(), PATH)));
    });

    it("deny create / update / delete from client", async () => {
      const admin = authedContext("u-admin", "admin");
      await assertFails(
        setDoc(doc(admin.firestore(), PATH), { score: 92 }),
      );
      await assertFails(
        updateDoc(doc(admin.firestore(), PATH), { score: 100 }),
      );
      await assertFails(deleteDoc(doc(admin.firestore(), PATH)));
    });
  });

  describe("internal collections (cache / logs / rate limits)", () => {
    it("_seo_cache: read OK auth, write deny", async () => {
      const user = authedContext("u-alice", "user");
      await assertSucceeds(
        getDoc(doc(user.firestore(), "_seo_cache/key-1")),
      );
      await assertFails(
        setDoc(doc(user.firestore(), "_seo_cache/key-1"), { v: 1 }),
      );
    });

    it("_ai_logs: read OK admin, deny user", async () => {
      const admin = authedContext("u-admin", "admin");
      const user = authedContext("u-alice", "user");
      await assertSucceeds(
        getDoc(doc(admin.firestore(), "_ai_logs/log-1")),
      );
      await assertFails(getDoc(doc(user.firestore(), "_ai_logs/log-1")));
    });

    it("_rate_limits: read+write deny per qualsiasi client", async () => {
      const admin = authedContext("u-admin", "admin");
      await assertFails(
        getDoc(doc(admin.firestore(), "_rate_limits/key-1")),
      );
      await assertFails(
        setDoc(doc(admin.firestore(), "_rate_limits/key-1"), { ts: [] }),
      );
    });
  });
});
