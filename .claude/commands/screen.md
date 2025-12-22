# Screen Generator

Create a new Expo Router screen at $ARGUMENTS.

## Steps:
1. Determine route path from $ARGUMENTS:
   - If starts with (tabs)/ - Tab screen
   - If starts with (auth)/ - Auth flow screen
   - If contains [id] - Dynamic route
   - Otherwise - Standard screen

2. Create screen file at app/$ARGUMENTS.tsx with:
   - Proper Stack.Screen options
   - SafeAreaView wrapper
   - Loading and error states
   - Accessibility landmarks

3. If tab screen, update tab configuration
4. Create associated components in src/components/screens/

## Output:
- Created file paths
- Navigation structure update
- Required component imports
