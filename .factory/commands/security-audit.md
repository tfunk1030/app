---
name: security-audit
description: Audit security, privacy compliance, and data handling
---

Comprehensive security and privacy audit.

## Workflow

1. **Delegate to `security-privacy` droid**
2. **Scan for hardcoded secrets**
3. **Check network security**
4. **Audit data storage**
5. **Review permission handling**
6. **Assess privacy compliance**

## Security Checks

### Secrets Detection
```bash
# Search for hardcoded API keys
grep -r "sk_live\|pk_live\|api_key\|apiKey\|secret" src/ --include="*.ts" --include="*.tsx" | grep -v ".env"

# Check for exposed keys in git history
git log -p --all -S 'api_key' --source --all 2>/dev/null | head -20
```

### Network Security
```bash
# Find non-HTTPS URLs
grep -r "http://" src/ --include="*.ts" --include="*.tsx" | grep -v "localhost\|127.0.0.1"

# Check ATS configuration
cat app.json | jq '.expo.ios.infoPlist.NSAppTransportSecurity'
```

### Storage Security
Check that sensitive data uses SecureStore:
- API tokens
- User credentials
- Payment information
- Personal data

### Permission Audit
Verify each permission:
- Has clear justification in Info.plist
- Requested at appropriate time
- Handles denial gracefully

## Privacy Checks

### Data Inventory
Document all data collected:
- Location data
- Device identifiers
- Usage analytics
- Crash reports
- Personal information

### Compliance
- GDPR requirements (EU)
- CCPA requirements (California)
- App Tracking Transparency (if IDFA used)

### Third-Party SDKs
Audit data sharing:
- RevenueCat
- Sentry
- Analytics providers

## Files to Check
```
src/config/
src/stores/
src/services/
app.json
.env*
src/providers/
```

## Output Format

```markdown
# Security & Privacy Audit - [Date]

## Critical Issues (P0)
| Issue | Location | Risk | Fix |
|-------|----------|------|-----|
| [issue] | [file] | [risk level] | [fix] |

## Security Status
| Category | Status | Notes |
|----------|--------|-------|
| Hardcoded secrets | ✅/❌ | |
| HTTPS only | ✅/❌ | |
| Secure storage | ✅/❌ | |
| Input validation | ✅/❌ | |
| ATS enabled | ✅/❌ | |

## Privacy Compliance
| Requirement | Status | Notes |
|-------------|--------|-------|
| Privacy Policy | ✅/❌ | |
| GDPR ready | ✅/❌ | |
| CCPA ready | ✅/❌ | |
| ATT implemented | ✅/N/A | |
| Data minimization | ✅/❌ | |

## Permission Handling
| Permission | Justified | Timing | Fallback |
|------------|-----------|--------|----------|
| Location | ✅/❌ | ✅/❌ | ✅/❌ |
| Motion | ✅/❌ | ✅/❌ | ✅/❌ |
| Notifications | ✅/❌ | ✅/❌ | ✅/❌ |

## Third-Party Data Sharing
| SDK | Data Shared | Compliant | Opt-Out |
|-----|-------------|-----------|---------|
| RevenueCat | [data] | ✅/❌ | ✅/❌ |
| Sentry | [data] | ✅/❌ | ✅/❌ |

## Recommendations
1. [Priority fix]
2. [Improvement]

## Score
Security Score: [X]/100
Privacy Score: [X]/100
```

## Usage
```
/security-audit              # Full audit
/security-audit --secrets    # Focus on secrets
/security-audit --privacy    # Focus on privacy
/security-audit --network    # Focus on network security
```
