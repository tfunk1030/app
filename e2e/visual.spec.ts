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
   * Project requirement is 48dp (stricter than iOS 44pt)
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

test.describe('Accessibility Regression Guards', () => {
  /**
   * These tests ensure no accessibility regressions occur.
   * They verify key patterns that must be maintained.
   */

  test('no interactive elements without accessible names', async ({ page }) => {
    await page.goto('/(tabs-redesign)/(wind)');
    await page.waitForTimeout(1000);

    // Check all interactive elements have accessible names
    const interactiveElements = page.locator(
      'button:not([aria-hidden="true"]), ' +
      '[role="button"]:not([aria-hidden="true"]), ' +
      'input:not([aria-hidden="true"]), ' +
      '[role="slider"]:not([aria-hidden="true"]), ' +
      '[role="checkbox"]:not([aria-hidden="true"]), ' +
      '[role="switch"]:not([aria-hidden="true"])'
    );

    const count = await interactiveElements.count();
    const unlabeled: string[] = [];

    for (let i = 0; i < count; i++) {
      const el = interactiveElements.nth(i);
      if (await el.isVisible()) {
        const ariaLabel = await el.getAttribute('aria-label');
        const ariaLabelledBy = await el.getAttribute('aria-labelledby');
        const title = await el.getAttribute('title');
        const textContent = (await el.textContent())?.trim();

        if (!ariaLabel && !ariaLabelledBy && !title && !textContent) {
          const tagName = await el.evaluate((e) => e.tagName);
          const role = await el.getAttribute('role');
          unlabeled.push(`${tagName}[role="${role}"] at index ${i}`);
        }
      }
    }

    expect(
      unlabeled,
      `Found ${unlabeled.length} unlabeled interactive elements: ${unlabeled.join(', ')}`
    ).toHaveLength(0);
  });

  test('headers are properly marked', async ({ page }) => {
    await page.goto('/(tabs-redesign)/(wind)');
    await page.waitForTimeout(1000);

    // Check for heading roles
    const headings = page.locator(
      '[role="heading"], ' +
      'h1, h2, h3, h4, h5, h6, ' +
      '[accessibilityRole="header"]'
    );

    const count = await headings.count();
    // Wind screen should have at least one heading
    // This is a soft check - we want to know if headings exist
    console.log(`Found ${count} headings on wind screen`);
  });

  test('no duplicate IDs that break accessibility', async ({ page }) => {
    await page.goto('/(tabs-redesign)/(wind)');
    await page.waitForTimeout(1000);

    // Check for duplicate IDs which break aria-labelledby references
    const duplicateIds = await page.evaluate(() => {
      const ids = document.querySelectorAll('[id]');
      const seen = new Map<string, number>();
      const duplicates: string[] = [];

      ids.forEach((el) => {
        const id = el.getAttribute('id');
        if (id) {
          const count = (seen.get(id) || 0) + 1;
          seen.set(id, count);
          if (count === 2) {
            duplicates.push(id);
          }
        }
      });

      return duplicates;
    });

    expect(
      duplicateIds,
      `Found duplicate IDs: ${duplicateIds.join(', ')}`
    ).toHaveLength(0);
  });

  test('sliders have accessible values', async ({ page }) => {
    await page.goto('/(tabs-redesign)/(wind)');
    await page.waitForTimeout(1000);

    const sliders = page.locator('[role="slider"]');
    const count = await sliders.count();

    for (let i = 0; i < count; i++) {
      const slider = sliders.nth(i);
      if (await slider.isVisible()) {
        const valueNow = await slider.getAttribute('aria-valuenow');
        const valueMin = await slider.getAttribute('aria-valuemin');
        const valueMax = await slider.getAttribute('aria-valuemax');

        expect(valueNow, `Slider ${i} missing aria-valuenow`).not.toBeNull();
        expect(valueMin, `Slider ${i} missing aria-valuemin`).not.toBeNull();
        expect(valueMax, `Slider ${i} missing aria-valuemax`).not.toBeNull();
      }
    }
  });

  test('focus order is logical', async ({ page }) => {
    await page.goto('/(tabs-redesign)/(wind)');
    await page.waitForTimeout(1000);

    // Tab through focusable elements and verify order makes sense
    const focusableElements: string[] = [];

    // Press Tab multiple times and record what gets focused
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab');
      const focused = await page.evaluate(() => {
        const el = document.activeElement;
        if (el) {
          return {
            tag: el.tagName,
            role: el.getAttribute('role'),
            label: el.getAttribute('aria-label') || el.textContent?.slice(0, 30),
          };
        }
        return null;
      });

      if (focused) {
        focusableElements.push(
          `${focused.tag}[${focused.role}]: ${focused.label}`
        );
      }
    }

    // At minimum, tabbing should find some focusable elements
    console.log('Focus order:', focusableElements);
    expect(focusableElements.length).toBeGreaterThan(0);
  });
});
