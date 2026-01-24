---
name: pyyw
description: Prove Yourself Wrong - Run adversarial validation on any conclusion before acting
---

# PYYW - Prove Yourself Wrong

Validate any conclusion using the adversarial validation protocol. Generates attack vectors and runs verifications before approving action.

## Usage

```
/pyyw "Your conclusion here"
/pyyw spacing "HomeScreen has hardcoded padding"
/pyyw dead-code "Button component is unused"
/pyyw appstore "Privacy URL is valid"
```

## Workflow

### 1. Get Current Context (ALWAYS FIRST)
```bash
echo "PYYW Session: $(date -Iseconds)"
echo "Working directory: $(pwd)"
```

### 2. Parse Conclusion Type

Determine category from argument or content:
- `spacing` → UI Change Attacks
- `dead-code` → Dead Code Attacks
- `appstore` → App Store Attacks
- `logic` → Logic Change Attacks
- `config` → Config Change Attacks
- (auto-detect) → Best match based on keywords

### 3. Load Attack Vectors

```bash
# Load relevant attack vectors from skill
cat .factory/skills/attack-vectors/SKILL.md | grep -A50 "[Category] Attacks"
```

### 4. Delegate to Adversarial Validator

Create validation request:
```json
{
  "droid": "[calling context]",
  "conclusion": "[user's conclusion]",
  "proposed_action": "[inferred or specified action]",
  "timestamp": "$(date -Iseconds)"
}
```

### 5. Execute PYYW Protocol

For each attack vector:
1. State the attack hypothesis
2. Design verification check
3. Execute verification
4. Record result (FAILED/SUCCEEDED)

### 6. Output Decision

```markdown
## PYYW Result: [APPROVED/REJECTED/NEEDS_MORE_EVIDENCE]

**Conclusion:** [original conclusion]
**Timestamp:** [dynamic]

### Attacks Executed
| # | Attack | Verification | Result |
|---|--------|--------------|--------|
| 1 | [name] | [check]      | FAILED/SUCCEEDED |
| 2 | [name] | [check]      | FAILED/SUCCEEDED |
| 3 | [name] | [check]      | FAILED/SUCCEEDED |

### Decision
- **Status:** [APPROVED ✅ / REJECTED ❌]
- **Score:** [X]/[Y] attacks succeeded
- **Reason:** [explanation]

### If Rejected
**Required before retry:**
- [ ] [Action needed]
- [ ] [Additional evidence needed]
```

## Quick PYYW (3-attack minimum)

For fast validation, run minimum viable PYYW:

```
/pyyw quick "Conclusion"
```

Runs only the 3 most relevant attacks for the detected category.

## Full PYYW (all attacks)

For thorough validation before critical changes:

```
/pyyw full "Conclusion"
```

Runs ALL attacks from the relevant category (5-6 attacks).

## Examples

### Example 1: Spacing Violation
```
/pyyw "Line 45 has padding: 10 instead of token"

Output:
- Attack 1 (Intentional): grep for comment → FAILED
- Attack 2 (Platform): check Platform.select → FAILED  
- Attack 3 (Recent): git log 7 days → FAILED
Result: APPROVED ✅
```

### Example 2: Dead Code Detection
```
/pyyw dead-code "formatDate function is unused"

Output:
- Attack 1 (Dynamic import): grep import() → FAILED
- Attack 2 (Test usage): grep in tests → SUCCEEDED (used in date.test.ts)
- Attack 3 (Barrel export): check index.ts → FAILED
Result: REJECTED ❌ (Used in tests)
```

### Example 3: App Store Check
```
/pyyw appstore "Privacy URL returns 200"

Output:
- Attack 1 (Live URL): curl -sI → Response: 200 OK → FAILED
- Attack 2 (Guidelines): web search 2026 → No new requirements → FAILED
- Attack 3 (Consistency): compare configs → All match → FAILED
Result: APPROVED ✅
```

## Integration

This command delegates to `adversarial-validator` droid. Full logs are saved to:
```
.factory/reviews/PYYW-[timestamp].md
```

## Rules

1. **NEVER skip attacks** - Minimum 3, no exceptions
2. **NEVER hardcode dates** - Always `$(date -Iseconds)`
3. **NEVER approve if ANY attack succeeds** - One counterexample is enough
4. **ALWAYS run concrete verifications** - Thinking alone is insufficient
5. **ALWAYS log resource versions** - `git log -1 --format=%ci [file]`
