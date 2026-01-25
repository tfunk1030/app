# Agent 1: Codebase Architecture Analysis

## Executive Summary

AICaddyPro is a React Native golf application built with Expo SDK 55 (canary), featuring weather-based shot calculations, wind impact analysis, and premium subscription features. The architecture follows a feature-based modular structure with Zustand for state management and Expo Router for navigation.

---

## Project Structure Overview

```
AICaddyPro/
├── app/                    # Expo Router file-based routes (entry points)
│   ├── _layout.tsx         # Root layout with providers
│   ├── index.tsx           # Entry redirect
│   ├── modal.tsx           # Modal screen
│   ├── +not-found.tsx      # 404 handler
│   ├── +html.tsx           # Web HTML template
│   └── (tabs-redesign)/    # Main tab navigation group
│       ├── _layout.tsx     # Tab navigator layout
│       ├── (setup)/        # Setup/settings tab
│       ├── (shot)/         # Shot calculator tab
│       └── (wind)/         # Wind calculator tab (Premium)
├── src/
│   ├── components/         # Legacy shared components
│   ├── config/             # App configuration (Sentry, RevenueCat)
│   ├── core/               # Core application layer
│   │   ├── components/ui/  # Design system UI components
│   │   ├── context/        # React Context providers
│   │   └── models/         # Domain models
│   ├── features/           # Feature modules (feature-first architecture)
│   │   ├── calculator/     # Shot calculator feature
│   │   ├── clubs/          # Club management
│   │   ├── home/           # Home screen
│   │   ├── redesign/       # Redesign navigation components
│   │   ├── settings/       # Settings feature
│   │   └── wind/           # Wind calculator feature (Premium)
│   ├── hooks/              # Shared custom hooks
│   ├── lib/                # Library utilities
│   ├── modules/            # Native module bridges
│   ├── navigation/         # Navigation utilities
│   ├── providers/          # Additional providers
│   ├── services/           # Business logic services
│   │   ├── cache/          # Caching service
│   │   ├── calculations/   # Calculation engines
│   │   ├── errors/         # Error handling
│   │   ├── notification/   # Notification service
│   │   ├── telemetry/      # Logging/telemetry
│   │   ├── validation/     # Input validation
│   │   └── weather/        # Weather API adapters
│   ├── startup/            # App initialization
│   ├── stores/             # Zustand state stores
│   ├── theme/              # Design tokens & theming
│   ├── types/              # TypeScript type definitions
│   └── utils/              # Utility functions
├── components/             # Legacy Expo template components
├── constants/              # App constants
└── e2e/                    # End-to-end tests (Playwright)
```

---

## Entry Points

### 1. App Entry: `app/_layout.tsx`

The root layout serves as the application entry point, handling:

- **Font loading**: SpaceMono + FontAwesome
- **Provider hierarchy**: ErrorBoundary → AppThemeProvider → AppProvider → ThemeProvider → Stack
- **Global error handling**: Catches cache relaunch errors, prevents production crashes
- **Push notification setup**: Registers for Expo push notifications
- **Cache validation**: Runs startup cache integrity checks
- **Onboarding flow**: First-run experience for new users

**Provider Stack (outer to inner):**
```
ErrorBoundary
└── AppThemeProvider (src/theme/ThemeProvider)
    └── AppProvider (src/core/context/AppProvider)
        └── ThemeProvider (@react-navigation)
            └── Stack (expo-router)
                ├── (tabs-redesign) - Main app
                ├── modal - Modal screens
                └── index - Entry redirect
```

### 2. Feature Entry Points

| Feature | Route | File |
|---------|-------|------|
| Wind Calculator | `/(tabs-redesign)/(wind)` | `src/features/wind/screen.tsx` |
| Shot Calculator | `/(tabs-redesign)/(shot)` | `src/features/calculator/screen.tsx` |
| Settings/Setup | `/(tabs-redesign)/(setup)` | `src/features/settings/screen.tsx` |
| Home | N/A (deprecated) | `src/features/home/screen.tsx` |

### 3. Service Entry Points

| Service | Purpose | Entry File |
|---------|---------|------------|
| Weather | Multi-source weather data | `src/services/weather/` |
| Environmental | Shot impact calculations | `src/services/environmental-calculations.ts` |
| Elevation | Altitude data | `src/services/elevation-service.ts` |
| Cache | Data persistence | `src/services/cache/CacheService.ts` |
| API | External API client | `src/services/api.ts` |

---

## State Management

### Zustand Stores

Located in `src/stores/`:

1. **`subscription.ts`** - Premium subscription state
   - RevenueCat integration
   - Subscription status tracking
   - Offline-capable with AsyncStorage persistence
   - States: unknown, not_subscribed, trial, active, expired, grace_period, lifetime

2. **`navigationPreference.ts`** - Navigation style preference
   - Toggles between 'classic' (5-tab) and 'redesign' (3-tab)
   - Persisted to AsyncStorage

### React Context Providers

Located in `src/core/context/`:

1. **`AppProvider.tsx`** - Consolidated app-wide provider
   - Wraps all feature-specific contexts
   - Single point of context composition

2. **`settings.tsx`** - User settings context
   - Club configurations
   - User preferences

3. **`shotcalc.tsx`** - Shot calculation context
   - Calculation state management
   - Input parameters

4. **`theme.tsx`** - Theme context
   - Light/dark mode toggle
   - System preference sync

### Feature-Level Context

Located in feature directories:

