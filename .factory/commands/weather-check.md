---
name: weather-check
description: Audit weather API integration, caching, and offline behavior
---

Comprehensive check of weather API integration health.

## Workflow

1. **Delegate to `weather-integrator` droid**
2. **Scan API configuration** for issues
3. **Check caching implementation**
4. **Verify offline behavior**
5. **Report findings**

## Checks Performed

### API Configuration
- API key from environment variables (not hardcoded)
- Base URL is HTTPS
- Timeout configured
- Rate limiting in place

### Caching
- Cache duration appropriate (5-15 min for weather)
- Stale data handling
- Cache invalidation logic

### Offline Behavior
- NetInfo connectivity detection
- Fallback to cached data
- User notification of stale data
- Retry mechanism with backoff

### Error Handling
- Network timeout handling
- API error responses (401, 429, 5xx)
- Graceful degradation

## Files to Check
```
src/services/weather/
src/providers/EnhancedEnvironmentalProvider.tsx
src/hooks/useWeather*.ts
src/config/
.env*
```

## Output Format

```markdown
# Weather Integration Audit - [Date]

## API Health
| Check | Status | Notes |
|-------|--------|-------|
| API key from env | ✅/❌ | |
| HTTPS only | ✅/❌ | |
| Timeout configured | ✅/❌ | [X]ms |
| Rate limiting | ✅/❌ | |

## Caching Status
| Check | Status | Notes |
|-------|--------|-------|
| Cache enabled | ✅/❌ | |
| Duration | ✅/❌ | [X] minutes |
| Stale handling | ✅/❌ | |

## Offline Resilience
| Scenario | Handled | UX Impact |
|----------|---------|-----------|
| No network | ✅/❌ | [description] |
| Slow network | ✅/❌ | [description] |
| API down | ✅/❌ | [description] |

## Issues Found
| Priority | Issue | Fix |
|----------|-------|-----|
| P0/P1/P2 | [issue] | [solution] |

## Recommendations
1. [Action item]
2. [Action item]
```

## Usage
```
/weather-check              # Full audit
/weather-check --offline    # Focus on offline behavior
/weather-check --api        # Focus on API config
```
