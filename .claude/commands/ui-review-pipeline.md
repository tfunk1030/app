---
name: ui-review-pipeline
description: Multi-agent UI review pipeline using RAMS, GPT, and ui-ux-pro-max
allowed-tools: ["Read", "Write", "Grep", "Bash", "Glob", "mcp__*"]
---

# UI Multi-Agent Review Pipeline

Execute a comprehensive UI review using multiple AI perspectives:
1. **RAMS** - Initial UI/UX review
2. **GPT** (via moderator) - Cross-review and blind spot detection
3. **ui-ux-pro-max** - Design pattern synthesis
4. **RAMS** - Final plan creation
5. **Claude** - Implementation
6. **Both** - Post-implementation verification

## Usage

Invoke with a target component or screen:
```
/project:ui-review-pipeline app/(tabs-redesign)/index.tsx
```

Or for a full pipeline run:
```
/project:ui-review-pipeline --all
```

## Execution Flow

### Step 1: RAMS Initial Review

```
/rams Review this component for:
- Visual hierarchy and spacing consistency
- Design token compliance (check src/theme/tokens.ts)
- Accessibility (contrast, touch targets, labels)
- Professional polish and alignment
- React Native/Expo best practices

Be specific with file paths and line numbers.
```

### Step 2: GPT Cross-Review

Use the Codex MCP tool to get GPT's cross-review:

```
mcp__codex__codex({
  prompt: `You are reviewing another AI's UI analysis. Identify blind spots,
disagree with incorrect assessments, and add React Native-specific issues.
Focus on outdoor readability for a golf app and one-handed mobile operation.

[PASTE RAMS OUTPUT HERE]`,
  sandbox: "read-only"
})
```

### Step 3: Skills Synthesis

Use ui-ux-pro-max to research patterns:
```bash
python .claude/skills/ui-ux-pro-max/scripts/search.py "mobile dark mode outdoor" --domain style
python .claude/skills/ui-ux-pro-max/scripts/search.py "react-native" --stack react-native
```

Create synthesis of all reviews with:
- CONSENSUS issues (all agree)
- DISPUTED issues (with resolution)
- ADDITIONAL issues from best practices

### Step 4: Final Plan

```
/rams Based on the synthesis, create a prioritized implementation plan with:
- P0 (Critical): Accessibility, crashes
- P1 (High): Spacing, hierarchy, consistency
- P2 (Nice-to-have): Polish, micro-interactions

Include specific code snippets for each fix.
```

### Step 5: Implementation

Execute the plan:
1. Implement P0 issues
2. Run `npx tsc --noEmit`
3. Implement P1 issues
4. Run typecheck again
5. Implement P2 if time permits

### Step 6: Post-Implementation Review

```
/rams Compare original issues with changes made. Mark each:
✅ Fixed | ⚠️ Partial | ❌ Not Fixed
Check for regressions.
```

### Step 7: GPT Verification

Use Codex MCP for final verification:
```
mcp__codex__codex({
  prompt: `Compare before/after code. Were issues fixed? Any regressions?

BEFORE CODE:
[PASTE BEFORE CODE]

AFTER CODE:
[PASTE AFTER CODE]`,
  sandbox: "read-only"
})
```

### Step 8: Fix & Commit

Address any remaining issues, then:
```bash
git add -A
git commit -m "feat(ui): [Component] - Multi-agent design polish

Reviewed by: RAMS, GPT, ui-ux-pro-max
- [List key changes]"
```

## Output Directory

All review outputs are saved to:
```
scripts/ralph/ui-pipeline/reviews/
├── [component]-rams-initial.md
├── [component]-gpt-cross-review.md
├── [component]-synthesis.md
├── [component]-plan.md
├── [component]-changes.md
├── [component]-post-review.md
└── [component]-gpt-verify.md
```

## Options

- `--all` - Run on all screens in priority order
- `--component <path>` - Run on specific component
- `--phase <name>` - Start from specific phase
- `--skip-gpt` - Skip GPT cross-review (faster, less thorough)
- `--dry-run` - Show what would be done without changes

## Notes

- Each phase builds on previous phase output
- Typecheck must pass before moving between phases
- Global consistency check runs after all components pass
- Full audit trail preserved in reviews/ directory
