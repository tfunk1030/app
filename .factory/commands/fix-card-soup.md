---
name: fix-card-soup
description: Automatically detect and fix card soup UI patterns
---

Detect and refactor "card soup" patterns across the application.

## What This Does

1. **Scan** all screen and component files
2. **Detect** nested card/View patterns with borders/shadows
3. **Analyze** visual hierarchy depth
4. **Refactor** using design-enforcer droid
5. **Verify** with ui-reviewer droid

## Detection Patterns

### Code Patterns to Find
```typescript
// Nested borderRadius
style={{ borderRadius: X, ...style={{ borderRadius: Y }}

// Nested borderWidth  
style={{ borderWidth: X, ...style={{ borderWidth: Y }}

// Nested shadows
style={{ shadowColor: ..., ...style={{ shadowColor: ... }}

// Card components inside cards
<Card><Card>...</Card></Card>

// Multiple Surface/Paper components
<Surface><Surface>...</Surface></Surface>
```

### Visual Depth Check
Count these properties in parent-child chain:
- `borderRadius > 0`
- `borderWidth > 0`
- `shadowColor` or `elevation`
- `backgroundColor` (non-transparent)

Flag if chain depth > 2.

## Refactoring Strategy

### Step 1: Flatten Structure
- Remove unnecessary wrapper Views
- Combine nested styles where possible

### Step 2: Use Typography for Hierarchy
- Headers: Large, bold
- Subheaders: Medium, semibold
- Body: Regular
- Captions: Small, muted color

### Step 3: Use Spacing
- Section gaps: 24px
- Item gaps: 12px
- Internal padding: 16px

### Step 4: Single Prominent Element
- One card-like element per screen maximum
- Use it for the PRIMARY action/info only

## Output

```markdown
# Card Soup Fix Report

## Files Analyzed: X
## Issues Found: X
## Auto-Fixed: X

## By File

### [FileName]
**Before:** Nesting depth X
**After:** Nesting depth Y
**Changes:**
- [List of changes made]

## Manual Review Needed
- [File]: [Reason]

## Verification
- UI Review: [Pass/Fail]
- Visual regression: [Needs screenshot comparison]
```

## Usage
```
/fix-card-soup                    # Fix all files
/fix-card-soup HomeScreen.tsx     # Fix specific file
/fix-card-soup --dry-run          # Preview changes only
```
