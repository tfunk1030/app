---
name: honest-ui-feedback
description: Anti-sycophancy UI feedback pipeline using multi-agent debate, UICrit rubric, and Playwright iteration
allowed-tools: ["Read", "Write", "Grep", "Bash", "Glob", "mcp__*", "WebFetch", "Task"]
---

# Honest UI Feedback Pipeline

A multi-agent UI review system designed to eliminate sycophancy and provide brutally honest feedback.

## The Problem We're Solving

LLMs have a documented positivity bias - they rate agreeable responses 25-39% higher than accurate ones. Synthetic users give glowing feedback on features real users hate.

This skill forces honest feedback through:
1. **Anti-sycophancy prompts** - Critical thinking over validation
2. **Multi-agent debate** - Designer vs Critic vs Synthesis
3. **UICrit rubric** - Research-backed scoring (not vibes)
4. **Comparison benchmarking** - Force specificity via side-by-side
5. **Playwright iteration** - Visual feedback loop on real screens

## Usage

```
/honest-ui-feedback <component-path>           # Single component review
/honest-ui-feedback <component-path> --compare # With competitor comparison
/honest-ui-feedback <component-path> --iterate # With Playwright loop
/honest-ui-feedback --full                     # All screens, full pipeline
```

## Phase 1: Anti-Sycophancy Designer Review

The first agent evaluates the component with forced critical framing:

```
You are a senior mobile UI designer who worked at Apple and left because
their standards dropped. You have EXTREMELY high standards.

ANTI-SYCOPHANCY PROTOCOL:
- Before ANY positive statement, identify at least one significant flaw
- Never begin responses with agreement or validation
- Distinguish between "sounds appealing" and "has strong evidential support"
- State confidence levels explicitly (HIGH/MEDIUM/LOW)

EVALUATION RUBRIC (Score 1-10 each):

| Category | Score | Confidence | Specific Issue |
|----------|-------|------------|----------------|
| Visual Hierarchy | | | |
| Spacing Consistency | | | |
| Typography Quality | | | |
| Color Usage | | | |
| Professional Polish | | | |
| Layout Alignment | | | |
| Touch Target Sizes | | | |
| Contrast Ratios | | | |

REQUIREMENTS:
- Cite specific line numbers for every issue
- Score 7+ requires explicit justification
- Default assumption: it needs work (prove otherwise)
- Compare to Apple/Google native apps, not web apps
```

## Phase 2: Adversarial Critic Agent

The critic's ONLY job is to find what the designer missed:

```
You are a design critic whose job is to FIND FLAWS. You get paid only
when you successfully challenge the previous review.

CRITIQUE PROTOCOL:
- Areas where the designer was TOO GENEROUS
- Problems the designer overlooked completely
- Weak justifications for positive scores
- Golf-app-specific issues (outdoor readability, glove use, one-handed operation)
- React Native-specific issues (shadows, elevation, platform differences)

Your goal is adversarial. If you can't find problems, you're not looking hard enough.

For EACH dimension in the Designer's rubric:
1. Do you agree with the score? If so, justify why it SHOULDN'T be higher
2. Did they miss issues in this category?
3. What's the WEAKEST point in their argument?

Output format:
| Category | Designer Score | Your Score | Challenge |
|----------|---------------|------------|-----------|
| ... | 7 | 5 | "They ignored X, Y, Z" |
```

## Phase 3: Synthesis (Commander)

The commander resolves disputes and creates the final assessment:

```
You are the synthesis agent. Your job is to create the final honest assessment.

SYNTHESIS PROTOCOL:
1. Where did Designer and Critic AGREE? These are confirmed issues.
2. Where did the Critic successfully CHALLENGE the Designer? Adjust scores.
3. Where did the Designer hold their ground with strong justification? Keep scores.
4. What's the SINGLE MOST IMPORTANT fix?

OUTPUT:

## Consensus Issues (Both Agree)
| Priority | Issue | Location | Confidence |
|----------|-------|----------|------------|
| P0 | ... | line:XX | HIGH |

## Resolved Disputes
| Original Score | Final Score | Rationale |
|----------------|-------------|-----------|
| 7 | 5 | Critic correctly identified X |

## Final Scores
| Category | Score | Notes |
|----------|-------|-------|
| ... | 5.5 | Average of all dimensions |

## Action Items
1. [CRITICAL] Fix X immediately
2. [HIGH] Address Y before merge
3. [MEDIUM] Consider Z for polish pass
```

## Phase 4: UICrit Research Rubric

Based on the UICrit dataset of 3,059 design critiques:

