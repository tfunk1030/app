# Playwright Iteration Workflow

Visual feedback loop for UI improvement without iOS Simulator.

## Prerequisites

```bash
# Add Playwright MCP to Claude Code
claude mcp add playwright -s user -- npx -y @anthropic/mcp-server-playwright
```

## Workflow

### Step 1: Start Expo Web
```bash
npx expo start --web
```

### Step 2: Open in Playwright
Use Claude Code with Playwright MCP to:
1. Navigate to `http://localhost:19006`
2. Set mobile viewport: 390x844 (iPhone 14)
3. Take initial screenshot

### Step 3: Initial Critique
Run `/honest-ui-feedback` on the component code.

### Step 4: Implement Top 3 Fixes
Make the changes identified as CRITICAL or HIGH priority.

### Step 5: Visual Verification
1. Take new screenshot
2. Compare to baseline
3. Run critique on new screenshot

### Step 6: Iterate
Repeat steps 4-5 until:
- Score threshold met (80+)
- OR maximum 5 iterations reached
- OR no CRITICAL issues remain

## MCP Commands Reference

```javascript
// Navigate to app
await page.goto('http://localhost:19006');

// Set mobile viewport
await page.setViewportSize({ width: 390, height: 844 });

// Take screenshot
await page.screenshot({ path: 'screenshots/iteration-1.png' });

// Device emulation (iPhone 14)
const devices = playwright.devices;
await browser.newContext({
  ...devices['iPhone 14'],
});
```

## Iteration Log Template

| Iteration | Screenshot | Score | Top Issue Fixed | Remaining Issues |
|-----------|------------|-------|-----------------|------------------|
| 1 | baseline.png | 45 | N/A | 8 |
| 2 | iter-2.png | 58 | Contrast | 5 |
| 3 | iter-3.png | 72 | Spacing | 3 |
| 4 | iter-4.png | 81 | Touch targets | 1 |
| 5 | final.png | 84 | Typography | 0 CRITICAL |

## Success Criteria

- CRITICAL issues: 0
- HIGH issues: ≤2
- Overall score: ≥80
- Designer/Critic consensus: Achieved

## Integration with /honest-ui-feedback

When using `--iterate` flag:

```bash
/honest-ui-feedback src/features/wind/screen.tsx --iterate
```

The workflow automatically:
1. Starts Playwright session
2. Takes baseline screenshot
3. Runs multi-agent critique
4. Implements fixes
5. Takes comparison screenshot
6. Loops until threshold

## Fallback: Manual Screenshot

If Playwright MCP isn't available, you can:
1. Take screenshots manually from Expo Go or device
2. Drag/drop into Claude Code chat
3. Run `/honest-ui-feedback --screenshot` with visual input
