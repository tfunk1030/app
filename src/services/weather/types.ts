export type WxPoint = {
  ts: string; // ISO timestamp
  wind_ms: number | null;
  wind_gust_ms: number | null;
  wind_dir_deg: number | null; // coming FROM
  temp_c: number | null;
  dewpoint_c: number | null;
  rh_pct: number | null;
  pressure_hpa: number | null;
  precip_mmph: number | null;
  precip_type?: 'none' | 'rain' | 'snow' | 'mix';
  source: 'stormglass' | 'openmeteo' | 'nws' | 'weatherkit' | 'tomorrow' | 'metar';
};
