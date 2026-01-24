# Wind UI Fix Task (Ralph Loop)

Use this with `/ralph-loop` to fix wind UI issues with test verification.

## Usage

```bash
/ralph-loop "$(cat .claude/commands/fix-wind-ui.md)" --completion-promise "ALL_VERIFIED" --max-iterations 15
```

---

## Task: Fix Wind UI Implementation

### Files to Modify
- `src/features/wind/utils/wind-colors.ts` - Utility functions
- `src/features/wind/components/compass/WindArrow.tsx` - Component using utilities

### Tests (Source of Truth)
- `src/features/wind/utils/__tests__/wind-colors.test.ts`

### Requirements

1. **Wind Arrow Colors:**
   - TAILWIND = `#16A34A` (green)
   - HEADWIND = `#DC2626` (red)
   - CROSSWIND = `#F59E0B` (yellow)
   - QUARTERING/default = `#DAA520` (gold)

2. **Wind Strength Opacity:**
   - 0 mph = 0.4 opacity
   - 15 mph = 0.7 opacity
   - 30 mph = 1.0 opacity
   - Formula: `0.4 + (windSpeed / 30) * 0.6`

3. **Gust Pulse Animation:**
   - Trigger when `gustSpeed > sustainedSpeed`
   - Scale pulses 1.0 → 1.15 → 1.0
   - Duration: 500ms each direction

### Verification Steps

**Step 1:** Run tests
```bash
npm test wind-colors
```

**Step 2:** If tests fail, fix the implementation in `wind-colors.ts`

**Step 3:** Ensure WindArrow.tsx uses the utility functions:
```typescript
import { getWindArrowColor, getWindOpacity } from '../../utils/wind-colors';
```

**Step 4:** Verify prop chain:
- WindDirectionCompass passes `windRelationship` to WindArrow
- WindDirectionCompass passes `magnitude` to WindArrow
- WindDirectionCompass passes `gustSpeed` to WindArrow

### Completion Criteria

Output `ALL_VERIFIED` ONLY when:
- [ ] `npm test wind-colors` shows 0 failures
- [ ] WindArrow.tsx imports from utils/wind-colors.ts
- [ ] All props are correctly passed through component tree

### DO NOT:
- Modify the test file (tests are the spec)
- Add new dependencies
- Refactor unrelated code
- Output `ALL_VERIFIED` if any test fails
