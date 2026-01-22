import { EnvironmentalConditions } from '@/src/services/environmental-calculations';
import { logger } from '@/src/services/telemetry/logger';
import { calculateAirDensityF } from './density';

type OpenMeteoCurrent = {
  time: string;
  temperature_2m: number; // °F (we'll request Fahrenheit)
  relative_humidity_2m: number; // %
  surface_pressure: number; // hPa (station pressure at elevation, not MSL)
  wind_speed_10m: number; // mph (we'll request mph)
  wind_direction_10m: number; // degrees
  wind_gusts_10m: number; // mph (we'll request mph)
};

type OpenMeteoResponse = {
  current?: Partial<OpenMeteoCurrent>;
};

export async function fetchOpenMeteoEnvironmental(
  lat: number,
  lon: number,
  elevation: number
): Promise<EnvironmentalConditions | null> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=UTC`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      const text = await res.text();
      logger.error('Open-Meteo error response', new Error(text));
      return null;
    }

    const data = (await res.json()) as OpenMeteoResponse;
    const c = data.current;
    if (!c) {
      logger.warn('Open-Meteo: missing current block');
      return null;
    }

    // Ensure presence with sensible fallbacks
    const temperatureF = typeof c.temperature_2m === 'number' ? c.temperature_2m : NaN;
    const humidity = typeof c.relative_humidity_2m === 'number' ? c.relative_humidity_2m : NaN;
    const pressure = typeof c.surface_pressure === 'number' ? c.surface_pressure : NaN;
    const windSpeedMph = typeof c.wind_speed_10m === 'number' ? c.wind_speed_10m : NaN;
    const windGustMph = typeof c.wind_gusts_10m === 'number' ? c.wind_gusts_10m : windSpeedMph;
    const windDirDeg = typeof c.wind_direction_10m === 'number' ? c.wind_direction_10m : 0;

    if (
      Number.isNaN(temperatureF) ||
      Number.isNaN(humidity) ||
      Number.isNaN(pressure) ||
      Number.isNaN(windSpeedMph)
    ) {
      logger.warn('Open-Meteo: missing required fields');
      return null;
    }

    // Open-Meteo returns time in the requested timezone. We request UTC, so
    // append 'Z' to ensure correct UTC parsing in Date constructors.
    const rawTime = (c as any).time as string | undefined;
    const obTime = rawTime ? (rawTime.endsWith('Z') ? rawTime : `${rawTime}Z`) : undefined;

    const conditions: EnvironmentalConditions = {
      temperature: temperatureF,
      humidity,
      pressure,
      altitude: elevation,
      windSpeed: windSpeedMph,
      windDirection: windDirDeg,
      windGust: Math.max(windGustMph, windSpeedMph),
      density: calculateAirDensityF(temperatureF, pressure, humidity),
      obTime,
      city: '',
    };

    logger.info('Open-Meteo conditions mapped', {
      temperature: conditions.temperature,
      windSpeed: conditions.windSpeed,
      gust: conditions.windGust,
      pressure: conditions.pressure,
    });

    return conditions;
  } catch (e) {
    logger.error('Open-Meteo fetch failed', e as Error);
    return null;
  }
}

// Hourly wind forecast types and fetcher
type OpenMeteoHourlyResponse = {
  hourly?: {
    time?: string[];
    wind_speed_10m?: number[];
    wind_direction_10m?: number[];
    wind_gusts_10m?: number[];
  };
};

export type HourlyWindPoint = {
  time: string; // ISO-like string (Open-Meteo uses local timezone when timezone=auto)
  speedMph: number;
  gustMph: number;
  directionDeg: number;
};

export async function fetchOpenMeteoHourlyWind(
  lat: number,
  lon: number,
  hours: number = 5
): Promise<HourlyWindPoint[] | null> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=wind_speed_10m,wind_direction_10m,wind_gusts_10m&wind_speed_unit=mph&timezone=auto`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      const text = await res.text();
      logger.error('Open-Meteo hourly error response', new Error(text));
      return null;
    }

    const data = (await res.json()) as OpenMeteoHourlyResponse;
    const h = data.hourly;
    if (
      !h ||
      !Array.isArray(h.time) ||
      !Array.isArray(h.wind_speed_10m) ||
      !Array.isArray(h.wind_direction_10m)
    ) {
      logger.warn('Open-Meteo hourly: missing required arrays');
      return null;
    }

    // Find the first index >= now
    const nowMs = Date.now() - 60 * 1000; // small fudge to include the current hour if exactly aligned
    let startIndex = 0;
    for (let i = 0; i < h.time.length; i++) {
      const t = new Date(h.time[i]).getTime();
      if (t >= nowMs) {
        startIndex = i;
        break;
      }
    }

    const endIndex = Math.min(startIndex + hours, h.time.length);
    const points: HourlyWindPoint[] = [];
    for (let j = startIndex; j < endIndex; j++) {
      const speed = Number(h.wind_speed_10m?.[j] ?? 0);
      const gust = Number(h.wind_gusts_10m?.[j] ?? speed);
      const dir = Number(h.wind_direction_10m?.[j] ?? 0);
      points.push({
        time: h.time[j]!,
        speedMph: speed,
        gustMph: Math.max(gust, speed),
        directionDeg: dir,
      });
    }

    // Fallback if we somehow didn't push any points
    if (points.length === 0) {
      const count = Math.min(hours, h.time.length);
      for (let j = 0; j < count; j++) {
        const speed = Number(h.wind_speed_10m?.[j] ?? 0);
        const gust = Number(h.wind_gusts_10m?.[j] ?? speed);
        const dir = Number(h.wind_direction_10m?.[j] ?? 0);
        points.push({
          time: h.time[j]!,
          speedMph: speed,
          gustMph: Math.max(gust, speed),
          directionDeg: dir,
        });
      }
    }

    logger.info('Open-Meteo hourly wind mapped', { count: points.length });
    return points;
  } catch (e) {
    logger.error('Open-Meteo hourly fetch failed', e as Error);
    return null;
  }
}
