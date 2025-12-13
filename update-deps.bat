@echo off
cd aicaddypro
call npx expo install expo-router@~4.0.17 @expo/metro-runtime@~1.2.0
call npx expo start --clear