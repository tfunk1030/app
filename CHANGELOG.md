# Changelog

All notable changes to AICaddy Pro will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Agent readiness improvements (AGENTS.md, .env.example, PR templates)
- Structured logging with log sanitization (`src/lib/logger.ts`)
- Architecture documentation (`docs/architecture.md`)
- Dead code detection with knip
- Maestro E2E test framework setup
- ESLint rules for code quality (complexity, max-lines, naming)
- Tech debt tracking via TODO/FIXME scanning

### Changed
- Enhanced ESLint configuration with stricter rules
- Improved pre-commit hooks with tech debt checking
- Updated AGENTS.md with comprehensive command documentation

## [1.2.0] - 2025-12-21

### Added
- Wind calculator redesign with compass interface
- Premium subscription support via RevenueCat
- New design system with glassmorphism components
- UI/UX skill for agent-assisted development

### Changed
- Refactored compass into modular components
- Improved settings and club management screens
- Enhanced error handling and diagnostics

## [1.1.0] - 2025-11-24

### Added
- Basic shot calculator with environmental adjustments
- Club setup and management
- Weather API integration (Tomorrow.io, OpenWeather, Weatherbit)

### Fixed
- TypeScript compilation errors
- iPad support disabled for initial iPhone-only launch

## [1.0.0] - 2025-10-26

### Added
- Initial release
- Shot calculator with temperature and altitude adjustments
- Three-tab navigation (Shot, Wind, Setup)
- Dark mode support
- Accessibility features (48dp touch targets, screen reader support)

[Unreleased]: https://github.com/tfunk1030/app/compare/v1.2.0...HEAD
[1.2.0]: https://github.com/tfunk1030/app/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/tfunk1030/app/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/tfunk1030/app/releases/tag/v1.0.0
