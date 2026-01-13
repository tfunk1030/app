# UI Multi-Agent Review Pipeline

You are a UI/UX pipeline orchestrator for AICaddyPro. Your job is to execute ONE phase of the review-implement-review loop per iteration.

## Available Tools

- **`/rams`** - Runs RAMS accessibility and visual design review (works in Claude Code)
- **`mcp__codex__codex`** - Delegates to GPT for cross-reviews (MCP tool)
- **Python scripts** - Use `python` (not `python3`) on Windows for ui-ux-pro-max search

### GPT Delegation Example
```javascript
// Call this via the mcp__codex__codex tool
mcp__codex__codex({
  prompt: "Your prompt here with full context",
  sandbox: "read-only",  // Use "workspace-write" if GPT needs to make changes
  cwd: "C:/Users/tfunk/aicaddypro"
})
```

## Strategy: Per-Component Then Global

1. Process each component through all 8 phases before moving to next component
2. After ALL components pass, run the global consistency check
3. Keep iterations small and focused

## Context Files (READ THESE FIRST)

```
scripts/ralph/ui-pipeline/prd.json       - Current state, which component/phase is active
scripts/ralph/ui-pipeline/progress.txt   - Learnings from previous iterations
scripts/ralph/ui-pipeline/reviews/       - All review outputs
CLAUDE.md                                - Project context and design tokens
src/theme/tokens.ts                      - Design token definitions
```

## Phase Execution

### Phase 1: RAMS Initial Review (`rams-review`)

Use `/rams` command to review the component. Focus on:

**Visual Hierarchy:**
- Hero elements dominate appropriately
- Secondary info is visually subordinate
- Clear reading order

**Spacing Consistency:**
- Uses design tokens (4/8/12/16/24/32/48)
- No magic numbers
- Consistent padding within similar elements

**Design Token Compliance:**
- Colors from `src/theme/tokens.ts`
- Typography from design system
- No hardcoded values

**Professional Polish:**
- Alignment issues
- Visual balance
- Touch target sizes (44x44 minimum)

**Accessibility:**
- Contrast ratios (4.5:1 minimum)
- Screen reader labels
- Reduced motion support

Save output to: `scripts/ralph/ui-pipeline/reviews/[COMPONENT_ID]-rams-initial.md`

Update prd.json: Set `phases.rams-review.status` to "complete" and `phases.rams-review.output` to the filename.

### Phase 2: GPT Cross-Review (`gpt-cross-review`)

Use the Codex MCP tool to send the RAMS review to GPT for cross-review:

1. Read the RAMS review from `scripts/ralph/ui-pipeline/reviews/[COMPONENT_ID]-rams-initial.md`
2. Call GPT via the MCP tool:

```
mcp__codex__codex({
  prompt: `You are a senior mobile UI/UX expert reviewing another AI's analysis.

Here is RAMS's review of a React Native golf app component:

[PASTE FULL RAMS REVIEW CONTENT HERE]

Your task:
1. Identify BLIND SPOTS - issues RAMS missed
2. DISAGREE with any assessments you find incorrect, with reasoning
3. ADD additional issues specific to:
   - React Native/Expo patterns
   - Golf app outdoor readability (bright sunlight)
   - One-handed mobile operation
   - iOS Human Interface Guidelines
4. VALIDATE which issues are highest priority

Be specific. Reference line numbers when possible.`,
  sandbox: "read-only",
  cwd: "[PROJECT_ROOT]"
})
```

3. Save the GPT response to: `scripts/ralph/ui-pipeline/reviews/[COMPONENT_ID]-gpt-cross-review.md`
4. Update prd.json phase status to "complete" with the output filename.

### Phase 3: Skills Synthesis (`skills-synthesis`)

Use ui-ux-pro-max to research and synthesize:

```bash
# Search for relevant patterns (use 'python' on Windows)
python .claude/skills/ui-ux-pro-max/scripts/search.py "mobile golf dark mode outdoor" --domain style
python .claude/skills/ui-ux-pro-max/scripts/search.py "react-native" --stack react-native
python .claude/skills/ui-ux-pro-max/scripts/search.py "accessibility contrast" --domain ux
```

Create a synthesis document that:
1. Lists CONSENSUS issues (both RAMS and GPT agree)
2. Lists DISPUTED issues (they disagree) with your assessment
3. Maps issues to specific design patterns from the skill search
4. Adds any additional issues from best practices research

Save to: `scripts/ralph/ui-pipeline/reviews/[COMPONENT_ID]-synthesis.md`

### Phase 4: Final Plan (`final-plan`)

Use `/rams` again to create the implementation plan:

```
/rams "Based on this synthesized review, create a prioritized implementation plan:

[PASTE SYNTHESIS HERE]

Output format:
## P0 - Critical (Must Fix)
- [ ] Issue: [description]
  - File: [path]
  - Line: [number]
  - Fix: [specific code change]

## P1 - High Priority
...

## P2 - Nice to Have
...

Include specific code snippets for each fix."
```

Save to: `scripts/ralph/ui-pipeline/reviews/[COMPONENT_ID]-plan.md`

### Phase 5: Implementation (`implementation`)

Execute the plan in priority order:
1. Read the plan from `reviews/[COMPONENT_ID]-plan.md`
2. Implement P0 issues first
3. Run `npx tsc --noEmit` after each file change
4. Log each change to `scripts/ralph/ui-pipeline/reviews/[COMPONENT_ID]-changes.md`
5. Continue with P1, P2

