# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview & Stack

- **App type:** React Native mobile app built with **Expo** (SDK 54+), targeting iOS and Android.
- **Navigation:** **expo-router** with file-based routing under `app/` (no manual `NavigationContainer` or custom navigators).
- **Styling & design system:** **NativeWind v4** (Tailwind for RN) plus a custom theme in `src/theme` (tokens, typography, gradients, animations).
- **State management:** **Zustand** stores in `src/stores` plus React context in `src/core/context` and providers in `src/providers`.
- **Language & tooling:** TypeScript everywhere (strict), Jest with `jest-expo`, ESLint + Prettier, Typedoc, Knip, JSCPD.

Use the `@/` path alias for imports instead of long relative paths; app code should live under this repo root (do not create sibling apps).

---

## Key Commands

> Shell note: Unless a command explicitly mentions `.bat` or `.ps1`, assume it is intended for a Unix-style shell (bash/zsh). For Windows, prefer WSL2 or Git Bash for Android/Gradle commands.

### Install & Align Dependencies

- Install and align packages with Expo:
  - `yarn`
  - `yarn align`  
    (runs `npx expo-doctor && npx expo install` to sync RN/Expo dependencies)

### Environment & Config

- Local env template: `yarn setup`  
  Creates `.env.local` from `.env.example` if missing.
- EAS environment variables for public client keys (weather APIs, maps, etc.):
  - On Windows (recommended): `./setup-env.bat`
  - Or manually (example pattern):
    - `eas env:create --scope project --name EXPO_PUBLIC_... --value "your-api-key" --type string --visibility "plaintext"`
- All client-exposed config uses `EXPO_PUBLIC_*` keys and is read via `process.env.EXPO_PUBLIC_*`.

### Run the App (Dev)

- Start dev server with dev client:
  - `yarn start`  
    (runs `expo start --dev-client`)
- Run on devices/simulators:
  - `yarn android`
  - `yarn ios`
  - `yarn web`

### Quality Checks

- Lint (ESLint via Expo):
  - `yarn lint`
- Typecheck (TS only, no emit):
  - `npx tsc --noEmit`
- Dead-code analysis:
  - `yarn knip`
  - `yarn knip:fix`
- Duplicate code detection:
  - `yarn jscpd`
- Docs (Typedoc to `docs/api`):
  - `yarn docs`
- TODO/tech-debt scan in TS/TSX:
  - `yarn todo:check`

### Tests

- Default test run (watch mode):
  - `yarn test`  
    (Jest via `jest-expo`, watch all tests)
- CI-style run with coverage:
  - `yarn test:ci`
- Run a single test file or pattern (examples):
  - `yarn test -- src/features/wind/__tests__/wind-calculator.test.tsx`
  - `yarn test -- wind`  
    (matches tests whose path/name contains `wind`)

### Builds (EAS)

Prerequisites (once per machine):

- `npm install -g eas-cli`
- `eas login`

Common build commands:

- Android: `eas build --platform android`
- iOS: `eas build --platform ios`
- Both: `eas build --platform all`
- Use profiles defined in `eas.json`:
  - `eas build --profile development --platform android`
  - `eas build --profile preview --platform ios`
  - `eas build --profile production --platform all`

### Cleanup & Windows-Specific Notes

- Cross-platform cleanup helpers (before builds):
  - Windows CMD: `./cleanup.bat`
  - Windows PowerShell: `./cleanup.ps1`
  - macOS/Linux: `./cleanup.sh`

- Windows build patches and Gradle fixes:
  - `yarn` triggers `postinstall`, which runs `npx patch-package`, applies Android Gradle/Expo patches, and rebuilds the RN Gradle plugin (`scripts/rebuild-rn-gradle-plugin.js`).
  - To verify patched Android builds (typically via Git Bash/WSL or similar):
    - `cd android`
    - `./gradlew assembleDebug`

- Known Windows local build limitation (see `WINDOWS_LOCAL_BUILD_LIMITATION.md`):
  - Local Android builds may fail due to `react-native-worklets` prefab issues.
  - EAS Android builds **do** work; prefer `eas build --platform android --profile development` on Windows.
  - If local builds are required, consider:
    - Limiting architectures: `./gradlew :app:assembleDebug -PreactNativeArchitectures=arm64-v8a`
    - Using `./gradlew clean` then rebuilding
    - Running Android builds from WSL2.

---

## Architecture Overview

### Routing & App Shell (`app/`)

- **File-based navigation via expo-router**:
  - `app/_layout.tsx` defines the global layout, theme/provider wiring, and base navigation structure.
  - `app/index.tsx` is the main landing screen entry.
  - `app/modal.tsx`, `app/+not-found.tsx`, and grouped routes under `app/(tabs-redesign)/` define additional stacks/modals and redesigned tab navigation.
