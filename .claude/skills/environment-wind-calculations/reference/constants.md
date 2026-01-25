# Physics Constants Reference

All constants used in golf ball flight calculations with their sources and expected values.

## Atmospheric Constants

### Gas Constants

| Constant | Value | Units | Source |
|----------|-------|-------|--------|
| GAS_CONSTANT_DRY (Rd) | 287.058 | J/(kg*K) | Specific gas constant for dry air |
| GAS_CONSTANT_VAPOR (Rv) | 461.495 | J/(kg*K) | Specific gas constant for water vapor |
| UNIVERSAL_GAS_CONSTANT (R) | 8.31432 | J/(mol*K) | Universal gas constant |
| MOLAR_MASS_AIR (M) | 0.0289644 | kg/mol | Molar mass of dry air |

### Magnus-Tetens Formula

| Constant | Value | Notes |
|----------|-------|-------|
| MAGNUS_A | 6.1121 | hPa |
| MAGNUS_B | 17.502 | dimensionless |
| MAGNUS_C | 240.97 | degrees Celsius |

### Reference Conditions

| Constant | Value | Units | Notes |
|----------|-------|-------|-------|
| AIR_DENSITY_SEA_LEVEL | 1.225 | kg/m3 | ISA standard |
| AIR_DENSITY_TUNED | 1.193 | kg/m3 | Golf-tuned value |
| STANDARD_PRESSURE | 1013.25 | hPa (mb) | ISA sea level |
| STANDARD_TEMP | 15 | C (59F) | ISA sea level |

---

## Physical Constants

| Constant | Value | Units | Source |
|----------|-------|-------|--------|
| GRAVITY_METRIC | 9.80665 | m/s2 | Standard gravity |
| GRAVITY_IMPERIAL | 32.174 | ft/s2 | Standard gravity |

---

## Wind Model Constants

### Calibration Factors

| Constant | Value | Purpose |
|----------|-------|---------|
| WIND_POWER_SCALE | 0.230 | Power law exponent for wind effects |
| TAILWIND_AMPLIFIER | 1.235 | Tailwind effect multiplier (asymmetric) |
| HEADTAIL_CALIBRATION | 0.15 | Base calibration for head/tail wind |
| CROSSWIND_CALIBRATION | 0.08 | Base calibration for crosswind |
| LATERAL_BASE_MULTIPLIER | 2.0 | Crosswind lateral movement base |

### Wind Gradient

| Constant | Value | Purpose |
|----------|-------|---------|
| GRADIENT_BASE | 1.1 | Base wind gradient |
| GRADIENT_SCALE | 0.14 | Scaling factor for height |
| REFERENCE_HEIGHT | 32 | Reference height in feet |

### Quartering Wind

| Constant | Value | Condition |
|----------|-------|-----------|
| HEADWIND_QUARTER_MULT | 1.3 | Wind from 45-135 deg |
| TAILWIND_QUARTER_MULT | 0.8 | Wind from 315-45, 225-315 deg |

---

## Spin Constants

| Constant | Value | Purpose |
|----------|-------|---------|
| SPIN_GYRO_THRESHOLD | 6000 | RPM threshold for full stability |
| STABILITY_BASE | 0.7 | Minimum stability factor |
| STABILITY_SCALE | 0.42 | Stability scaling factor |

---

## Density Exponents

| Constant | Value | Condition |
|----------|-------|-----------|
| DENSITY_EXPONENT_SEA | 0.7 | Below 3000ft altitude |
| DENSITY_EXPONENT_ALT | 0.5 | Above 3000ft altitude |
| ALTITUDE_THRESHOLD | 3000 | Feet, switch point for exponent |

---

## Club-Specific Constants

### Ball Speeds (Tour Professional)

| Club | Speed (mph) |
|------|-------------|
| Driver | 165-175 |
| 3-Wood | 150-160 |
| 5-Iron | 135-145 |
| 7-Iron | 125-135 |
| 9-Iron | 115-125 |
| PW | 105-115 |

### Launch Angles (degrees)

| Club | Angle |
|------|-------|
| Driver | 10-12 |
| 3-Wood | 12-14 |
| 5-Iron | 16-18 |
| 7-Iron | 20-22 |
| 9-Iron | 26-28 |
| PW | 28-32 |

### Spin Rates (RPM)

| Club | Spin |
|------|------|
| Driver | 2200-2800 |
| 3-Wood | 3500-4200 |
| 5-Iron | 5000-5500 |
| 7-Iron | 6500-7500 |
| 9-Iron | 8000-9000 |
| PW | 9500-10500 |

### Wind Sensitivity (relative)

| Club | Sensitivity |
|------|-------------|
| Driver | 1.0 (most affected) |
| Long irons | 0.85 |
| Mid irons | 0.70 |
| Short irons | 0.55 |
| Wedges | 0.40 (least affected) |

---

## Verification

To verify constants in code:

```bash
grep -n "WIND_POWER_SCALE\|TAILWIND_AMPLIFIER\|MAGNUS" src/core/models/YardageModel.ts
grep -n "GAS_CONSTANT\|AIR_DENSITY" src/services/weather/density.ts
```

Expected locations:
- YardageModel.ts lines 38-55 for wind constants
- density.ts lines 3-15 for gas constants
