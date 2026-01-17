# Skill Upgrade: ui-ux-pro-max
Started: 2026-01-15T22:14:50Z

## Input Skills
- `.claude/skills/ui-ux-pro-max/SKILL.md` (main)
- `.claude/skills/design-review-skill.md`
- `.claude/skills/ui-ux-pro-max.md` (legacy)

## Target Format
Decision Theory v5 Hybrid

## Agent Findings
(Agents append below)

---

## Agent 1: States, Actions & Transitions (LaValle MDP Analysis)

### 1. STATES - What Information the Agent Tracks

The UI/UX skill operates as a **finite-state system** with the following state components:

**Primary Phase States (Sequential):**
1. **S_init** - Initial state, user request received but not analyzed
2. **S_analyze** - Requirements extraction in progress
3. **S_search** - Database queries being executed
4. **S_synthesize** - Combining search results
5. **S_implement** - Code generation
6. **S_verify** - Pre-delivery checklist validation
7. **S_deliver** - Final output ready

**Tracked Information (State Variables):**
- `product_type ∈ {SaaS, e-commerce, portfolio, dashboard, landing, mobile, ...}`
- `style_keywords[] ∈ {minimal, playful, professional, elegant, dark, ...}`
- `industry ∈ {healthcare, fintech, gaming, education, beauty, ...}`
- `stack ∈ {html-tailwind, react, nextjs, vue, svelte, swiftui, react-native, flutter}`
- `search_results{}` - accumulated domain knowledge
- `checklist_status{}` - verification state for each checklist item

**Design Review Skill adds parallel states:**
- **S_static_analysis** - Grep-based code inspection
- **S_visual_analysis** - Screenshot/heuristic evaluation
- **S_a11y_check** - Accessibility verification

### 2. ACTIONS - What the Agent Can Do

**In S_analyze state:**
- `extract_product_type(request)` → identifies SaaS, e-commerce, etc.
- `extract_style_keywords(request)` → identifies minimal, elegant, etc.
- `extract_industry(request)` → identifies healthcare, fintech, etc.
- `detect_stack(request)` → identifies framework, defaults to html-tailwind

**In S_search state:**
- `search(keyword, domain)` where domain ∈ {product, style, typography, color, landing, chart, ux, prompt}
- `search(keyword, stack)` where stack ∈ {html-tailwind, react, nextjs, vue, svelte, swiftui, react-native, flutter}
- Agent can execute **multiple searches** iteratively (the skill explicitly says "search until you have enough context")

**In S_synthesize state:**
- `combine_results()` → merge all search outputs into coherent design system
- `resolve_conflicts()` → handle contradictory recommendations

**In S_implement state:**
- `generate_code(design_system, stack)` → produce actual component code
- `apply_common_rules()` → enforce the "Common Rules for Professional UI" table

**In S_verify state (Pre-Delivery Checklist):**
- `check_visual_quality()` → no emojis, consistent icons, correct logos
- `check_interaction()` → cursor-pointer, hover states, transitions
- `check_light_dark()` → contrast ratios, glass visibility
- `check_layout()` → floating elements, responsiveness
- `check_accessibility()` → alt text, labels, reduced-motion

**Design Review additions:**
- `grep_hardcoded_colors()` → find hex codes outside tokens
- `grep_hardcoded_spacing()` → find arbitrary pixel values
- `measure_contrast_ratio(fg, bg)` → verify 4.5:1 minimum
- `apply_heuristics(screenshot)` → Nielsen 10, iOS HIG, Material Design 3

### 3. TRANSITIONS - How States Change

**Deterministic Transitions:**
- `S_init → S_analyze` : Triggered by receiving user request
- `S_analyze → S_search` : Triggered by completing requirements extraction (all four variables populated)
- `S_search → S_search` : **Self-loop** - agent continues searching until "enough context" (this introduces non-determinism)
- `S_search → S_synthesize` : Triggered by agent judgment that sufficient data gathered
- `S_synthesize → S_implement` : Triggered by successful design system construction
- `S_implement → S_verify` : Triggered by code generation completion
- `S_verify → S_deliver` : Triggered by ALL checklist items passing
- `S_verify → S_implement` : **Failure loop** - if checklist fails, return to fix code

