#!/bin/bash
# Script to integrate the swift files into XCode project

# Check if the xcode command line tools are installed
if ! command -v xcodeproj &> /dev/null; then
    echo "Error: xcodeproj command not found. Install with: gem install xcodeproj"
    exit 1
fi

# Define the project directory and file path
PROJECT_DIR="$(pwd)"
PROJECT_FILE=$(find . -name "*.xcodeproj" -maxdepth 1 | head -n 1)

if [ -z "$PROJECT_FILE" ]; then
    echo "Error: No XCode project found in the current directory"
    exit 1
fi

echo "Found XCode project: $PROJECT_FILE"

# Files to add
FILES_TO_ADD=(
    "NativeErrorModule.swift"
    "NativeErrorModule.m"
    "ErrorRecovery.swift"
    "StartupProcedure.swift"
)

# Check if files exist
for file in "${FILES_TO_ADD[@]}"; do
    if [ ! -f "$file" ]; then
        echo "Error: File $file does not exist"
        exit 1
    fi
done

echo "All files found, integrating into XCode project..."

# Add Swift files to the project using the xcodeproj gem
echo "import 'xcodeproj'

# Open the project
project_path = ARGV[0]
project = Xcodeproj::Project.open(project_path)

# Get the main target
target = project.targets.first

# Find the source build phase
source_build_phase = target.source_build_phase

# Files to add
files_to_add = ARGV[1..-1]

# Add files to the project
files_to_add.each do |file_path|
  file_ref = project.new_file(file_path)

  # If it's a Swift file, make sure we have Swift support
  if file_path.end_with?('.swift')
    target.build_configurations.each do |config|
      config.build_settings['SWIFT_VERSION'] = '5.0'
    end
  end

  # Add file to the build phase
  source_build_phase.add_file_reference(file_ref)
  puts \"Added \#{file_path} to project\"
end

# Also make sure we have the BuildConfig.xcconfig
if File.exist?('BuildConfig.xcconfig')
  target.build_configurations.each do |config|
    if config.name == 'Debug'
      config.base_configuration_reference = project.new_file('BuildConfig.xcconfig')
      puts \"Set BuildConfig.xcconfig for Debug configuration\"
    end
  end
end

# Save the project
project.save
puts \"Project updated and saved!\"
" > add_files.rb

# Run the Ruby script to add files to the project
ruby add_files.rb "$PROJECT_FILE" "${FILES_TO_ADD[@]}"

echo "Integration complete!"
echo "Next steps:"
echo "1. Open the XCode project and build to verify"
echo "2. Make sure the BuildConfig.xcconfig is applied to the Debug configuration"
echo "3. Run tests to ensure everything works correctly"
