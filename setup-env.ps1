# PowerShell script for setting up environment variables
Write-Host "Setting up environment variables using eas env:create..."

# Set up Tomorrow API key
Write-Host "Setting up EXPO_PUBLIC_TOMORROW_API_KEY (provide via CI/Secrets)..."
eas env:create --scope project --name EXPO_PUBLIC_TOMORROW_API_KEY --value "" --type string --visibility "plaintext"

# Set up OpenWeather API key
Write-Host "Setting up EXPO_PUBLIC_OPENWEATHER_API_KEY (provide via CI/Secrets)..."
eas env:create --scope project --name EXPO_PUBLIC_OPENWEATHER_API_KEY --value "" --type string --visibility "plaintext"

# Set up Weatherbit API key
Write-Host "Setting up EXPO_PUBLIC_WEATHERBIT_API_KEY (provide via CI/Secrets)..."
eas env:create --scope project --name EXPO_PUBLIC_WEATHERBIT_API_KEY --value "" --type string --visibility "plaintext"

# Set up Stormglass API key
Write-Host "Setting up EXPO_PUBLIC_STORMGLASS_API_KEY (provide via CI/Secrets)..."
eas env:create --scope project --name EXPO_PUBLIC_STORMGLASS_API_KEY --value "" --type string --visibility "plaintext"

# Set up Maps API key
Write-Host "Setting up EXPO_PUBLIC_MAPS_API_KEY (provide via CI/Secrets)..."
eas env:create --scope project --name EXPO_PUBLIC_MAPS_API_KEY --value "" --type string --visibility "plaintext"

Write-Host "Environment setup complete!"
Write-Host ""
Write-Host "NOTE: EXPO_PUBLIC_ variables have been set with 'plaintext' visibility since they'll be accessible in the app."
