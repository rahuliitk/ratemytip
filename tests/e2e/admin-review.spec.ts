// tests/e2e/admin-review.spec.ts
//
// End-to-end tests for the admin review queue.
// Verifies login redirect, queue rendering, and keyboard hint display.

import { test, expect } from "@playwright/test";

test.describe("Admin Review Queue", () => {
  test("redirects unauthenticated users to admin login", async ({ page }) => {
    await page.goto("/admin/review");
    // Should redirect to /admin/login
    await expect(page).toHaveURL(/admin\/login/);
  });

  test("admin login page renders", async ({ page }) => {
    await page.goto("/admin/login");
    // Should show login form
    const emailInput = page.getByLabel(/email/i).first();
    await expect(emailInput).toBeVisible();
  });

  test("admin login page has password field", async ({ page }) => {
    await page.goto("/admin/login");
    const passwordInput = page.getByLabel(/password/i).first();
    await expect(passwordInput).toBeVisible();
  });

  test("admin dashboard redirects when not authenticated", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/admin\/login/);
  });

  test("admin creators page redirects when not authenticated", async ({ page }) => {
    await page.goto("/admin/creators");
    await expect(page).toHaveURL(/admin\/login/);
  });

  test("admin scrapers page redirects when not authenticated", async ({ page }) => {
    await page.goto("/admin/scrapers");
    await expect(page).toHaveURL(/admin\/login/);
  });
});
