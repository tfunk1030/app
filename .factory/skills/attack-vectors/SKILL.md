---
name: attack-vectors
description: "Pre-built attack vectors for PYYW validation. Categories: UI changes, logic changes, dependency changes, config changes, dead code, App Store. Use before any action to identify how conclusions could be wrong."
---

# Attack Vectors - PYYW Support Skill

Pre-built attack vectors for the Prove Yourself Wrong (PYYW) protocol. Use these to systematically challenge conclusions before taking action.

## How to Use

When validating a conclusion, select the appropriate category and apply ALL relevant attacks:

```bash
# Search for attack vectors by category
grep -A20 "## UI Change Attacks" .factory/skills/attack-vectors/SKILL.md

# Or search by keyword
grep -B2 -A5 "spacing\|padding\|margin" .factory/skills/attack-vectors/SKILL.md
```

---

## UI Change Attacks (5 vectors)

Use when modifying any visual component, styling, or layout.

### 1. Intentional Design Attack
**Question:** Is this value intentional for a specific design reason?
**Verification:**
```bash
# Check for justification comments
grep -B3 -A1 "[value]" [file] | grep -i "intent\|design\|align\|pixel-perfect\|ok:"

# Check git commit message
git log -1 --format=%B -- [file] | grep -i "design\|intentional\|specific"
```
**Succeeds if:** Comment or commit explains the value

### 2. Platform-Specific Attack
**Question:** Is this value platform-specific (iOS vs Android)?
**Verification:**
```bash
# Check for Platform.select or Platform.OS
grep -B5 -A5 "[line]" [file] | grep -i "Platform\|ios\|android"

# Check for .ios.tsx or .android.tsx variants
ls $(dirname [file])/$(basename [file] .tsx).{ios,android}.tsx 2>/dev/null
```
**Succeeds if:** Value is inside platform-specific code

### 3. Responsive Design Attack
**Question:** Does this value adapt to screen size?
**Verification:**
```bash
# Check for Dimensions, useWindowDimensions, or responsive utilities
grep -B10 "[line]" [file] | grep -i "Dimensions\|window\|responsive\|scale"
```
**Succeeds if:** Value is computed from screen dimensions

### 4. Animation/Transition Attack
**Question:** Is this value part of an animation that requires precision?
**Verification:**
```bash
# Check for Animated, Reanimated, or spring configs
grep -B10 -A5 "[value]" [file] | grep -i "Animated\|useSharedValue\|spring\|timing"
```
**Succeeds if:** Value is used in animation calculations

### 5. Accessibility Override Attack
**Question:** Is this value for accessibility compliance (touch targets, contrast)?
**Verification:**
```bash
# Check for accessibility-related code
grep -B5 -A5 "[value]" [file] | grep -i "accessible\|touch\|target\|minimum\|a11y"
```
**Succeeds if:** Value ensures accessibility compliance

---

## Logic Change Attacks (5 vectors)

Use when modifying business logic, calculations, or data flow.

### 1. Edge Case Attack
**Question:** Does this change break edge cases?
**Verification:**
```bash
# Find test file and check edge cases
grep -l "[function_name]" src/**/*.test.ts
grep -A20 "edge\|boundary\|zero\|null\|empty" [test_file]
```
**Succeeds if:** Tests cover edge cases that would break

### 2. Dependent Code Attack
**Question:** What other code depends on this behavior?
**Verification:**
```bash
# Find all usages of the function/variable
grep -rn "[function_name]\|[variable_name]" src/ --include="*.ts" --include="*.tsx"
```
**Succeeds if:** Dependents rely on current behavior

### 3. Type Contract Attack
**Question:** Does this change violate type contracts?
**Verification:**
```bash
# Run typecheck
npx tsc --noEmit 2>&1 | grep -A2 "[file]"
```
**Succeeds if:** Type errors would occur

### 4. State Consistency Attack
**Question:** Could this cause inconsistent state?
**Verification:**
```bash
# Check for state dependencies
grep -B10 -A10 "[function]" [file] | grep -i "useState\|useStore\|set[A-Z]\|dispatch"
```
**Succeeds if:** Multiple state updates could race

### 5. Performance Regression Attack
**Question:** Could this cause performance issues?
**Verification:**
```bash
# Check for loops, maps, or expensive operations
grep -A20 "[function]" [file] | grep -c "\.map\|\.filter\|\.reduce\|for\|while"
```
**Succeeds if:** Change adds O(n) or worse complexity

---

## Dependency Change Attacks (5 vectors)

Use when adding, removing, or updating dependencies.

### 1. Breaking Change Attack
**Question:** Does the new version have breaking changes?
**Verification:**
```bash
# Check changelog or release notes (web search)
# Search: "[package] [version] breaking changes [current_year]"
```
**Succeeds if:** Breaking changes affect our usage

### 2. Peer Dependency Attack
**Question:** Are peer dependencies satisfied?
**Verification:**
```bash
npm ls [package] 2>&1 | grep -i "peer\|WARN\|ERR"
```
**Succeeds if:** Peer dependency conflicts exist

