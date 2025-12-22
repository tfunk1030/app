# Component Generator

Create a new React Native component named $ARGUMENTS following AICaddyPro conventions.

## Steps:
1. Create component directory at src/components/$ARGUMENTS/
2. Create main component file $ARGUMENTS.tsx with:
   - TypeScript interface for props
   - React.FC typing
   - React.memo wrapper for performance
   - Proper accessibilityLabel and accessibilityRole
   - Support for dark mode via dark: classes
   - testID for automation testing
3. Create types file $ARGUMENTS.types.ts
4. Create barrel export index.ts
5. Create test file __tests__/$ARGUMENTS.test.tsx

## Use patterns from:
- Reference: src/components/Button/Button.tsx
- Styling: NativeWind with design tokens from src/theme/tokens.ts

## Output:
List all created files and their locations.
