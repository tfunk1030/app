# Physics Formulas Reference

Complete derivations and formulas for golf ball flight calculations.

## 1. Air Density Calculation

Air density is the MASTER variable - all environmental factors ultimately affect density.

### Magnus-Tetens Formula (Saturation Vapor Pressure)

```
SVP = A * exp((B * T) / (T + C))

Where:
- A = 6.1121 hPa
- B = 17.502
- C = 240.97 C
- T = temperature in Celsius
```

### Actual Vapor Pressure

```
Pv = (humidity / 100) * SVP
```

### Air Density (Ideal Gas Law for Moist Air)

```
rho = (Pd / (Rd * T)) + (Pv / (Rv * T))

Where:
- Pd = dry air partial pressure = P_total - Pv (in Pascals)
- Rd = specific gas constant for dry air = 287.058 J/(kg*K)
- Rv = specific gas constant for water vapor = 461.495 J/(kg*K)
- T = absolute temperature (Kelvin)
- Pv = vapor pressure (Pascals)
```

### Unit Conversions Required

- Temperature: F to C = (F - 32) * 5/9
- Temperature: C to K = C + 273.15
- Pressure: hPa (mb) to Pa = multiply by 100

### Standard Values

| Condition | Density (kg/m3) |
|-----------|-----------------|
| ISA Sea Level (15C, 1013.25hPa) | 1.225 |
| Hot day (30C, 1013.25hPa) | 1.164 |
| Cold day (0C, 1013.25hPa) | 1.292 |
| Denver altitude (1600m, 15C) | 1.047 |

---

## 2. Pressure Altitude Correction

Weather APIs report Mean Sea Level (MSL) pressure. For accurate density, convert to station pressure.

### Barometric Formula

```
P_station = P_msl * exp((-g * M * h) / (R * T))

Where:
- g = 9.80665 m/s2 (gravitational acceleration)
- M = 0.0289644 kg/mol (molar mass of dry air)
- R = 8.31432 J/(mol*K) (universal gas constant)
- h = elevation in meters
- T = temperature in Kelvin
```

### Simplified Approximation

For quick estimates: Pressure drops ~1 hPa per 8.5 meters of elevation.

### Why This Matters

At 5000ft elevation:
- MSL pressure: 1013 hPa
- Station pressure: ~843 hPa
- Using MSL directly would UNDERESTIMATE carry by ~10%!

---

## 3. Environmental Distance Factor

How air density affects carry distance.

### Formula

```
factor = (rho_current / rho_sealevel) ^ (-exponent)

Where:
- rho_sealevel = 1.225 kg/m3 (or 1.193 tuned for golf)
- exponent = 0.7 (below 3000ft) or 0.5 (above 3000ft)
```

### Altitude Lookup Table (Pre-computed)

| Altitude (ft) | Multiplier |
|---------------|------------|
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

## 4. Wind Effects

### Wind Gradient by Height

Wind speed increases with altitude due to surface friction.

```
gradient = 1.1 + 0.14 * log10(max(height_ft, 32) / 32)

At 100ft apex: gradient = 1.17
At 50ft apex: gradient = 1.13
```

### Effective Wind Speed

```
effective_wind = wind_speed * gradient
```

### Headwind/Tailwind Component

```
head_tail = wind_speed * cos(wind_angle)

Where wind_angle is relative to shot direction:
- 0 deg = pure tailwind
- 180 deg = pure headwind
- 90/270 deg = pure crosswind
```

### Crosswind Component

```
crosswind = wind_speed * sin(wind_angle)
```

### Distance Effect Formula

```
distance_effect = effective_wind * wind_factor * distance_factor
                * speed_factor * wind_sensitivity * height_factor
                * stability_factor

Tailwind amplifier: 1.235 (tailwind helps more than headwind hurts)
```

### Lateral Movement Formula

```
lateral = sin(wind_angle) * effective_wind * flight_time
        * distance_factor * speed_factor * wind_sensitivity
        * height_factor * stability_factor * 0.08
        * (wind_normalized ^ 0.3) * (1 + spin_factor * 0.05)
        * 2.0 * quartering_multiplier

quartering_multiplier:
- 1.3 for headwind quarters (45-135 deg)
- 0.8 for tailwind quarters (315-45 deg, 225-315 deg)
```

---

## 5. Ball Flight Time

### Simplified Formula

```
flight_time = (2 * v0 * sin(launch_angle)) / g + glide_factor

Where:
- v0 = initial ball speed (ft/s)
- launch_angle = launch angle (radians)
- g = 32.174 ft/s2
- glide_factor = additional time from lift (club dependent)
```

### Club-Specific Values

| Club | Launch Angle | Ball Speed | Flight Time |
|------|--------------|------------|-------------|
| Driver | 10.5 deg | 165 mph | ~6.5 sec |
| 7-Iron | 20 deg | 130 mph | ~5.0 sec |
| PW | 28 deg | 105 mph | ~4.0 sec |

---

## 6. Gyroscopic Stability

Spin affects how much the ball is affected by wind.

```
gyro_stability = min(1, spin_rate / 6000)
stability_factor = 0.7 + (0.42 * gyro_stability)

Higher spin = more stable = less wind drift
Lower spin (driver) = more affected by wind
```

---

## 7. Spin Decay

Backspin decreases during flight.

```
spin_at_time = initial_spin * exp(-decay_rate * time)

decay_rate varies by club (higher lofted = faster decay)
```

---

## Validation Test Cases

Use these to verify implementations:

| Scenario | Expected Result |
|----------|-----------------|
| Standard day, no wind | Base distance |
| 10 mph headwind | ~5% shorter |
| 10 mph tailwind | ~6% longer (asymmetric!) |
| 5000ft altitude | ~11% longer |
| 90F vs 60F | ~3% longer |
| 90% humidity vs 30% | ~1% longer |
