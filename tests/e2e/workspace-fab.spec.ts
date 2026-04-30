import { test, expect } from "playwright/test";

/**
 * Sprint S1.5 acceptance:
 * - Workspace progetti SENZA sidebar laterale
 * - FAB azioni rapide visible bottom-right su /projects
 * - Click FAB → dropdown con azioni → click azione → modal "scegli progetto"
 * - Sidebar slide-in al click di un progetto (route change)
 *
 * Pre-condizione: server dev su http://localhost:3000.
 */

async function loginAndOpenWorkspace(page: import("playwright/test").Page) {
  await page.goto("/login");
  await page.getByRole("button", { name: /accedi|sign in|login/i }).click();
  await page.waitForURL(/\/projects$/);
}

test.describe("Workspace progetti — premium UX", () => {
  test("sidebar laterale non visibile sull'elenco progetti", async ({
    page,
  }) => {
    await loginAndOpenWorkspace(page);
    // l'aside dell'AppSidebar non dovrebbe essere renderizzato
    const sidebar = page.getByTestId("nav-global-progetti");
    await expect(sidebar).toHaveCount(0);
  });

  test("FAB azioni rapide visibile in basso a destra", async ({ page }) => {
    await loginAndOpenWorkspace(page);
    const fab = page.getByLabel("Azioni rapide");
    await expect(fab).toBeVisible();
  });

  test("click FAB apre dropdown con azioni", async ({ page }) => {
    await loginAndOpenWorkspace(page);
    await page.getByLabel("Azioni rapide").click();
    await expect(page.getByText("Genera pagina con AI")).toBeVisible();
    await expect(page.getByText("Lancia Site Audit")).toBeVisible();
  });

  test("click azione apre modal scegli progetto", async ({ page }) => {
    await loginAndOpenWorkspace(page);
    await page.getByLabel("Azioni rapide").click();
    await page.getByText("Lancia Site Audit").click();
    await expect(
      page.getByRole("heading", { name: /su quale sito/i }),
    ).toBeVisible();
  });

  test("entrando in un progetto la sidebar appare", async ({ page }) => {
    await loginAndOpenWorkspace(page);
    // click sul primo progetto disponibile (link card)
    const firstCardLink = page
      .locator('a[href^="/projects/"]')
      .filter({ has: page.locator("img,svg") })
      .first();
    await firstCardLink.click();
    await expect(page).toHaveURL(/\/projects\/[^/]+\//);
    // sidebar globale Progetti deve essere visibile
    await expect(page.getByTestId("nav-global-progetti")).toBeVisible();
  });
});
