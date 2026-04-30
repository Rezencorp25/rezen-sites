import { test, expect } from "playwright/test";

/**
 * Sprint S1 acceptance: la voce "Progetti" deve essere sempre raggiungibile
 * dalla sidebar quando si è dentro un progetto, riportando l'utente all'elenco.
 *
 * Pre-condizione: server dev avviato su http://localhost:3000.
 */

async function loginAsDemoUser(page: import("playwright/test").Page) {
  await page.goto("/login");
  await page.getByRole("button", { name: /accedi|sign in|login/i }).click();
  await page.waitForURL(/\/projects/);
}

test.describe("Sidebar global navigation", () => {
  test("link Progetti riporta all'elenco da una pagina interna al progetto", async ({
    page,
  }) => {
    await loginAsDemoUser(page);

    // dall'elenco progetti, entra nel primo progetto
    await page.getByRole("link", { name: /apri|dashboard|view/i }).first().click();

    // ora siamo su /projects/{id}/...
    await expect(page).toHaveURL(/\/projects\/[^/]+\//);

    // il link Progetti nella sidebar è visibile e cliccabile
    const progettiLink = page.getByTestId("nav-global-progetti");
    await expect(progettiLink).toBeVisible();
    await progettiLink.click();

    // siamo tornati all'elenco
    await expect(page).toHaveURL(/\/projects\/?$/);
  });

  test("link Progetti è sempre presente nella sidebar a prescindere dalla route", async ({
    page,
  }) => {
    await loginAsDemoUser(page);

    const progettiLink = page.getByTestId("nav-global-progetti");
    await expect(progettiLink).toBeVisible();
    await expect(progettiLink).toHaveAttribute("href", "/projects");
  });
});
