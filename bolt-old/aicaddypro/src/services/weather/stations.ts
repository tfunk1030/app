import Constants from 'expo-constants';
import * as Location from 'expo-location';

export type NearbyStation = {
  icao: string;
  name?: string;
  distance_km?: number;
};

const AVWX_BASE = 'https://avwx.rest/api';

async function fetchJson(url: string, headers: Record<string, string>) {
  const res = await fetch(url, { headers });
  if (!res.ok) return null;
  try {
    return await res.json();
  } catch {
    return null;
  }
}

function getPublicEnv(key: string): string | undefined {
  const fromEnv = (process.env as any)?.[key];
  const fromExtra = (Constants?.expoConfig as any)?.extra?.[key];
  const fromManifest = (Constants as any)?.manifest?.extra?.[key];
  return fromEnv ?? fromExtra ?? fromManifest ?? undefined;
}

export async function getNearestStations(
  lat: number,
  lon: number,
  n: number = 10
): Promise<NearbyStation[]> {
  const token = (getPublicEnv('EXPO_PUBLIC_AVWX_TOKEN') ||
    (process.env as any)?.EXPO_PUBLIC_AVWX_TOKEN) as string | undefined;
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'User-Agent': 'aicaddypro',
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  // Try AVWX station/near (returns list)
  const nearUrl = `${AVWX_BASE}/station/near/${lat.toFixed(4)},${lon.toFixed(
    4
  )}?format=json&n=${n}&airport=true&reporting=true`;
  const near = await fetchJson(nearUrl, headers);
  if (Array.isArray(near) && near.length > 0) {
    return near
      .map((s: any) => {
        const stationField = s?.station;
        const icao =
          typeof s?.icao === 'string'
            ? s.icao
            : typeof stationField === 'string'
            ? stationField
            : typeof stationField?.icao === 'string'
            ? stationField.icao
            : '';
        const name =
          typeof s?.name === 'string'
            ? s.name
            : typeof s?.city === 'string'
            ? s.city
            : typeof stationField?.name === 'string'
            ? stationField.name
            : undefined;
        const distance_km = typeof s?.distance === 'number' ? s.distance : undefined;
        return { icao, name, distance_km } as NearbyStation;
      })
      .filter(s => typeof s.icao === 'string' && s.icao.length > 0);
  }

  // Fallback: use METAR by coordinates (returns single station)
  const metarUrl = `${AVWX_BASE}/metar/${lat.toFixed(4)},${lon.toFixed(
    4
  )}?format=json&onfail=cache`;
  const metar = await fetchJson(metarUrl, headers);
  if (metar && (metar.station || metar.icao)) {
    return [{ icao: metar.station ?? metar.icao }];
  }
  return [];
}

export async function getNearestStationsFromDevice(n: number = 10): Promise<NearbyStation[]> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') return [];
  const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
  return getNearestStations(loc.coords.latitude, loc.coords.longitude, n);
}