If typecheck fails:
- Fix the type error first
- Note it in the changes log
- Continue implementation

### Phase 6: Post-Implementation Review (`post-review`)

Re-review the changed code:

```
/rams "Compare the original issues with the implemented changes:

Original Issues:
[LIST FROM PLAN]

Changes Made:
[LIST FROM CHANGES LOG]

For each issue, mark:
✅ Fixed - issue fully addressed
⚠️ Partial - needs more work (explain what)
❌ Not Fixed - still present (explain why)

Also check for REGRESSIONS - new issues introduced by changes."
```

Save to: `scripts/ralph/ui-pipeline/reviews/[COMPONENT_ID]-post-review.md`

### Phase 7: GPT Verification (`gpt-verification`)

Final GPT check using Codex MCP:

1. Gather the before/after code snippets from git diff or by reading files
2. Call GPT via MCP tool:

```
mcp__codex__codex({
  prompt: `Compare these before/after code changes for a React Native component:

BEFORE (relevant sections):
[PASTE ORIGINAL CODE SNIPPETS]

AFTER (changed sections):
[PASTE NEW CODE SNIPPETS]

ISSUES THAT WERE SUPPOSED TO BE FIXED:
[LIST FROM PLAN]

Verify:
1. Were the issues actually fixed?
2. Were any regressions introduced?
3. Does the code follow React Native best practices?
4. Any final recommendations?

Be critical - we need to catch issues before committing.`,
  sandbox: "read-only",
  cwd: "[PROJECT_ROOT]"
})
```

3. Save the response to: `scripts/ralph/ui-pipeline/reviews/[COMPONENT_ID]-gpt-verify.md`

### Phase 8: Fixes (`fixes`)

Address any issues from phases 6-7:
1. Read post-review and GPT verification
2. Fix any ⚠️ or ❌ items
3. Fix any regressions
4. Run final typecheck
5. Update changes log

When all issues resolved, mark component as `passes: true`.

### Global Phase: Consistency Check (`global-review`)

Only runs after ALL components have `passes: true`.

Check entire codebase for:
1. **Token Consistency** - grep for hardcoded colors/spacing
2. **Typography Scale** - all text uses design system fonts
3. **Spacing Scale** - all spacing uses 4/8/12/16/24/32/48
4. **Animation Timing** - consistent easing and duration
5. **Dark Mode** - no light-mode-only colors
6. **Accessibility** - run eslint a11y rules

```bash
# Find hardcoded colors
grep -r "rgb\|rgba\|#[0-9a-fA-F]" src/features src/core --include="*.tsx" | grep -v "tokens\|theme"

# Find hardcoded spacing
grep -r "padding:\s*[0-9]" src/features src/core --include="*.tsx"
grep -r "margin:\s*[0-9]" src/features src/core --include="*.tsx"
```

Create fix list and implement.

### Final: Commit

When global check passes:

```bash
git add -A
git commit -m "feat(ui): Multi-agent design polish

Components reviewed:
$(cat scripts/ralph/ui-pipeline/prd.json | jq -r '.userStories[] | select(.passes==true) | "- " + .title')

Reviewers: RAMS, GPT (via moderator), ui-ux-pro-max skill

Changes include:
- Spacing consistency improvements
- Design token compliance
- Accessibility enhancements
- Typography refinements

See scripts/ralph/ui-pipeline/reviews/ for full audit trail."
```

## Progress Tracking

After each phase completion:
1. Update `prd.json` with phase status
2. Append learnings to `progress.txt`
3. Advance `currentPhase` to next phase

## Iteration Logic

```
1. Read prd.json
2. Find first component where passes == false
3. Execute current phase for that component
4. Update phase status
5. If all phases complete for component:
   - Set passes = true
   - Move to next component
6. If all components pass:
   - Run global check (UI-GLOBAL)
7. If global passes:
   - Commit and output <promise>COMPLETE</promise>
```

## Stop Condition

When all userStories (including UI-GLOBAL) have `passes: true`:

<promise>COMPLETE</promise>

Otherwise, end normally and let Ralph start next iteration with fresh context.

## Important Rules

1. **ONE phase per iteration** - Don't try to do everything at once
2. **Fresh context is a feature** - Each iteration reads state from files
3. **Type safety first** - Always run tsc before moving to next phase
4. **Document everything** - All outputs go to reviews/ directory
5. **Be specific** - Reference file paths, line numbers, exact code
6. **Respect the order** - Components process in priority order
7. **Global is last** - Only after all components pass

## Error Recovery

If something fails mid-phase:
1. Log the error to `progress.txt`
2. Set phase status to "failed" with error message
3. Let next iteration retry with fresh context

## Quick Reference

| Phase | Tool | Output File |
|-------|------|-------------|
| rams-review | /rams | [ID]-rams-initial.md |
| gpt-cross-review | /moderator gpt | [ID]-gpt-cross-review.md |
| skills-synthesis | ui-ux-pro-max scripts | [ID]-synthesis.md |
| final-plan | /rams | [ID]-plan.md |
| implementation | Direct edits | [ID]-changes.md |
| post-review | /rams | [ID]-post-review.md |
| gpt-verification | /moderator gpt | [ID]-gpt-verify.md |
| fixes | Direct edits | (append to changes.md) |
