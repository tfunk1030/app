@echo off
echo Cleaning up Expo project for EAS build...

:: Remove Android build cache
echo Removing Android build cache...
if exist android\.gradle (
  rmdir /s /q android\.gradle
)

:: Clean and reinstall node_modules
echo Cleaning node_modules...
if exist node_modules (
  rmdir /s /q node_modules
)

echo Installing fresh dependencies...
call yarn install

:: Create environment config file that uses EAS secrets
echo Creating environment configuration...
echo // env.ts > src\env.ts
echo export const ENV = { >> src\env.ts
echo   TOMORROW_API_KEY: process.env.EXPO_PUBLIC_TOMORROW_API_KEY, >> src\env.ts
echo   OPENWEATHER_API_KEY: process.env.EXPO_PUBLIC_OPENWEATHER_API_KEY, >> src\env.ts
echo   WEATHERBIT_API_KEY: process.env.EXPO_PUBLIC_WEATHERBIT_API_KEY, >> src\env.ts
echo   MAPS_API_KEY: process.env.EXPO_PUBLIC_MAPS_API_KEY, >> src\env.ts
echo } as const; >> src\env.ts

echo Cleanup complete!
echo.
echo NEXT STEPS:
echo 1. Add your API keys as EAS secrets using:
echo    eas secret:create --scope project --name EXPO_PUBLIC_TOMORROW_API_KEY --value "your-api-key"
echo 2. Run your EAS build with: eas build --platform ios (or android)
echo. 