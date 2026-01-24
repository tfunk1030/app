---
name: quick-ui-review
description: Quick multi-agent UI review for a single component (no Ralph needed)
allowed-tools: ["Read", "Write", "Grep", "Bash", "Glob", "mcp__*"]
---

# Quick Multi-Agent UI Review

Fast, single-component review using RAMS + GPT + skills. No automation, just thorough analysis.

## Usage

```
/project:quick-ui-review src/features/redesign/screens/PlayScreen.tsx
```

## Process

I'll execute these steps in sequence:

### 1. Read Component
First, let me read the target component to understand its current state.

### 2. RAMS Review
```
/rams Analyze this React Native component for:

**Visual Hierarchy:**
- Hero elements appropriate size/weight
- Information priority reflected in visual treatment
- Clear reading order

**Spacing:**
- Uses design tokens (4/8/12/16/24/32/48)
- Consistent internal/external spacing
- No magic numbers

**Design Tokens:**
- Colors from theme
- Typography from system
- No hardcoded values

**Accessibility:**
- Touch targets ≥44pt
- Contrast ≥4.5:1
- Screen reader labels present

**Professional Polish:**
- Alignment precise
- Visual balance
- No orphaned elements

Be specific with line numbers and file paths.
```

### 3. GPT Cross-Review
```
/moderator gpt "You're reviewing a React Native golf app component analysis.

[RAMS REVIEW HERE]

Tasks:
1. Identify BLIND SPOTS the reviewer missed
2. DISAGREE with incorrect assessments  
3. ADD React Native-specific issues
4. Consider: outdoor readability, one-handed use, glanceability

Be critical and specific."
```

### 4. Skills Research
```bash
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "mobile golf outdoor" --domain style
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "react-native" --stack react-native
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "accessibility" --domain ux
```

### 5. Synthesis Report

I'll create a final report with:

```markdown
# UI Review: [Component Name]

## Consensus Issues (Both Agree)
| Priority | Issue | Location | Suggested Fix |
|----------|-------|----------|---------------|
| P0 | ... | line X | ... |

## Disputed Points
| RAMS Says | GPT Says | Resolution |
|-----------|----------|------------|
| ... | ... | ... |

## Additional Findings (from Skills)
- Pattern research results
- Best practices to apply

## Recommended Actions
1. P0 (Fix Now): ...
2. P1 (Important): ...
3. P2 (Nice-to-have): ...
```

### 6. Optional: Quick Fixes

If you want me to implement the P0 fixes immediately, just say "implement P0" after seeing the report.

## Output

The review will be displayed directly. No files created unless you run the full pipeline.

For full automation with file tracking, use:
- `/project:ui-review-pipeline` (manual control)
- `scripts/ralph/ui-pipeline/run-ui-pipeline.bat` (full automation)
