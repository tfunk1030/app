---
name: physics-test
description: Run and validate all physics calculations
---

Run comprehensive physics calculation tests and validation.

## Workflow

1. **Run tests**: Execute `npm test -- --testPathPattern=ballistics --coverage`
2. **Analyze results**: Parse test output for failures
3. **Validate accuracy**: Delegate to `physics-validator` droid
4. **Report coverage**: Identify untested calculations

## Test Scenarios

### Wind Effects
- Headwind: 5, 10, 15, 20, 25, 30 mph
- Tailwind: 5, 10, 15, 20, 25, 30 mph  
- Crosswind: Left and right at various speeds
- Combined: Quartering winds

### Altitude Effects
- Sea level baseline
- 1000ft, 3000ft, 5000ft, 7000ft increments
- Denver (5280ft) special case
- Mexico City (7350ft) special case

### Temperature Effects
- Cold: 40°F, 50°F
- Moderate: 60°F, 70°F
- Hot: 80°F, 90°F, 100°F

### Combined Scenarios
- Mountain course: high altitude + wind
- Links course: sea level + strong wind
- Desert course: hot + dry + elevation

## Expected Output

```markdown
# Physics Test Report

## Test Results
- Total tests: X
- Passed: X ✅
- Failed: X ❌
- Coverage: X%

## Accuracy Validation

### Wind Calculations
| Scenario | Expected | Actual | Δ | Status |
|----------|----------|--------|---|--------|
| 10mph HW | -11 yds  | -10.8  | 0.2 | ✅ |

### Coverage Gaps
- [Untested scenario 1]
- [Untested scenario 2]

## Recommendations
- [Action items]
```

## Usage
```
/physics-test                 # Full test suite
/physics-test wind            # Wind tests only
/physics-test altitude        # Altitude tests only
```
