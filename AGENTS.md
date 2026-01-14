# AICaddyPro - React Native Golf App

## Project Overview
Mobile golf application that calculates shot adjustments based on weather conditions.
Built with React Native + Expo + TypeScript.

## Tech Stack
- **Framework:** React Native 0.76+ with Expo SDK 54+
- **Language:** TypeScript (strict mode)
- **State:** Zustand + React hooks + Context API
- **Styling:** NativeWind v4 (Tailwind for React Native)
- **Weather:** OpenWeatherMap API
- **Navigation:** Expo Router
- **Subscriptions:** RevenueCat

## Directory Structure
```
src/
├── app/                    # Expo Router pages
├── core/
│   └── components/ui/      # Core UI components
├── features/
│   ├── redesign/screens/   # Main app screens (Play, Setup, Stats)
│   ├── wind/               # Wind calculation feature
│   └── settings/           # Settings feature
├── hooks/                  # Custom React hooks
├── stores/                 # Zustand state stores
├── theme/                  # Design tokens, gradients, typography
├── providers/              # Context providers
├── config/                 # App configuration (RevenueCat, Sentry)
└── utils/                  # Helper functions
```

## Build & Test Commands
- `npm install` - Install dependencies
- `npx expo start` - Start development server
- `npx expo lint` - Run ESLint
- `npm test` - Run Jest tests
- `npx expo build` - Create production build

## Code Conventions

### UI Requirements (CRITICAL)
- **NO "card soup"** - Avoid stacking cards within cards
- Maximum 3 levels of visual hierarchy per screen
- Use design system tokens, never hardcode colors/spacing
- Weather data: gradient backgrounds reflecting conditions
- Golf calculations: monospace fonts for numbers
- All interactive elements must have 44pt minimum touch target

### Component Structure
```typescript
// Standard component template
interface Props {
  // Props with JSDoc comments
}

export function ComponentName({ prop1, prop2 }: Props) {
  // Hooks at top
  // Event handlers
  // Render
}
```

### File Naming
- Components: PascalCase (`WeatherCard.tsx`)
- Hooks: camelCase with 'use' prefix (`useWeatherData.ts`)
- Utils: camelCase (`calculateDistance.ts`)
- Types: PascalCase with `.types.ts` suffix

### Testing Requirements
- All physics calculations must have unit tests
- Test weather edge cases (wind > 30mph, rain, etc.)
- Snapshot tests for UI components

## Design System Reference
See `src/design-system/tokens.ts` for:
- Colors (primary, secondary, semantic)
- Typography (font families, sizes, weights)
- Spacing (4px base grid)
- Shadows and elevation

## Physics Calculations
Golf shot adjustments are calculated in `src/services/ballistics/`:
- Wind effect: Vector decomposition relative to shot direction
- Altitude: Air density compensation
- Temperature: Ball compression factor
- Humidity: Minimal effect, included for completeness

## Known Issues / TODOs
- [x] UI Pipeline complete (UI-001 through UI-GLOBAL) - All screens polished
- [x] Accessibility improvements complete (VoiceOver, reduced motion)
- [ ] iOS App Store submission blocked - see `scripts/ralph/ios-pipeline/`
  - [ ] P0: 1024x1024 app icon required
  - [ ] P0: Privacy Policy URL required
  - [ ] P0: Terms of Service URL required
  - [ ] P0: App Store Connect metadata incomplete
- [ ] Row-level toggle behavior (deferred from UI-002)
- [ ] Typography scale for outdoor readability (deferred)

## PR Guidelines
- Include screenshot for UI changes
- Run `npx expo lint` before committing
- Ensure physics calculation tests pass
- Update design system docs if adding new tokens
