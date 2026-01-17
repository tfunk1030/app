# IOS-003: Privacy & Permissions - Audit

**Date:** 2024-01-13
**Status:** PARTIAL PASS
**Priority Issues Found:** 0 P0, 2 P1

## Requirements Checklist

| Requirement | Status | Finding |
|-------------|--------|---------|
| NSLocationWhenInUseUsageDescription | PASS | Clear golf-specific reason |
| NSLocationAlwaysAndWhenInUseUsageDescription | PASS | Present with clear reason |
| NSMotionUsageDescription | PASS | Compass explanation present |
| NSCompassUsageDescription | PASS | Present in Info.plist |
| App Tracking Transparency (ATT) | N/A | No IDFA/tracking used |
| Privacy Nutrition Labels | N/A | Set in App Store Connect |
| Data collection minimized | PASS | Only location/weather |
| No unnecessary permissions | PASS | Only location and motion |
| Permissions not requested on launch | **REVIEW** | May trigger on mount |

## Info.plist Privacy Strings (app.json)

### Location Permission
```json
"NSLocationWhenInUseUsageDescription": "AICaddyPro needs access to your location to provide accurate weather conditions and environmental data for your golf game."
```
**Status:** PASS - Clear, golf-specific reason

### Location Always Permission
```json
"NSLocationAlwaysAndWhenInUseUsageDescription": "AICaddyPro needs access to your location to provide accurate weather conditions and environmental data for your golf game."
```
**Status:** PASS - Present, but always permission may not be needed

### Motion/Compass Permission
```json
"NSMotionUsageDescription": "This app uses the compass to provide directional information",
"NSCompassUsageDescription": "This app uses the compass to provide directional information"
```
**Status:** PASS - Clear reason, could be more golf-specific

## P0 - Submission Blockers

None identified.

## P1 - Should Fix

### 1. Permission Request Timing
**Finding:** Permissions may be requested on app launch via provider mount:
- `sensor-data.tsx:275-290` - Requests location on useEffect mount
- `enhanced-environmental-service.ts:397` - Requests location when service starts

**Issue:** Apple guidelines recommend requesting permissions at point of use, not on launch.

**Current Flow:**
```
App Launch → Provider Mount → requestForegroundPermissionsAsync() → Prompt
```

**Recommended Flow:**
```
App Launch → Show UI → User taps feature → Request permission → Prompt
```

### 2. Motion Permission Description Could Be Improved
**Current:** "This app uses the compass to provide directional information"
**Suggested:** "AI Caddy Pro uses your device compass to calculate wind adjustments for your golf shots"

## P2 - Polish Items

### 1. NSLocationAlwaysUsageDescription May Not Be Needed
- App doesn't appear to use background location
- Consider removing to reduce permissions requested

### 2. UIRequiredDeviceCapabilities
```json
"UIRequiredDeviceCapabilities": ["gyroscope", "magnetometer", "accelerometer"]
```
- This restricts app to devices with these sensors
- May limit compatibility unnecessarily

## Privacy Data Collection Summary

| Data Type | Collected | Linked to User | Tracking |
|-----------|-----------|----------------|----------|
| Location | Yes | No | No |
| Weather Data | Yes (via API) | No | No |
| Device Sensors | Yes | No | No |
| Personal Info | No | - | - |
| IDFA | No | - | - |

## App Tracking Transparency (ATT)

**Status:** NOT REQUIRED
- No IDFA usage detected
- No third-party tracking SDKs identified
- No `NSUserTrackingUsageDescription` needed

## Recommended Actions

1. **Defer permission requests** until feature is used (P1)
2. **Improve motion description** to be golf-specific (P2)
3. **Review always-location** - remove if not needed (P2)
4. **Set up Privacy Nutrition Labels** in App Store Connect (required)

## Privacy Nutrition Labels Guidance

For App Store Connect, declare:
- **Location:** Used for functionality, not linked to identity
- **Usage Data:** Weather API calls, not linked to identity

## Next Phase
Minor improvements recommended, no blockers.
