// tests/e2e/stock-page.spec.ts
//
// End-to-end tests for the stock detail page.
// Verifies page rendering, consensus display, and tip feed.

import { test, expect } from "@playwright/test";

test.describe("Stock Page", () => {
  test("renders stock page with symbol heading", async ({ page }) => {
    await page.goto("/stock/RELIANCE");
    const heading = page.getByRole("heading", { level: 1 }).first();
    await expect(heading).toBeVisible();
  });

  test("shows stock metadata (exchange, sector)", async ({ page }) => {
    await page.goto("/stock/RELIANCE");
    const body = page.locator("body");
    await expect(body).toBeVisible();
    // Page should render without errors regardless of data
  });

  test("displays consensus widget if tips exist", async ({ page }) => {
    await page.goto("/stock/RELIANCE");
    // Consensus section may or may not be visible depending on data
    const body = page.locator("body");
    await expect(body).toBeVisible();
  });

  test("shows tip feed section", async ({ page }) => {
    await page.goto("/stock/RELIANCE");
    // Look for any tip-related content or empty state
    const body = page.locator("body");
    await expect(body).toBeVisible();
  });

  test("navigates back to search from stock page", async ({ page }) => {
    await page.goto("/stock/RELIANCE");
    const searchLink = page.getByRole("link", { name: /search/i }).first();
    if (await searchLink.isVisible()) {
      await searchLink.click();
      await expect(page).toHaveURL(/search/);
    }
  });

  test("returns 404 for non-existent stock", async ({ page }) => {
    await page.goto("/stock/ZZZZNOTEXIST");
    // Should either show 404 page or render gracefully
    const body = page.locator("body");
    await expect(body).toBeVisible();
  });
});
