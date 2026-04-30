import { test, expect } from "playwright/test";

/**
 * Sprint S1 acceptance: ogni KPI nella Dashboard di progetto ha un tooltip
 * accessibile (info-icon con `aria-label="Definizione KPI"`).
 *
 * Pre-condizione: server dev avviato su http://localhost:3000.
 */

async function loginAndOpenDashboard(page: import("playwright/test").Page) {
  await page.goto("/login");
  await page.getByRole("button", { name: /accedi|sign in|login/i }).click();
  await page.waitForURL(/\/projects/);
  await page.getByRole("link", { name: /apri|dashboard|view/i }).first().click();
  await page.waitForURL(/\/projects\/[^/]+\/dashboard/);
}

test.describe("Dashboard KPI tooltips", () => {
  test("ogni KPI mostra un info-icon con aria-label accessibile", async ({
    page,
  }) => {
    await loginAndOpenDashboard(page);

    const tooltips = page.getByLabel("Definizione KPI");
    // 4 KPI cards previste: Pagine Pubblicate, Traffico Organico, Revenue AdSense, SEO Score
    await expect(tooltips).toHaveCount(4);
  });

  test("hover su info-icon rivela contenuto tooltip", async ({ page }) => {
    await loginAndOpenDashboard(page);

    const firstTooltip = page.getByLabel("Definizione KPI").first();
    await firstTooltip.hover();
    // il tooltip content è renderizzato via portal con data-slot=tooltip-content
    const tooltipContent = page.locator('[data-slot="tooltip-content"]').first();
    await expect(tooltipContent).toBeVisible({ timeout: 2000 });
  });
});
