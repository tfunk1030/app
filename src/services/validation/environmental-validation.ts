import { EnvironmentalConditions } from '../environmental-calculations';
import { ValidationError } from '../errors/environmental-errors';
// WeatherbitResponse is only used for type validation of legacy service responses
type WeatherbitResponse = {
  data: Array<{
    temp: number;
    rh: number;
    pres: number;
    wind_spd: number;
    wind_dir: number;
    gust: number;
  }>;
};

export function validateCoordinates(lat: number, lon: number) {
  if (typeof lat !== 'number' || isNaN(lat) || lat < -90 || lat > 90) {
    throw new ValidationError('Invalid latitude');
  }
  if (typeof lon !== 'number' || isNaN(lon) || lon < -180 || lon > 180) {
    throw new ValidationError('Invalid longitude');
  }
}

export function validateWeatherAPIResponse(response: WeatherbitResponse) {
  if (!response) {
    throw new ValidationError('Invalid weather API response format');
  }

  // Handle Weatherbit response
  if (Array.isArray(response.data)) {
    const weatherData = response.data[0];

    // Check required numeric fields
    const numericFields = ['temp', 'rh', 'pres', 'wind_spd', 'wind_dir', 'gust'] as const;

    numericFields.forEach(field => {
      const value = weatherData[field];
      if (typeof value !== 'number' || isNaN(value)) {
        throw new ValidationError(`Invalid ${field} value in weather data`);
      }
    });

    // Ensure wind gust is never less than wind speed
    weatherData.gust = Math.max(weatherData.gust, weatherData.wind_spd);

    // Validate value ranges
    if (weatherData.temp < -100 || weatherData.temp > 150) {
      throw new ValidationError('Temperature out of valid range');
    }
    if (weatherData.rh < 0 || weatherData.rh > 100) {
      throw new ValidationError('Relative humidity out of valid range');
    }
    if (weatherData.pres < 800 || weatherData.pres > 1200) {
      throw new ValidationError('Pressure out of valid range');
    }
    if (weatherData.wind_spd < 0 || weatherData.wind_spd > 200) {
      throw new ValidationError('Wind speed out of valid range');
    }
    if (weatherData.wind_dir < 0 || weatherData.wind_dir > 360) {
      throw new ValidationError('Wind direction out of valid range');
    }
    if (weatherData.gust < 0 || weatherData.gust > 300) {
      throw new ValidationError('Wind gust out of valid range');
    }
  } else {
    throw new ValidationError('Unknown weather API response format');
  }
}

export function validateEnvironmentalConditions(conditions: EnvironmentalConditions) {
  // Check all required fields exist
  const requiredFields = [
    'temperature',
    'humidity',
    'pressure',
    'altitude',
    'windSpeed',
    'windDirection',
    'windGust',
    'density',
  ] as const;

  requiredFields.forEach(field => {
    const value = conditions[field];
    if (value === undefined || value === null) {
      throw new ValidationError(`Missing required field: ${field}`);
    }
    if (typeof value !== 'number' || isNaN(value)) {
      throw new ValidationError(`Invalid ${field} value`);
    }
  });

  // Validate value ranges
  if (conditions.temperature < -100 || conditions.temperature > 150) {
    throw new ValidationError('Temperature out of valid range');
  }
  if (conditions.humidity < 0 || conditions.humidity > 100) {
    throw new ValidationError('Humidity out of valid range');
  }
  if (conditions.pressure < 800 || conditions.pressure > 1200) {
    throw new ValidationError('Pressure out of valid range');
  }
  if (conditions.altitude < -1000 || conditions.altitude > 30000) {
    throw new ValidationError('Altitude out of valid range');
  }
  if (conditions.windSpeed < 0 || conditions.windSpeed > 200) {
    throw new ValidationError('Wind speed out of valid range');
  }
  if (conditions.windDirection < 0 || conditions.windDirection > 360) {
    throw new ValidationError('Wind direction out of valid range');
  }
  if (conditions.windGust < 0 || conditions.windGust > 300) {
    throw new ValidationError('Wind gust out of valid range');
  }
  if (conditions.density < 0.5 || conditions.density > 2) {
    throw new ValidationError('Density out of valid range');
  }

  // Validate gust is not less than wind speed
  if (conditions.windGust < conditions.windSpeed) {
    conditions.windGust = conditions.windSpeed;
  }
}
