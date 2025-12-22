<#
.SYNOPSIS
    AICaddyPro Claude Code Complete Toolkit Installer
    
.DESCRIPTION
    One-shot installation of all Claude Code tools, MCP servers, agents, 
    skills, commands, and configurations for React Native/Expo development.
    
.NOTES
    Version: 1.1
    Date: December 21, 2025
    For: AICaddyPro Golf Application
    
.EXAMPLE
    .\install-claude-code-toolkit.ps1 -ProjectPath "C:\dev\aicaddypro"
#>

param(
    [Parameter(Mandatory=$true)]
    [string]$ProjectPath,
    
    [switch]$SkipNpmInstall,
    [switch]$SkipAgentSystem
)

$ErrorActionPreference = "Stop"

function Write-Step { param($msg) Write-Host "`n[STEP] $msg" -ForegroundColor Cyan }
function Write-Success { param($msg) Write-Host "[OK] $msg" -ForegroundColor Green }
function Write-Warn { param($msg) Write-Host "[WARN] $msg" -ForegroundColor Yellow }
function Write-Err { param($msg) Write-Host "[ERROR] $msg" -ForegroundColor Red }
function Write-Info { param($msg) Write-Host "[INFO] $msg" -ForegroundColor Gray }

# Banner
Write-Host ""
Write-Host "================================================================" -ForegroundColor Magenta
Write-Host "   AICaddyPro Claude Code Toolkit Installer v1.1" -ForegroundColor Magenta
Write-Host "   React Native / Expo Development Environment" -ForegroundColor Magenta
Write-Host "================================================================" -ForegroundColor Magenta
Write-Host ""
Write-Host "Project Path: $ProjectPath" -ForegroundColor White
Write-Host ""

# Prerequisites Check
Write-Step "Checking prerequisites..."

try {
    $nodeVersion = node --version
    Write-Success "Node.js found: $nodeVersion"
} catch {
    Write-Err "Node.js not found. Please install Node.js 18+ from https://nodejs.org"
    exit 1
}

try {
    $npmVersion = npm --version
    Write-Success "npm found: $npmVersion"
} catch {
    Write-Err "npm not found."
    exit 1
}

try {
    $gitVersion = git --version
    Write-Success "Git found: $gitVersion"
} catch {
    Write-Err "Git not found. Please install Git from https://git-scm.com"
    exit 1
}

if (-not (Test-Path $ProjectPath)) {
    Write-Warn "Project path does not exist. Creating: $ProjectPath"
    New-Item -ItemType Directory -Path $ProjectPath -Force | Out-Null
}

Set-Location $ProjectPath
Write-Success "Working directory: $ProjectPath"

# Install Claude Code
Write-Step "Installing Claude Code CLI..."

try {
    npm install -g @anthropic-ai/claude-code 2>$null
    Write-Success "Claude Code installed globally"
} catch {
    Write-Warn "Claude Code may already be installed"
}

# Create Project Structure
Write-Step "Creating project directory structure..."

$directories = @(
    ".claude",
    ".claude\commands",
    ".claude\skills",
    ".claude\agents",
    "src",
    "src\components",
    "src\hooks",
    "src\utils",
    "src\theme",
    "src\stores",
    "src\types",
    "app",
    "app\(tabs)",
    "app\(auth)",
    "assets",
    "eslint-rules"
)

foreach ($dir in $directories) {
    $fullPath = Join-Path $ProjectPath $dir
    if (-not (Test-Path $fullPath)) {
        New-Item -ItemType Directory -Path $fullPath -Force | Out-Null
        Write-Info "Created: $dir"
    }
}

Write-Success "Project structure created"

# Create CLAUDE.md
Write-Step "Creating CLAUDE.md configuration..."

$claudeMd = @'
# AICaddyPro - Professional Golf Application

## Project Overview
React Native golf application with weather-based shot calculations, GPS course mapping, and real-time score tracking.

## Architecture
- Framework: React Native with Expo SDK 54+
- Routing: Expo Router with file-based navigation
- Styling: NativeWind v4 (Tailwind for React Native)
- State: Zustand for global state

## Code Style Requirements
- TypeScript everywhere - no any types (use unknown if needed)
- File naming: kebab-case (e.g., course-card.tsx)
- Import paths: Use @/ alias
- Components: Functional only, typed with React.FC<Props>
- Lists: Use FlashList for >20 items

