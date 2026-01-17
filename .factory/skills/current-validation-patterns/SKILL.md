---
name: current-validation-patterns
description: "Validation approaches for React Native, Expo, NativeWind. ALWAYS web search for current year updates before using. Covers: typecheck, lint, test, visual, a11y, performance validation."
---

# Current Validation Patterns

Validation approaches for the AICaddyPro tech stack. 

**CRITICAL:** Before using any pattern, web search for `[technology] [current year] changes` to ensure patterns are current.

## How to Use

```bash
# Search this skill for patterns
grep -A20 "## TypeScript" .factory/skills/current-validation-patterns/SKILL.md

# ALWAYS check for updates first
# Web search: "React Native [current year] breaking changes"
# Web search: "Expo SDK [current year] new features"
```

---

## Pre-Validation Checklist

Before ANY validation, run:

```bash
# 1. Get current timestamp
echo "Validation started: $(date -Iseconds)"

# 2. Check tool versions
npx tsc --version
npx expo --version
node --version

# 3. Verify package versions match expectations
cat package.json | jq '.dependencies["react-native"], .dependencies["expo"]'
```

---

## TypeScript Validation

### Full Typecheck
```bash
npx tsc --noEmit
```

### Incremental Check (faster)
```bash
npx tsc --noEmit --incremental
```

### Single File Check
```bash
npx tsc --noEmit [file.ts]
```

### Common Type Errors
| Error | Likely Cause | Fix |
|-------|--------------|-----|
| TS2339 | Property doesn't exist | Check interface definition |
| TS2345 | Argument type mismatch | Verify function signature |
| TS2322 | Type not assignable | Check source and target types |
| TS7006 | Implicit any | Add explicit type annotation |

---

## Lint Validation

### Full Lint
```bash
npx expo lint
```

### With Auto-fix
```bash
npx expo lint --fix
```

### Specific Files
```bash
npx eslint [file.tsx]
```

### Common Lint Rules (React Native)
- `react-hooks/rules-of-hooks` - Hook call order
- `react-hooks/exhaustive-deps` - Missing dependencies
- `@typescript-eslint/no-unused-vars` - Dead code hint

---

## Test Validation

### Full Test Suite
```bash
npm test
```

### With Coverage
```bash
npm test -- --coverage
```

### Specific Test File
```bash
npm test -- --testPathPattern=[pattern]
```

### Watch Mode (development)
```bash
npm test -- --watch
```

### Test Categories
| Category | Command | Purpose |
|----------|---------|---------|
| Unit | `npm test -- --testPathPattern=unit` | Logic tests |
| Integration | `npm test -- --testPathPattern=integration` | Flow tests |
| Snapshot | `npm test -- -u` | Update snapshots |

---

## Visual Validation

### Manual Checks
1. Run app on iOS Simulator
2. Run app on Android Emulator
3. Check both light and dark modes
4. Test on smallest screen (iPhone SE / small Android)
5. Test on largest screen (iPad / tablet)

### Automated Visual
```bash
# If using Storybook
npx storybook dev

# If using Expo Go
npx expo start
```

### Key Visual Checks
- [ ] No overlapping elements
- [ ] Text readable at all sizes
- [ ] Touch targets >= 44pt
- [ ] Contrast meets WCAG AA
- [ ] Safe area respected

---

## Accessibility Validation

### VoiceOver (iOS)
1. Enable VoiceOver in Settings
2. Navigate through app
3. Verify all elements announced
4. Check focus order is logical

### TalkBack (Android)
1. Enable TalkBack in Settings
2. Navigate through app
3. Verify all elements announced
4. Check focus order is logical

### Automated A11y Check
```bash
# Check for missing labels
grep -rn "accessibilityLabel\|accessibilityRole" src/ | wc -l

# Find interactive elements without labels
grep -rn "onPress\|Pressable\|TouchableOpacity" src/ --include="*.tsx" | \
  grep -v "accessibilityLabel"
```

### Key A11y Checks
- [ ] All images have alt text
- [ ] All buttons have labels
- [ ] Focus order matches visual order
- [ ] Reduced motion respected
- [ ] Color is not only indicator

---

## Performance Validation

### Bundle Size
```bash
# Check bundle size
npx react-native bundle \
  --platform ios \
  --dev false \
  --entry-file index.js \
  --bundle-output /tmp/bundle.js
ls -la /tmp/bundle.js
```

### Memory Profiling
1. Open React DevTools
2. Go to Profiler tab
3. Record interaction
4. Check for memory leaks

### Re-render Detection
```bash
# Add to component for debug
console.log('[ComponentName] rendered at', new Date().toISOString());

# Or use React DevTools Profiler
# Look for unexpected re-renders
```

### Key Performance Checks
- [ ] No unnecessary re-renders
- [ ] Lists use FlashList for >20 items
- [ ] Images are optimized
- [ ] No memory leaks on navigation
- [ ] Animations run at 60fps

---

## Spacing/Design Token Validation

### Find Hardcoded Values
```bash
# Find non-token spacing
grep -rn "padding:\s*[0-9]\+\|margin:\s*[0-9]\+" src/ --include="*.tsx" | \
  grep -v "node_modules" | \
  grep -v "// spacing-ok"
```

### Valid Token Values
```
Spacing: 4, 8, 12, 16, 24, 32, 48, 64, 96
```

### Check Token Usage
```bash
# Verify token imports
grep -rn "import.*spacing\|import.*tokens" src/ --include="*.tsx" | head -10
```

---

## Dead Code Validation

### Using Knip
```bash
npx knip --reporter json
```

### Manual Export Check
```bash
# Find exports
grep -rn "export " [file] | grep -v "export type"

# Find usages
grep -rn "[export_name]" src/ --include="*.ts" --include="*.tsx"
```

### Dependency Check
```bash
# Unused dependencies
npx depcheck
```

---

## App Store Validation

### iOS Checks
```bash
# Icon
file assets/images/icon.png
identify assets/images/icon.png 2>/dev/null

# URLs
curl -sI "https://[privacy-url]" | head -3
curl -sI "https://[terms-url]" | head -3

# Bundle ID
jq '.expo.ios.bundleIdentifier' app.json
```

### Android Checks
```bash
# Adaptive icon
ls assets/images/adaptive-icon.png

# Package name
jq '.expo.android.package' app.json
```

---

## Validation Sequence

For comprehensive validation, run in this order:

```bash
# 1. Types (catches structural issues)
npx tsc --noEmit

# 2. Lint (catches style/pattern issues)
npx expo lint

# 3. Tests (catches logic issues)
npm test

# 4. Then manual/visual checks
# - Run on device
# - Check accessibility
# - Verify performance
```

---

## When to Re-validate

Re-run validation when:
- [ ] Changing dependencies
- [ ] Modifying shared components
- [ ] Updating config files
- [ ] Before creating PR
- [ ] After resolving merge conflicts

---

## Resource Freshness Check

Always verify resources are current:

```bash
# Check when key files were last modified
for f in package.json app.json eas.json src/theme/tokens.ts; do
  echo "$f: $(git log -1 --format='%ci' -- $f)"
done
```
