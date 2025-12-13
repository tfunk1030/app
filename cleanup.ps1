# PowerShell script for cleaning up Expo project for EAS build
Write-Host "Cleaning up Expo project for EAS build..." -ForegroundColor Cyan

# Remove Android build cache
Write-Host "Removing Android build cache..." -ForegroundColor Yellow
if (Test-Path -Path "android\.gradle") {
    Remove-Item -Path "android\.gradle" -Recurse -Force
    Write-Host "Android build cache removed successfully." -ForegroundColor Green
} else {
    Write-Host "No Android build cache found." -ForegroundColor Gray
}

# Clean and reinstall node_modules
Write-Host "Cleaning node_modules..." -ForegroundColor Yellow
if (Test-Path -Path "node_modules") {
    Remove-Item -Path "node_modules" -Recurse -Force
    Write-Host "node_modules removed successfully." -ForegroundColor Green
} else {
    Write-Host "No node_modules directory found." -ForegroundColor Gray
}

# Install fresh dependencies
Write-Host "Installing fresh dependencies..." -ForegroundColor Yellow
yarn install
Write-Host "Dependencies installed successfully." -ForegroundColor Green

# Create environment config file that uses EAS secrets
Write-Host "Creating environment configuration..." -ForegroundColor Yellow

# Ensure src directory exists
if (-not (Test-Path -Path "src")) {
    New-Item -Path "src" -ItemType Directory
}

$envContent = @"
// env.ts
export const ENV = {
  TOMORROW_API_KEY: process.env.EXPO_PUBLIC_TOMORROW_API_KEY,
  OPENWEATHER_API_KEY: process.env.EXPO_PUBLIC_OPENWEATHER_API_KEY,
  WEATHERBIT_API_KEY: process.env.EXPO_PUBLIC_WEATHERBIT_API_KEY,
  MAPS_API_KEY: process.env.EXPO_PUBLIC_MAPS_API_KEY,
} as const;
"@

Set-Content -Path "src\env.ts" -Value $envContent
Write-Host "Environment configuration created successfully." -ForegroundColor Green

Write-Host "Cleanup complete!" -ForegroundColor Cyan
Write-Host ""
Write-Host "NEXT STEPS:" -ForegroundColor Magenta
Write-Host "1. Make sure your API keys are set in EAS with:" -ForegroundColor White
Write-Host "   eas env:create --scope project --name EXPO_PUBLIC_TOMORROW_API_KEY --value 'your-api-key' --type string --visibility 'plaintext'" -ForegroundColor Gray
Write-Host "2. Run your EAS build with: eas build --platform ios (or android)" -ForegroundColor White
Write-Host "" 