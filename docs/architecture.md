# AICaddy Pro - Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        AICaddy Pro App                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │    Shot     │  │    Wind     │  │    Setup    │   Screens   │
│  │ Calculator  │  │ Calculator  │  │   (Clubs)   │             │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘             │
│         │                │                │                     │
│  ┌──────┴────────────────┴────────────────┴──────┐             │
│  │              Shared Components                 │             │
│  │  (ResultCard, GlassCard, MetricTile, etc.)    │             │
│  └──────────────────────┬────────────────────────┘             │
│                         │                                       │
│  ┌──────────────────────┴────────────────────────┐             │
│  │                   Providers                    │             │
│  │  ┌─────────────┐ ┌─────────────┐ ┌──────────┐ │             │
│  │  │Environmental│ │   Theme     │ │ Settings │ │             │
│  │  │  Provider   │ │  Provider   │ │ Provider │ │             │
│  │  └──────┬──────┘ └─────────────┘ └──────────┘ │             │
│  └─────────┼─────────────────────────────────────┘             │
│            │                                                    │
│  ┌─────────┴─────────────────────────────────────┐             │
│  │                  Services                      │             │
│  │  ┌─────────────┐ ┌─────────────┐ ┌──────────┐ │             │
│  │  │   Weather   │ │    Wind     │ │  Cache   │ │             │
│  │  │   Service   │ │ Calculator  │ │ Manager  │ │             │
│  │  └──────┬──────┘ └─────────────┘ └──────────┘ │             │
│  └─────────┼─────────────────────────────────────┘             │
│            │                                                    │
└────────────┼────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────┐
│                     External Services                           │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │ Tomorrow.io │  │ OpenWeather │  │  Weatherbit │  Weather    │
│  │     API     │  │     API     │  │     API     │  APIs       │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐                              │
│  │   Google    │  │  RevenueCat │  Other                       │
│  │  Maps API   │  │  (Payments) │  Services                    │
│  └─────────────┘  └─────────────┘                              │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

### Shot Calculation Flow

```
User Input (Distance)
        │
        ▼
┌───────────────────┐
│  Environmental    │◄──── Weather APIs (cached)
│    Provider       │
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│  Shot Calculator  │
│  - Temperature    │
│  - Altitude       │
│  - Humidity       │
│  - Wind (basic)   │
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│   Result Card     │
│  - Adjusted Dist  │
│  - Conditions     │
└───────────────────┘
```

### Wind Calculator Flow (Premium)

```
User Input
├── Target Distance
├── Wind Speed (auto/manual)
└── Wind Direction (compass)
        │
        ▼
┌───────────────────┐
│  Wind Calculator  │
│  Service          │
│  - Headwind calc  │
│  - Crosswind calc │
│  - Club selection │
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│   Result Card     │
│  - Play Distance  │
│  - Aim Adjustment │
│  - Club Recommend │
└───────────────────┘
```

## Directory Structure

```
aicaddypro/
├── app/                      # Expo Router (screens)
│   ├── (tabs-redesign)/      # Main tab navigation
│   │   ├── _layout.tsx       # Tab bar configuration
│   │   ├── index.tsx         # Shot calculator (free)
│   │   ├── wind.tsx          # Wind calculator (premium)
│   │   └── setup.tsx         # Club management
│   ├── _layout.tsx           # Root layout + providers
│   └── modal.tsx             # Modal screens
│
├── src/
│   ├── components/           # Shared UI components
│   │   ├── redesign/         # New design system
│   │   │   ├── ResultCard.tsx
│   │   │   ├── GlassCard.tsx
│   │   │   └── MetricTile.tsx
│   │   └── error-boundary/
│   │
│   ├── core/                 # Core infrastructure
│   │   ├── components/ui/    # Base primitives
│   │   │   ├── button.tsx
│   │   │   ├── slider.tsx
│   │   │   └── Input.tsx
│   │   └── context/          # React contexts
│   │       ├── settings.tsx  # App settings
│   │       └── clubs.tsx     # Club data
│   │
│   ├── features/             # Feature modules
│   │   ├── wind/             # Wind calculator
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   └── utils/
│   │   ├── calculator/       # Shot calculator
│   │   └── clubs/            # Club management
│   │
│   ├── providers/            # App-wide providers
│   │   └── EnhancedEnvironmentalProvider.tsx
│   │
│   ├── services/             # Business logic
│   │   ├── weather/          # Weather API adapters
│   │   ├── calculations/     # Math/physics
│   │   └── cache/            # Data caching
│   │
│   ├── stores/               # Zustand stores
│   │   └── navigation-preference.ts
│   │
│   ├── theme/                # Design system
│   │   ├── tokens.ts         # Design tokens
│   │   └── redesign/         # Theme provider
│   │
│   ├── hooks/                # Custom hooks
│   ├── types/                # TypeScript types
│   ├── utils/                # Utilities
│   └── lib/                  # Core libraries
│       └── logger.ts         # Structured logging
│
└── assets/                   # Static assets
    ├── images/
    └── fonts/
```

## Key Technologies

| Layer | Technology | Purpose |
|-------|------------|---------|
| Framework | React Native + Expo | Cross-platform mobile |
| Navigation | Expo Router | File-based routing |
| Styling | NativeWind v4 | Tailwind for RN |
| State | Zustand | Global state |
| Animations | Reanimated | 60fps animations |
| Payments | RevenueCat | Subscriptions |
| Storage | AsyncStorage | Local persistence |

## Feature Flags / Premium Gates

| Feature | Free | Premium |
|---------|------|---------|
| Shot Calculator | ✓ | ✓ |
| Basic Wind Adjustment | ✓ | ✓ |
| Wind Calculator | ✗ | ✓ |
| Compass Direction | ✗ | ✓ |
| Club Recommendations | ✗ | ✓ |

## Caching Strategy

```
Weather Data Flow:
  API Request → Response → Cache (5 min TTL) → UI

Cache Invalidation:
  - Location change > 1km
  - Manual refresh
  - TTL expiration
  - App foreground (if stale)
```

## Error Handling

```
Error Boundary (App Level)
        │
        ▼
Feature Error Boundaries
        │
        ▼
Service Error Handlers
        │
        ▼
Logger (structured, sanitized)
```