## Design System

### Color Palette
- primary: #2E8B57 (Course green)
- primaryLight: #3CB371
- primaryDark: #228B22
- accent: #F4D03F (Sand/gold)
- background: #FAFAFA (Light)
- backgroundDark: #0F172A (Dark)
- surface: #FFFFFF
- surfaceDark: #1E293B
- textPrimary: #1A1A1A
- textSecondary: #6B7280
- success: #16A34A (Under par)
- warning: #F59E0B (Bogey)
- error: #DC2626 (Out of bounds)

### Spacing Scale (8pt Grid)
- xs: 4px
- sm: 8px
- md: 16px
- lg: 24px
- xl: 32px
- 2xl: 48px

### Touch Targets
- Minimum: 48x48dp (larger than standard for glove use)
- Primary actions: 56x56dp

## Frontend Design Skill

When building UI:
- Make creative, distinctive interfaces
- Avoid overused patterns and AI slop aesthetics
- Choose beautiful, unique fonts (avoid Inter, Roboto, Arial for headings)
- Commit to cohesive, intentional color themes
- Avoid purple-blue gradients on white
- Create atmosphere and depth with gradients, textures, shadows
- Avoid flat solid color backgrounds
- Use purposeful whitespace

## Component Requirements
1. ALL interactive elements must have accessibilityLabel and accessibilityRole
2. Support both light and dark modes (dark: prefix)
3. Use design tokens only - NO hardcoded colors/spacing
4. Include loading, error, and empty states
5. Wrap in React.memo for list items

## Animation Standards
- Library: react-native-reanimated
- Button press: scale(0.9) then spring back
- Page transitions: 200-300ms or spring physics
- Respect reduceMotion accessibility setting

## CLI Commands
- npm start or npx expo start - Start dev server
- npx expo install [package] - Install dependencies
- npx expo lint - Run ESLint
- eas build -p ios --profile preview - iOS build
- eas build -p android --profile preview - Android build

## NEVER Do These Things
- Use FlatList for lists >20 items (use FlashList)
- Hardcode colors without semantic meaning
- Use magic numbers for spacing
- Modify existing tests without permission
- Use any type
- Create components without accessibilityLabel
- Skip loading/error/empty states

## ALWAYS Do These Things
- Use semantic tokens for colors and spacing
- Include TypeScript interfaces for all props
- Add testID for interactive elements
- Test on both iOS and Android
- Consider outdoor sunlight readability
- Design for one-handed thumb-zone operation
'@

Set-Content -Path (Join-Path $ProjectPath "CLAUDE.md") -Value $claudeMd -Encoding UTF8
Write-Success "Created CLAUDE.md"

# Create CLAUDE.local.md
Write-Step "Creating CLAUDE.local.md..."

$claudeLocal = @"
# Personal Claude Code Settings

## Development Environment
- Machine: Windows PC
- Project Path: $ProjectPath

## Preferred Patterns
- Always use explicit TypeScript return types
- Prefer early returns over nested conditionals
- Add JSDoc comments for complex functions
"@

Set-Content -Path (Join-Path $ProjectPath "CLAUDE.local.md") -Value $claudeLocal -Encoding UTF8
Write-Success "Created CLAUDE.local.md"

# Create MCP Configuration
Write-Step "Creating MCP server configuration..."

$mcpJson = @"
{
  "mcpServers": {
    "react-native": {
      "command": "npx",
      "args": ["run", "cali-mcp-server@latest"],
      "env": {
        "FILESYSTEM_ROOT": "$($ProjectPath -replace '\\', '\\\\')"
      }
    }
  }
}
"@

Set-Content -Path (Join-Path $ProjectPath ".mcp.json") -Value $mcpJson -Encoding UTF8
Write-Success "Created .mcp.json"

# Create Slash Commands
Write-Step "Creating custom slash commands..."

# Component Command
$componentCmd = @'
# Component Generator

Create a new React Native component named $ARGUMENTS following AICaddyPro conventions.

## Steps:
1. Create component directory at src/components/$ARGUMENTS/
2. Create main component file $ARGUMENTS.tsx with:
   - TypeScript interface for props
   - React.FC typing
   - React.memo wrapper for performance
   - Proper accessibilityLabel and accessibilityRole
   - Support for dark mode via dark: classes
   - testID for automation testing
