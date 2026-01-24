# Privacy Compliance Integration

## Overview

AICaddy Pro implements privacy-by-design principles with built-in data protection mechanisms.

## Data Collection

### What We Collect

| Data Type | Purpose | Retention | User Control |
|-----------|---------|-----------|--------------|
| Location | Weather lookup | Session only | Opt-in required |
| Club settings | Personalization | Until deleted | Full control |
| Usage analytics | App improvement | 90 days | Opt-out available |
| Crash reports | Bug fixes | 30 days | Anonymized |

### What We Don't Collect

- Personal identification (name, email) - not required
- Payment details - handled by App Store/Play Store
- Precise GPS history - only current location used
- Contacts or photos

## Privacy Implementation

### Consent Management

```typescript
import { getConsentState, updateConsent, hasConsent } from '@/src/lib/privacy';

// Check consent before tracking
if (await hasConsent('analytics')) {
  track('event_name', properties);
}

// Update consent from settings screen
await updateConsent({
  analytics: true,
  marketing: false,
});
```

### Data Masking

```typescript
import { maskPII, maskPIIInObject } from '@/src/lib/privacy';

// Mask PII in logs
logger.info('User action', maskPIIInObject(userData));

// Mask PII in error reports
captureException(error, maskPIIInObject(context));
```

### Log Scrubbing

The logger automatically redacts:
- API keys and tokens
- Email addresses
- Phone numbers
- Passwords and secrets

```typescript
// This is automatically sanitized
logger.info('Request', { apiKey: 'secret123' });
// Output: { apiKey: '[REDACTED]' }
```

## GDPR/CCPA Compliance

### User Rights Implementation

| Right | Implementation |
|-------|----------------|
| Access | Export data via Settings |
| Deletion | Delete account clears all data |
| Portability | JSON export of settings |
| Opt-out | Analytics toggle in Settings |

### Data Deletion

```typescript
// Clear all user data
async function deleteAllUserData() {
  await AsyncStorage.clear();
  await clearConsent();
  await clearSentryUser();
  reset(); // Analytics
}
```

## Privacy Settings UI

Implement in Settings screen:

```tsx
<Section title="Privacy">
  <ToggleRow
    label="Usage Analytics"
    description="Help improve the app with anonymous usage data"
    value={consent.analytics}
    onValueChange={(v) => updateConsent({ analytics: v })}
  />
  <ToggleRow
    label="Crash Reports"
    description="Send anonymous crash reports"
    value={consent.errorTracking}
    onValueChange={(v) => updateConsent({ errorTracking: v })}
  />
  <LinkRow
    label="Privacy Policy"
    href="https://aicaddypro.com/privacy"
  />
  <LinkRow
    label="Delete My Data"
    onPress={showDeleteConfirmation}
  />
</Section>
```

## Third-Party Services

### Data Processors

| Service | Purpose | Data Shared | DPA |
|---------|---------|-------------|-----|
| RevenueCat | Subscriptions | Purchase data | ✓ |
| Tomorrow.io | Weather | Location | ✓ |
| Sentry | Crash reports | Anonymized errors | ✓ |
| App Store | Distribution | Purchase data | Apple DPA |
| Play Store | Distribution | Purchase data | Google DPA |

### API Data Handling

Weather API requests:
- Only current location sent
- No persistent storage on servers
- HTTPS encryption

## Audit Checklist

- [ ] Privacy policy accessible from app
- [ ] Consent collected before analytics
- [ ] Data deletion available
- [ ] Export data available
- [ ] PII masked in logs
- [ ] Location permission explained
- [ ] Third-party DPAs verified
- [ ] Data retention enforced
- [ ] Breach notification process documented
