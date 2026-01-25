import { WxPoint } from './types';

export function pickMostRecent(points: WxPoint[]): WxPoint | null {
  if (!points || points.length === 0) return null;
  return points.slice().sort((a, b) => (a.ts > b.ts ? -1 : 1))[0] ?? null;
}

export function toEnvironmentalConditions(wx: WxPoint) {
  // Converts normalized schema to current EnvironmentalConditions-like fields (imperial for UI)
  const tempF = wx.temp_c != null ? (wx.temp_c * 9) / 5 + 32 : null;
  const windMph = wx.wind_ms != null ? wx.wind_ms * 2.23694 : 0;
  const gustMph = wx.wind_gust_ms != null ? wx.wind_gust_ms * 2.23694 : 0;
  return {
    temperature: tempF,
    humidity: wx.rh_pct,
    pressure: wx.pressure_hpa,
    windSpeed: windMph,
    windGust: Math.max(gustMph, windMph),
    windDirection: wx.wind_dir_deg,
    obTime: wx.ts,
    source: wx.source,
  };
}
