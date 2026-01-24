# Observability & Monitoring

## Dashboard Links

### Production Monitoring

| Service | Dashboard | Purpose |
|---------|-----------|---------|
| App Store Connect | [analytics](https://appstoreconnect.apple.com/analytics) | iOS crash reports, usage metrics |
| Google Play Console | [vitals](https://play.google.com/console) | Android ANRs, crashes, performance |
| RevenueCat | [dashboard](https://app.revenuecat.com/) | Subscription analytics |
| Expo | [dashboard](https://expo.dev/) | OTA updates, build status |

### Error Tracking (when configured)

| Service | Dashboard |
|---------|-----------|
| Sentry | `https://[org].sentry.io/projects/aicaddypro/` |

## Key Metrics to Monitor

### App Performance

| Metric | Target | Source |
|--------|--------|--------|
| App Start Time | < 2s | App Store/Play Console |
| Crash-free Rate | > 99.5% | Sentry / Store Console |
| ANR Rate (Android) | < 0.5% | Play Console |

### Business Metrics

| Metric | Source |
|--------|--------|
| DAU/MAU | RevenueCat / Analytics |
| Subscription Conversion | RevenueCat |
| Trial to Paid Rate | RevenueCat |
| Churn Rate | RevenueCat |

### API Performance

| Metric | Target |
|--------|--------|
| Weather API Latency | < 500ms p95 |
| API Error Rate | < 1% |
| Cache Hit Rate | > 80% |

## Alerting Configuration

### Critical Alerts (P0)

Configure these in your monitoring tool:

```yaml
alerts:
  - name: high_crash_rate
    condition: crash_rate > 1%
    duration: 5m
    severity: critical
    notify: [pagerduty, slack]

  - name: api_down
    condition: api_error_rate > 50%
    duration: 2m
    severity: critical
    notify: [pagerduty]
```

### Warning Alerts (P1)

```yaml
alerts:
  - name: elevated_errors
    condition: error_rate > 5%
    duration: 15m
    severity: warning
    notify: [slack]

  - name: slow_api
    condition: api_latency_p95 > 2s
    duration: 10m
    severity: warning
    notify: [slack]
```

## Deployment Notifications

### Slack Integration

Configure deploy notifications:

```bash
# In your CI/CD workflow
curl -X POST $SLACK_WEBHOOK_URL \
  -H 'Content-type: application/json' \
  -d '{
    "text": "🚀 AICaddy Pro deployed",
    "blocks": [
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": "*Version*: '"$VERSION"'\n*Platform*: '"$PLATFORM"'\n*Build*: '"$BUILD_NUMBER"'"
        }
      }
    ]
  }'
```

### GitHub Deployment Status

EAS automatically updates GitHub deployment status when configured.

## Runbook Links

- [App Not Loading](./runbooks/app-not-loading.md)
- [Weather API Issues](./runbooks/weather-api-issues.md)
- [Build Failures](./runbooks/build-failures.md)
- [Release Process](./runbooks/release-process.md)

## Logging

### Log Levels

| Level | When to Use |
|-------|-------------|
| DEBUG | Development only, verbose details |
| INFO | Important state changes |
| WARN | Recoverable issues |
| ERROR | Errors requiring attention |

### Structured Log Format

```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "level": "error",
  "message": "API request failed",
  "context": {
    "component": "WeatherService",
    "action": "fetchWeather"
  },
  "error": {
    "name": "NetworkError",
    "message": "timeout"
  }
}
```

### Log Aggregation

For production, configure log shipping to your preferred service:
- Datadog
- Axiom
- LogRocket
- Custom ELK stack
