# Validation Checklist

Step-by-step process for validating golf shot calculations.

## Pre-Validation Setup

- [ ] Identify which calculation to validate
- [ ] Locate the source file and line numbers
- [ ] Have reference formulas ready (see physics-formulas.md)
- [ ] Have expected constants ready (see constants.md)

---

## 1. Air Density Validation

### Check Magnus Formula Implementation

- [ ] Locate: `src/services/weather/density.ts`
- [ ] Verify MAGNUS_A = 6.1121
- [ ] Verify MAGNUS_B = 17.502
- [ ] Verify MAGNUS_C = 240.97
- [ ] Verify formula: `SVP = A * exp((B * T) / (T + C))`

### Check Gas Constants

- [ ] Verify GAS_CONSTANT_DRY = 287.058
- [ ] Verify GAS_CONSTANT_VAPOR = 461.495

### Check Unit Conversions

- [ ] F to C conversion: `(F - 32) * 5/9`
- [ ] C to K conversion: `C + 273.15`
- [ ] hPa to Pa conversion: `hPa * 100`

### Check Pressure Conversion (CRITICAL)

- [ ] Does `convertMslToStationPressure()` exist?
- [ ] Is it being called with elevation data?
- [ ] Verify barometric formula constants:
  - g = 9.80665
  - M = 0.0289644
  - R = 8.31432

### Test Values

| Input | Expected Density |
|-------|------------------|
| 59F, 1013hPa, 0% RH | ~1.225 kg/m3 |
| 90F, 1013hPa, 80% RH | ~1.15 kg/m3 |
| 32F, 1013hPa, 50% RH | ~1.29 kg/m3 |

---

## 2. Wind Effect Validation

### Check Wind Gradient

- [ ] Locate: `src/core/models/YardageModel.ts`
- [ ] Verify formula: `1.1 + 0.14 * log10(max(h, 32) / 32)`
- [ ] Test: At 100ft, gradient should be ~1.17

### Check Wind Constants

- [ ] WIND_POWER_SCALE = 0.230
- [ ] TAILWIND_AMPLIFIER = 1.235
- [ ] LATERAL_BASE_MULTIPLIER = 2.0
- [ ] CROSSWIND_CALIBRATION = 0.08

### Check Headwind/Tailwind Asymmetry

- [ ] Tailwind effect > headwind effect (by ~1.235x)
- [ ] Formula includes `TAILWIND_AMPLIFIER` for positive wind factor

### Check Crosswind Lateral

- [ ] Uses sin(wind_angle) for lateral component
- [ ] Includes quartering multipliers (1.3 headwind, 0.8 tailwind)

### Test Values

| Condition | Expected Effect |
|-----------|-----------------|
| 10 mph pure headwind | ~5% shorter |
| 10 mph pure tailwind | ~6% longer |
| 10 mph pure crosswind | ~0% distance, lateral drift |

---

## 3. Environmental Factor Validation

### Check Density Ratio

- [ ] Locate in YardageModel.ts
- [ ] Verify sea level reference: 1.225 or 1.193 kg/m3
- [ ] Verify exponent: 0.7 (below 3000ft), 0.5 (above)

### Check Altitude Lookup Table

- [ ] Values present for 0-8000ft
- [ ] 5000ft multiplier ~1.112

### Test Values

| Altitude | Expected Multiplier |
|----------|---------------------|
| 0ft | 1.000 |
| 3000ft | 1.065 |
| 5000ft | 1.112 |
| 8000ft | 1.190 |

---

## 4. Spin/Stability Validation

### Check Gyroscopic Stability

- [ ] SPIN_GYRO_THRESHOLD = 6000 RPM
- [ ] Formula: `min(1, spin / 6000)`
- [ ] Stability factor: `0.7 + 0.42 * gyro_stability`

### Check Club Wind Sensitivity

- [ ] Driver highest sensitivity (~1.0)
- [ ] Wedges lowest sensitivity (~0.4)
- [ ] Values decrease with increasing loft

---

## 5. Integration Validation

### Check Data Flow

- [ ] Weather data fetched correctly
- [ ] Pressure converted (MSL to station)
- [ ] Density calculated from conditions
- [ ] Environmental factor applied
- [ ] Wind effects calculated
- [ ] Results combined correctly

### Check Edge Cases

- [ ] Zero wind returns no wind effect
- [ ] Zero altitude uses sea level density
- [ ] Missing weather data has fallback

---

## 6. Compare with bolt-old

### Run Diff Commands

```bash
# Physics engine
diff src/core/models/YardageModel.ts bolt-old/aicaddypro/src/core/models/YardageModel.ts

# Air density
diff src/services/weather/density.ts bolt-old/aicaddypro/src/services/weather/density.ts

# Wind calculator
diff src/services/calculations/wind-calculator.ts bolt-old/aicaddypro/src/services/calculations/wind-calculator.ts
```

### Document Differences

- [ ] List any formula differences
- [ ] List any constant differences
- [ ] Determine which version is correct
- [ ] Create fix plan if needed

---

## 7. iOS Performance Check

### Ensure Calculations Are Efficient

- [ ] No heavy computations in render loop
- [ ] Environmental calcs are cached
- [ ] Lookup tables used where possible
- [ ] No unnecessary object allocations

### Verify Debouncing

- [ ] Weather updates debounced (not on every slider move)
- [ ] Calculation results memoized

---

## Validation Report Template

```markdown
## Validation Report: [Component Name]

Date: [YYYY-MM-DD]
File: [path/to/file.ts]

### Constants Verified
- [x] CONSTANT_A = expected_value
- [ ] CONSTANT_B = WRONG (found X, expected Y)

### Formulas Verified
- [x] Formula 1: Correct
- [ ] Formula 2: Issue found (describe)

### Test Results
| Test Case | Expected | Actual | Status |
|-----------|----------|--------|--------|
| Case 1 | X | X | PASS |
| Case 2 | Y | Z | FAIL |

### Issues Found
1. Issue description
   - Location: file.ts:123
   - Fix: description

### Recommendations
1. Recommendation
```
