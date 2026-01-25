---
name: ui-skills
description: Opinionated constraints for React Native interfaces.
---

# UI Skills (React Native)

When invoked, apply these opinionated constraints for building better React Native interfaces.

## How to use

- `/ui-skills`
  Apply these constraints to any UI work in this conversation.

- `/ui-skills <file>`
  Review the file against all constraints below and output:
  - violations (quote the exact line/snippet)
  - why it matters (1 short sentence)
  - a concrete fix (code-level suggestion)

## Stack

- MUST use NativeWind/Tailwind defaults unless custom values already exist or are explicitly requested
- MUST use `react-native-reanimated` for JavaScript animation
- MUST use `cn` utility (`clsx` + `tailwind-merge`) for class logic
- MUST use design tokens from `src/theme/tokens.ts`

## Components

- MUST add `accessibilityLabel` to all interactive elements
- MUST add `accessibilityRole` (`button`, `header`, `link`, `image`, etc.)
- MUST use 48dp minimum touch targets (56dp for primary actions)
- SHOULD use `hitSlop` when sizing can't change
- MUST use the project's existing component primitives first
- NEVER rebuild gesture handling by hand (use `react-native-gesture-handler`)
- NEVER mix gesture systems within the same interaction surface

## Interaction

- MUST wrap screens in `SafeAreaView` or use `useSafeAreaInsets`
- MUST use `Alert.alert` or `TrueSheet` for destructive/irreversible actions
- SHOULD use `Skeleton` components for loading states
- MUST show errors inline near the action that caused them
- NEVER block paste in `TextInput`
- MUST handle keyboard avoidance (`KeyboardAvoidingView` or `react-native-keyboard-controller`)

## Animation

- NEVER add animation unless it is explicitly requested
- MUST animate only `transform` and `opacity`
- MUST use worklets for animated styles (`useAnimatedStyle`)
- MUST check `useReducedMotion()` and provide static fallback
- SHOULD use spring physics (`withSpring`) over timing
- NEVER exceed 200ms for interaction feedback
- SHOULD use `entering`/`exiting` props for layout animations
- NEVER animate `BlurView` or large backdrop surfaces

## Typography

- MUST use `numberOfLines` for truncation
- SHOULD use `adjustsFontSizeToFit` for constrained labels
- MUST use `fontVariant: ['tabular-nums']` for data/numbers
- NEVER modify `letterSpacing` unless explicitly requested

## Layout

- MUST use flex for layout (no absolute positioning unless necessary)
- MUST use fixed zIndex scale (10, 20, 30, 40, 50)
- SHOULD use `size-*` for square elements instead of `w-*` + `h-*`
- MUST use percentage or flex for responsive widths
- NEVER use hardcoded pixel values for responsive dimensions

## Performance

- NEVER animate `BlurView` or large backdrop surfaces
- NEVER use `useEffect` for anything that can be expressed as render logic
- MUST use `FlashList` for lists >20 items
- SHOULD memoize expensive renders (`React.memo`, `useMemo`)
- SHOULD use `useCallback` for event handlers passed to child components
- NEVER create inline styles in render (use StyleSheet or NativeWind)

## Design

- NEVER use gradients unless explicitly requested
- NEVER use purple or multicolor gradients
- NEVER use glow effects as primary affordances
- MUST use theme tokens (no hardcoded colors)
- MUST give empty states one clear next action
- SHOULD limit accent color usage to one per screen
- SHOULD use existing theme tokens before introducing new ones
- MUST consider outdoor sunlight readability for golf app
