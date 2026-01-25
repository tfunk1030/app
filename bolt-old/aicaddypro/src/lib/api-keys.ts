'use server'

export const getTomorrowApiKey = () => {
  return process.env.TOMORROW_API_KEY;
};

export const getOpenWeatherApiKey = () => {
  return process.env.OPENWEATHER_API_KEY;
};

export const getMapsApiKey = () => {
  return process.env.MAPS_API_KEY;
};