---
name: environment-wind-calculations
description: Physics expert for golf shot calculations - validates formulas, reviews accuracy, compares bolt-old vs current
allowed-tools: [Read, Grep, Glob, Bash]
---

# Environment and Wind Calculations Expert

Genius-level physics expert for golf ball flight dynamics and environmental effects.

## What Are You Trying To Do?

### "Validate a formula or constant"
→ Jump to [Section 2: Quick Reference](#quick-reference) to compare values
→ Then [Section 4: Validation Workflow](#validation-workflow) for step-by-step

### "Compare with bolt-old"
→ Jump to [Section 5: bolt-old Comparison](#bolt-old-comparison-workflow)

### "Debug inaccurate calculations"
→ Jump to [Section 6: Debugging Accuracy Issues](#debugging-accuracy-issues)
→ Start with pressure conversion check (most common bug)

### "Understand the physics"
→ Jump to [Section 3: Core Formulas](#core-formulas)
→ See `reference/physics-formulas.md` for full derivations

### "Check iOS performance"
→ Jump to [Section 7: iOS Performance](#ios-performance)

---

## Key Files

| Purpose | Path | Key Lines |
|---------|------|-----------|
| Physics Engine | `src/core/models/YardageModel.ts` | 38-55 (wind constants) |
| Wind Calculator | `src/services/calculations/wind-calculator.ts` | - |
| Air Density | `src/services/weather/density.ts` | 3-15 (gas constants) |
| Environmental Service | `src/services/enhanced-environmental-service.ts` | - |
| bolt-old Physics | `bolt-old/aicaddypro/src/core/models/YardageModel.ts` | Reference |
| bolt-old Density | `bolt-old/aicaddypro/src/services/weather/density.ts` | 36-58 (MSL conversion) |

---

## Quick Reference

### Environmental Factors

| Factor | Effect | Key Insight |
|--------|--------|-------------|
| Wind Speed | Distance head/tail, lateral drift cross | Tailwind helps MORE than headwind hurts (1.235x) |
| Wind Direction | Decomposed into head/tail + crosswind | From direction in weather data |
| Altitude | Thinner air = less drag = longer carry | ~2% per 1000ft |
| Temperature | Warmer = less dense = farther | ~1 yard per 10F |
| Humidity | Higher = slightly less dense = farther | Humid air is lighter |
| Pressure | Lower = less dense = farther | **MUST convert MSL to station!** |

### Critical Constants (95% of validation needs)

| Constant | Value | File:~Line | Verify With |
|----------|-------|------------|-------------|
| TAILWIND_AMPLIFIER | 1.235 | YardageModel.ts:~45 | `grep -n "TAILWIND_AMPLIFIER" src/core/models/YardageModel.ts` |
| WIND_POWER_SCALE | 0.230 | YardageModel.ts:~42 | `grep -n "WIND_POWER_SCALE" src/core/models/YardageModel.ts` |
| LATERAL_BASE_MULT | 2.0 | YardageModel.ts:~50 | `grep -n "LATERAL\|lateral.*2" src/core/models/YardageModel.ts` |
| MAGNUS_A | 6.1121 | density.ts:~10 | `grep -n "6.1121\|MAGNUS" src/services/weather/density.ts` |
| MAGNUS_B | 17.502 | density.ts:~11 | `grep -n "17.502" src/services/weather/density.ts` |
| MAGNUS_C | 240.97 | density.ts:~12 | `grep -n "240.97" src/services/weather/density.ts` |
| GAS_CONSTANT_DRY (Rd) | 287.058 | density.ts:~5 | `grep -n "287.058\|GAS_CONSTANT" src/services/weather/density.ts` |
| GAS_CONSTANT_VAPOR (Rv) | 461.495 | density.ts:~6 | `grep -n "461.495" src/services/weather/density.ts` |
| AIR_DENSITY_SEA_LEVEL | 1.225 (or 1.193 tuned) | density.ts | `grep -n "1.225\|1.193" src/services/weather/density.ts` |
| SPIN_GYRO_THRESHOLD | 6000 RPM | YardageModel.ts | `grep -n "6000" src/core/models/YardageModel.ts` |

### Wind Gradient Constants

| Constant | Value | Purpose |
|----------|-------|---------|
| GRADIENT_BASE | 1.1 | Base wind gradient |
| GRADIENT_SCALE | 0.14 | Scaling factor for height |
| REFERENCE_HEIGHT | 32 ft | Reference height for log formula |

### Quartering Wind Multipliers

| Condition | Multiplier |
|-----------|------------|
| Headwind quarters (45-135°) | 1.3 |
| Tailwind quarters (315-45°, 225-315°) | 0.8 |

### Altitude Lookup Table

| Altitude (ft) | Distance Multiplier |
|---------------|---------------------|
| 0 | 1.000 |
| 1000 | 1.021 |
| 2000 | 1.043 |
| 3000 | 1.065 |
| 4000 | 1.088 |
| 5000 | 1.112 |
| 6000 | 1.137 |
| 7000 | 1.163 |
| 8000 | 1.190 |

---

## Core Formulas

### Air Density (Magnus-Tetens)

```
SVP = 6.1121 * exp((17.502 * T_C) / (T_C + 240.97))   [hPa]
Pv = (humidity / 100) * SVP                            [vapor pressure]
rho = (Pd / (Rd * T)) + (Pv / (Rv * T))               [kg/m3]

Where:
- Pd = P_total - Pv (dry air partial pressure, Pascals)
- Rd = 287.058, Rv = 461.495 J/(kg*K)
- T = absolute temperature (Kelvin)
```

### Barometric Formula (MSL → Station Pressure)

```
P_station = P_msl * exp((-g * M * h) / (R * T))

Where:
- g = 9.80665 m/s2
- M = 0.0289644 kg/mol
- R = 8.31432 J/(mol*K)
- h = elevation in meters
- T = temperature in Kelvin
```

### Wind Gradient

```
gradient = 1.1 + 0.14 * log10(max(height_ft, 32) / 32)

At 100ft apex: gradient = 1.17
At 50ft apex: gradient = 1.13
```

### Environmental Factor

```
factor = (rho_current / rho_sealevel) ^ (-exponent)

Where:
- rho_sealevel = 1.225 kg/m3 (or 1.193 tuned)
- exponent = 0.7 (below 3000ft), 0.5 (above 3000ft)
```

### Headwind/Tailwind Component

```
head_tail = wind_speed * cos(wind_angle)

Where wind_angle relative to shot:
- 0° = pure tailwind
- 180° = pure headwind
- 90°/270° = pure crosswind
```

---

## Validation Workflow

### Step 1: Locate the Calculation

```bash
# Find where the calculation lives
grep -rn "calculateWind\|windEffect\|environmentalFactor" src/

# Check specific files
grep -n "WIND_POWER_SCALE\|TAILWIND_AMPLIFIER" src/core/models/YardageModel.ts
grep -n "Magnus\|SVP\|airDensity" src/services/weather/density.ts
```

### Step 2: Verify Constants

Compare found values against Quick Reference table above. Check for:
- Correct values
- Correct units (hPa vs Pa, ft vs m)
- Correct placement in formulas

### Step 3: Verify Formulas

Cross-reference with Core Formulas above. Common issues:
- Unit conversion missing (F→C, hPa→Pa, ft→m)
- Exponent sign wrong
- Division vs multiplication

### Step 4: Compare with bolt-old

```bash
# Quick diff of physics engine
diff src/core/models/YardageModel.ts bolt-old/aicaddypro/src/core/models/YardageModel.ts

# Quick diff of density calculations
diff src/services/weather/density.ts bolt-old/aicaddypro/src/services/weather/density.ts
```

### Step 5: Test Values

| Scenario | Expected Result |
|----------|-----------------|
| Standard day, no wind | Base distance |
| 10 mph headwind | ~5% shorter |
| 10 mph tailwind | ~6% longer (asymmetric!) |
| 5000ft altitude | ~11% longer |
| 90F vs 60F | ~3% longer |
| 90% vs 30% humidity | ~1% longer |

---

## bolt-old Comparison Workflow

### Executive Summary

The core physics formulas are **IDENTICAL** between bolt-old and current. Accuracy differences come from:

1. **Pressure conversion** - bolt-old converts MSL to station pressure
2. **Weather providers** - bolt-old has multi-provider fallback
3. **METAR blending** - bolt-old uses real airport observations

### Check #1: Pressure Conversion (CRITICAL)

```bash
# Check if MSL conversion exists in current code
grep -n "convertMslToStationPressure\|stationPressure\|MSL" src/services/weather/density.ts
grep -n "convertMslToStationPressure\|stationPressure\|MSL" src/services/enhanced-environmental-service.ts
```

**If no matches → THIS IS THE BUG.** Port from bolt-old:

```bash
# View the bolt-old implementation (lines 36-58)
sed -n '36,58p' bolt-old/aicaddypro/src/services/weather/density.ts
```

bolt-old implementation:
```typescript
export function convertMslToStationPressure(
  pressureMslMb: number,
  elevationFeet: number,
  temperatureF: number
): number {
  const elevationMeters = elevationFeet / 3.28084;
  const tempK = ((temperatureF - 32) * 5/9) + 273.15;
  const g = 9.80665;
  const M = 0.0289644;
  const R = 8.31432;
  const exponent = (-g * M * elevationMeters) / (R * tempK);
  return pressureMslMb * Math.exp(exponent);
}
```

### Check #2: Weather Provider Fallback

```bash
grep -n "Stormglass\|Open-Meteo\|NWS\|METAR" src/services/enhanced-environmental-service.ts
```

bolt-old has:
- Primary: Stormglass API
- Fallback 1: Open-Meteo
- Fallback 2: NWS (National Weather Service)
- METAR blending (lines 991-1087)

### Check #3: Physics Engine (Should Be Identical)

```bash
diff src/core/models/YardageModel.ts bolt-old/aicaddypro/src/core/models/YardageModel.ts
```

Expected: Only whitespace/formatting differences, no algorithmic changes.

### Priority Fixes

| Priority | What | Source | Impact |
|----------|------|--------|--------|
| HIGH | convertMslToStationPressure() | bolt-old density.ts:36-58 | Fixes altitude accuracy |
| HIGH | Use station pressure in calcs | Find pressure usage, add conversion | 10%+ error at altitude |
| MEDIUM | Multi-provider fallback | bolt-old enhanced-env-service.ts | Reliability |
| MEDIUM | METAR blending | bolt-old:991-1087 | Real observations |
| LOW | ThrottleManager | bolt-old | Rate limiting |

---

## Debugging Accuracy Issues

### Decision Tree

```
Calculation seems wrong
    ↓
Is it at altitude (>1000ft)?
    → YES: Check pressure conversion FIRST (most common bug)
    → NO: Continue...
    ↓
Is wind effect wrong?
    → Headwind/tailwind reversed? Check wind angle convention (0°=tailwind)
    → Effect too strong/weak? Check TAILWIND_AMPLIFIER, WIND_POWER_SCALE
    → Crosswind drift wrong? Check LATERAL_BASE_MULTIPLIER
    ↓
Is density calculation wrong?
    → Check Magnus constants (A, B, C)
    → Check gas constants (Rd, Rv)
    → Check unit conversions (F→C→K, hPa→Pa)
    ↓
Still wrong?
    → Diff with bolt-old (see Section 5)
    → Check integration (data flow)
```

### Quick Diagnostic Commands

```bash
# Check pressure conversion (THE MOST COMMON BUG)
grep -n "convertMslToStationPressure\|stationPressure" src/services/weather/density.ts
# If no results → THIS IS THE BUG

# Check wind constants
grep -n "WIND_POWER_SCALE\|TAILWIND_AMPLIFIER" src/core/models/YardageModel.ts

# Check Magnus constants
grep -n "6.1121\|17.502\|240.97" src/services/weather/density.ts

# Check gas constants
grep -n "287.058\|461.495" src/services/weather/density.ts

# Full comparison with bolt-old
diff src/core/models/YardageModel.ts bolt-old/aicaddypro/src/core/models/YardageModel.ts
```

---

## Common Pitfalls

### #1: Using MSL Pressure Directly (10%+ error at altitude)

**Symptom:** Carry distance wrong at high elevation courses (Denver, Albuquerque)

**Root Cause:** Weather APIs return Mean Sea Level pressure. At altitude, actual station pressure is MUCH lower.

**Example:**
- At 5000ft elevation, Denver CO:
- MSL pressure: ~1013 hPa
- Station pressure: ~843 hPa
- Using MSL directly → density calculation WRONG → 10%+ error!

**Check:**
```bash
grep -n "convertMslToStationPressure" src/services/weather/density.ts
```

**Fix:** Port `convertMslToStationPressure()` from bolt-old (lines 36-58)

### #2: Wrong Wind Direction Convention

**Symptom:** Headwind/tailwind effects reversed

**Expected Convention:**
- 0° = pure tailwind (wind behind player)
- 180° = pure headwind (wind in face)
- 90°/270° = pure crosswind

**Check:** Look at how wind_angle is calculated and used in cos() function

### #3: Missing Tailwind Asymmetry

**Symptom:** Tailwind and headwind have same magnitude effect

**Root Cause:** Physics shows tailwind helps MORE than headwind hurts

**Check:**
```bash
grep -n "TAILWIND_AMPLIFIER\|1.235" src/core/models/YardageModel.ts
```

**Expected:** TAILWIND_AMPLIFIER = 1.235 applied to positive wind effects

### #4: Unit Conversion Errors

**Common Mistakes:**
- Temperature: Forgot F→C→K conversion
- Pressure: Using hPa where Pa expected (factor of 100!)
- Distance: Mixing feet and meters

**Check:** Trace unit conversions through calculation chain

### #5: Wrong Density Exponent

**Symptom:** Altitude effect too strong or too weak

**Expected:**
- Below 3000ft: exponent = 0.7
- Above 3000ft: exponent = 0.5

**Check:**
```bash
grep -n "0.7\|0.5\|exponent\|DENSITY" src/core/models/YardageModel.ts
```

---

## iOS Performance

1. **Cache environmental calculations** - Don't recalculate on every frame
2. **Use lookup tables for altitude** - Pre-computed multipliers
3. **Avoid allocations in hot paths** - Reuse objects
4. **Debounce weather updates** - Not on every slider move
5. **Profile before optimizing** - Measure first

```bash
# Check for memoization/caching
grep -n "useMemo\|useCallback\|cache\|memoize" src/services/enhanced-environmental-service.ts
grep -n "useMemo\|useCallback" src/features/wind/
```

---

## Validation Report Template

```markdown
## Validation Report: [Component Name]

Date: [YYYY-MM-DD]
File: [path/to/file.ts]

### Constants Verified
- [x] CONSTANT_A = expected_value ✓
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

---

## Deep Dive References

For complete details, see:
- `reference/physics-formulas.md` - Full derivations and all formulas
- `reference/constants.md` - Complete constant reference
- `reference/bolt-old-comparison.md` - Detailed comparison guide
- `checklists/validation-checklist.md` - Full validation checklist
