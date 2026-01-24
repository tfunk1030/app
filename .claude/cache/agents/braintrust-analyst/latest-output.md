# Braintrust Analysis Report

**Generated:** 2026-01-15T22:37:00Z
**Project:** claude-code
**Organization:** aicaddy

---

## Executive Summary

**STATUS: Tracing NOT Active**

The Braintrust API connection is valid and working, but **no session data exists** in the `claude-code` project. The root cause is that the Braintrust hooks are **implemented but not registered** in Claude Code's `settings.json`.

---

## 1. Recent Sessions

### API Query Results

```
Project: claude-code
  ID: afc1499d-38a7-468d-94ff-b1af944f35b2
  Created: 2026-01-11T06:53:12.855Z
  Project Logs: 0 events
  Experiments: 0

Project: My Project
  ID: 005103f6-4d07-4091-a90c-0c88348eee96
  Created: 2026-01-11T06:50:30.560Z
  Project Logs: 0 events
  Experiments: 0
```

**Interpretation:** Both projects are empty. No sessions have been recorded despite the API key being valid.

---

## 2. Agent Usage Statistics

**No data available** - Tracing not active.

---

## 3. Skill Usage Statistics

**No data available** - Tracing not active.

---

## 4. Loop Detection

**No data available** - Tracing not active.

---

## 5. Root Cause Analysis

### Why Tracing is Not Working

| Check | Status | Details |
|-------|--------|---------|
| API Key Valid | YES | `sk-40jAOt...` connects successfully |
| Project Exists | YES | `claude-code` (afc1499d-38a7-468d-94ff-b1af944f35b2) |
| Hook File Exists | YES | `/home/tfunk1030/.claude/hooks/braintrust_hooks.py` (701 lines) |
| Hooks Registered | **NO** | `settings.json` has no Braintrust hook entries |
| State Directory | **NO** | `/home/tfunk1030/.claude/state/` does not exist |
| Log File | **NO** | No `/home/tfunk1030/.claude/state/braintrust_hook.log` |

### The Problem

The `braintrust_hooks.py` file implements 5 hooks:
1. `session_start` - Creates root span
2. `session_end` - Finalizes session
3. `user_prompt_submit` - Creates turn spans
4. `post_tool_use` - Creates tool spans
5. `stop` - Creates LLM spans from transcript

However, **none of these are registered** in `~/.claude/settings.json`. The settings.json only contains:
- One `PreToolUse` hook for WebSearch year injection
- One `PostToolUse` hook for dependency file auditing

---

## 6. Recommendations

### To Enable Braintrust Tracing

Add the following to `~/.claude/settings.json` under the `hooks` section:

```json
{
  "hooks": {
    "SessionStart": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "python3 $HOME/.claude/hooks/braintrust_hooks.py session_start"
          }
        ]
      }
    ],
    "SessionEnd": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "python3 $HOME/.claude/hooks/braintrust_hooks.py session_end"
          }
        ]
      }
    ],
    "UserPromptSubmit": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "python3 $HOME/.claude/hooks/braintrust_hooks.py user_prompt_submit"
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "python3 $HOME/.claude/hooks/braintrust_hooks.py post_tool_use"
          }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "python3 $HOME/.claude/hooks/braintrust_hooks.py stop"
          }
        ]
      }
    ]
  }
}
```

### Prerequisites

1. **Install httpx:** The hooks require the `httpx` library
   ```bash
   pip install httpx
   ```

2. **Ensure .env is loaded:** The `.env` file at `~/.claude/.env` contains:
   ```
   BRAINTRUST_API_KEY=sk-40jAOt0HJWGq05pDdFFyh5DnUGExqhcdfxlvUhTRGdt6XcsA
   TRACE_TO_BRAINTRUST=true
   BRAINTRUST_CC_PROJECT=claude-code
   ```

3. **Create state directory:**
   ```bash
   mkdir -p ~/.claude/state/braintrust_sessions
   ```

---

## 7. API Verification

### Successful API Calls

```
GET https://api.braintrust.dev/v1/project/afc1499d-38a7-468d-94ff-b1af944f35b2
Status: 200

Response:
{
  "id": "afc1499d-38a7-468d-94ff-b1af944f35b2",
  "org_id": "a80e3e4f-d1be-4343-94e7-73b8a82690f6",
  "name": "claude-code",
  "created": "2026-01-11T06:53:12.855Z"
}

GET https://api.braintrust.dev/v1/organization
Status: 200

Response:
{
  "objects": [
    {"name": "aicaddy", "id": "a80e3e4f-d1be-4343-94e7-73b8a82690f6"}
  ]
}
```

### API Endpoints Tested

| Endpoint | Status | Result |
|----------|--------|--------|
| `/v1/project` | 200 | 2 projects found |
| `/v1/project/{id}` | 200 | Project details returned |
| `/v1/project_logs/{id}/fetch` | 200 | Empty (0 events) |
| `/v1/experiment` | 200 | Empty (0 experiments) |
| `/v1/dataset` | 200 | Empty (0 datasets) |
| `/v1/organization` | 200 | aicaddy org found |

---

## 8. Weekly Summary

**No data available** - First week with Braintrust configured but tracing inactive.

---

## 9. Next Steps

1. **Register the hooks** in settings.json as shown above
2. **Start a new Claude Code session** to trigger SessionStart
3. **Run this analysis again** after a few sessions to see data
4. **Enable debug mode** for troubleshooting:
   ```
   BRAINTRUST_CC_DEBUG=true
   ```

---

## Files Referenced

- Hook implementation: `/home/tfunk1030/.claude/hooks/braintrust_hooks.py`
- Environment config: `/home/tfunk1030/.claude/.env`
- Settings file: `/home/tfunk1030/.claude/settings.json`
- Analysis scripts: `/home/tfunk1030/projects/AICaddyPro/.claude/cache/agents/braintrust-analyst/`

---

*Report generated by Braintrust Analyst Agent*
