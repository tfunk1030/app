#!/bin/bash
# Script to set up local Maven repository for React Native Gradle plugin
# This is needed because Expo plugins require it as a dependency

set -e

echo "Setting up local Maven repository for React Native Gradle plugin..."

# Create directory structure
mkdir -p android/local-maven-repo/com/facebook/react/react-native-gradle-plugin/0.79.6

# Build the React Native Gradle plugin JAR
echo "Building React Native Gradle plugin..."
cd node_modules/@react-native/gradle-plugin
./gradlew :react-native-gradle-plugin:jar -x test

# Copy JAR to local Maven repository
echo "Copying JAR to local Maven repository..."
cp react-native-gradle-plugin/build/libs/react-native-gradle-plugin.jar ../../android/local-maven-repo/com/facebook/react/react-native-gradle-plugin/0.79.6/react-native-gradle-plugin-0.79.6.jar

# Create POM file
echo "Creating POM file..."
cat > ../../android/local-maven-repo/com/facebook/react/react-native-gradle-plugin/0.79.6/react-native-gradle-plugin-0.79.6.pom << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
  <modelVersion>4.0.0</modelVersion>
  <groupId>com.facebook.react</groupId>
  <artifactId>react-native-gradle-plugin</artifactId>
  <version>0.79.6</version>
  <packaging>jar</packaging>
  <name>React Native Gradle Plugin</name>
  <description>Gradle plugin for React Native</description>
</project>
EOF

cd ../../

echo "Local Maven repository setup complete!"
echo "The React Native Gradle plugin is now available at:"
echo "  android/local-maven-repo/com/facebook/react/react-native-gradle-plugin/0.79.6/"

