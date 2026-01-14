# Droid Factory Reviews

This directory contains outputs from droid factory task executions.

## File Naming Convention

```
TASK-XXX-[droid]-[YYYY-MM-DD].md
```

Examples:
- `TASK-001-security-privacy-2024-01-13.md`
- `TASK-002-release-ops-2024-01-13.md`
- `TASK-003-performance-2024-01-13.md`

## Review Types

| Droid | Output Content |
|-------|----------------|
| `release-ops` | App Store blocker checklist |
| `security-privacy` | Security audit with scores |
| `performance` | Performance metrics and issues |
| `weather-integrator` | API health and caching status |
| `ui-reviewer` | UI/UX issues (audit only) |
| `design-enforcer` | Fix implementation log |
| `physics-validator` | Calculation validation results |
| `code-reviewer` | Code quality report |

## Retention

Reviews are kept for audit trail. Archive old reviews periodically:

```bash
# Archive reviews older than 30 days
mkdir -p .factory/reviews/archive
find .factory/reviews -name "TASK-*.md" -mtime +30 -exec mv {} .factory/reviews/archive/ \;
```
