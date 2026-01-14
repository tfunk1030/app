---
name: appstore
description: App Store submission pipeline - validate icons, URLs, metadata with live checks
---

# App Store Command

Comprehensive App Store submission validation with live verification and PYYW protocol.

## Usage

```
/appstore check      # Full P0 blocker check with PYYW
/appstore icon       # Icon validation only
/appstore urls       # Privacy/Terms URL validation only
/appstore metadata   # Metadata consistency check
/appstore submit     # Final pre-submission validation
```

## Workflow

### 1. Get Current Context
```bash
echo "App Store Check: $(date -Iseconds)"
git log -1 --format='%ci' -- app.json eas.json
```

### 2. Search Current Guidelines
```
Web search: "App Store Review Guidelines [current year] changes"
Web search: "iOS app submission requirements [current year]"
```

### 3. Run Live Validations

**CRITICAL:** Never trust code - always run live checks.

## P0 Blockers

### P0-1: App Icon

```bash
# Check existence
ls -la assets/images/icon.png

# Check dimensions (must be 1024x1024)
file assets/images/icon.png
identify assets/images/icon.png 2>/dev/null

# Check no transparency
identify -verbose assets/images/icon.png | grep -i alpha
```

Requirements:
- 1024x1024 pixels exactly
- PNG format
- No transparency (alpha channel)
- sRGB colorspace

### P0-2: Privacy Policy URL

```bash
# Extract URL from code
grep -rn "privacy" app.json src/ --include="*.tsx" | head -3

# LIVE CHECK
curl -sI "https://aicaddypro.com/privacy" | head -3
```

Must return HTTP 200.

### P0-3: Terms of Service URL

```bash
# Extract URL from code
grep -rn "terms" app.json src/ --include="*.tsx" | head -3

# LIVE CHECK
curl -sI "https://aicaddypro.com/terms" | head -3
```

Must return HTTP 200.

### P0-4: Bundle Identifier

```bash
# Check all sources match
jq '.expo.ios.bundleIdentifier' app.json
jq '.expo.android.package' app.json
jq '.build.production' eas.json
```

All must be consistent.

## PYYW Validation

Each P0 item MUST pass PYYW before marking resolved:

### Attack Checklist
- [ ] Live URL actually returns 200?
- [ ] Asset dimensions verified with tool?
- [ ] Current year guidelines checked?
- [ ] All config files consistent?
- [ ] Privacy declarations match usage?

## Output Format

```markdown
# App Store Validation Report

**Timestamp:** $(date -Iseconds)
**Guidelines Year:** [searched]

## P0 Status

| Item | Status | PYYW | Evidence |
|------|--------|------|----------|
| Icon 1024x1024 | ✅/❌ | APPROVED | [file output] |
| Privacy URL | ✅/❌ | APPROVED | [curl output] |
| Terms URL | ✅/❌ | APPROVED | [curl output] |
| Bundle ID | ✅/❌ | APPROVED | [consistency check] |

## Ready to Submit?

**[YES / NO]**

### If NO, Blocking Issues:
1. [ ] [Issue with fix instructions]
2. [ ] [Issue with fix instructions]

### Required Assets Checklist
- [ ] 1024x1024 icon.png
- [ ] Privacy Policy URL (live)
- [ ] Terms of Service URL (live)
- [ ] App Store description
- [ ] Screenshots (all sizes)
- [ ] Keywords list
```

## Quick Check

For fast status overview:
```
/appstore check --quick
```

Skips PYYW, just shows current state.

## Full Check (Default)

Complete validation with all PYYW attacks:
```
/appstore check --full
```

## Pre-Submit

Final validation before submission:
```
/appstore submit
```

This runs:
1. All P0 checks with PYYW
2. Guideline currency search
3. Metadata consistency
4. Asset verification
5. Privacy declaration audit

## Integration

- Delegates to `appstore-validator` droid
- Saves report to `.factory/reviews/APPSTORE-[date].md`
- Creates tasks for any failures
- Updates `.factory/prd.json` status

## Rules

1. **NEVER trust code** - Always curl URLs
2. **ALWAYS verify assets** - Use file/identify commands
3. **SEARCH current year** - Guidelines change annually
4. **CHECK all configs** - app.json, eas.json, Info.plist
5. **LOG timestamps** - `$(date -Iseconds)`
