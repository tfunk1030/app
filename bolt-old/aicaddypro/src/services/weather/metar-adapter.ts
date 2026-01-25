import { logger } from '@/src/services/telemetry/logger';
import { WxPoint } from './types';

type AvwxNumberLike = number | { value?: number | null } | null | undefined;
type AvwxMetar = {
  time?: { dt?: string };
  wind_speed?: AvwxNumberLike; // kt
  wind_gust?: AvwxNumberLike; // kt
  wind_direction?: AvwxNumberLike; // deg
  temperature?: AvwxNumberLike; // C
  dewpoint?: AvwxNumberLike; // C
  relative_humidity?: AvwxNumberLike; // fraction or %
  altimeter?: AvwxNumberLike; // inHg
  remarks_info?: { sea_level_pressure?: { value?: number | null } } | null;
};

export async function fetchMetarWx(icao: string): Promise<WxPoint[] | null> {
  const AVWX_TOKEN = process.env.EXPO_PUBLIC_AVWX_TOKEN as string | undefined;
  try {
    // Try AVWX first if token provided (more reliable, JSON)
    if (AVWX_TOKEN) {
      const res = await fetch(`https://avwx.rest/api/metar/${icao}?format=json&onfail=cache`, {
        headers: { Accept: 'application/json', Authorization: `Bearer ${AVWX_TOKEN}` },
      });
      if (res.ok) {
        const data = (await res.json()) as AvwxMetar;
        const ts = data.time?.dt ?? new Date().toISOString();

        const getVal = (v: AvwxNumberLike): number | null => {
          if (v == null) return null;
          if (typeof v === 'number') return Number.isFinite(v) ? v : null;
          if (typeof v === 'object') {
            const vv = (v as any).value;
            return typeof vv === 'number' && Number.isFinite(vv) ? vv : null;
          }
          return null;
        };

        const windKt = getVal(data.wind_speed);
        const gustKt = getVal(data.wind_gust);
        const dirDeg = getVal(data.wind_direction);
        const temp_c = getVal(data.temperature);
        const dewpoint_c = getVal(data.dewpoint);
        let rh_pct = getVal(data.relative_humidity);
        if (rh_pct != null && rh_pct <= 1) rh_pct = rh_pct * 100; // AVWX may return fraction

        // Prefer sea-level pressure if present; else altimeter inHg → hPa
        // NOTE: Both sea-level pressure and altimeter are MSL-adjusted values.
        // Ideally, these should be converted to station pressure using station elevation,
        // but station elevation is not currently tracked. Since METAR blending is optional
        // and only occurs for nearby stations with recent data, this is acceptable for now.
        const slp_hpa = data.remarks_info?.sea_level_pressure?.value ?? null;
        const altInHg = getVal(data.altimeter);
        const pressure_hpa =
          slp_hpa != null && Number.isFinite(slp_hpa)
            ? slp_hpa
            : altInHg != null
            ? altInHg * 33.8639
            : null;

        const wind_ms = windKt != null ? windKt * 0.514444 : null;
        const wind_gust_ms = gustKt != null ? gustKt * 0.514444 : null;
        const wind_dir_deg = dirDeg;

        const calm = wind_ms == null && wind_gust_ms == null;

        const wx: WxPoint = {
          ts,
          wind_ms: calm ? 0 : wind_ms,
          wind_gust_ms: calm ? 0 : wind_gust_ms,
          wind_dir_deg,
          temp_c,
          dewpoint_c,
          rh_pct,
          pressure_hpa,
          precip_mmph: null,
          source: 'metar',
        };
        return [wx];
      }
      logger.warn('AVWX METAR request failed', { status: res.status, statusText: res.statusText });
    }

    // Fallback to NOAA TGFTP (text METAR). No key required.
    const noaa = await fetch(
      `https://tgftp.nws.noaa.gov/data/observations/metar/stations/${icao}.TXT`
    );
    if (!noaa.ok) {
      logger.warn('NOAA TGFTP METAR fetch failed', {
        status: noaa.status,
        statusText: noaa.statusText,
      });
      return null;
    }
    const text = await noaa.text();
    const lines = text.trim().split(/\r?\n/);
    if (lines.length < 2) return null;
    const tsLine = lines[0];
    const metarLine = lines[1];

    // Timestamp like: 2025/08/10 09:56 → to ISO
    const ts = new Date(tsLine.replace(' ', 'T') + 'Z').toISOString();

    // Parse METAR line
    const windMatch = metarLine.match(/\b(VRB|\d{3})(\d{2,3})(G(\d{2,3}))?KT\b/);
    const tempDewMatch = metarLine.match(/\b(M?\d{2})\/(M?\d{2})\b/);
    const altMatch = metarLine.match(/\bA(\d{4})\b/);

    const dirStr = windMatch?.[1];
    const spdKt = windMatch ? parseInt(windMatch[2], 10) : NaN;
    const gstKt = windMatch && windMatch[4] ? parseInt(windMatch[4], 10) : NaN;
    const wind_dir_deg = dirStr === 'VRB' ? null : dirStr ? parseInt(dirStr, 10) : null;
    const wind_ms = Number.isFinite(spdKt) ? spdKt * 0.514444 : null;
    const wind_gust_ms = Number.isFinite(gstKt) ? gstKt * 0.514444 : null;
    // If both speed and gust are missing, treat as calm
    const calm = wind_ms == null && wind_gust_ms == null;

    const parseTemp = (s?: string | null) => {
      if (!s) return null;
      const neg = s.startsWith('M');
      const val = parseInt(neg ? s.slice(1) : s, 10);
      return neg ? -val : val;
    };
    const temp_c = parseTemp(tempDewMatch?.[1]);
    const dewpoint_c = parseTemp(tempDewMatch?.[2]);

    // Estimate RH from temp/dew if available
    let rh_pct: number | null = null;
    if (temp_c != null && dewpoint_c != null) {
      const es = 6.112 * Math.exp((17.67 * temp_c) / (temp_c + 243.5));
      const e = 6.112 * Math.exp((17.67 * dewpoint_c) / (dewpoint_c + 243.5));
      rh_pct = Math.max(0, Math.min(100, (e / es) * 100));
    }

    // NOTE: Altimeter setting is MSL-adjusted. See note above about station pressure conversion.
    const altHundredths = altMatch ? parseInt(altMatch[1], 10) : NaN;
    const altInHg = Number.isFinite(altHundredths) ? altHundredths / 100 : null;
    const pressure_hpa = altInHg != null ? altInHg * 33.8639 : null;

    const wx: WxPoint = {
      ts,
      wind_ms: calm ? 0 : wind_ms,
      wind_gust_ms: calm ? 0 : wind_gust_ms,
      wind_dir_deg,
      temp_c,
      dewpoint_c,
      rh_pct,
      pressure_hpa,
      precip_mmph: null,
      source: 'metar',
    };
    return [wx];
  } catch (e) {
    logger.error('METAR adapter failed', e as Error);
    return null;
  }
}
