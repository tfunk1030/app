import { LogManager } from '@/src/utils/LogManager';
import { fetchOpenMeteoHourlyWind } from './openmeteo-adapter';

export type HourlyWindPoint = {
  time: string;
  speedMph: number;
  gustMph: number;
  directionDeg: number;
};

type ProviderPreference = 'auto' | 'openmeteo' | 'nws';

const logger = LogManager.getLogger('HourlyForecast');

export async function fetchHourlyWind(
  lat: number,
  lon: number,
  hours: number = 5,
  preference: ProviderPreference = 'auto'
): Promise<HourlyWindPoint[] | null> {
  // Use Open-Meteo as primary provider
  const om = await fetchOpenMeteoHourlyWind(lat, lon, hours);
  if (om && om.length > 0) return om;

  // TODO: Implement NWS hourly if desired; for now, return null
  logger.warn('No hourly wind data available from preferred providers');
  return null;
}