3. Create types file $ARGUMENTS.types.ts
4. Create barrel export index.ts
5. Create test file __tests__/$ARGUMENTS.test.tsx

## Use patterns from:
- Reference: src/components/Button/Button.tsx
- Styling: NativeWind with design tokens from src/theme/tokens.ts

## Output:
List all created files and their locations.
'@
Set-Content -Path (Join-Path $ProjectPath ".claude\commands\component.md") -Value $componentCmd -Encoding UTF8
Write-Info "Created: component.md"

# Screen Command
$screenCmd = @'
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
'@
Set-Content -Path (Join-Path $ProjectPath ".claude\commands\screen.md") -Value $screenCmd -Encoding UTF8
Write-Info "Created: screen.md"

# Design Review Command
$designReviewCmd = @'
# Design Review

Perform a comprehensive design review of $ARGUMENTS.

## Review Criteria:

### 1. Spacing Consistency
- All spacing uses 8pt grid (4, 8, 16, 24, 32, 48)
- No magic numbers or arbitrary values
- Consistent gaps between related elements

### 2. Color Usage
- Only design tokens used (no hardcoded hex)
- Sufficient contrast (WCAG AA: 4.5:1 text, 3:1 UI)
- Dark mode support

### 3. Typography
- Proper hierarchy (h1 > h2 > body)
- Minimum 16px for body text
- Readable outdoors (high contrast)

### 4. Touch Targets
- Minimum 48x48dp
- Adequate spacing between targets
- Thumb-zone friendly for primary actions

### 5. Visual Hierarchy
- Clear primary action
- Logical grouping
- Appropriate whitespace
- No visual clutter

### 6. Accessibility
- accessibilityLabel on all interactive elements
- accessibilityRole defined
- Screen reader logical order

## Output Format:
| Issue | Severity (1-4) | Location | Fix |
Severity: 1=Critical, 2=Major, 3=Minor, 4=Enhancement
'@
Set-Content -Path (Join-Path $ProjectPath ".claude\commands\design-review.md") -Value $designReviewCmd -Encoding UTF8
Write-Info "Created: design-review.md"

# A11y Audit Command
$a11yCmd = @'
# Accessibility Audit

Perform WCAG 2.2 AA accessibility audit on $ARGUMENTS.

## Audit Checklist:

### Perceivable
- Color contrast >= 4.5:1 for text
- Color contrast >= 3:1 for UI components
- Information not conveyed by color alone
- Text resizable to 200%

### Operable
- Touch targets >= 48x48dp
- No time limits on interactions
- Focus order is logical
- Gestures have alternatives

### Understandable
- Labels describe purpose
- Error messages are helpful
- Consistent navigation

### Robust
- accessibilityLabel on all interactive elements
- accessibilityRole defined correctly
- accessibilityHint for complex actions
- Works with VoiceOver/TalkBack

### Golf-Specific
- Large touch targets for glove use
- High contrast for outdoor sunlight
- Works one-handed (thumb reach)

## Output:
Provide pass/fail for each item with specific code locations for failures.
'@
Set-Content -Path (Join-Path $ProjectPath ".claude\commands\a11y-audit.md") -Value $a11yCmd -Encoding UTF8
Write-Info "Created: a11y-audit.md"

# Feature Command
$featureCmd = @'
# Multi-Agent Feature Implementation

Implement a complete feature using all available agents: $ARGUMENTS

## Orchestration Protocol:

### Phase 1: Architecture
1. Analyze feature requirements
2. Design component structure
3. Plan state management
4. Identify API needs

### Phase 2: Implementation
1. Create components following CLAUDE.md conventions
2. Implement business logic
3. Add proper TypeScript types
4. Include all states (loading, error, empty)

### Phase 3: Design Validation
1. Verify all colors use tokens
2. Check spacing follows 8pt grid
3. Validate typography hierarchy
4. Confirm touch targets >= 48dp

### Phase 4: Accessibility
1. Add accessibilityLabel to all interactive elements
2. Set accessibilityRole correctly
3. Verify focus order
4. Test screen reader flow

### Phase 5: Testing
1. Create render tests
2. Add interaction tests
3. Cover edge cases
4. Test accessibility

