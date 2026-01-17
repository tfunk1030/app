# Runbook: Weather API Issues

## Symptoms
- "Unable to fetch weather" error
- Stale weather data (old timestamps)
- Environmental conditions showing N/A

## API Fallback Chain

The app uses multiple weather APIs with automatic fallback:

1. **Tomorrow.io** (primary)
2. **OpenWeather** (fallback 1)
3. **Weatherbit** (fallback 2)

## Diagnostic Steps

### 1. Check API Status Pages

- [Tomorrow.io Status](https://status.tomorrow.io/)
- [OpenWeather Status](https://status.openweathermap.org/)
- [Weatherbit Status](https://www.weatherbit.io/status)

### 2. Verify API Keys

```bash
# Check .env.local has all keys
grep "API_KEY" .env.local

# Test Tomorrow.io directly
curl "https://api.tomorrow.io/v4/weather/realtime?location=40.7128,-74.0060&apikey=$EXPO_PUBLIC_TOMORROW_API_KEY"
```

### 3. Check Rate Limits

| API | Free Tier Limit |
|-----|-----------------|
| Tomorrow.io | 500 calls/day |
| OpenWeather | 1000 calls/day |
| Weatherbit | 500 calls/day |

### 4. Inspect Cache

Weather data is cached for 5 minutes. Check if cache is stale:

```javascript
// In React Native Debugger console
AsyncStorage.getItem('weather_cache').then(console.log)
```

## Common Fixes

### API Key Expired/Invalid
1. Regenerate key from provider dashboard
2. Update in EAS secrets: `eas env:update`
3. Rebuild app

### Rate Limit Exceeded
1. Wait for limit reset (usually midnight UTC)
2. Consider upgrading API plan
3. Implement more aggressive caching

### Network Issues
1. Check device connectivity
2. Verify no VPN/firewall blocking
3. Test with different network

## Fallback Behavior

When all APIs fail:
- App shows "Weather unavailable"
- Shot calculator uses default conditions (72°F, sea level)
- User can manually override conditions

## Monitoring

Check API usage in provider dashboards:
- [Tomorrow.io Dashboard](https://app.tomorrow.io/)
- [OpenWeather Dashboard](https://home.openweathermap.org/)