- **Wind Feature** (`src/features/wind/context/`):
  - `compass-lock.tsx` - Compass lock state for wind direction
  - `sensor-data.tsx` - Device sensor data (magnetometer, accelerometer)

- **Settings Feature** (`src/features/settings/context/`):
  - `clubs.tsx` - Club configuration context
  - `premium.tsx` - Premium feature gating

---

## Routing Structure

### Expo Router File-Based Routing

```
app/
├── _layout.tsx          → Root Stack Navigator
├── index.tsx            → Redirect based on nav preference
├── (tabs-redesign)/
│   ├── _layout.tsx      → Native Tab Navigator (3 tabs)
│   ├── (setup)/
│   │   ├── _layout.tsx  → Setup stack
│   │   └── index.tsx    → SetupScreen
│   ├── (shot)/
│   │   ├── _layout.tsx  → Shot stack
│   │   └── index.tsx    → CalculatorScreen
│   └── (wind)/
│       ├── _layout.tsx  → Wind stack
│       └── index.tsx    → WindScreen
└── modal.tsx            → Modal presentation
```

### Navigation Flow

1. App loads → `app/_layout.tsx` initializes providers
2. `app/index.tsx` redirects to appropriate tab layout
3. Native tabs render with iOS tab bar via `@react-navigation/bottom-tabs`
4. Each tab has its own stack navigator for nested screens

---

## Shared Utilities and Hooks

### Custom Hooks (`src/hooks/`)

| Hook | Purpose | Test Coverage |
|------|---------|---------------|
| `usePresets.ts` | Manage calculation presets | ✅ |
| `useUndoRedo.ts` | Undo/redo state management | ✅ |
| `useConnectivity.ts` | Network status monitoring | |
| `useAccessibility.ts` | A11y helpers | |
| `useReduceMotion.ts` | System reduce motion preference | |
| `useReduceTransparency.ts` | System transparency preference | |
| `useCompactLayout.ts` | Responsive layout detection | |
| `use-shots.ts` | Shot history management | |

### Utility Modules (`src/utils/`)

| Utility | Purpose |
|---------|---------|
| `LogManager.ts` | Centralized logging |
| `FeatureFlags.ts` | Feature flag management |
| `cacheManager.ts` | Cache operations |
| `SegmentedCacheManager.ts` | Partitioned caching |
| `ErrorHandler.ts` | Error handling utilities |
| `permissions.ts` | Permission request helpers |
| `SensorManager.ts` | Device sensor abstraction |
| `animations.ts` | Animation utilities |
| `responsive.ts` | Responsive design helpers |
| `club-mapping.ts` | Club type mappings |
| `ThrottleManager.ts` | Request throttling |

### Feature-Specific Utilities

**Wind Feature** (`src/features/wind/`):
- `utils/wind-colors.ts` - Dynamic wind arrow coloring (41 tests)
- `utils/wind-error-handler.ts` - Wind-specific error handling
- `hooks/useWindCalculator.ts` - Wind calculation hook
- `hooks/useWindSettings.ts` - Wind settings management
- `hooks/useWindScreenLayout.ts` - Layout calculations
- `reducers/windCalculatorReducer.ts` - Complex state reducer

---

## Architecture Patterns

### 1. Feature-First Architecture

Each feature is self-contained with:
```
feature/
├── screen.tsx          # Main screen component
├── components/         # Feature-specific components
├── hooks/              # Feature-specific hooks
├── context/            # Feature-specific context (if needed)
├── utils/              # Feature-specific utilities
└── reducers/           # Complex state management (if needed)
```

### 2. Provider Composition Pattern

Providers are composed in `AppProvider.tsx` to avoid prop drilling:
- ClubsProvider
- PremiumProvider
- SettingsProvider

### 3. Adapter Pattern (Weather Services)

Multiple weather API adapters implementing common interface:
- `metar-adapter.ts` - Aviation weather data
- `weatherkit-adapter.ts` - Apple WeatherKit
- `nws-adapter.ts` - National Weather Service
- `openmeteo-adapter.ts` - Open-Meteo API

### 4. Error Boundary Pattern

Hierarchical error boundaries:
- Root: `src/components/error-boundary.tsx`
- Feature-level boundaries as needed

---

## Technology Stack

| Layer | Technology |
|-------|------------|
| Framework | React Native 0.83.1 |
| Platform | Expo SDK 55 (canary) |
| Navigation | Expo Router 7.0.0 |
| Styling | NativeWind v4 (Tailwind) |
| State | Zustand 5.x |
| Animation | Reanimated 4.x |
| Payments | RevenueCat |
| Persistence | AsyncStorage |
| Testing | Jest + Playwright |

---

## Build Configuration

- **Dev Server**: `expo start --dev-client` (requires native modules)
- **Cannot use Expo Go**: TrueSheet, expo-glass-effect require dev client
- **Known Issue**: CocoaPods errors with SDK 55 canary (`spawn pod ENOENT`)

---

## Summary of Findings

### Strengths
1. Clean feature-first architecture
2. Proper separation of concerns
3. Comprehensive state management with Zustand + Context
4. Multi-adapter pattern for weather services
5. Good test coverage for critical utilities (wind-colors: 41 tests)

### Areas for Investigation
1. Legacy `components/` directory contains old Expo template files
2. Some hooks lack test coverage
3. Feature flags system present but usage unclear
4. Duplicate club-mapping utility in two locations

---

*Generated by Agent 1: Codebase Understanding*
*Date: 2026-01-18*