### Phase 6: Performance
1. Check for unnecessary re-renders
2. Verify memo usage
3. Optimize list rendering
4. Review bundle impact

## Output:
- All created files
- Test coverage summary
- Design compliance report
- Accessibility score
'@
Set-Content -Path (Join-Path $ProjectPath ".claude\commands\feature.md") -Value $featureCmd -Encoding UTF8
Write-Info "Created: feature.md"

# Review Command
$reviewCmd = @'
# Comprehensive Code Review

Perform a multi-concern review of the current changes.

## Review Dimensions:

### 1. Design System Compliance
- Token usage for colors, spacing, typography
- 8pt grid adherence
- Component pattern consistency

### 2. Accessibility
- WCAG 2.2 AA compliance
- Screen reader support
- Touch target sizes

### 3. Performance
- Unnecessary re-renders
- Proper memoization
- List optimization

### 4. Security
- Input validation
- Data sanitization
- Secure storage usage

### 5. Code Quality
- TypeScript strictness
- Error handling
- Test coverage

## Output Format:
For each dimension, provide:
- Score (1-10)
- Issues found
- Specific fixes required
- Blocking vs non-blocking classification
'@
Set-Content -Path (Join-Path $ProjectPath ".claude\commands\review.md") -Value $reviewCmd -Encoding UTF8
Write-Info "Created: review.md"

# Test Command
$testCmd = @'
# Test Suite Generator

Generate comprehensive tests for $ARGUMENTS.

## Test Categories:

### 1. Render Tests
- Default props render
- All prop variations
- Conditional rendering

### 2. Interaction Tests
- Button/touch handling
- Input changes
- Gesture responses

### 3. Accessibility Tests
- accessibilityLabel presence
- Role correctness
- Hint accuracy

### 4. State Tests
- Loading state
- Error state
- Empty state
- Success state

### 5. Edge Cases
- Null/undefined props
- Empty arrays
- Network failures
- Extreme values

## Output:
Complete test file with Jest + React Native Testing Library.
'@
Set-Content -Path (Join-Path $ProjectPath ".claude\commands\test.md") -Value $testCmd -Encoding UTF8
Write-Info "Created: test.md"

Write-Success "Created all custom slash commands"

# Create Skills
Write-Step "Creating Claude Code skills..."

# Design Review Skill
$designSkill = @'
---
name: design-review
description: Automated design review for React Native components
---

# Design Review Skill

## Activation
Use this skill when:
- User asks to review, audit, or check design
- User mentions spacing, layout, visual
- Before any PR or merge

## Review Protocol

### Phase 1: Static Analysis
1. Check for hardcoded values:
   - Colors: grep for hex codes
   - Spacing: grep for arbitrary pixel values
   - Fonts: grep for fontFamily without token

2. Verify design token usage:
   - All colors from tokens.ts
   - All spacing from 8pt scale
   - All typography from theme

### Phase 2: Visual Analysis
1. If screenshot available:
   - Check alignment (8pt grid)
   - Verify touch target sizes
   - Assess visual hierarchy
   - Identify clutter

2. Apply heuristics:
   - Nielsen 10 usability heuristics
   - iOS HIG compliance
   - Material Design 3 patterns

### Phase 3: Accessibility Check
1. Verify required props:
   - accessibilityLabel
   - accessibilityRole
   - testID

2. Measure contrast ratios
3. Check focus order

## Output Format
Always output as table:
| Issue | Severity | Location | Heuristic | Fix |
'@
Set-Content -Path (Join-Path $ProjectPath ".claude\skills\design-review-skill.md") -Value $designSkill -Encoding UTF8
Write-Info "Created: design-review-skill.md"

# UI/UX Skill
$uiuxSkill = @'
---
name: ui-ux-pro-max
description: Multi-platform design intelligence with React Native support
---

# UI/UX Pro Max Skill

## Capabilities

### Design Archetypes
- Minimalist: Clean, whitespace-focused, limited palette
- Bold: High contrast, strong typography, vivid colors
- Elegant: Refined, subtle gradients, premium feel
- Playful: Rounded corners, bright colors, friendly
- Professional: Corporate, structured, trustworthy

### Typography Pairing
- Display + Body combinations
- Platform-specific recommendations
- Accessibility considerations

