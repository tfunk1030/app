---
name: appstore-blockers
description: Check all P0 blockers for iOS App Store submission
---

Check current App Store submission blockers and provide actionable status.

## Workflow

1. **Delegate to `release-ops` droid** for comprehensive check
2. **Read iOS pipeline status** from `scripts/ralph/ios-pipeline/prd.json`
3. **Validate assets** (icon, URLs)
4. **Report blockers** with specific actions

## Checks Performed

### P0-1: App Icon
```bash
# Verify icon exists and is correct size
file assets/images/icon.png
identify assets/images/icon.png 2>/dev/null || echo "ImageMagick not installed"
```
- Required: 1024x1024 PNG, no transparency, sRGB

### P0-2: Privacy Policy URL
```bash
# Check if URL is accessible
curl -sI https://aicaddypro.com/privacy | head -1
```
- Required: 200 OK response
- Check: SetupScreen.tsx for placeholder alert

### P0-3: Terms of Service URL
```bash
# Check if URL is accessible
curl -sI https://aicaddypro.com/terms | head -1
```
- Required: 200 OK response
- Check: SetupScreen.tsx for ToS link

### P0-4: App Store Connect Metadata
- Subtitle prepared
- Description written
- Keywords optimized
- Screenshots created
- Contact info ready

## Output Format

```markdown
# App Store Blockers Report - [Date]

## Quick Status
| P0 Blocker | Status | Action |
|------------|--------|--------|
| Icon 1024x1024 | ✅/❌ | [action] |
| Privacy Policy | ✅/❌ | [action] |
| Terms of Service | ✅/❌ | [action] |
| ASC Metadata | ✅/❌ | [action] |

## Ready to Submit?
[YES / NO]

## Immediate Actions Required
1. [First action with specific instructions]
2. [Second action]
...

## Files to Provide
- [ ] 1024x1024 icon.png (PNG, no transparency)
- [ ] Privacy Policy URL
- [ ] Terms of Service URL
- [ ] App Store description text
- [ ] Keywords list
- [ ] Screenshots

## Reference
Full iOS audit: `scripts/ralph/ios-pipeline/reviews/IOS-GLOBAL-checklist.md`
```

## Usage
```
/appstore-blockers           # Full P0 check
/appstore-blockers --quick   # Just status, no validation
```
