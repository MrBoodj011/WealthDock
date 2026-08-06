import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Financial command center")).toBeVisible();
});

test("adds and finds a transaction", async ({ page }) => {
  await page.getByRole("button", { name: "Add transaction" }).click();
  await page.getByLabel("Amount").fill("19.75");
  await page.getByLabel("Note").fill("Open source launch lunch");
  await page.getByRole("button", { name: "Save to vault" }).click();

  const mobileNavigation = page.locator(".mobile-nav");
  if (await mobileNavigation.isVisible()) {
    await mobileNavigation
      .getByRole("button", { name: "Transactions" })
      .click();
  } else {
    await page
      .locator(".side-nav")
      .getByRole("button", { name: "Transactions" })
      .click();
  }
  await page
    .getByPlaceholder("Search note, category or tag…")
    .fill("launch lunch");
  await expect(page.getByText("Open source launch lunch")).toBeVisible();
});

test("privacy mode hides balances", async ({ page }) => {
  await page.getByRole("button", { name: "Hide balances" }).click();
  await expect(page.getByText("••••••").first()).toBeVisible();
});

test("dashboard has no automatically detectable WCAG A/AA violations", async ({
  page,
}) => {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa"])
    .analyze();
  expect(results.violations).toEqual([]);
});