### Platform Guidelines
- iOS Human Interface Guidelines
- Material Design 3
- React Native specific patterns

### Component Patterns
- Cards and lists
- Forms and inputs
- Navigation patterns
- Modal and overlay patterns
- Loading and feedback states

## Usage
When generating UI:
1. Identify appropriate archetype
2. Select typography pairing
3. Apply platform guidelines
4. Use established patterns
5. Ensure accessibility

## Golf App Specifics
- Outdoor readability priority
- One-handed operation
- GPS/map integration patterns
- Score entry optimization
- Landscape tablet support
'@
Set-Content -Path (Join-Path $ProjectPath ".claude\skills\ui-ux-pro-max.md") -Value $uiuxSkill -Encoding UTF8
Write-Info "Created: ui-ux-pro-max.md"

Write-Success "Created all skills"

# Create Design Tokens
Write-Step "Creating design tokens..."

$tokens = @'
/**
 * AICaddyPro Design Tokens
 * Single source of truth for all design values.
 */

export const colors = {
  // Primary - Course Green
  primary: '#2E8B57',
  primaryLight: '#3CB371',
  primaryDark: '#228B22',
  
  // Accent - Sand/Gold
  accent: '#F4D03F',
  accentAlt: '#DAA520',
  
  // Surfaces - Light Mode
  background: '#FAFAFA',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  
  // Surfaces - Dark Mode
  backgroundDark: '#0F172A',
  surfaceDark: '#1E293B',
  surfaceElevatedDark: '#334155',
  
  // Text
  textPrimary: '#1A1A1A',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  textDark: '#F8FAFC',
  textSecondaryDark: '#CBD5E1',
  
  // Semantic - Scoring
  birdie: '#16A34A',
  par: '#3B82F6',
  bogey: '#F59E0B',
  doublePlus: '#DC2626',
  
  // Semantic - UI
  success: '#16A34A',
  warning: '#F59E0B',
  error: '#DC2626',
  info: '#3B82F6',
  
  // Borders
  border: '#E5E7EB',
  borderDark: '#374151',
  
  // Overlays
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.3)',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
} as const;

export const borderRadius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
} as const;

export const fontSize = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
} as const;

export const fontWeight = {
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;

export const shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
} as const;

export const touchTarget = {
  minimum: 48,
  recommended: 56,
} as const;

export const animation = {
  fast: 150,
  normal: 250,
  slow: 350,
  spring: {
    damping: 15,
    stiffness: 150,
    mass: 1,
  },
} as const;

export type ColorKey = keyof typeof colors;
export type SpacingKey = keyof typeof spacing;
'@
Set-Content -Path (Join-Path $ProjectPath "src\theme\tokens.ts") -Value $tokens -Encoding UTF8
Write-Success "Created design tokens"

# Create ESLint Config
Write-Step "Creating ESLint configuration..."

$eslintConfig = @'
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
  },
  plugins: [
    '@typescript-eslint',
    'react',
    'react-hooks',
    'react-native',
    'react-native-a11y',
  ],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:react-native/all',
    'plugin:react-native-a11y/all',
  ],
  rules: {
    'react-native/no-color-literals': 'error',
    'react-native/no-inline-styles': 'warn',
    'react-native/no-unused-styles': 'error',
    'react-native-a11y/has-accessibility-props': 'error',
    'react-native-a11y/has-valid-accessibility-role': 'error',
    '@typescript-eslint/no-explicit-any': 'error',
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off',
  },
  settings: { react: { version: 'detect' } },
  env: { 'react-native/react-native': true },
  ignorePatterns: ['node_modules/', '.expo/', 'dist/', 'build/'],
};
'@
Set-Content -Path (Join-Path $ProjectPath ".eslintrc.js") -Value $eslintConfig -Encoding UTF8
Write-Success "Created .eslintrc.js"

# Create .gitignore
Write-Step "Creating .gitignore..."

$gitignore = @'
node_modules/
.expo/
dist/
web-build/
*.orig.*
*.jks
*.p8
*.p12
*.key
*.mobileprovision
.metro-health-check*
npm-debug.*
yarn-debug.*
yarn-error.*
.DS_Store
*.pem
.env*.local
.env
*.tsbuildinfo
coverage/
CLAUDE.local.md
.idea/
.vscode/
*.swp
*.swo
logs/
*.log
android/app/build/
ios/build/
'@
Set-Content -Path (Join-Path $ProjectPath ".gitignore") -Value $gitignore -Encoding UTF8
Write-Success "Created .gitignore"

