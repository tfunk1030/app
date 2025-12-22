# AICaddyPro - Professional Golf Application

## Project Overview
React Native golf application with weather-based shot calculations, GPS course mapping, and real-time score tracking.

## Architecture
- Framework: React Native with Expo SDK 54+
- Routing: Expo Router with file-based navigation
- Styling: NativeWind v4 (Tailwind for React Native)
- State: Zustand for global state

## Code Style Requirements
- TypeScript everywhere - no any types (use unknown if needed)
- File naming: kebab-case (e.g., course-card.tsx)
- Import paths: Use @/ alias
- Components: Functional only, typed with React.FC<Props>
- Lists: Use FlashList for >20 items

## Design System

### Color Palette
- primary: #2E8B57 (Course green)
- primaryLight: #3CB371
- primaryDark: #228B22
- accent: #F4D03F (Sand/gold)
- background: #FAFAFA (Light)
- backgroundDark: #0F172A (Dark)
- surface: #FFFFFF
- surfaceDark: #1E293B
- textPrimary: #1A1A1A
- textSecondary: #6B7280
- success: #16A34A (Under par)
- warning: #F59E0B (Bogey)
- error: #DC2626 (Out of bounds)

### Spacing Scale (8pt Grid)
- xs: 4px
- sm: 8px
- md: 16px
- lg: 24px
- xl: 32px
- 2xl: 48px

### Touch Targets
- Minimum: 48x48dp (larger than standard for glove use)
- Primary actions: 56x56dp

## Frontend Design Skill

When building UI:
- Make creative, distinctive interfaces
- Avoid overused patterns and AI slop aesthetics
- Choose beautiful, unique fonts (avoid Inter, Roboto, Arial for headings)
- Commit to cohesive, intentional color themes
- Avoid purple-blue gradients on white
- Create atmosphere and depth with gradients, textures, shadows
- Avoid flat solid color backgrounds
- Use purposeful whitespace

## Component Requirements
1. ALL interactive elements must have accessibilityLabel and accessibilityRole
2. Support both light and dark modes (dark: prefix)
3. Use design tokens only - NO hardcoded colors/spacing
4. Include loading, error, and empty states
5. Wrap in React.memo for list items

## Animation Standards
- Library: react-native-reanimated
- Button press: scale(0.9) then spring back
- Page transitions: 200-300ms or spring physics
- Respect reduceMotion accessibility setting

## CLI Commands
- npm start or npx expo start - Start dev server
- npx expo install [package] - Install dependencies
- npx expo lint - Run ESLint
- eas build -p ios --profile preview - iOS build
- eas build -p android --profile preview - Android build

## NEVER Do These Things
- Use FlatList for lists >20 items (use FlashList)
- Hardcode colors without semantic meaning
- Use magic numbers for spacing
- Modify existing tests without permission
- Use any type
- Create components without accessibilityLabel
- Skip loading/error/empty states

## ALWAYS Do These Things
- Use semantic tokens for colors and spacing
- Include TypeScript interfaces for all props
- Add testID for interactive elements
- Test on both iOS and Android
- Consider outdoor sunlight readability
- Design for one-handed thumb-zone operation
