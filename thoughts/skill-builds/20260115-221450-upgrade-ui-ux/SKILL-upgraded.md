---
name: ui-ux-pro-max
description: "Decision Theory v5 Hybrid UI/UX skill with MDP formalization, modal logic constraints, and formal verification. React Native optimized for AICaddyPro."
version: 5.1-hybrid
stack: react-native
triggers:
  - "design UI"
  - "build component"
  - "create screen"
  - "review design"
  - "fix UI"
  - "improve UX"
  - "accessibility audit"
---

# UI/UX Pro Max v5.1 Hybrid

Decision Theory formalization of UI/UX design intelligence with formal verification.

## Initiation (I)

**Activate this skill when user request matches:**

| Pattern | Examples |
|---------|----------|
| Design/Build verbs | "design a dashboard", "build a landing page", "create a modal" |
| Review/Audit verbs | "review this component", "audit accessibility", "check design" |
| Fix/Improve verbs | "fix the spacing", "improve contrast", "make it responsive" |
| UI/UX keywords | "button", "form", "navbar", "card", "table", "chart" |
| Style keywords | "glassmorphism", "dark mode", "minimalist", "professional" |

**Prerequisites check:**
```bash
python3 --version || echo "Python required for search.py"
```

---

## Observation Space (Y)

**What the agent observes/tracks during episode:**

### Phase State (Fully Observable)
```
Y_phase ∈ {S_init, S_analyze, S_search, S_synthesize, S_implement, S_verify, S_deliver}
```

### State Variables (Partially Observable)
| Variable | Domain | Observability |
|----------|--------|---------------|
| `product_type` | {SaaS, e-commerce, portfolio, dashboard, landing, mobile} | Extracted from request |
| `style_keywords[]` | {minimal, playful, professional, elegant, dark, bold} | Extracted from request |
| `industry` | {healthcare, fintech, gaming, education, beauty, golf} | May be implicit |
| `stack` | {react-native, react, nextjs, vue, svelte, flutter} | Default: react-native |
| `search_results{}` | Domain knowledge accumulated | Observable after search |
| `checklist_status{}` | Pass/fail per item | Observable after verify |
| `confidence` | [0, 1] | Belief state estimate |

### POMDP Hidden State
- User's true aesthetic preferences (partially hidden)
- Search completeness (no formal metric)
- Final user satisfaction (revealed only at delivery)

---

## Action Space (U)

### Phase 1: Analysis Actions
```python
U_analyze = {
    extract_product_type(request),
    extract_style_keywords(request),
    extract_industry(request),
    detect_stack(request)  # Default: react-native for this project
}
```

### Phase 2: Search Actions
```python
U_search = {
    search(keyword, domain)  # domain ∈ {product, style, typography, color, landing, chart, ux, prompt}
    search(keyword, stack)   # stack ∈ {react-native, react, nextjs, vue, svelte, swiftui, flutter}
}
```

**Search command:**
```bash
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "<keyword>" --domain <domain> [--stack react-native]
```

### Phase 3: Synthesis Actions
```python
U_synthesize = {
    combine_results(),
    resolve_conflicts()
}
```

### Phase 4: Implementation Actions
```python
U_implement = {
    generate_code(design_system, stack="react-native"),
    apply_common_rules()
}
```

### Phase 5: Verification Actions
```python
U_verify = {
    check_accessibility(),    # Q = 0.95 (highest priority)
    check_contrast(),         # Q = 0.90
    check_light_dark(),       # Q = 0.85
    check_touch_targets(),    # Q = 0.80 (React Native specific)
    check_layout(),           # Q = 0.65
    check_visual_quality(),   # Q = 0.60
    check_interaction()       # Q = 0.50
}
```

---

## Policy (π)

**State → Action mapping rules:**

### π(S_init)
```
IF user_request_received THEN
    transition_to(S_analyze)
```

### π(S_analyze)
```
EXTRACT product_type FROM request
EXTRACT style_keywords FROM request
EXTRACT industry FROM request (or INFER from product_type)
SET stack = "react-native" (project default)

IF confidence(requirements) < 0.6 THEN
    ASK clarifying_question
ELSE
    transition_to(S_search)
```

### π(S_search)
```
# Recommended search order (by Q-value)
1. search(industry, domain=ux, keyword="accessibility")  # Q=0.90
2. search(industry, domain=color)                         # Q=0.75
3. search(industry, domain=typography)                    # Q=0.75
4. search(product_type, domain=product)                   # Q=0.60
5. search(style_keywords, domain=style)                   # Q=0.60
6. search("layout responsive", stack=react-native)        # Stack-specific

# Termination criterion (explicit)
search_complete = (∀d ∈ required_domains: results[d].count ≥ 1)

IF search_complete THEN transition_to(S_synthesize)
ELSE search_next_domain()
```