# Create Tailwind Config
Write-Step "Creating NativeWind configuration..."

$tailwindConfig = @'
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: '#2E8B57',
        'primary-light': '#3CB371',
        'primary-dark': '#228B22',
        accent: '#F4D03F',
        'accent-alt': '#DAA520',
        background: '#FAFAFA',
        surface: '#FFFFFF',
        'course-green': '#2E8B57',
        'fairway': '#90EE90',
        'bunker': '#F4D03F',
        'water': '#3B82F6',
        'out-of-bounds': '#DC2626',
        'birdie': '#16A34A',
        'par': '#3B82F6',
        'bogey': '#F59E0B',
        'double-plus': '#DC2626',
      },
      spacing: {
        'xs': '4px',
        'sm': '8px',
        'md': '16px',
        'lg': '24px',
        'xl': '32px',
        '2xl': '48px',
        '3xl': '64px',
      },
      borderRadius: {
        'sm': '4px',
        'md': '8px',
        'lg': '12px',
        'xl': '16px',
      },
    },
  },
  plugins: [],
};
'@
Set-Content -Path (Join-Path $ProjectPath "tailwind.config.js") -Value $tailwindConfig -Encoding UTF8
Write-Success "Created tailwind.config.js"

# Install npm dependencies
if (-not $SkipNpmInstall) {
    Write-Step "Installing npm dependencies..."
    
    if (-not (Test-Path (Join-Path $ProjectPath "package.json"))) {
        Write-Info "Initializing npm project..."
        npm init -y 2>$null
    }
    
    Write-Info "Installing dev dependencies..."
    npm install --save-dev eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin eslint-plugin-react eslint-plugin-react-hooks eslint-plugin-react-native eslint-plugin-react-native-a11y typescript @types/react @types/react-native husky lint-staged jest @testing-library/react-native 2>$null
    
    Write-Success "Dev dependencies installed"
    
    # Setup husky
    Write-Info "Setting up Husky..."
    npx husky install 2>$null
    
    $huskyDir = Join-Path $ProjectPath ".husky"
    if (-not (Test-Path $huskyDir)) {
        New-Item -ItemType Directory -Path $huskyDir -Force | Out-Null
    }
    
    $preCommit = '#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"
npx lint-staged'
    
    Set-Content -Path (Join-Path $huskyDir "pre-commit") -Value $preCommit -Encoding UTF8
    Write-Success "Husky pre-commit hook created"
    
    # Update package.json
    $pkgPath = Join-Path $ProjectPath "package.json"
    if (Test-Path $pkgPath) {
        $pkg = Get-Content $pkgPath -Raw | ConvertFrom-Json
        
        if (-not $pkg.scripts) {
            $pkg | Add-Member -NotePropertyName "scripts" -NotePropertyValue @{} -Force
        }
        $pkg.scripts | Add-Member -NotePropertyName "lint" -NotePropertyValue "eslint . --ext .ts,.tsx" -Force
        $pkg.scripts | Add-Member -NotePropertyName "lint:fix" -NotePropertyValue "eslint . --ext .ts,.tsx --fix" -Force
        $pkg.scripts | Add-Member -NotePropertyName "prepare" -NotePropertyValue "husky install" -Force
        
        $pkg | Add-Member -NotePropertyName "lint-staged" -NotePropertyValue @{
            "*.{ts,tsx}" = @("eslint --fix")
        } -Force
        
        $pkg | ConvertTo-Json -Depth 10 | Set-Content $pkgPath -Encoding UTF8
        Write-Success "Updated package.json"
    }
} else {
    Write-Warn "Skipping npm install"
}

