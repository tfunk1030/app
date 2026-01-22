# bolt-old vs Current Implementation Comparison

Analysis of differences between the accurate bolt-old code and current implementation.

## Executive Summary

The core physics formulas are IDENTICAL between bolt-old and current. The accuracy differences come from:

1. **Pressure conversion** - bolt-old converts MSL to station pressure
2. **Weather providers** - bolt-old has multi-provider fallback
3. **METAR blending** - bolt-old uses real airport observations

---

## Physics Engine (YardageModel.ts)

### Status: IDENTICAL

Both versions use the same:
- Wind power scale (0.230)
- Tailwind amplifier (1.235)
- Lateral base multiplier (2.0)
- Spin gyro threshold (6000 RPM)
- Magnus formula constants
- Wind gradient formula
- Headwind/tailwind effect calculations
- Crosswind lateral movement calculations

### How to Verify

```bash
diff src/core/models/YardageModel.ts bolt-old/aicaddypro/src/core/models/YardageModel.ts
```

Expected: Only whitespace/formatting differences, no algorithmic changes.

---

## Air Density (density.ts)

### Status: POTENTIAL DIFFERENCE

Check if current code has `convertMslToStationPressure()` function.

### bolt-old Implementation (Critical!)

```typescript
// bolt-old/aicaddypro/src/services/weather/density.ts lines 36-58
export function convertMslToStationPressure(
  pressureMslMb: number,
  elevationFeet: number,
  temperatureF: number
): number {
  const elevationMeters = elevationFeet / 3.28084;
  const tempK = ((temperatureF - 32) * 5/9) + 273.15;

  // Barometric formula constants
  const g = 9.80665;  // gravitational acceleration m/s2
  const M = 0.0289644; // molar mass of dry air kg/mol
  const R = 8.31432;  // universal gas constant J/(mol*K)

  const exponent = (-g * M * elevationMeters) / (R * tempK);
  return pressureMslMb * Math.exp(exponent);
}
```

### Why This Matters

At 5000ft elevation, Denver CO:
- Weather API returns MSL pressure: ~1013 hPa
- Actual station pressure: ~843 hPa
- Using MSL directly: density calculation is WRONG
- Result: 10%+ error in carry distance!

### How to Check Current Code

```bash
grep -n "convertMslToStationPressure\|stationPressure\|MSL" src/services/weather/density.ts
grep -n "convertMslToStationPressure\|stationPressure\|MSL" src/services/enhanced-environmental-service.ts
```

If no matches: THIS IS THE BUG. Port from bolt-old.

---

## Weather Service (enhanced-environmental-service.ts)

### Status: MAJOR DIFFERENCES

### bolt-old Features

1. **Multi-Provider Fallback**
   - Primary: Stormglass API
   - Fallback 1: Open-Meteo
   - Fallback 2: NWS (National Weather Service)

2. **METAR Blending**
   - Fetches real airport observations
   - Age-weighted blending (fresher = more weight)
   - Lines 991-1087 in bolt-old

3. **ThrottleManager**
   - Prevents API rate limiting
   - Smart caching with TTL

### Current Code (Check These)

```bash
grep -n "Stormglass\|Open-Meteo\|NWS\|METAR" src/services/enhanced-environmental-service.ts
grep -n "ThrottleManager\|rateLimit" src/services/enhanced-environmental-service.ts
```

---

## Type Safety Improvements (Current is Better)

Current code has better TypeScript:

```typescript
// Current (good)
type LogData = Record<string, unknown> | undefined;

// bolt-old (bad)
type LogData = any;
```

```typescript
// Current (good)
const errorInfo = error instanceof Error
  ? { message: error.message, name: error.name }
  : { error: String(error) };

// bolt-old (less safe)
const errorInfo = { error: error.message || String(error) };
```

---

## Priority Fixes (What to Port)

### HIGH PRIORITY

1. **convertMslToStationPressure()** function
   - Source: bolt-old/aicaddypro/src/services/weather/density.ts
   - Target: src/services/weather/density.ts
   - Impact: Fixes altitude-based accuracy

2. **Use station pressure in calculations**
   - Find where pressure is used in enhanced-environmental-service.ts
   - Ensure it calls convertMslToStationPressure() with elevation

### MEDIUM PRIORITY

3. **Multi-provider weather fallback**
   - Source: bolt-old enhanced-environmental-service.ts
   - Improves reliability, not accuracy

4. **METAR blending**
   - Source: bolt-old enhanced-environmental-service.ts lines 991-1087
   - Uses real observations instead of just forecasts

### LOW PRIORITY

5. **ThrottleManager**
   - Nice to have for API rate limiting
   - Not accuracy-related

---

## Testing After Porting

After porting pressure conversion:

1. Test at sea level (should be unchanged)
2. Test at 5000ft (should show ~11% longer carry)
3. Test at 8000ft (should show ~19% longer carry)

Compare with bolt-old results - they should now match.

---

## File Mapping

| bolt-old File | Current File | What to Check |
|---------------|--------------|---------------|
| src/core/models/YardageModel.ts | src/core/models/YardageModel.ts | Should be identical |
| src/services/weather/density.ts | src/services/weather/density.ts | Pressure conversion function |
| src/services/enhanced-environmental-service.ts | src/services/enhanced-environmental-service.ts | Provider fallback, METAR |
| src/services/calculations/wind-calculator.ts | src/services/calculations/wind-calculator.ts | Should be identical |
