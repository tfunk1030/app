@echo off
REM Script to set up local Maven repository for React Native Gradle plugin
REM This is needed because Expo plugins require it as a dependency

echo Setting up local Maven repository for React Native Gradle plugin...

REM Create directory structure
if not exist "android\local-maven-repo\com\facebook\react\react-native-gradle-plugin\0.79.6" (
    mkdir "android\local-maven-repo\com\facebook\react\react-native-gradle-plugin\0.79.6"
)

REM Build the React Native Gradle plugin JAR
echo Building React Native Gradle plugin...
cd node_modules\@react-native\gradle-plugin
call gradlew.bat :react-native-gradle-plugin:jar -x test

REM Copy JAR to local Maven repository
echo Copying JAR to local Maven repository...
copy react-native-gradle-plugin\build\libs\react-native-gradle-plugin.jar ..\..\android\local-maven-repo\com\facebook\react\react-native-gradle-plugin\%RN_VERSION%\react-native-gradle-plugin-%RN_VERSION%.jar

REM Create POM file
echo Creating POM file...
(
echo ^<?xml version="1.0" encoding="UTF-8"?^>
echo ^<project xmlns="http://maven.apache.org/POM/4.0.0"
echo          xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
echo          xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd"^>
echo   ^<modelVersion^>4.0.0^</modelVersion^>
echo   ^<groupId^>com.facebook.react^</groupId^>
echo   ^<artifactId^>react-native-gradle-plugin^</artifactId^>
echo   ^<version^>%RN_VERSION%^</version^>
echo   ^<packaging^>jar^</packaging^>
echo   ^<name^>React Native Gradle Plugin^</name^>
echo   ^<description^>Gradle plugin for React Native^</description^>
echo ^</project^>
) > ..\..\android\local-maven-repo\com\facebook\react\react-native-gradle-plugin\0.79.6\react-native-gradle-plugin-0.79.6.pom

cd ..\..

echo Local Maven repository setup complete!
echo The React Native Gradle plugin is now available at:
echo   android\local-maven-repo\com\facebook\react\react-native-gradle-plugin\%RN_VERSION%\

