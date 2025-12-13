# AICaddy Pro Mobile App

## Environment Setup

This app uses environment variables for API keys. Set them up with:

```bash
# Run the setup-env.bat script (Windows)
./setup-env.bat

# Or manually run each command:
eas env:create --scope project --name EXPO_PUBLIC_TOMORROW_API_KEY --value "your-api-key" --type string --visibility "plaintext"
eas env:create --scope project --name EXPO_PUBLIC_OPENWEATHER_API_KEY --value "your-api-key" --type string --visibility "plaintext"
eas env:create --scope project --name EXPO_PUBLIC_WEATHERBIT_API_KEY --value "your-api-key" --type string --visibility "plaintext"
eas env:create --scope project --name EXPO_PUBLIC_MAPS_API_KEY --value "your-api-key" --type string --visibility "plaintext"
```

> **Note:** Variables with the `EXPO_PUBLIC_` prefix must use "plaintext" visibility as they will be accessible in the compiled app. Never store truly sensitive information in these variables.

## Building with EAS

### Prerequisites

1. Install EAS CLI:
```bash
npm install -g eas-cli
```

2. Log in to EAS:
```bash
eas login
```

### Build Commands

Build for Android:
```bash
eas build --platform android
```

Build for iOS:
```bash
eas build --platform ios
```

Build for both platforms:
```bash
eas build --platform all
```

### Build Profiles

The app has the following build profiles in `eas.json`:

- **development**: For development testing with development client
- **preview**: For internal testing
- **production**: For app store submission

To use a specific profile:
```bash
eas build --profile preview --platform ios
```

## Project Cleanup

Before building, you can clean up the project with:

```bash
# Windows CMD
./cleanup.bat

# Windows PowerShell
./cleanup.ps1

# Unix/Mac
./cleanup.sh
```

This will:
- Clean Android build cache
- Refresh node_modules
- Set up environment configuration properly 