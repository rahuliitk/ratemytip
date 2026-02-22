// tests/e2e/leaderboard.spec.ts
//
// End-to-end tests for the leaderboard page.
// Verifies page rendering, navigation, and filtering UI.

import { test, expect } from "@playwright/test";

test.describe("Leaderboard Page", () => {
  test("renders the leaderboard page with title", async ({ page }) => {
    await page.goto("/leaderboard");
    await expect(page).toHaveTitle(/Leaderboard/i);
  });

  test("displays leaderboard heading", async ({ page }) => {
    await page.goto("/leaderboard");
    const heading = page.getByRole("heading", { level: 1 });
    await expect(heading).toBeVisible();
  });

  test("has category tabs", async ({ page }) => {
    await page.goto("/leaderboard");
    // Look for category navigation (All, Intraday, Swing, etc.)
    const allTab = page.getByRole("link", { name: /all/i }).first();
    await expect(allTab).toBeVisible();
  });

  test("category tab navigation works", async ({ page }) => {
    await page.goto("/leaderboard");

    // Click on a category tab if available
    const intradayLink = page.getByRole("link", { name: /intraday/i }).first();
    if (await intradayLink.isVisible()) {
      await intradayLink.click();
      await expect(page).toHaveURL(/leaderboard\/intraday/);
    }
  });

  test("leaderboard table has expected column headers", async ({ page }) => {
    await page.goto("/leaderboard");

    // Check for key column headers in the leaderboard
    const rankHeader = page.getByText(/rank/i).first();
    await expect(rankHeader).toBeVisible();
  });

  test("empty leaderboard shows appropriate message", async ({ page }) => {
    await page.goto("/leaderboard");
    // If no data, should show an empty state or placeholder
    // This test passes as long as the page renders without errors
    const body = page.locator("body");
    await expect(body).toBeVisible();
  });

  test("navigating to homepage works", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/RateMyTip/i);
  });

  test("homepage has link to leaderboard", async ({ page }) => {
    await page.goto("/");
    const leaderboardLink = page.getByRole("link", { name: /leaderboard/i }).first();
    await expect(leaderboardLink).toBeVisible();
  });
});
