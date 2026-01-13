# UI Multi-Agent Review Pipeline

Automated UI/UX review system using multiple AI perspectives for professional-grade polish.

## Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        PIPELINE FLOW                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────┐    ┌──────────────┐    ┌─────────────────┐           │
│  │  RAMS    │───>│  GPT via     │───>│  ui-ux-pro-max  │           │
│  │  Review  │    │  Moderator   │    │  Synthesis      │           │
│  └──────────┘    └──────────────┘    └─────────────────┘           │
│       │                                      │                       │
│       │         ┌────────────────────────────┘                      │
│       │         │                                                    │
│       ▼         ▼                                                    │
│  ┌─────────────────┐                                                │
│  │  RAMS Creates   │                                                │
│  │  Final Plan     │                                                │
│  └─────────────────┘                                                │
│       │                                                              │
│       ▼                                                              │
│  ┌─────────────────┐    ┌──────────────┐    ┌───────────────┐      │
│  │  Claude         │───>│  Post-Review │───>│  GPT Verify   │      │
│  │  Implements     │    │  (RAMS)      │    │  (Moderator)  │      │
│  └─────────────────┘    └──────────────┘    └───────────────┘      │
│                                                    │                 │
│                                                    ▼                 │
│                                            ┌───────────────┐        │
│                                            │  Git Commit   │        │
│                                            └───────────────┘        │
└─────────────────────────────────────────────────────────────────────┘
```

## Quick Start

### Using Ralph (Recommended for Full Automation)

```powershell
# Windows PowerShell
cd scripts\ralph\ui-pipeline
.\ralph-ui-pipeline.ps1 -MaxIterations 50

# macOS/Linux
cd scripts/ralph/ui-pipeline
chmod +x ralph-ui-pipeline.sh
./ralph-ui-pipeline.sh 50
```

### Using Claude Command (Manual Control)

```
/project:ui-review-pipeline src/features/redesign/screens/PlayScreen.tsx
```

### Using the Agent (Conversational)

Just ask:
```
"Run the multi-agent UI review on the play screen"
"Let's polish the settings UI with RAMS and GPT"
"Do a thorough design review before release"
```

## Strategy: Per-Component Then Global

The pipeline processes components in this order:

1. **PlayScreen** - Most visible, first impression
2. **SetupScreen** - User onboarding experience
3. **StatsScreen** - Data visualization
4. **Wind/Calculator** - Core feature
5. **Settings** - Configuration
6. **Core UI Components** - Shared elements
7. **Navigation** - Tab bar
8. **GLOBAL** - Cross-component consistency check

Each component goes through ALL 8 phases before moving to the next.

## Pipeline Phases

| Phase | Tool | Purpose |
|-------|------|---------|
| 1. rams-review | /rams | Initial UI/UX analysis |
| 2. gpt-cross-review | /moderator gpt | Identify blind spots |
| 3. skills-synthesis | ui-ux-pro-max | Research patterns, create consensus |
| 4. final-plan | /rams | Prioritized fix list (P0/P1/P2) |
| 5. implementation | Claude | Execute fixes |
| 6. post-review | /rams | Verify fixes |
| 7. gpt-verification | /moderator gpt | Check for regressions |
| 8. fixes | Claude | Address remaining issues |

## Files

```
scripts/ralph/ui-pipeline/
├── README.md              # This file
├── prd.json               # Pipeline state (components, phases)
├── progress.txt           # Learnings and iteration log
├── prompt.md              # Ralph prompt with full instructions
├── ralph-ui-pipeline.ps1  # Windows PowerShell launcher
├── ralph-ui-pipeline.sh   # Bash launcher (Mac/Linux)
└── reviews/               # All review outputs
    ├── UI-001-rams-initial.md
    ├── UI-001-gpt-cross-review.md
    ├── UI-001-synthesis.md
    ├── UI-001-plan.md
    ├── UI-001-changes.md
    ├── UI-001-post-review.md
    └── UI-001-gpt-verify.md
```

## Continuous Claude v3 vs Ralph Wiggum

| Feature | Ralph Wiggum ✅ | Continuous Claude |
|---------|----------------|-------------------|
| Fresh context | ✅ Each iteration | ❌ Accumulated |
| Memory via | Git + text files | Context window |
| Best for | Multi-step pipelines | Watch tasks |
| Context pollution | ❌ Avoided | ⚠️ Risk |

**This pipeline uses Ralph** because the multi-agent review loop benefits from fresh context windows. Each iteration reads state from files, not memory.

## Customization

### Add/Remove Components

Edit `prd.json` → `userStories` array:

```json
{
  "id": "UI-NEW",
  "title": "New Component Polish",
  "component": "path/to/component.tsx",
  "phases": { ... },
  "currentPhase": "rams-review",
  "priority": 8,
  "passes": false
}
```

### Change Reviewers

Edit `prd.json` → `pipelineConfig.reviewers`:

```json
"reviewers": ["rams", "gpt-moderator", "ui-ux-pro-max"]
```

### Skip GPT Reviews

For faster (but less thorough) runs:

```powershell
# Edit prompt.md to skip phases 2 and 7
# Or use the command with --skip-gpt flag
```

## Troubleshooting

### Pipeline stuck on a phase

1. Check `reviews/[ID]-[phase].md` for errors
2. Check `progress.txt` for logged issues
3. Manually advance phase in `prd.json`

### Typecheck failures

The pipeline requires typecheck to pass between phases. If stuck:

```bash
npx tsc --noEmit 2>&1 | head -20
```

Fix the errors, then resume.

### Moderator not working

Ensure the moderator plugin is installed and configured:

```bash
claude /moderator status
```

## Output Example

After completion, you'll have:

1. **Full audit trail** in `reviews/` directory
2. **Git commit** with structured message
3. **Progress log** with learnings for future iterations

Sample commit message:
```
feat(ui): Multi-agent design polish

Components reviewed:
- PlayScreen
- SetupScreen
- StatsScreen
- Wind/Calculator
- Settings
- Core UI Components
- Navigation

Reviewers: RAMS, GPT (via moderator), ui-ux-pro-max

Changes include:
- Spacing consistency improvements (4/8/16/24/32 scale)
- Design token compliance (removed hardcoded colors)
- Accessibility enhancements (contrast, touch targets)
- Typography refinements (consistent font weights)

See scripts/ralph/ui-pipeline/reviews/ for full audit trail.
```
