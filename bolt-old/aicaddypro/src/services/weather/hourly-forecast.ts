import { logger } from '@/src/services/telemetry/logger';
import Constants from 'expo-constants';
import { fetchOpenMeteoHourlyWind } from './openmeteo-adapter';

export type HourlyWindPoint = {
  time: string;
  speedMph: number;
  gustMph: number;
  directionDeg: number;
};

type ProviderPreference = 'auto' | 'stormglass' | 'openmeteo' | 'nws';

function getPublicEnv(key: string): string | undefined {
  const fromEnv = (process.env as any)?.[key];
  const fromExtra = (Constants?.expoConfig as any)?.extra?.[key];
  const fromManifest = (Constants as any)?.manifest?.extra?.[key];
  return fromEnv ?? fromExtra ?? fromManifest ?? undefined;
}

const STORMGLASS_API_KEY = getPublicEnv('EXPO_PUBLIC_STORMGLASS_API_KEY');

// Stormglass hourly wind fetch (fallback when key is configured)
async function fetchStormglassHourlyWind(
  lat: number,
  lon: number,
  hours: number
): Promise<HourlyWindPoint[] | null> {
  if (!STORMGLASS_API_KEY) {
    logger.info('Stormglass key not configured; skipping stormglass hourly');
    return null;
  }

  try {
    const start = new Date();
    const end = new Date(start.getTime() + hours * 60 * 60 * 1000);
    const url = `https://api.stormglass.io/v2/weather/point?lat=${lat}&lng=${lon}&params=windSpeed,windDirection,gust&source=noaa&start=${start.toISOString()}&end=${end.toISOString()}`;

    const res = await fetch(url, {
      headers: {
        Authorization: STORMGLASS_API_KEY,
        Accept: 'application/json',
      },
    });
    if (!res.ok) {
      const text = await res.text();
      logger.error('Stormglass hourly response not ok', new Error(text));
      return null;
    }
    const data = (await res.json()) as {
      hours?: Array<{
        time?: string;
        windSpeed?: { noaa?: number };
        windDirection?: { noaa?: number };
        gust?: { noaa?: number };
      }>;
    };

    const hoursArr = data?.hours;
    if (!Array.isArray(hoursArr) || hoursArr.length === 0) {
      logger.warn('Stormglass hourly: missing or empty hours array');
      return null;
    }

    const points: HourlyWindPoint[] = [];
    for (const h of hoursArr) {
      const t = h?.time ?? null;
      const ws = h?.windSpeed?.noaa;
      const wd = h?.windDirection?.noaa;
      const gs = h?.gust?.noaa;
      if (t == null || ws == null || wd == null) continue;
      const speedMph = ws * 2.23694; // m/s → mph
      const gustMph = Math.max((gs ?? ws) * 2.23694, speedMph);
      points.push({ time: t, speedMph, gustMph, directionDeg: wd });
    }

    if (points.length === 0) return null;
    // Truncate to requested count from now forward
    const nowMs = Date.now();
    const filtered = points
      .filter(p => {
        const ts = Date.parse(p.time);
        return Number.isFinite(ts) ? ts >= nowMs - 60 * 1000 : true;
      })
      .slice(0, hours);
    return filtered.length > 0 ? filtered : points.slice(0, hours);
  } catch (e) {
    logger.error('Stormglass hourly fetch failed', e as Error);
    return null;
  }
}

export async function fetchHourlyWind(
  lat: number,
  lon: number,
  hours: number = 5,
  preference: ProviderPreference = 'auto'
): Promise<HourlyWindPoint[] | null> {
  // If specifically forced Open-Meteo
  if (preference === 'openmeteo') {
    return fetchOpenMeteoHourlyWind(lat, lon, hours);
  }

  // Try Stormglass when preferred or in auto with a key
  if (preference === 'stormglass' || (preference === 'auto' && !!STORMGLASS_API_KEY)) {
    const sg = await fetchStormglassHourlyWind(lat, lon, hours);
    if (sg && sg.length > 0) return sg;
  }

  // Fallback to Open-Meteo
  const om = await fetchOpenMeteoHourlyWind(lat, lon, hours);
  if (om && om.length > 0) return om;

  // TODO: Implement NWS hourly if desired; for now, return null
  logger.warn('No hourly wind data available from preferred providers');
  return null;
}