**Stochastic Elements:**
The `S_search → S_search` self-loop is **stochastic** because:
1. Search quality depends on keyword selection (agent chooses keywords)
2. "Enough context" is subjective - no formal termination criterion
3. Database may not contain matches for all queries

**Transition Function T(s, a, s'):**
- Most transitions are **deterministic** (T = 1.0 for single outcome)
- Search loop is **probabilistic** - depends on search result quality
- Verification loop is **conditional** - depends on checklist outcomes

### 4. OBSERVABILITY - POMDP vs Fully Observable MDP

**This is a PARTIALLY OBSERVABLE MDP (POMDP)** for several reasons:

**Fully Observable Aspects:**
- Current phase state (S_init, S_analyze, etc.) - always known
- Stack selection - deterministic from user input or default
- Checklist status - binary pass/fail for each item
- Search results - returned explicitly by search.py

**Hidden/Partially Observable Aspects:**

1. **User Intent Uncertainty:**
   - "Professional" could mean corporate, elegant, or minimal
   - Industry may not be explicitly stated
   - Style preferences may be implicit or conflicting

2. **Search Completeness Uncertainty:**
   - Agent doesn't know if database has relevant entries until searching
   - "Enough context" has no formal definition
   - Missing domains may not be apparent until implementation fails

3. **Design Quality Uncertainty:**
   - Visual quality is subjective (the checklist helps but doesn't cover everything)
   - "Professional UI" rules are heuristics, not guarantees
   - User satisfaction is only observable after delivery

4. **Accessibility Compliance Uncertainty:**
   - Contrast ratios require measurement tools
   - Focus order requires runtime testing
   - Screen reader compatibility is not directly observable from code

**Belief State Implications:**
The agent maintains an implicit **belief state** about:
- How well it understands user requirements (confidence level)
- Whether search results are sufficient (completeness estimate)
- Whether generated code will pass review (quality prediction)

### Summary: MDP Characterization

| Aspect | Classification |
|--------|----------------|
| State space | Finite, composite (phase × variables) |
| Action space | Discrete, context-dependent |
| Transitions | Mostly deterministic, with stochastic search loop |
| Observability | **POMDP** - user intent and quality partially hidden |
| Reward | Implicit (user satisfaction, checklist pass rate) |
| Horizon | Finite (terminates at S_deliver) |

The skill would benefit from **explicit termination criteria** for the search loop and **confidence thresholds** for transitioning between phases - this would make it closer to a fully observable MDP with clearer decision boundaries.

---

## Agent 2: Policy & Values (Sutton & Barto RL Framework)

Building on Agent 1's MDP formalization, I now define the optimal policy, termination conditions, reward structure, and value functions.

### 1. The POLICY π(s) - State → Action Mapping

The UI/UX skill operates as a **near-deterministic policy** that maps observed states to actions.

**Phase 1: Information Gathering Policy (S_analyze → S_search)**

| State Observation | Policy Action π(s) |
|-------------------|---------------------|
| Product type detected in request | `search(product_type, domain=product)` |
| Style keywords present | `search(style_keywords, domain=style)` |
| Typography not yet resolved | `search(industry + "typography", domain=typography)` |
| Color palette needed | `search(industry, domain=color)` |
| Landing page requested | `search("hero CTA", domain=landing)` |
| Dashboard/analytics context | `search("data visualization", domain=chart)` |
| Accessibility concern raised | `search("accessibility", domain=ux)` |
| Stack not specified | Default action: `stack = html-tailwind` |

**Phase 2: Synthesis & Implementation Policy (S_synthesize → S_implement)**

| State Observation | Policy Action π(s) |
|-------------------|---------------------|
| All required domains searched | Transition to `combine_results()` |
| Conflicts in recommendations | Execute `resolve_conflicts()` using industry priority |
| Design system complete | Begin `generate_code(design_system, stack)` |
| Generating interactive element | Apply Common Rules (cursor-pointer, no emoji) |

**Phase 3: Verification Policy (S_verify loop)**

| State Observation | Policy Action π(s) |
|-------------------|---------------------|
| Code generation complete | Run `check_visual_quality()` first |
| Visual quality fails | Fix violation, re-check |
| Visual passes | Run `check_interaction()` |
| Interaction fails | Fix violation, re-check |
| Interaction passes | Run `check_light_dark()` |
| Light/dark fails | Fix contrast/visibility, re-check |
| Light/dark passes | Run `check_layout()` |
| Layout fails | Fix spacing/responsive, re-check |
| Layout passes | Run `check_accessibility()` |
| Accessibility fails | Fix a11y violation, re-check |
| All 5 categories pass | Transition to S_deliver |

**Policy Characteristics:**
- **Greedy with respect to information**: Exhaustive search before commitment to generation
- **Fixed ordering in verification**: The checklist sequence is deterministic (visual → interaction → light/dark → layout → a11y)
- **Failure-repair loop**: π(S_verify_fail) = fix + retry, not restart

### 2. TERMINAL STATES (Episode Termination)

**Success Terminals (τ⁺):**
| Terminal | Condition |
|----------|-----------|
| τ_deliver | Agent reaches S_deliver with all checklist items passing |
| τ_user_accept | User explicitly confirms ("looks good", "ship it") |
| τ_review_pass | Design review table contains no Severity=Critical rows |

**Failure Terminals (τ⁻):**
| Terminal | Condition |
|----------|-----------|
| τ_prereq_fail | Python unavailable AND user declines installation |
| τ_search_exhaust | 3+ search queries return zero results |
| τ_conflict_unresolvable | User requirements contradict a11y standards |
| τ_loop_limit | S_verify → S_implement loop executed 5+ times |

**Formal Termination Condition:**
```
is_terminal(s) = (s = S_deliver) ∧ (∀c ∈ checklist: status[c] = PASS)
              ∨ (loop_count > MAX_RETRIES)
              ∨ (prereq_available = FALSE)
              ∨ (constraint_conflict = TRUE)
```

### 3. REWARD FUNCTION R(s, a, s')

**Sparse Terminal Rewards:**
| Terminal State | Reward | Rationale |
|----------------|--------|-----------|
| τ_deliver (all checks pass) | **+100** | Primary goal achieved |
| τ_user_accept | **+50** | User satisfaction signal |
| τ_review_pass | **+25** | Quality gate passed |
| τ_prereq_fail | **-10** | Blocked at start |
| τ_loop_limit | **-50** | Excessive iteration |
| τ_conflict_unresolvable | **-20** | Design contradiction |

**Dense Shaping Rewards (during episode):**

*Positive shaping:*
| Action | Reward |
|--------|--------|
| Search returns relevant result (>0 matches) | **+2** |
| Design token used (not hardcoded) | **+1** |
| SVG icon used | **+1** |
| `cursor-pointer` on interactive element | **+1** |
| Contrast ratio ≥ 4.5:1 verified | **+2** |
| `accessibilityLabel` present | **+1** |
| `prefers-reduced-motion` respected | **+1** |
| Both light/dark modes tested | **+2** |
| Responsive breakpoints tested | **+2** |

*Negative shaping (penalties):*
| Violation | Penalty |
|-----------|---------|
| Emoji used as UI icon | **-5** |
| Scale transform on hover | **-4** |
| Hardcoded hex color | **-3** |
| Horizontal scroll on mobile | **-8** |
| Guessed brand logo | **-6** |
| var() wrapper for theme color | **-2** |
| Missing `accessibilityLabel` on interactive | **-5** |
| Contrast ratio < 4.5:1 | **-10** |
| Content hidden behind fixed navbar | **-7** |

**Reward Function Encoding:**
The reward structure encodes a **lexicographic preference ordering**:
1. **Accessibility** (highest weight - heavily penalized when violated)
2. **Functionality** (code works)
3. **Robustness** (light/dark, responsive)
4. **Aesthetics** (professional appearance)

### 4. STATE VALUE FUNCTION V(s)

Using Agent 1's state enumeration, here is the value ranking:

**HIGH-VALUE STATES (V(s) ≈ 0.8-1.0):**
| State | V(s) | Rationale |
|-------|------|-----------|
| S_verify (accessibility check) | **0.95** | Gates legal compliance |
| S_verify (contrast ratio test) | **0.90** | Most common a11y failure |
| S_verify (light/dark mode test) | **0.85** | 50% of users see opposite mode |
| S_search (typography domain) | **0.80** | Font defines visual identity |
| S_search (color domain) | **0.80** | Palette cascades everywhere |

**MEDIUM-VALUE STATES (V(s) ≈ 0.4-0.7):**
| State | V(s) | Rationale |
|-------|------|-----------|
| S_analyze | **0.70** | Errors propagate forward |
| S_search (product domain) | **0.60** | Sets initial direction |
| S_search (landing domain) | **0.55** | Structural guidance |
| S_verify (icon check) | **0.50** | Visible but easy to fix |
| S_implement | **0.45** | Routine code generation |

**LOW-VALUE STATES (V(s) ≈ 0.1-0.3):**
| State | V(s) | Rationale |
|-------|------|-----------|
| S_init | **0.30** | Waiting for input |
| S_search (prompt domain) | **0.20** | Nice-to-have |
| S_deliver | **0.10** | Terminal state |

### 5. ACTION-VALUE FUNCTION Q(s, a)

**In S_search state:**
| Action | Q(s,a) | Rationale |
|--------|--------|-----------|
| `search(*, domain=ux, keyword="accessibility")` | **0.90** | Prevents critical failures |
| `search(*, domain=color)` | **0.75** | Complete palette |
| `search(*, domain=typography)` | **0.75** | Font imports |
| `search(*, domain=style)` | **0.60** | Good guidance |
| `search(*, domain=chart)` | **0.30** | Context-conditional |

**In S_verify state:**
| Action | Q(s,a) | Rationale |
|--------|--------|-----------|
| `check_accessibility()` | **0.95** | Highest payoff if passes |
| `check_light_dark()` | **0.80** | High failure rate |
| `check_layout()` | **0.65** | Moderate impact |
| `check_visual_quality()` | **0.60** | Moderate impact |
| `check_interaction()` | **0.50** | Easy fixes |

### 6. Policy Improvement Recommendations

Based on RL analysis, the merged skill should implement:

1. **Explicit Search Termination**: Define `search_complete = TRUE` when all 7 required domains return ≥1 result. This removes the stochastic S_search → S_search loop.

2. **Value-Weighted Verification Order**: Reorder checklist to run highest-Q(s,a) checks first:
   ```
   accessibility → contrast → light/dark → layout → visual → interaction
   ```
   This implements **fail-fast** based on value function.

3. **Reward Instrumentation**: Log checklist outcomes as reward signals for future learning.

4. **Rollback on Net-Negative Fix**: If fixing violation X introduces violation Y where |penalty(Y)| > |penalty(X)|, revert and try alternative.

5. **Belief Tracking**: Track confidence ∈ [0,1] for user intent understanding. If confidence < 0.6 after S_analyze, ask clarifying questions before S_search.

6. **Discount Factor γ**: For the S_verify → S_implement loop, apply γ = 0.9 per iteration. After 5 loops, future reward expectation drops to 0.59 × original, triggering τ_loop_limit.

---

## Agent 3: Constraints (Blackburn Modal Logician)

### Theoretical Framework
Using Blackburn's Modal Logic with:
- **Temporal**: □ (always), ◇ (eventually), U (until), → (leads to)
- **Epistemic**: K (knows), B (believes)
- **Deontic**: O (obligatory), F (forbidden), P (permitted)
- **Dynamic**: [action] (action causes)

---

### TEMPORAL Constraints (Ordering Requirements)

| # | Plain English | Modal Notation | Why It Matters |
|---|---------------|----------------|----------------|
| T1 | Must analyze user requirements BEFORE searching domains | analyze □→ search | Without understanding product type/industry/style, searches will be unfocused and miss relevant design patterns |
| T2 | Must search product type FIRST in recommended order | [search_product] □→ [search_style] □→ [search_typography] | Product type determines which styles are appropriate; searching style first may yield irrelevant options |
| T3 | Must search BEFORE synthesizing/implementing | search U implement | Implementation without search produces generic designs lacking professional depth |
| T4 | Static analysis BEFORE visual analysis BEFORE accessibility check | phase1 □→ phase2 □→ phase3 | Catching hardcoded values first prevents wasted effort reviewing visuals that use wrong tokens |
| T5 | Must search UNTIL sufficient context gathered | search U K(sufficient_context) | "Search multiple times" - single search rarely provides complete design system |
| T6 | Must verify checklist BEFORE delivery | verify □→ deliver | Pre-delivery checklist exists to catch common professional issues |

---

### EPISTEMIC Constraints (Knowledge Requirements)

| # | Plain English | Modal Notation | Why It Matters |
|---|---------------|----------------|----------------|
| E1 | Must know product type | K(productType) | "SaaS, e-commerce, portfolio, dashboard" - determines entire design direction |
| E2 | Must know style keywords | K(styleKeywords) | "minimal, playful, professional, elegant" - drives aesthetic choices |
| E3 | Must know industry context | K(industry) | "healthcare, fintech, gaming" - different industries have different trust signals and color expectations |
| E4 | Must know target stack | K(stack) ∨ default(html-tailwind) | Stack determines implementation patterns; unknown defaults to html-tailwind |
| E5 | Must know design tokens exist | K(tokens) | Review requires verifying "All colors from tokens.ts, all spacing from 8pt scale" |
| E6 | Must know official brand logos | K(brandLogos) | "Research official SVG from Simple Icons" - guessing produces unprofessional results |
| E7 | Must know contrast ratios | K(contrastRatio) | "4.5:1 minimum" - accessibility requirement needs measured knowledge |

---

### DEONTIC Constraints (Obligations & Prohibitions)

| # | Plain English | Modal Notation | Why It Matters |
|---|---------------|----------------|----------------|
| **OBLIGATORY** |||
| D1 | Must use SVG icons | O(useSVGIcons) | Professional UI requires vector icons, not emojis |
| D2 | Must provide cursor-pointer on clickables | O(cursorPointer) | Interactive elements must indicate interactivity |
| D3 | Must verify contrast ratio | O(verifyContrast) | Accessibility is mandatory, not optional |
| D4 | Must have accessibilityLabel on interactive elements | O(accessibilityLabel) | Screen reader support is required |
| D5 | Must respect prefers-reduced-motion | O(reducedMotion) | Accessibility preference must be honored |
| D6 | Must test both light and dark modes | O(testBothModes) | "Test both modes before delivery" |
| D7 | Must have responsive breakpoints | O(responsive) | "320px, 768px, 1024px, 1440px" |
| D8 | Must output review as table format | O(tableFormat) | "Always output as table: Issue, Severity, Location..." |
| **FORBIDDEN** |||
| D9 | Forbidden to use emojis as icons | F(emojiIcons) | "Don't use emojis like fire rocket gear as UI icons" |
| D10 | Forbidden to use scale transforms on hover | F(scaleHover) | "Don't use scale transforms that shift layout" |
| D11 | Forbidden to use hardcoded colors | F(hardcodedColors) | Must use design tokens only |
| D12 | Forbidden to have horizontal scroll on mobile | F(horizontalScroll) | "No horizontal scroll on mobile" |
| D13 | Forbidden to guess brand logos | F(guessBrandLogo) | Must research official SVG |
| D14 | Forbidden to use var() wrapper for theme colors | F(varWrapper) | "Use theme colors directly (bg-primary) not var() wrapper" |
| **PERMITTED** |||
| D15 | May iterate on keyword searches | P(iterateSearch) | "If first search doesn't match, try different keywords" |
| D16 | May use default stack when unspecified | P(defaultStack) | Stack can default to html-tailwind |

---

### DYNAMIC Constraints (Action-Effect Relationships)

| # | Plain English | Modal Notation | Why It Matters |
|---|---------------|----------------|----------------|
| A1 | Searching product reveals style recommendations | [search_product]◇(hasStyleRecs) | Product search populates which aesthetics fit |
| A2 | Searching typography reveals font pairings + Google Fonts imports | [search_typography]◇(hasFontImports) | Typography search provides ready-to-use imports |
| A3 | Searching color reveals complete palette | [search_color]◇(hasPalette) | "Primary, Secondary, CTA, Background, Text, Border" |
| A4 | Grep for hex codes reveals hardcoded colors | [grep_hex]◇(K(hardcodedColors)) | Static analysis detects token violations |
| A5 | Screenshot enables visual hierarchy assessment | [screenshot]◇(P(assessHierarchy)) | Visual analysis requires screenshot input |
| A6 | Combining style+typography+color creates complete design system | [style ∧ typography ∧ color]◇(completeDesignSystem) | "Combine domains - Style + Typography + Color = Complete design system" |
| A7 | Checking Nielsen heuristics reveals usability issues | [nielsenCheck]◇(K(usabilityIssues)) | Phase 2 applies "Nielsen 10 usability heuristics" |
| A8 | Failing checklist blocks delivery | [checklistFail]□¬(deliver) | Pre-delivery checklist must pass |

---

### Constraint Dependencies (Implication Graph)

```
K(productType) → [search_product]◇(hasStyleRecs)
                        ↓
                K(styleKeywords) → [search_style]◇(hasStyleGuide)
                        ↓
              [style ∧ typography ∧ color] → completeDesignSystem
                        ↓
                   implement
                        ↓
              O(verifyContrast) ∧ O(testBothModes) ∧ O(responsive)
                        ↓
                   deliver
```

### Critical Constraint: The Knowledge-Before-Action Principle

The most fundamental constraint pattern in these skills is:

**K(X) □→ [action_based_on_X]**

You cannot search effectively without knowing what to search for. You cannot implement professionally without having searched. You cannot deliver without having verified. This temporal-epistemic chain is the backbone of quality UI/UX work.

---

## Agent 4: Huth & Ryan Verification (Safety & Liveness Analysis)

### Theoretical Framework
Using temporal logic (LTL) from Huth & Ryan's "Logic in Computer Science" to verify:
- **Safety**: □¬(bad) — bad things must NEVER happen
- **Liveness**: ◇(good) — good things must EVENTUALLY happen

---

### 1. SAFETY PROPERTIES — □¬(bad)

#### ui-ux-pro-max/SKILL.md

| Property | Status | Evidence |
|----------|--------|----------|
| □¬(emoji-as-icon) | ✓ EXPLICIT | Lines 163, 200: "No emojis used as icons" |
| □¬(layout-shift-on-hover) | ✓ EXPLICIT | Lines 164, 203: "Hover states don't cause layout shift" |
| □¬(low-contrast-text) | ✓ EXPLICIT | Lines 180-182, 216: "4.5:1 minimum" |
| □¬(incorrect-brand-logo) | ✓ EXPLICIT | Lines 165, 202: "verified from Simple Icons" |
| □¬(invisible-borders) | ✓ EXPLICIT | Lines 183, 217 |
| □¬(content-behind-navbar) | ✓ EXPLICIT | Lines 189, 220 |
| □¬(horizontal-scroll-mobile) | ✓ EXPLICIT | Line 223 |
| □¬(instant-state-changes) | ✓ EXPLICIT | Line 174: "No instant state changes" |
| □¬(missing-cursor-pointer) | ✓ EXPLICIT | Lines 170, 206 |
| □¬(inconsistent-icon-sizes) | ✓ EXPLICIT | Line 166 |

**Safety Score: 10/10** — Comprehensive "Don't" list with specific violations named.

#### design-review-skill.md

| Property | Status | Evidence |
|----------|--------|----------|
| □¬(hardcoded-colors) | ✓ EXPLICIT | Line 18: "grep for hex codes" |
| □¬(hardcoded-spacing) | ✓ EXPLICIT | Line 19: "grep for arbitrary pixel values" |
| □¬(missing-accessibility-props) | ✓ EXPLICIT | Lines 40-43 |
| □¬(low-contrast) | ✓ IMPLICIT | Line 45: "Measure contrast ratios" |
| □¬(wrong-focus-order) | ✓ IMPLICIT | Line 46: "Check focus order" |

**Safety Score: 5/5** — All review checks identify violations to prevent.

---

### 2. LIVENESS PROPERTIES — ◇(good)

#### ui-ux-pro-max/SKILL.md

| Property | Status | Evidence |
|----------|--------|----------|
| ◇(search-product-domain) | ✓ | Step 2, line 59 |
| ◇(search-style-domain) | ✓ | Step 2, line 60 |
| ◇(search-typography) | ✓ | Step 2, line 61 |
| ◇(search-color-palette) | ✓ | Step 2, line 62 |
| ◇(search-ux-guidelines) | ✓ | Step 2, line 66 |
| ◇(test-light-mode) | ✓ | Line 217: "Test both modes" |
| ◇(test-dark-mode) | ✓ | Line 217: "Test both modes" |
| ◇(verify-responsive-320px) | ✓ | Line 222 |
| ◇(verify-responsive-768px) | ✓ | Line 222 |
| ◇(verify-responsive-1024px) | ✓ | Line 222 |
| ◇(verify-responsive-1440px) | ✓ | Line 222 |
| ◇(all-images-have-alt) | ✓ | Line 225 |
| ◇(form-inputs-have-labels) | ✓ | Line 226 |
| ◇(respect-reduced-motion) | ✓ | Line 228 |

**Liveness Score: 14/14** — Pre-delivery checklist ensures all good things happen.

#### design-review-skill.md

| Property | Status | Evidence |
|----------|--------|----------|
| ◇(static-analysis-complete) | ✓ | Phase 1 |
| ◇(visual-analysis-if-screenshot) | ✓ | Phase 2 |
| ◇(accessibility-check-complete) | ✓ | Phase 3 |
| ◇(output-in-table-format) | ✓ | Line 50 |
| ◇(apply-nielsen-heuristics) | ✓ | Line 35 |
| ◇(apply-ios-hig) | ✓ | Line 36 |
| ◇(apply-material-design) | ✓ | Line 37 |

**Liveness Score: 7/7** — All review phases must eventually complete.

---

### 3. CONSISTENCY CHECK

| Potential Conflict | Status | Analysis |
|--------------------|--------|----------|
| Stack default mismatch | ✗ CONFLICT | ui-ux-pro-max defaults to `html-tailwind` (line 70), but design-review targets "React Native" (line 3). When used together in AICaddyPro (a React Native project), the stack default is wrong. |
| Hover transition timing | ✓ OK | Both agree: 150-300ms (ui-ux line 209) |
| Accessibility requirements | ✓ OK | Both require accessibilityLabel, accessibilityRole |
| Color contrast | ✓ OK | Both require 4.5:1 minimum |
| Token usage | ✓ OK | ui-ux line 204 says "use theme colors directly", design-review line 22-24 verifies token usage |

**Consistency Issue Found:**
- `ui-ux-pro-max` defaults to `html-tailwind` but this project is React Native
- RECOMMENDATION: When used in this repo, explicitly pass `--stack react-native`

---

### 4. COMPLETENESS CHECK

#### Gaps in ui-ux-pro-max/SKILL.md

| Gap | Severity | Explanation |
|-----|----------|-------------|
| No touch target size requirement | HIGH | CLAUDE.md requires 48x48dp minimum, skill doesn't enforce |
| No FlashList requirement | MEDIUM | CLAUDE.md requires FlashList for >20 items, skill silent |
| No glove-use consideration | MEDIUM | CLAUDE.md mentions "larger for glove use", skill generic |
| No outdoor/sunlight readability | MEDIUM | CLAUDE.md requires this, skill silent |
| No one-handed operation | LOW | CLAUDE.md mentions thumb-zone, skill generic |

#### Gaps in design-review-skill.md

| Gap | Severity | Explanation |
|-----|----------|-------------|
| No severity definitions | HIGH | Table has "Severity" column but no P0/P1/P2 definitions |
| No pass/fail criteria | HIGH | When does review pass? No threshold defined |
| No screenshot requirement flow | MEDIUM | "If screenshot available" — what if not? |
| No React Native specific checks | MEDIUM | Says "React Native" but checks are generic web |

---

### 5. VERDICT

| Skill | Safety | Liveness | Consistency | Completeness | Overall |
|-------|--------|----------|-------------|--------------|---------|
| ui-ux-pro-max | ✓ PASS | ✓ PASS | ⚠ NEEDS FIX | ⚠ NEEDS FIX | **NEEDS_WORK** |
| design-review | ✓ PASS | ✓ PASS | ✓ OK | ⚠ NEEDS FIX | **NEEDS_WORK** |

---

### 6. REQUIRED FIXES

#### For ui-ux-pro-max:

**Safety additions needed:**
```
□¬(touch-target-below-48dp) — "All touch targets must be ≥48x48dp"
□¬(FlatList-over-20-items) — "Use FlashList for lists >20 items"
```

**Completeness additions needed:**
- Add to Pre-Delivery Checklist:
  - [ ] Touch targets ≥48dp (56dp for primary actions)
  - [ ] Consider outdoor/sunlight readability
  - [ ] One-handed thumb-zone operation verified
  - [ ] FlashList used for lists >20 items

**Consistency fix needed:**
- Add note: "For React Native projects, use `--stack react-native`"

#### For design-review:

**Liveness additions needed:**
```
◇(severity-defined) — Define P0/P1/P2 thresholds
◇(pass-criteria-stated) — "Review passes if no P0 issues and ≤2 P1 issues"
```

**Completeness additions needed:**
- Add React Native specific checks:
  - accessibilityState usage
  - hitSlop for undersized targets
  - useReducedMotion hook
  - AccessibilityInfo.announceForAccessibility for dynamic content

---

### 7. FORMAL PROPERTIES TO ENFORCE (For Merged Skill)

#### Safety Properties (□¬bad):
1. □¬(emoji-as-icon)
2. □¬(layout-shift-on-hover)
3. □¬(contrast-below-4.5)
4. □¬(touch-target-below-48dp)
5. □¬(hardcoded-color-values)
6. □¬(hardcoded-spacing-values)
7. □¬(missing-accessibility-props)
8. □¬(FlatList-for-large-lists)
9. □¬(content-behind-fixed-elements)
10. □¬(horizontal-scroll-mobile)

#### Liveness Properties (◇good):
1. ◇(test-light-mode)
2. ◇(test-dark-mode)
3. ◇(verify-responsive-breakpoints)
4. ◇(accessibility-audit-complete)
5. ◇(all-checklist-items-verified)
6. ◇(severity-classification-assigned)
7. ◇(pass-fail-verdict-rendered)

---

**Agent 4 Complete** — VERDICT: **NEEDS_WORK**

Both skills have strong safety and liveness coverage but require:
1. Stack consistency fix for React Native context
2. Touch target requirements (project-specific)
3. Severity/pass-fail criteria for design-review
4. React Native-specific accessibility checks

---
