/**
 * Seed Firebase emulator with mock data.
 *
 * Prerequisites:
 *   1. Start emulators: `npm run emulators`
 *   2. Run this: `npm run seed`
 *
 * Idempotent: wipes target collections before re-seeding.
 */

// Tell firebase-admin to target local emulators.
process.env.FIRESTORE_EMULATOR_HOST ??= "127.0.0.1:8080";
process.env.FIREBASE_AUTH_EMULATOR_HOST ??= "127.0.0.1:9099";
process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR = "true";

import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { MOCK_PROJECTS } from "../lib/mocks/projects";
import { ALL_PAGES } from "../lib/mocks/pages";
import {
  MOCK_COLLECTIONS,
  MOCK_CMS_ITEMS,
} from "../lib/mocks/cms";
import { generateFormSubmissions } from "../lib/mocks/forms";
import { MOCK_ALERTS } from "../lib/mocks/alerts";
import { MOCK_REDIRECTS, MOCK_VERSIONS } from "../lib/mocks/misc";
import {
  generateDailyAdSense,
  generateGoogleAds,
} from "../lib/mocks/analytics";

const PROJECT_ID = "rezen-sites-dev";
const DEMO_EMAIL =
  process.env.REZEN_DEMO_USER_EMAIL ?? "demo@rezen.dev";
const DEMO_PASSWORD =
  process.env.REZEN_DEMO_USER_PASSWORD ?? "rezen2026";

if (!getApps().length) {
  initializeApp({ projectId: PROJECT_ID });
}

const db = getFirestore();
const auth = getAuth();

async function wipe() {
  console.log("Wiping existing collections...");
  const projectsSnap = await db.collection("projects").get();
  for (const p of projectsSnap.docs) {
    const subcollections = [
      "pages",
      "cms_collections",
      "cms_items",
      "forms",
      "redirects",
      "versions",
      "alerts",
      "adsense",
      "google_ads",
    ];
    for (const sub of subcollections) {
      const snap = await p.ref.collection(sub).get();
      for (const d of snap.docs) {
        await d.ref.delete();
      }
    }
    await p.ref.delete();
  }
  console.log("  Wiped projects.");
}

async function seedAuth() {
  console.log(`Seeding demo user: ${DEMO_EMAIL}`);
  try {
    await auth.getUserByEmail(DEMO_EMAIL);
    console.log("  User already exists.");
  } catch {
    await auth.createUser({
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
      displayName: "REZEN Demo Admin",
      emailVerified: true,
    });
    console.log("  User created.");
  }
}

async function seedProjects() {
  console.log(`Seeding ${MOCK_PROJECTS.length} projects...`);
  for (const project of MOCK_PROJECTS) {
    await db.collection("projects").doc(project.id).set({
      ...project,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    });
  }
}

async function seedPages() {
  console.log(`Seeding ${ALL_PAGES.length} pages...`);
  for (const page of ALL_PAGES) {
    await db
      .collection("projects")
      .doc(page.projectId)
      .collection("pages")
      .doc(page.id)
      .set(page);
  }
}

async function seedCMS() {
  console.log(
    `Seeding ${MOCK_COLLECTIONS.length} collections + ${MOCK_CMS_ITEMS.length} items...`,
  );
  for (const col of MOCK_COLLECTIONS) {
    await db
      .collection("projects")
      .doc(col.projectId)
      .collection("cms_collections")
      .doc(col.id)
      .set(col);
  }
  for (const item of MOCK_CMS_ITEMS) {
    await db
      .collection("projects")
      .doc(item.projectId)
      .collection("cms_items")
      .doc(item.id)
      .set(item);
  }
}

async function seedForms() {
  const vflow = generateFormSubmissions("verumflow-ch", 48);
  const carfi = generateFormSubmissions("impresa-edile-carfi", 12);
  const all = [...vflow, ...carfi];
  console.log(`Seeding ${all.length} form submissions...`);
  for (const s of all) {
    await db
      .collection("projects")
      .doc(s.projectId)
      .collection("forms")
      .doc(s.id)
      .set(s);
  }
}

async function seedAlerts() {
  console.log(`Seeding ${MOCK_ALERTS.length} alerts...`);
  for (const a of MOCK_ALERTS) {
    await db
      .collection("projects")
      .doc(a.projectId)
      .collection("alerts")
      .doc(a.id)
      .set(a);
  }
}

async function seedRedirectsAndVersions() {
  console.log("Seeding redirects + versions...");
  for (const r of MOCK_REDIRECTS) {
    await db
      .collection("projects")
      .doc(r.projectId)
      .collection("redirects")
      .doc(r.id)
      .set(r);
  }
  for (const v of MOCK_VERSIONS) {
    await db
      .collection("projects")
      .doc(v.projectId)
      .collection("versions")
      .doc(v.id)
      .set(v);
  }
}

async function seedAnalytics() {
  console.log("Seeding AdSense + Google Ads (30d)...");
  const adsense = generateDailyAdSense("verumflow-ch", 30);
  for (const row of adsense) {
    await db
      .collection("projects")
      .doc(row.projectId)
      .collection("adsense")
      .doc(row.id)
      .set(row);
  }
  const ads = generateGoogleAds("verumflow-ch", 30);
  for (const row of ads) {
    await db
      .collection("projects")
      .doc(row.projectId)
      .collection("google_ads")
      .doc(row.id)
      .set(row);
  }
  console.log(`  AdSense rows: ${adsense.length}, Google Ads rows: ${ads.length}`);
}

async function main() {
  console.log("\n🌱 REZEN Sites — Seeding Firebase emulator\n");
  await wipe();
  await seedAuth();
  await seedProjects();
  await seedPages();
  await seedCMS();
  await seedForms();
  await seedAlerts();
  await seedRedirectsAndVersions();
  await seedAnalytics();
  console.log("\n✅ Seed completed.\n");
  console.log(`Demo user: ${DEMO_EMAIL}`);
  console.log(`Password:  ${DEMO_PASSWORD}`);
  console.log("\nEmulator UI: http://127.0.0.1:4000");
  // prevent hang
  void FieldValue; // unused-import silencer
  process.exit(0);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
