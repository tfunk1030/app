# Secrets Management

## Overview

AICaddy Pro uses a tiered approach to secrets management:

1. **Development**: `.env.local` (gitignored)
2. **CI/CD & Builds**: EAS Secrets
3. **Production (future)**: Cloud secrets manager

## Development Secrets

### Setup

```bash
# Copy template
cp .env.example .env.local

# Edit with your API keys
nano .env.local
```

### Required Variables

| Variable | Source | Required |
|----------|--------|----------|
| `EXPO_PUBLIC_TOMORROW_API_KEY` | [tomorrow.io](https://tomorrow.io/) | Yes (primary weather) |
| `EXPO_PUBLIC_OPENWEATHER_API_KEY` | [openweathermap.org](https://openweathermap.org/) | Recommended (fallback) |
| `EXPO_PUBLIC_WEATHERBIT_API_KEY` | [weatherbit.io](https://weatherbit.io/) | Optional (fallback) |
| `EXPO_PUBLIC_MAPS_API_KEY` | [Google Cloud Console](https://console.cloud.google.com/) | Yes |

### Security Notes

- Variables prefixed with `EXPO_PUBLIC_` are bundled into the app
- Never store truly sensitive secrets in `EXPO_PUBLIC_` variables
- API keys in the app can be extracted - use rate limiting and domain restrictions

## EAS Secrets (Build-time)

### Managing Secrets

```bash
# List current secrets
eas env:list

# Create a new secret
eas env:create --scope project --name SECRET_NAME --value "value" --type string --visibility plaintext

# Update a secret
eas env:update --name SECRET_NAME --value "new-value"

# Delete a secret
eas env:delete --name SECRET_NAME
```

### Visibility Levels

| Visibility | Description | Use Case |
|------------|-------------|----------|
| `plaintext` | Visible in build logs | Public API keys |
| `sensitive` | Hidden in logs | Private keys |
| `secret` | Never shown | Signing credentials |

### Current EAS Secrets

```bash
# View configured secrets (without values)
eas env:list --scope project
```

Expected secrets:
- `EXPO_PUBLIC_TOMORROW_API_KEY`
- `EXPO_PUBLIC_OPENWEATHER_API_KEY`
- `EXPO_PUBLIC_WEATHERBIT_API_KEY`
- `EXPO_PUBLIC_MAPS_API_KEY`
- `SENTRY_AUTH_TOKEN` (for source maps)

## Production Secrets (Future)

For enhanced security, consider migrating to a cloud secrets manager:

### AWS Secrets Manager

```typescript
import { SecretsManager } from '@aws-sdk/client-secrets-manager';

const client = new SecretsManager({ region: 'us-east-1' });

async function getSecret(secretName: string): Promise<string> {
  const response = await client.getSecretValue({ SecretId: secretName });
  return response.SecretString!;
}
```

### Expo SecureStore (Device)

For storing user-specific secrets on device:

```typescript
import * as SecureStore from 'expo-secure-store';

// Store
await SecureStore.setItemAsync('user_token', token);

// Retrieve
const token = await SecureStore.getItemAsync('user_token');

// Delete
await SecureStore.deleteItemAsync('user_token');
```

## API Key Security Best Practices

### Rate Limiting

Configure rate limits in your API provider dashboards:

| Provider | Recommended Limit |
|----------|-------------------|
| Tomorrow.io | 500/day (free), 25k/day (paid) |
| OpenWeather | 1000/day (free) |
| Google Maps | Budget alerts at $100 |

### Domain/App Restrictions

- **Google Maps**: Restrict to iOS bundle ID and Android package name
- **Weather APIs**: Enable IP rate limiting

### Key Rotation

Rotate API keys periodically:

1. Generate new key in provider dashboard
2. Update EAS secret: `eas env:update`
3. Trigger new build
4. Verify new build works
5. Delete old key from provider

## Incident Response

### Compromised Key

1. **Immediate**: Revoke key in provider dashboard
2. Generate new key
3. Update EAS secrets
4. Build and deploy new version
5. Review access logs for unauthorized usage

### Key Exposure in Logs

1. Audit recent builds for exposure
2. Rotate affected keys
3. Review logging configuration
4. Add key patterns to `.gitignore` and log scrubbing

## Audit Checklist

- [ ] `.env` files are in `.gitignore`
- [ ] No secrets in committed code
- [ ] EAS secrets use appropriate visibility
- [ ] API keys have usage restrictions
- [ ] Rate limits are configured
- [ ] Key rotation schedule documented
