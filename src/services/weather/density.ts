// Shared air density calculation using Magnus formula
// Inputs: temperature in Fahrenheit, pressure in millibars (hPa), humidity in percent (0-100)
export function calculateAirDensityF(
  temperatureF: number,
  pressureMb: number,
  humidityPct: number
): number {
  const tempC = ((temperatureF - 32) * 5) / 9;
  const pressurePa = pressureMb * 100;

  // Magnus constants (same as EnhancedEnvironmentalService)
  const MAGNUS_A = 6.1121;
  const MAGNUS_B = 17.502;
  const MAGNUS_C = 240.97;
  const GAS_CONSTANT_DRY = 287.058;
  const GAS_CONSTANT_VAPOR = 461.495;

  const svp = MAGNUS_A * Math.exp((MAGNUS_B * tempC) / (tempC + MAGNUS_C));
  const vaporPressure = (humidityPct / 100) * svp;

  return (
    (pressurePa - vaporPressure * 100) / (GAS_CONSTANT_DRY * (tempC + 273.15)) +
    (vaporPressure * 100) / (GAS_CONSTANT_VAPOR * (tempC + 273.15))
  );
}

/**
 * Convert Mean Sea Level (MSL) pressure to station pressure at a given elevation
 * Uses the barometric formula accounting for temperature
 *
 * @param pressureMslMb - Sea level pressure in millibars (hPa)
 * @param elevationFeet - Elevation in feet
 * @param temperatureF - Temperature in Fahrenheit
 * @returns Station pressure in millibars (hPa)
 */
export function convertMslToStationPressure(
  pressureMslMb: number,
  elevationFeet: number,
  temperatureF: number
): number {
  // Convert elevation to meters
  const elevationMeters = elevationFeet / 3.28084;

  // Convert temperature to Kelvin
  const tempC = ((temperatureF - 32) * 5) / 9;
  const tempK = tempC + 273.15;

  // Physical constants
  const g = 9.80665; // gravitational acceleration (m/s²)
  const M = 0.0289644; // molar mass of dry air (kg/mol)
  const R = 8.31432; // universal gas constant (J/(mol·K))

  // Barometric formula: P_station = P_msl * exp((-g * M * h) / (R * T))
  const exponent = (-g * M * elevationMeters) / (R * tempK);
  const stationPressure = pressureMslMb * Math.exp(exponent);

  return stationPressure;
}