### π(S_synthesize)
```
design_system = combine_results(search_results)
IF conflicts_detected THEN resolve_conflicts(industry_priority)
transition_to(S_implement)
```

### π(S_implement)
```
code = generate_code(design_system, stack="react-native")
apply_common_rules(code)
transition_to(S_verify)
```

### π(S_verify) - Fail-Fast Order by Q-Value
```
# Run checks in Q-value order (highest first)
FOR check IN [accessibility, contrast, light_dark, touch_targets, layout, visual, interaction]:
    result = run_check(check)
    IF result == FAIL THEN
        fix_violation(check)
        loop_count += 1
        IF loop_count > 5 THEN
            TERMINAL(τ_loop_limit)
        ELSE
            transition_to(S_implement)  # Retry

IF all_checks_pass THEN transition_to(S_deliver)
```

### π(S_deliver)
```
OUTPUT code
TERMINAL(τ_deliver)
```

---

## Termination (β)

**Episode ends when:**

### Success Terminals (τ⁺)
| Terminal | Condition | Reward |
|----------|-----------|--------|
| τ_deliver | All checklist items PASS | +100 |
| τ_user_accept | User confirms satisfaction | +50 |
| τ_review_pass | No P0 issues, ≤2 P1 issues | +25 |

### Failure Terminals (τ⁻)
| Terminal | Condition | Reward |
|----------|-----------|--------|
| τ_prereq_fail | Python unavailable, user declines install | -10 |
| τ_loop_limit | S_verify → S_implement loop > 5 times | -50 |
| τ_search_exhaust | 3+ consecutive searches return 0 results | -20 |
| τ_conflict | User requirements contradict a11y standards | -20 |

**Formal termination:**
```
β(s) = TRUE iff:
    (s = S_deliver ∧ ∀c: checklist[c] = PASS)
    ∨ (loop_count > MAX_RETRIES)
    ∨ (prereq_available = FALSE)
```

---

## Q-Heuristics

**Action-value guidance for decision-making:**

### Verification Priority (Fail-Fast Order)
| Check | Q(s,a) | Rationale |
|-------|--------|-----------|
| `check_accessibility()` | 0.95 | Legal compliance, highest penalty |
| `check_contrast()` | 0.90 | Most common a11y failure |
| `check_light_dark()` | 0.85 | 50% of users see opposite mode |
| `check_touch_targets()` | 0.80 | Golf app: gloves, outdoor use |
| `check_layout()` | 0.65 | Responsive, no horizontal scroll |
| `check_visual_quality()` | 0.60 | Icons, logos, hover states |
| `check_interaction()` | 0.50 | Cursor, transitions (easy fixes) |

### Search Priority
| Domain | Q(s,a) | Rationale |
|--------|--------|-----------|
| ux (accessibility) | 0.90 | Prevents critical failures |
| color | 0.75 | Palette cascades everywhere |
| typography | 0.75 | Font defines identity |
| style | 0.60 | Good aesthetic guidance |
| product | 0.60 | Sets initial direction |
| chart | 0.30 | Context-conditional |

### Reward Shaping
| Good Action | Reward | Bad Action | Penalty |
|-------------|--------|------------|---------|
| Design token used | +1 | Hardcoded hex | -3 |
| SVG icon | +1 | Emoji icon | -5 |
| cursor-pointer | +1 | Missing cursor | -2 |
| Contrast ≥4.5:1 | +2 | Contrast <4.5:1 | -10 |
| Touch target ≥48dp | +2 | Touch target <48dp | -8 |
| FlashList for >20 items | +2 | FlatList for >20 items | -5 |
| Both modes tested | +2 | Single mode only | -4 |

---

## Constraints

### Temporal (□→ ordering)
| ID | Constraint | Notation |
|----|------------|----------|
| T1 | Analyze BEFORE search | analyze □→ search |
| T2 | Search BEFORE implement | search □→ implement |
| T3 | Verify BEFORE deliver | verify □→ deliver |
| T4 | Accessibility check FIRST in verify | a11y □→ other_checks |

### Epistemic (K knowledge)
| ID | Constraint | Notation |
|----|------------|----------|
| E1 | Must know product type | K(productType) |
| E2 | Must know style keywords | K(styleKeywords) |
| E3 | Must know contrast ratios | K(contrastRatio) |
| E4 | Must know touch target sizes | K(touchTargetSize) |

### Deontic (O/F obligations)
| ID | Constraint | Notation |
|----|------------|----------|
| **OBLIGATORY** | | |
| D1 | Use SVG icons | O(SVGicons) |
| D2 | Provide cursor-pointer | O(cursorPointer) |
| D3 | Verify contrast | O(verifyContrast) |
| D4 | Have accessibilityLabel | O(accessibilityLabel) |
| D5 | Test both light/dark | O(testBothModes) |
| D6 | Touch targets ≥48dp | O(touchTarget48dp) |
| D7 | Use FlashList for >20 items | O(FlashList) |
| **FORBIDDEN** | | |
| D8 | Emoji as icons | F(emojiIcons) |
| D9 | Scale hover transforms | F(scaleHover) |
| D10 | Hardcoded colors | F(hardcodedColors) |
| D11 | Horizontal scroll mobile | F(horizontalScroll) |
| D12 | Guess brand logos | F(guessBrandLogo) |
| D13 | FlatList for >20 items | F(FlatListLarge) |

