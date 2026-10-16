import { expect, test, type Page } from "@playwright/test";

/** End-to-end checks in mock mode: sign-in, route protection, permission-aware navigation, core screens load. */
const PASSWORD = "cicod-demo";

async function signIn(page: Page, email: string, next?: string) {
  await page.goto(next ? `/login?next=${encodeURIComponent(next)}` : "/login");
  await page.getByLabel("Work email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
}

test("signed-out visitors are sent to sign in and returned afterwards", async ({ page }) => {
  await page.goto("/crm/billing/payments");
  await expect(page).toHaveURL(/\/login\?next=%2Fcrm%2Fbilling%2Fpayments/);
  await page.getByLabel("Work email").fill("adeola.adesina@cicod.com");
  await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/crm\/billing\/payments$/);
});

test("wrong password and deactivated accounts are refused", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Work email").fill("adeola.adesina@cicod.com");
  await page.getByLabel("Password", { exact: true }).fill("wrong-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("alert").filter({ hasText: /incorrect/i })).toBeVisible();

  await page.getByLabel("Work email").fill("kemi.balogun@cicod.com");
  await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("alert").filter({ hasText: /deactivated/i })).toBeVisible();
});

test("the session cookie is HttpOnly", async ({ page, context }) => {
  await signIn(page, "adeola.adesina@cicod.com");
  await expect(page).toHaveURL(/\/$/);
  const cookie = (await context.cookies()).find((c) => c.name === "crm_session");
  expect(cookie?.httpOnly).toBe(true);
  expect(await page.evaluate(() => document.cookie)).not.toContain("crm_session");
});

test("an admin sees every module and the main screens load", async ({ page }) => {
  await signIn(page, "adeola.adesina@cicod.com");
  const nav = page.getByRole("navigation", { name: "Main" });
  await page.getByRole("button", { name: "Expand sidebar" }).click();
  for (const section of ["Daily Operations", "Growth", "Administration"]) await expect(nav.getByText(section)).toBeVisible();
  await expect(nav.getByText("Campaign Studio")).toHaveCount(0);

  for (const [path, heading] of [
    ["/crm/customer-mgt/customers", /customers/i],
    ["/crm/catalogue", /products|plans|catalogue/i],
    ["/crm/billing/payments", /payments/i],
    ["/crm/growth/leads", /leads/i],
    ["/crm/settings/users", /users/i],
  ] as const) {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 }).first()).toHaveText(heading, { timeout: 15_000 });
    await expect(page.getByText("We couldn't load this")).toHaveCount(0);
  }
});

test("a finance user cannot see or open the pipeline", async ({ page }) => {
  await signIn(page, "chiamaka.obi@cicod.com");
  await expect(page).toHaveURL(/\/$/);
  // Expand the sidebar so section labels are visible.
  const nav = page.getByRole("navigation", { name: "Main" });
  await expect(nav.locator('a[href="/crm/growth/leads"]')).toHaveCount(0);
  await page.goto("/crm/growth/leads");
  await expect(page.getByText(/You don't have access to Pipeline/)).toBeVisible();
  await page.goto("/crm/billing/payments");
  await expect(page.getByText(/You don't have access/)).toHaveCount(0);
});

test("log out ends the session", async ({ page }) => {
  await signIn(page, "adeola.adesina@cicod.com");
  await expect(page).toHaveURL(/\/$/);
  await page.getByRole("button", { name: "Account menu" }).click();
  await page.getByRole("menuitem", { name: /log out/i }).click();
  await expect(page).toHaveURL(/\/login\?signedout=1/);
  await page.goto("/crm/customer-mgt/customers");
  await expect(page).toHaveURL(/\/login/);
});