- **Routing rules:**
  - Do **not** introduce `NavigationContainer` or raw `createNativeStackNavigator`/`createBottomTabNavigator` directly.
  - New screens should be added as route files under `app/` and wired via existing layout/tab group files.

### Application Layers (`src/`)

`src/` is organized by **feature** plus a small core layer and shared utilities:

- `src/features/` – Domain features and screens:
  - Examples: `calculator`, `wind`, `home`, `settings`, `redesign`, `clubs`.
  - Each feature owns its screens, feature-specific hooks, and feature-specific components.
- `src/components/` – Cross-feature presentation and UX building blocks:
  - `src/components/ui/` – Reusable UI primitives (buttons, cards, inputs, etc.).
  - `src/components/redesign/`, `src/components/onboarding/`, etc. – Cross-feature visual components for specific initiatives.
  - Global components like `ContextualOverlay`, `EmptyState`, and error boundary wrappers live here.
- `src/core/` – Core primitives and domain-agnostic building blocks:
  - `src/core/components/` – Low-level reusable components shared across features.
  - `src/core/context/` – Core React contexts.
  - `src/core/models/` – Shared domain models and types.
- `src/providers/` – Top-level providers that bridge system data into React:
  - `EnhancedEnvironmentalProvider.tsx` is the canonical entry for environmental conditions (weather, location, sensors, etc.).
  - New code should consume environment via this provider (or hooks it exposes), **not** by re-introducing legacy providers or ad-hoc sensor logic.
- `src/stores/` – Zustand stores for app state (e.g., subscription, navigation preferences).  
  Stores should remain thin, typed, and driven by services/providers rather than direct networking.
- `src/services/` – Side-effect and integration layer:
  - Network calls and external APIs should live here.
  - Components should call hooks/providers that wrap service functions instead of performing fetches directly.
- `src/utils/` – Shared utilities and infrastructure helpers:
  - `responsive.ts` – Central responsive layout/typography helpers (`scaledFontSize`, `moderateScale`, etc.).
  - `SensorManager`, `ThrottleManager` – Sensor and update throttling utilities; use these rather than bespoke intervals/timeouts.
  - `CacheManager`, `SegmentedCacheManager`, `PerformanceMonitor`, `FeatureFlags`, permissions helpers, error handling, logging, and accessibility helpers.
- `src/theme/` – Design system:
  - `tokens.ts` – Canonical source for colors, spacing, radii, shadows, text styles.
  - `typography.ts`, `gradients.ts`, `animations.ts`, `ThemeProvider.tsx`, `useTokens.ts` – Higher-level theming and animation primitives.
  - `src/theme/redesign/` – Theme assets specific to the redesign work.
- Additional directories:
  - `src/hooks/` – Reusable hooks that compose stores/services/providers.
  - `src/navigation/` – Any helper code that supports expo-router navigation (not full navigators).
  - `src/config/`, `src/modules/`, `src/lib/`, `src/startup/`, `src/types/` – Configuration, integration modules, library helpers, startup wiring, and shared types.

### Platform & Assets

- `android/` – Native Android project; largely managed by Expo (plus Windows-specific patches).
- `assets/` – Images, fonts, and other static resources used across features.
- `docs/runbooks/` – Operational runbooks for incidents and procedures (app not loading, weather API issues, build failures, release process).

### Automated UI Review Pipeline

- Location: `scripts/ralph/ui-pipeline/`.
- Purpose: Multi-agent UI/UX review pipeline that iterates through key screens/components, runs multiple AI reviewers, synthesizes a plan, applies changes, and verifies them.
- Key files:
  - `prd.json` – Defines user stories/components, phases, and current pipeline state.
  - `prompt.md` – Pipeline instructions and agent prompts.
  - `reviews/` – Full audit trail of each run (per-phase markdown outputs).
  - `ralph-ui-pipeline.ps1` / `ralph-ui-pipeline.sh` – Orchestration scripts.
- How to run the pipeline:
  - Windows PowerShell:
    - `cd scripts\ralph\ui-pipeline`
    - `./ralph-ui-pipeline.ps1 -MaxIterations 50`
  - macOS/Linux:
    - `cd scripts/ralph/ui-pipeline`
    - `chmod +x ralph-ui-pipeline.sh`
    - `./ralph-ui-pipeline.sh 50`

Use this pipeline when performing large-scale UI polish passes; it expects typechecking to pass between phases (use `npx tsc --noEmit` when the pipeline gets stuck).

---

## AI Editing Rules & Conventions (from CLAUDE.md and .cursorrules)

These are the most important constraints for AI-driven edits in this repo.

### TypeScript & Code Style

