import { logger } from '@/src/services/telemetry/logger';
import { WxPoint } from './types';

// Minimal NWS adapter using /points → /gridpoints current observations
export async function fetchNwsWx(lat: number, lon: number): Promise<WxPoint[] | null> {
  try {
    const pointsRes = await fetch(`https://api.weather.gov/points/${lat},${lon}`, {
      headers: { Accept: 'application/geo+json', 'User-Agent': 'aicaddypro' },
    });
    if (!pointsRes.ok) return null;
    const points = await pointsRes.json();
    const grid = points?.properties;
    if (!grid?.forecastGridData) return null;

    const gridRes = await fetch(grid.forecastGridData, {
      headers: { Accept: 'application/geo+json', 'User-Agent': 'aicaddypro' },
    });
    if (!gridRes.ok) return null;
    const gridData = await gridRes.json();

    interface NWSGridSeries {
      values?: Array<{ value?: number; validTime?: string }>;
    }
    const toVal = (series: NWSGridSeries | undefined) => (series?.values?.[0]?.value ?? null) as number | null;
    const toTs = (series: NWSGridSeries | undefined) =>
      series?.values?.[0]?.validTime?.split('/')?.[0] ?? new Date().toISOString();

    const wind_ms =
      toVal(gridData?.properties?.windSpeed) != null
        ? (toVal(gridData?.properties?.windSpeed) as number) / 1.94384
        : null; // kt → m/s
    const wind_gust_ms =
      toVal(gridData?.properties?.windGust) != null
        ? (toVal(gridData?.properties?.windGust) as number) / 1.94384
        : null;
    const wind_dir_deg = toVal(gridData?.properties?.windDirection) as number | null;
    const temp_c = toVal(gridData?.properties?.temperature) as number | null;
    const dewpoint_c = toVal(gridData?.properties?.dewpoint) as number | null;
    const rh_pct = toVal(gridData?.properties?.relativeHumidity) as number | null;
    const pressure_hpa =
      toVal(gridData?.properties?.pressure) != null
        ? (toVal(gridData?.properties?.pressure) as number) / 100
        : null; // Pa → hPa
    const precip_mmph = null; // not directly provided here
    const ts = toTs(gridData?.properties?.temperature);

    const wx: WxPoint = {
      ts,
      wind_ms,
      wind_gust_ms,
      wind_dir_deg,
      temp_c,
      dewpoint_c,
      rh_pct,
      pressure_hpa,
      precip_mmph,
      source: 'nws',
    };
    return [wx];
  } catch (e) {
    logger.error('NWS adapter failed', e as Error);
    return null;
  }
}
