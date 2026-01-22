import { logger } from '@/src/services/telemetry/logger';
import { WxPoint } from './types';

const WEATHERKIT_PROXY_URL = process.env.EXPO_PUBLIC_WEATHERKIT_PROXY_URL as string | undefined;

// WeatherKit adapter via proxy (proxy should sign requests and optionally normalize to WxPoint[])
export async function fetchWeatherKitWx(lat: number, lon: number): Promise<WxPoint[] | null> {
  try {
    if (!WEATHERKIT_PROXY_URL) {
      logger.warn('WeatherKit proxy URL not configured (EXPO_PUBLIC_WEATHERKIT_PROXY_URL)');
      return null;
    }
    const url = `${WEATHERKIT_PROXY_URL}?lat=${lat}&lon=${lon}`;
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) {
      const text = await res.text();
      logger.error('WeatherKit proxy error', new Error(text));
      return null;
    }
    const data = (await res.json()) as WxPoint[] | { points?: WxPoint[] };
    const points = Array.isArray(data) ? data : (data as any)?.points;
    if (!points || !Array.isArray(points) || points.length === 0) return null;
    return points.map(p => ({ ...p, source: 'weatherkit' }));
  } catch (e) {
    logger.error('WeatherKit adapter failed', e as Error);
    return null;
  }
}
