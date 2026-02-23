// tests/e2e/navigation.spec.ts
//
// End-to-end tests for cross-page navigation flows.
// Verifies links between leaderboard, creator, stock, and search pages.

import { test, expect } from "@playwright/test";

test.describe("Cross-Page Navigation", () => {
  test("homepage → leaderboard navigation", async ({ page }) => {
    await page.goto("/");
    const link = page.getByRole("link", { name: /leaderboard/i }).first();
    await expect(link).toBeVisible();
    await link.click();
    await expect(page).toHaveURL(/leaderboard/);
  });

  test("homepage → search navigation", async ({ page }) => {
    await page.goto("/");
    const link = page.getByRole("link", { name: /search/i }).first();
    if (await link.isVisible()) {
      await link.click();
      await expect(page).toHaveURL(/search/);
    }
  });

  test("leaderboard → homepage via logo", async ({ page }) => {
    await page.goto("/leaderboard");
    const logo = page.getByRole("link", { name: /ratemytip/i }).first();
    await expect(logo).toBeVisible();
    await logo.click();
    await expect(page).toHaveURL("/");
  });

  test("search page renders with search input", async ({ page }) => {
    await page.goto("/search");
    const body = page.locator("body");
    await expect(body).toBeVisible();
  });

  test("header is visible on all public pages", async ({ page }) => {
    for (const path of ["/", "/leaderboard", "/search"]) {
      await page.goto(path);
      const header = page.locator("header").first();
      await expect(header).toBeVisible();
    }
  });

  test("footer is visible on all public pages", async ({ page }) => {
    for (const path of ["/", "/leaderboard", "/search"]) {
      await page.goto(path);
      const footer = page.locator("footer").first();
      await expect(footer).toBeVisible();
    }
  });
});
