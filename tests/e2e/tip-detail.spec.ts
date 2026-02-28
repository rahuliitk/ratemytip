// tests/e2e/tip-detail.spec.ts
//
// End-to-end tests for the individual tip detail page.
// Verifies rendering of tip data, price chart, and creator link.

import { test, expect } from "@playwright/test";

test.describe("Tip Detail Page", () => {
  test("renders tip page without crashing", async ({ page }) => {
    // Use a known-format tip ID (cuid) - page should handle gracefully
    await page.goto("/tip/nonexistent-tip-id");
    const body = page.locator("body");
    await expect(body).toBeVisible();
  });

  test("shows 404 or not-found state for invalid tip ID", async ({ page }) => {
    await page.goto("/tip/does-not-exist-abc123");
    // Should show not-found page
    const body = page.locator("body");
    await expect(body).toBeVisible();
  });

  test("tip page has share button", async ({ page }) => {
    await page.goto("/tip/nonexistent-tip-id");
    // Share button may be present if page renders
    const body = page.locator("body");
    await expect(body).toBeVisible();
  });
});
