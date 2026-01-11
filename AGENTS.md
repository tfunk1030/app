# AGENTS.md - AICaddy Pro

> Agent-focused documentation for autonomous development. See [CLAUDE.md](./CLAUDE.md) for coding conventions.

## Quick Start

```bash
# Install dependencies
yarn install

# Copy environment template
cp .env.example .env.local

# Start development server
yarn start
```

## Commands

| Command | Description |
|---------|-------------|
| `yarn setup` | **One-command setup** - install deps + create .env.local |
| `yarn start` | Start Expo dev server with dev client |
| `yarn test` | Run Jest tests in watch mode |
| `yarn test:ci` | Run tests with coverage (CI mode) |
| `yarn lint` | Run ESLint via Expo |
| `yarn format` | Format code with Prettier |
| `yarn format:check` | Check formatting without changes |
| `yarn knip` | Find unused exports and dependencies |
| `yarn todo:check` | List TODO/FIXME tech debt markers |
| `eas build -p ios --profile preview` | Build iOS preview |
| `eas build -p android --profile preview` | Build Android preview |

## Project Structure

```
aicaddypro/
├── app/                    # Expo Router screens (file-based routing)
│   ├── (tabs-redesign)/    # Main tab navigation
│   │   ├── index.tsx       # Shot calculator (home)
│   │   ├── wind.tsx        # Wind calculator (premium)
│   │   └── setup.tsx       # Club setup
│   ├── _layout.tsx         # Root layout with providers
│   └── index.tsx           # Entry redirect
├── src/
│   ├── components/         # Shared UI components
│   │   └── redesign/       # New design system components
│   ├── core/               # Core utilities and context
│   │   ├── components/ui/  # Base UI primitives (Button, Slider, etc.)
│   │   └── context/        # React contexts (settings, clubs)
│   ├── features/           # Feature modules
│   │   └── wind/           # Wind calculator feature
│   ├── hooks/              # Custom React hooks
│   ├── providers/          # App-wide providers
│   ├── services/           # API and external services
│   ├── stores/             # Zustand state stores
│   ├── theme/              # Design tokens and theming
│   ├── types/              # TypeScript type definitions
│   └── utils/              # Utility functions
├── assets/                 # Images, fonts, icons
└── .factory/skills/        # AI agent skills
```

## Environment Variables

Required environment variables (see `.env.example`):

| Variable | Description |
|----------|-------------|
| `EXPO_PUBLIC_TOMORROW_API_KEY` | Tomorrow.io weather API |
| `EXPO_PUBLIC_OPENWEATHER_API_KEY` | OpenWeather API (fallback) |
| `EXPO_PUBLIC_WEATHERBIT_API_KEY` | Weatherbit API (fallback) |
| `EXPO_PUBLIC_MAPS_API_KEY` | Google Maps API |

## Testing

Tests are located in `__tests__/` directories alongside source files:

```bash
# Run all tests
yarn test

# Run specific test file
yarn test useUndoRedo

# Run with coverage
yarn test --coverage

# List available tests
npx jest --listTests
```

Current test files:
- `src/hooks/__tests__/useUndoRedo.test.ts`
- `src/hooks/__tests__/usePresets.test.ts`

### E2E Tests (Maestro)

E2E tests use [Maestro](https://maestro.mobile.dev/) for mobile UI testing:

```bash
# Install Maestro CLI
curl -Ls "https://get.maestro.mobile.dev" | bash

# Run all E2E tests
maestro test .maestro/flows/

# Run specific flow
maestro test .maestro/flows/app-launch.yaml
```

Test flows in `.maestro/flows/`:
- `app-launch.yaml` - Verify app launches and shows main UI
- `shot-calculator.yaml` - Test shot calculator functionality

## Architecture Decisions

### State Management
- **Zustand** for global state (stores/)
- **React Context** for feature-scoped state (core/context/)
- **AsyncStorage** for persistence

### Navigation
- **Expo Router** with file-based routing
- Tab navigation in `app/(tabs-redesign)/`
- Modal routes in `app/modal.tsx`

### Styling
- **NativeWind v4** (Tailwind for React Native)
- Design tokens in `src/theme/tokens.ts`
- Theme provider with light/dark/outdoor modes

### Key Patterns
- All components use `useTokens()` hook for theming
- Interactive elements require `accessibilityLabel` and `accessibilityRole`
- Minimum touch target: 48x48dp (golf glove friendly)

## Development Workflow

1. **Before making changes**: Run `yarn lint` to check current state
2. **After changes**: Run `yarn test` to verify tests pass
3. **Before committing**: Run `yarn format` for consistent style

## Common Tasks

### Add a new screen
1. Create file in `app/(tabs-redesign)/` for tab screens
2. Export default React component
3. Add navigation in `app/(tabs-redesign)/_layout.tsx` if needed

### Add a new component
1. Create in `src/components/` or feature-specific directory
2. Use `useTokens()` for all colors and spacing
3. Include `accessibilityLabel` on interactive elements
4. Add TypeScript interface for props

### Modify design tokens
1. Edit `src/theme/tokens.ts`
2. Update both `darkTokens` and `lightTokens`
3. Verify changes in both themes

## Observability & Debugging

### Logging

Use the structured logger for all logging:

```typescript
import { logger } from '@/src/lib/logger';

logger.info('Action completed', { component: 'MyComponent', data });
logger.error('Failed to fetch', error, { action: 'fetchData' });
```

### Tracing

Add request tracing for debugging:

```typescript
import { withTracing, getTraceHeaders } from '@/src/lib/tracing';

// Trace async operations
const result = await withTracing('fetchWeather', () => api.getWeather());

// Add trace headers to requests
fetch(url, { headers: getTraceHeaders() });
```

### Metrics

Track performance metrics:

```typescript
import { timeAsync, incrementCounter } from '@/src/lib/metrics';

// Time operations
await timeAsync('api.weather', () => fetchWeather());

// Count events
incrementCounter('feature.shot_calculated');
```

## Troubleshooting

### Metro bundler issues
```bash
yarn start --clear
```

### TypeScript errors
```bash
npx tsc --noEmit
```

### Clean rebuild
```bash
# Windows
./cleanup.ps1

# Unix/Mac
./cleanup.sh
```