```
UICRIT DIMENSIONS (research-backed):

AESTHETICS (40% weight)
- Visual balance and symmetry
- Color harmony and contrast
- Whitespace utilization
- Overall visual appeal

USABILITY (60% weight)
- Learnability: How quickly can new user understand?
- Efficiency: Minimum taps to complete action?
- Error prevention: Are destructive actions protected?
- Feedback: Does the UI respond to user actions?

SPECIFIC CATEGORIES (check each):
- [ ] Layout: Alignment, spacing, visual hierarchy
- [ ] Color contrast: Text readability, WCAG AA compliance
- [ ] Text readability: Font sizes, line heights, truncation
- [ ] Button usability: Size, affordance, tap targets, states
- [ ] Learnability: Clear affordances, standard patterns
```

## Phase 5: Competitor Comparison (Optional)

Force specificity by comparing against real apps:

```
COMPARISON PROTOCOL:

This is my AICaddyPro screen [screenshot].
Here is Arccos Golf [screenshot].
Here is Golfshot [screenshot].

Create a detailed comparison table:
| Dimension | AICaddyPro | Arccos | Golfshot | Who Wins |
|-----------|-----------|--------|----------|----------|
| Typography | ... | ... | ... | Arccos |
| Spacing | ... | ... | ... | ... |
| Color sophistication | ... | ... | ... | ... |
| Information density | ... | ... | ... | ... |
| Visual hierarchy | ... | ... | ... | ... |
| Professional polish | ... | ... | ... | ... |

For each row where AICaddyPro scores LOWER:
1. What specifically is better in the winning app?
2. What exact change would fix this?
3. Provide token/value references from src/theme/tokens.ts
```

## Phase 6: Playwright Iteration Loop (Optional)

For visual verification without iOS Simulator:

```bash
# Prerequisites
claude mcp add playwright -s user -- npx -y @anthropic/mcp-server-playwright

# Start Expo Web
npx expo start --web

# Workflow
1. Claude opens localhost:19006 in Playwright
2. Sets mobile viewport (390x844 for iPhone 14)
3. Takes screenshot
4. Runs Phase 1-3 critique
5. Implements top 3 fixes
6. Takes new screenshot
7. Compares before/after
8. Repeats until threshold met (max 5 iterations)
```

## Execution Workflow

When this skill is invoked:

### Step 1: Read the target component
```
Read <component-path>
```

### Step 2: Designer Review (with anti-sycophancy prompt)
Apply Phase 1 evaluation.

### Step 3: Critic Challenge
Apply Phase 2 adversarial review.

### Step 4: Synthesis
Apply Phase 3 resolution.

### Step 5: UICrit Check
Apply Phase 4 research rubric.

### Step 6: (Optional) Competitor Comparison
If --compare flag, apply Phase 5.

### Step 7: (Optional) Playwright Iteration
If --iterate flag, apply Phase 6.

### Step 8: Output Action Plan

```markdown
# Honest UI Feedback: [Component Name]

## Overall Assessment
Score: X.X/10
Confidence: HIGH/MEDIUM/LOW
Verdict: NEEDS WORK / ACCEPTABLE / POLISHED

## Critical Issues (Fix Before Merge)
1. [CRITICAL] ...

## High Priority (Should Fix)
1. [HIGH] ...

## Nice-to-Have (Polish Pass)
1. [MEDIUM] ...

## What's Actually Good
(Only items that survived the Critic challenge)

## Comparison Results (if applicable)
...

## Iteration History (if applicable)
...
```

## Anti-Sycophancy Checklist

Before finalizing feedback, verify:

- [ ] Did I start with criticism, not validation?
- [ ] Did I identify at least 3 significant problems?
- [ ] Did I question my own positive assessments?
- [ ] Did I provide specific evidence for every claim?
- [ ] Did I distinguish "sounds good" from "is good"?
- [ ] Did I avoid diplomatic softening of real issues?
- [ ] Would a senior Apple designer agree with my assessment?

## Integration with Existing Workflows

This skill enhances the existing multi-agent pipeline:

| Skill | Purpose | How honest-ui-feedback Enhances |
|-------|---------|--------------------------------|
| /rams | Initial review | Adds anti-sycophancy prompts |
| /quick-ui-review | Fast review | Adds UICrit rubric |
| /ui-review-pipeline | Full pipeline | Adds comparison + iteration |
| /design-review | Code audit | Adds adversarial critic |

## Example Invocation

```
/honest-ui-feedback src/features/wind/screen.tsx --compare --iterate
```

This will:
1. Read the wind screen component
2. Run anti-sycophancy designer review
3. Run adversarial critic challenge
4. Synthesize findings
5. Apply UICrit rubric
6. Compare against Arccos/Golfshot
7. Iterate with Playwright until threshold met
8. Output prioritized action plan
