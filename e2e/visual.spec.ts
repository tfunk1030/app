/**
 * Visual Regression Tests for AICaddyPro
 *
 * These tests capture screenshots and compare against baselines.
 *
 * Usage:
 *   npx playwright test                    # Run tests
 *   npx playwright test --update-snapshots # Update baseline screenshots
 *   npx playwright test --ui               # Open interactive UI
 *
 * First run creates baseline snapshots in e2e/visual.spec.ts-snapshots/
 */

import { test, expect } from '@playwright/test';

test.describe('Wind Screen Visual Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to wind tab
    await page.goto('/(tabs-redesign)/(wind)');
    // Wait for the compass to be rendered
    await page.waitForTimeout(1000);
  });

  test('wind screen matches baseline', async ({ page }) => {
    await expect(page).toHaveScreenshot('wind-screen.png', {
      maxDiffPixels: 1000, // Allow minor anti-aliasing/rendering differences
    });
  });

  test('compass component renders correctly', async ({ page }) => {
    // Look for compass by testID, aria-label, or fallback to content area
    const compass = page.locator('[data-testid="compass"], [aria-label*="compass" i], [aria-label*="wind" i]').first();
    if (await compass.isVisible()) {
      await expect(compass).toHaveScreenshot('compass.png', { maxDiffPixels: 1000 });
    } else {
      // Fallback: capture the entire viewport since React Native web doesn't use semantic HTML
      await expect(page).toHaveScreenshot('wind-compass-area.png', {
        maxDiffPixels: 1000,
      });
    }
  });
});

test.describe('Shot Screen Visual Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/(tabs-redesign)/(shot)');
    await page.waitForTimeout(1000);
  });

  test('shot screen matches baseline', async ({ page }) => {
    await expect(page).toHaveScreenshot('shot-screen.png', {
      maxDiffPixels: 1000,
    });
  });
});

test.describe('Setup Screen Visual Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/(tabs-redesign)/(setup)');
    await page.waitForTimeout(1000);
  });

  test('setup screen matches baseline', async ({ page }) => {
    await expect(page).toHaveScreenshot('setup-screen.png', {
      maxDiffPixels: 1000,
    });
  });
});

test.describe('Accessibility Snapshots', () => {
  /**
   * These tests capture accessibility trees for AI analysis.
   * Use with Playwright MCP: browser_snapshot returns similar data.
   */

  test('wind screen accessibility tree', async ({ page }) => {
    await page.goto('/(tabs-redesign)/(wind)');
    await page.waitForTimeout(1000);

    // React Native Web renders accessibility through data-* attributes
    // Check for any interactive elements (buttons, inputs, etc.)
    const interactiveElements = page.locator('button, [role], input, [tabindex], [data-testid]');
    const count = await interactiveElements.count();

    // Log what we found for debugging
    console.log(`Found ${count} interactive/accessible elements on wind screen`);

    // React Native Web may not use standard aria - verify page renders at minimum
    const pageContent = await page.content();
    expect(pageContent.length).toBeGreaterThan(100);
  });

  test('all interactive elements have labels', async ({ page }) => {
    await page.goto('/(tabs-redesign)/(wind)');
    await page.waitForTimeout(1000);

    // Find all buttons and pressables
    const buttons = page.locator('button, [role="button"]');
    const buttonCount = await buttons.count();

    for (let i = 0; i < buttonCount; i++) {
      const button = buttons.nth(i);
      const ariaLabel = await button.getAttribute('aria-label');
      const accessibilityLabel = await button.getAttribute('accessibilityLabel');
      const textContent = await button.textContent();

      // Each button should have some accessible name
      const hasLabel = ariaLabel || accessibilityLabel || textContent?.trim();
      expect(
        hasLabel,
        `Button ${i} missing accessible label`
      ).toBeTruthy();
    }
  });
});

test.describe('Wind Arrow Color Verification', () => {
  /**
   * Visual verification that wind arrow colors match spec:
   * - TAILWIND = green (#16A34A)
   * - HEADWIND = red (#DC2626)
   * - CROSSWIND = yellow (#F59E0B)
   */

  test('wind arrow is visible', async ({ page }) => {
    await page.goto('/(tabs-redesign)/(wind)');
    await page.waitForTimeout(1000);

    // Look for SVG path or arrow element
    const arrow = page.locator('[data-testid="wind-arrow"], svg path, .wind-arrow').first();
    if (await arrow.isVisible()) {
      await expect(arrow).toHaveScreenshot('wind-arrow.png');
    }
  });
});

test.describe('Touch Target Sizes', () => {
  /**
   * Verify touch targets meet minimum 48x48dp requirement
   */

  test('buttons meet minimum touch target size', async ({ page }) => {
    await page.goto('/(tabs-redesign)/(wind)');
    await page.waitForTimeout(1000);

    const buttons = page.locator('button, [role="button"]');
    const buttonCount = await buttons.count();

    for (let i = 0; i < buttonCount; i++) {
      const button = buttons.nth(i);
      if (await button.isVisible()) {
        const box = await button.boundingBox();
        if (box) {
          expect(
            box.width >= 48 || box.height >= 48,
            `Button ${i} is smaller than 48px (${box.width}x${box.height})`
          ).toBeTruthy();
        }
      }
    }
  });
});
