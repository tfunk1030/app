#!/bin/bash
echo "Cleaning up Expo project for EAS build..."

# Remove Android build cache
echo "Removing Android build cache..."
if [ -d "android/.gradle" ]; then
  rm -rf android/.gradle
fi

# Clean and reinstall node_modules
echo "Cleaning node_modules..."
if [ -d "node_modules" ]; then
  rm -rf node_modules
fi

echo "Installing fresh dependencies..."
yarn install

# Create environment config file that uses EAS secrets
echo "Creating environment configuration..."
mkdir -p src
cat > src/env.ts << EOL
// env.ts
export const ENV = {
  TOMORROW_API_KEY: process.env.EXPO_PUBLIC_TOMORROW_API_KEY,
  OPENWEATHER_API_KEY: process.env.EXPO_PUBLIC_OPENWEATHER_API_KEY,
  WEATHERBIT_API_KEY: process.env.EXPO_PUBLIC_WEATHERBIT_API_KEY,
  MAPS_API_KEY: process.env.EXPO_PUBLIC_MAPS_API_KEY,
} as const;
EOL

echo "Cleanup complete!"
echo ""
echo "NEXT STEPS:"
echo "1. Add your API keys as EAS secrets using:"
echo "   eas secret:create --scope project --name EXPO_PUBLIC_TOMORROW_API_KEY --value \"your-api-key\""
echo "2. Run your EAS build with: eas build --platform ios (or android)"
echo "" 