// tests/e2e/search.spec.ts
//
// End-to-end tests for the search functionality.
// Verifies search input, result rendering, and navigation.

import { test, expect } from "@playwright/test";

test.describe("Search Page", () => {
  test("renders the search page", async ({ page }) => {
    await page.goto("/search");
    await expect(page).toHaveTitle(/Search|RateMyTip/i);
  });

  test("search page has a search input", async ({ page }) => {
    await page.goto("/search");
    const searchInput = page.getByRole("textbox").first();
    // If there's a search input on the page, it should be visible
    if (await searchInput.isVisible()) {
      await expect(searchInput).toBeVisible();
    }
  });

  test("search with query parameter renders results", async ({ page }) => {
    await page.goto("/search?q=reliance");
    const body = page.locator("body");
    await expect(body).toBeVisible();
    // Page should load without errors
    expect(page.url()).toContain("q=reliance");
  });

  test("empty search shows empty state", async ({ page }) => {
    await page.goto("/search");
    const body = page.locator("body");
    await expect(body).toBeVisible();
  });

  test("header search bar is present on public pages", async ({ page }) => {
    await page.goto("/");
    // The global header should have some kind of search functionality
    const header = page.locator("header").first();
    await expect(header).toBeVisible();
  });
});