- Use **TypeScript everywhere**; avoid `any` (prefer `unknown` where necessary).
- Prefer **interfaces** over type aliases for public shapes and component props.
- File naming: **kebab-case** for TS/TSX files (e.g., `course-card.tsx`).
- Use the `@/` alias for app imports (configured in `tsconfig.json`); avoid long `../../..` relative paths.
- Components must be **functional** (no classes) and exported with explicit props interfaces (e.g., `React.FC<Props>` where appropriate).
- Do **not** import Node-specific types/APIs into React Native app code:
  - Use `ReturnType<typeof setTimeout>` instead of `NodeJS.Timeout`.
  - Do not add `@types/node` usages in app code.

### Navigation

- Use **expo-router** exclusively:
  - Do not introduce raw `NavigationContainer`, `createNativeStackNavigator`, or `createBottomTabNavigator`.
  - Changes to navigation should be made via route files under `app/` and the layout files (`_layout.tsx` and tab layouts).
- Avoid adding alternative navigation stacks outside of expo-router’s model.

### Environment & Secrets

- Never hardcode API keys or secrets.
- Client-visible configuration must use `EXPO_PUBLIC_*` variables managed via EAS env:
  - Example workflow is documented in `README.md` and `setup-env.bat`.
- Access env values via `process.env.EXPO_PUBLIC_*` in app code.

### Design System & Theming

- **No hardcoded visual tokens**:
  - Colors, gradients, shadows, borders, radii must come from:
    - `src/theme/tokens.ts` and related theme utilities, or
    - `constants/Colors.ts` where specifically used.
  - If a required token does not exist, add it to `tokens.ts` and then use it.
- Follow the defined **color palette** and **8pt spacing scale** from `CLAUDE.md` and `src/theme/tokens.ts`.
- Typography:
  - Use `scaledFontSize()` and related helpers from `src/utils/responsive.ts` for text.
  - Maintain WCAG AA+ contrast in both light and dark modes.
- Cards and surfaces:
  - Use shared radius, padding, and shadow tokens so cards look consistent across the app.

### Layout, Responsiveness, and Accessibility

- Wrap screens with `SafeAreaView` from `react-native-safe-area-context`.
- Use responsive helpers from `src/utils/responsive.ts`:
  - Replace fixed paddings/margins with `moderateScale(...)` or other shared utilities.
  - For large numbers/text (e.g., yardage, temperature), ensure `numberOfLines={1}`, `adjustsFontSizeToFit`, and an appropriate `minimumFontScale`.
  - Collapse multi-column layouts on narrow devices or high `fontScale` using `useWindowDimensions`.
- Lists:
  - Use **FlashList** (not FlatList) for lists with more than ~20 items.
- Accessibility & testing:
  - All interactive elements must have `accessibilityLabel` and `accessibilityRole`.
  - Provide `testID` on interactive elements that are exercised in tests.
  - Consider outdoor readability and one-handed operation when adjusting layouts.

### State, Data, and Performance

- State and environment:
  - Use `EnhancedEnvironmentalProvider` for environmental and conditions data instead of introducing new providers or ad-hoc sensor logic.
  - Keep shared, cross-screen state in Zustand stores under `src/stores` where appropriate.
- Data access:
  - Avoid direct `fetch`/network calls from components.
  - Add integrations under `src/services/*` and surface them via hooks/providers.
- Performance:
  - Use `ThrottleManager` and related utilities for periodic/sensor updates instead of custom intervals.
  - Use `ProgressiveLoader` / `SkeletonLoader` (where present) for async UI states.
  - Memoize heavy/pure components with `React.memo`, `useMemo`, and `useCallback` when beneficial.

### Testing

- Prefer `@testing-library/react-native` over `react-test-renderer`; minimize snapshot-only tests.
- Co-locate tests with source where practical; Jest is configured to collect coverage from `src/**/*.{ts,tsx}` (excluding `*.d.ts` and `**/types.ts`).
- Focus tests on calculations, providers, and critical flows; do not perform real network calls in tests.
- Template tests under `components/__tests__/` may be removed or ignored if incompatible with the current React/Expo versions.

---

## Operational & Reference Docs

- **README.md** – Environment setup (EAS env vars, cleanup scripts) and EAS build profiles.
- **CLAUDE.md** – Detailed stack, design system description, CLI shortcuts, and additional UX guidelines.
- **.cursorrules** – Project-wide AI editing rules (navigation, theming, env handling, state, testing). Treat these as authoritative for code changes.
- **WINDOWS_BUILD_FIXES.md** – Details on Windows-specific Gradle/Expo patches applied via `patch-package` and helper scripts.
- **WINDOWS_LOCAL_BUILD_LIMITATION.md** – Known issues and workarounds for local Android builds on Windows.
- **docs/runbooks/** – Operational runbooks for incidents (app not loading, weather API outages, build failures, release process).
- **scripts/ralph/ui-pipeline/README.md** – Deep dive into the multi-agent UI review pipeline and its phases.

When in doubt about project conventions or non-obvious patterns, consult `CLAUDE.md` and `.cursorrules` first, then inspect the corresponding `src/` feature or core module for concrete examples.