### 3. Bundle Size Attack
**Question:** Does this significantly increase bundle size?
**Verification:**
```bash
# Check package size
npm view [package] dist.unpackedSize
```
**Succeeds if:** Adds >100KB to bundle

### 4. Security Vulnerability Attack
**Question:** Does this package have known vulnerabilities?
**Verification:**
```bash
npm audit --json | grep -A5 "[package]"
```
**Succeeds if:** Vulnerabilities found

### 5. Native Module Attack
**Question:** Does this require native module linking?
**Verification:**
```bash
# Check for native code
ls node_modules/[package]/ios node_modules/[package]/android 2>/dev/null
```
**Succeeds if:** Native modules require additional setup

---

## Config Change Attacks (5 vectors)

Use when modifying app.json, eas.json, tsconfig, etc.

### 1. Environment Mismatch Attack
**Question:** Does this config work in all environments?
**Verification:**
```bash
# Check for environment-specific values
grep -i "dev\|prod\|staging\|preview" [config_file]
```
**Succeeds if:** Config only works in specific environment

### 2. Platform Parity Attack
**Question:** Does this affect iOS and Android equally?
**Verification:**
```bash
# Check for platform-specific keys
grep -i "\"ios\"\|\"android\"" [config_file]
```
**Succeeds if:** Change affects only one platform

### 3. Build Profile Attack
**Question:** Does this affect all build profiles?
**Verification:**
```bash
# Check eas.json profiles
cat eas.json | jq 'keys'
```
**Succeeds if:** Some profiles would break

### 4. Secret Exposure Attack
**Question:** Could this expose secrets?
**Verification:**
```bash
# Check for sensitive patterns
grep -i "key\|secret\|token\|password\|api" [config_file]
```
**Succeeds if:** Secrets would be in version control

### 5. Backwards Compatibility Attack
**Question:** Does this break existing installations?
**Verification:**
```bash
# Check version bumps
git diff HEAD~1 [config_file] | grep -i "version\|build"
```
**Succeeds if:** Version change requires migration

---

## Dead Code Attacks (6 vectors)

Use when flagging code as unused/dead.

### 1. Dynamic Import Attack
**Question:** Is this used via dynamic import?
**Verification:**
```bash
grep -rn "import(['\"].*[name]" src/
grep -rn "require(['\"].*[name]" src/
```
**Succeeds if:** Dynamic import found

### 2. Test-Only Usage Attack
**Question:** Is this only used in tests?
**Verification:**
```bash
grep -rn "[name]" src/**/*.test.ts src/**/__tests__/
```
**Succeeds if:** Used in tests (not dead)

### 3. Barrel Export Attack
**Question:** Is this exported from an index.ts?
**Verification:**
```bash
grep -rn "export.*[name]" src/**/index.ts
```
**Succeeds if:** Part of public API

### 4. Recent Addition Attack
**Question:** Was this added recently (WIP)?
**Verification:**
```bash
git log --since="7 days ago" --oneline -- [file] | head -5
```
**Succeeds if:** Added in last 7 days

### 5. Config Usage Attack
**Question:** Is this used in config files?
**Verification:**
```bash
grep -rn "[name]" *.config.js babel.config.js metro.config.js app.json
```
**Succeeds if:** Used in config

### 6. Type-Only Export Attack
**Question:** Is this a type-only export?
**Verification:**
```bash
grep -n "export type\|export interface" [file] | grep "[name]"
```
**Succeeds if:** Type exports are often missed by analyzers

---

## App Store Attacks (5 vectors)

Use when validating App Store submission readiness.

### 1. Live URL Attack
**Question:** Is the URL actually accessible?
**Verification:**
```bash
curl -sI "[url]" | head -3
```
**Succeeds if:** Not 200 OK

### 2. Guideline Currency Attack
**Question:** Are guidelines current for this year?
**Verification:**
```bash
# Web search: "App Store Review Guidelines [current_year] changes"
```
**Succeeds if:** New requirements added

### 3. Asset Specification Attack
**Question:** Does asset meet exact specifications?
**Verification:**
```bash
file [asset_path]
identify -verbose [asset_path] | grep -E "Geometry|Type|Alpha|Colorspace"
```
**Succeeds if:** Doesn't match specs exactly

### 4. Metadata Consistency Attack
**Question:** Is metadata consistent across all config files?
**Verification:**
```bash
# Compare app.json, eas.json, Info.plist
jq '.expo.name, .expo.version' app.json
jq '.build.production.ios' eas.json
```
**Succeeds if:** Inconsistencies found

### 5. Privacy Declaration Attack
**Question:** Does privacy declaration match actual data usage?
**Verification:**
```bash
# Search for data collection patterns
grep -rn "Analytics\|tracking\|collect\|user.*data" src/
```
**Succeeds if:** Undeclared data collection found

---

## Quick Reference

| Category | Min Attacks | Must Verify |
|----------|-------------|-------------|
| UI Change | 3 | Platform, intent, a11y |
| Logic Change | 3 | Types, deps, edge cases |
| Dependency | 3 | Security, peers, size |
| Config | 3 | Env, platform, secrets |
| Dead Code | 4 | Dynamic, tests, recent, types |
| App Store | 3 | URL live, assets, metadata |