---

## Verification

### Safety Properties (□¬bad)
```
□¬(emoji-as-icon)           # Never use emoji as UI icon
□¬(contrast-below-4.5)      # Never ship low contrast
□¬(touch-target-below-48dp) # Never ship small touch targets
□¬(hardcoded-colors)        # Never hardcode hex values
□¬(horizontal-scroll)       # Never have horizontal scroll on mobile
□¬(missing-a11y-props)      # Never omit accessibilityLabel/Role
□¬(FlatList-over-20)        # Never use FlatList for large lists
□¬(content-behind-navbar)   # Never hide content behind fixed elements
□¬(layout-shift-hover)      # Never cause layout shift on hover
□¬(incorrect-logo)          # Never guess brand logos
```

### Liveness Properties (◇good)
```
◇(test-light-mode)          # Eventually test light mode
◇(test-dark-mode)           # Eventually test dark mode
◇(verify-breakpoints)       # Eventually verify responsive
◇(a11y-audit-complete)      # Eventually complete accessibility audit
◇(all-checklist-pass)       # Eventually pass all checklist items
◇(severity-assigned)        # Eventually assign severity to issues
◇(verdict-rendered)         # Eventually render PASS/FAIL verdict
```

### Consistency
- Stack default: `react-native` (matches AICaddyPro project)
- Contrast: 4.5:1 minimum (matches WCAG AA)
- Touch targets: 48dp minimum, 56dp primary (matches CLAUDE.md)
- Transition timing: 150-300ms (matches both skills)

### Completeness
- ✓ Touch target requirements (project-specific)
- ✓ FlashList for large lists (project requirement)
- ✓ Outdoor/sunlight readability consideration
- ✓ One-handed thumb-zone operation
- ✓ Glove-use larger targets (golf app specific)

---

## Pre-Delivery Checklist

### Accessibility (P0 - Ship Blockers)
- [ ] All interactive elements have `accessibilityLabel`
- [ ] All interactive elements have `accessibilityRole`
- [ ] Touch targets ≥48dp (56dp for primary actions)
- [ ] Contrast ratio ≥4.5:1 for all text
- [ ] `prefers-reduced-motion` / `useReducedMotion()` respected
- [ ] Dynamic content announces via `AccessibilityInfo.announceForAccessibility`

### Visual Quality (P1)
- [ ] No emojis used as icons (use SVG: Heroicons, Lucide)
- [ ] All icons from consistent set with fixed viewBox
- [ ] Brand logos verified from Simple Icons
- [ ] Hover states use color/opacity, not scale transforms
- [ ] Theme colors used directly (not var() wrapper)

### Interaction (P1)
- [ ] All clickable elements have `cursor-pointer`
- [ ] Transitions are 150-300ms or spring physics
- [ ] Focus states visible for keyboard navigation
- [ ] `hitSlop` used for undersized touch targets

### Light/Dark Mode (P1)
- [ ] Both modes tested before delivery
- [ ] Glass/transparent elements visible in light mode
- [ ] Borders visible in both modes
- [ ] Text contrast sufficient in both modes

### Layout (P1)
- [ ] Responsive at 320px, 768px, 1024px, 1440px
- [ ] No horizontal scroll on mobile
- [ ] Fixed elements don't hide content
- [ ] One-handed thumb-zone operation verified

### React Native Specific (P1)
- [ ] FlashList used for lists >20 items
- [ ] `accessibilityState` for dynamic states
- [ ] Outdoor/sunlight readability considered
- [ ] Glove-friendly touch target sizing

---

## Review Output Format

When running design review, output as table:

| Issue | Severity | Location | Constraint | Fix |
|-------|----------|----------|------------|-----|
| (description) | P0/P1/P2 | file:line | D1-D13 | (action) |

**Pass Criteria:**
- ✓ PASS: No P0 issues AND ≤2 P1 issues
- ✗ FAIL: Any P0 issue OR >2 P1 issues

---

## Usage

```bash
# Search for design guidance
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "golf dashboard" --domain product
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "outdoor readability" --domain ux
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "accessibility" --stack react-native

# Design review
# (Use design-review skill or run checklist manually)
```

---

*Upgraded to v5.1 Hybrid on 2026-01-15 using Decision Theory + Modal Logic framework.*
*Source analysis: LaValle (MDP), Sutton & Barto (RL), Blackburn (Modal), Huth & Ryan (Verification)*