# Install Agent System
if (-not $SkipAgentSystem) {
    Write-Step "Installing Senaiverse Agent System..."
    
    $agentRepo = "https://github.com/senaiverse/claude-code-reactnative-expo-agent-system.git"
    $tempDir = Join-Path $env:TEMP "claude-agent-system"
    
    try {
        if (Test-Path $tempDir) {
            Remove-Item -Recurse -Force $tempDir
        }
        
        git clone --depth 1 $agentRepo $tempDir 2>$null
        
        if (Test-Path $tempDir) {
            $srcAgents = Join-Path $tempDir "agents"
            $dstAgents = Join-Path $ProjectPath ".claude\agents"
            
            if (Test-Path $srcAgents) {
                Copy-Item -Path "$srcAgents\*" -Destination $dstAgents -Recurse -Force -ErrorAction SilentlyContinue
                Write-Success "Agent system installed"
            }
            
            Remove-Item -Recurse -Force $tempDir -ErrorAction SilentlyContinue
        }
    } catch {
        Write-Warn "Could not install agent system automatically"
        Write-Info "Clone manually from: $agentRepo"
    }
} else {
    Write-Warn "Skipping agent system"
}

# Create MCP Setup Script
Write-Step "Creating MCP server setup script..."

$mcpSetup = @'
# MCP Server Setup Script
Write-Host "Setting up MCP Servers for Claude Code..." -ForegroundColor Cyan

Write-Host "`nAdding Expo MCP Server..." -ForegroundColor Yellow
claude mcp add --transport http expo-mcp https://mcp.expo.dev/mcp

Write-Host "`nAdding Figma MCP Server..." -ForegroundColor Yellow
claude mcp add --transport http figma https://mcp.figma.com/mcp

Write-Host "`nAdding Design Systems MCP Server..." -ForegroundColor Yellow
claude mcp add --transport http design-systems https://design-systems-mcp.southleft.com/mcp

Write-Host "`nMCP Servers configured!" -ForegroundColor Green
Write-Host "`nNext steps:"
Write-Host "1. Run 'claude' to start Claude Code"
Write-Host "2. Type '/mcp' to verify server connections"
Write-Host "3. Authenticate with Figma when prompted"
'@
Set-Content -Path (Join-Path $ProjectPath "setup-mcp-servers.ps1") -Value $mcpSetup -Encoding UTF8
Write-Success "Created setup-mcp-servers.ps1"

# Create README
Write-Step "Creating README..."

$readme = @"
# AICaddyPro

Professional golf application built with React Native and Expo.

## Quick Start

``````bash
npm install
npx expo start
npm run lint
``````

## Claude Code Setup

1. Run MCP setup: ``.\setup-mcp-servers.ps1``
2. Start Claude Code: ``claude``
3. Verify: ``/mcp``

## Available Commands

| Command | Description |
|---------|-------------|
| /project:component Name | Generate component |
| /project:screen path | Generate screen |
| /project:design-review path | Design review |
| /project:a11y-audit path | Accessibility audit |
| /feature description | Multi-agent feature |
| /review | Code review |
| /test Name | Generate tests |

## Design System

See ``src/theme/tokens.ts`` for all design tokens.

Generated by AICaddyPro Claude Code Toolkit Installer v1.1
"@
Set-Content -Path (Join-Path $ProjectPath "README.md") -Value $readme -Encoding UTF8
Write-Success "Created README.md"

# Done
Write-Host ""
Write-Host "================================================================" -ForegroundColor Green
Write-Host "   INSTALLATION COMPLETE!" -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Installed:" -ForegroundColor Cyan
Write-Host "  - Claude Code CLI" -ForegroundColor White
Write-Host "  - Project structure (16 directories)" -ForegroundColor White
Write-Host "  - CLAUDE.md configuration" -ForegroundColor White
Write-Host "  - MCP server config (.mcp.json)" -ForegroundColor White
Write-Host "  - 7 Custom slash commands" -ForegroundColor White
Write-Host "  - 2 Claude Code skills" -ForegroundColor White
Write-Host "  - Design tokens (src/theme/tokens.ts)" -ForegroundColor White
Write-Host "  - ESLint + accessibility rules" -ForegroundColor White
Write-Host "  - NativeWind/Tailwind config" -ForegroundColor White
if (-not $SkipNpmInstall) {
    Write-Host "  - npm dependencies + Husky hooks" -ForegroundColor White
}
if (-not $SkipAgentSystem) {
    Write-Host "  - Senaiverse agent system" -ForegroundColor White
}
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "  1. .\setup-mcp-servers.ps1" -ForegroundColor Gray
Write-Host "  2. claude" -ForegroundColor Gray
Write-Host "  3. /mcp" -ForegroundColor Gray
Write-Host ""
