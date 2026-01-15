---
active: false
iteration: 1
max_iterations: 0
completion_promise: "MASTER PLAN CREATED AND VALIDATED"
started_at: "2026-01-14T12:00:00Z"
completed_at: "2026-01-14T12:45:00Z"
status: "COMPLETE"
outputs:
  - docs/MASTER_PLAN_2026-01-14.md
  - docs/MASTER_PLAN_2026-01-14.json
---

# Deep Discovery Ralph Loop - Comprehensive Plan Synthesis

Execute a thorough, evidence-based discovery process across ALL plan/review files in the codebase. **No hallucinating or assuming** - every finding must be backed by file:line evidence.

## Phase 1: Discovery - Full Recursive Search (LAST 3 DAYS ONLY)

### 1.1 Full Directory Scan (MANDATORY)

**CRITICAL: Only use files modified within the last 3 days. Ignore older files completely.**

```bash
# STEP 1: Find ALL files modified in last 3 days (full recursive, all directories)
find . -type f -mtime -3 \
  ! -path "./node_modules/*" \
  ! -path "./.git/*" \
  ! -path "./android/*" \
  ! -path "./ios/Pods/*" \
  ! -path "./.expo/*" \
  2>/dev/null | sort

# STEP 2: Get modification timestamps for verification
find . -type f -mtime -3 \
  ! -path "./node_modules/*" \
  ! -path "./.git/*" \
  -printf "%T+ %p\n" 2>/dev/null | sort -r | head -200
```

### 1.2 Files That May Contain Plans (Not Always Labeled)

Search ALL file types that could contain planning/review content:

| Extension | May Contain |
|-----------|-------------|
| `*.md` | Plans, reviews, decisions, handoffs, summaries |
| `*.json` | PRD files, status tracking, consolidated plans |
| `*.yaml` / `*.yml` | Handoffs, configurations, workflows |
| `*.txt` | Progress logs, notes, todos |
| `*.log` | Session logs with decisions |

**Content patterns to search for (not just filename):**
```bash
# Search file CONTENTS for plan-like language
grep -rl --include="*.md" --include="*.json" --include="*.yaml" --include="*.txt" \
  -e "TODO" -e "BLOCKED" -e "P0" -e "P1" -e "priority" -e "implementation" \
  -e "phase" -e "status" -e "complete" -e "pending" -e "action item" \
  . 2>/dev/null | while read f; do
    # Only include if modified in last 3 days
    if [ $(find "$f" -mtime -3 2>/dev/null | wc -l) -gt 0 ]; then
      echo "$f"
    fi
  done
```

### 1.3 ALL Directories to Recursively Search

**Hidden directories (start with `.`):**
- `./.claude/` - Claude commands, settings, ralph configs
- `./.factory/` - Droid factory, reviews, prompts, skills
- `./.agent/` - Agent scratchpad and notes
- `./.mind/` - Mind memory system
- `./.github/` - GitHub templates that may have requirements

**Standard directories:**
- `./scripts/` - All ralph pipelines, automation scripts
- `./thoughts/` - Plans, handoffs, shared context
- `./docs/` - Documentation, audit reports, consolidated plans
- `./src/` - Source files with inline TODOs or planning comments

**Root level files:**
- `./CLAUDE.md` - Project instructions
- `./README.md` - May contain roadmap
- `./CHANGELOG.md` - Recent changes
- `./TODO.md` or similar

### 1.4 Date Verification (STRICT)

For EVERY file considered, verify modification date:
```bash
# Get exact modification time
stat -c "%y %n" <filepath>
# OR
ls -la --time-style=full-iso <filepath>
```

**REJECT any file older than 3 days. Do not include in analysis.**

### 1.5 Identifying Plans (Content-Based, Not Just Filename)

A file contains a "plan" if it has ANY of these indicators:

**Structural indicators:**
- Numbered steps or phases
- Status markers: `[x]`, `[ ]`, `TODO`, `DONE`, `BLOCKED`
- Priority labels: `P0`, `P1`, `P2`, `Critical`, `High`, `Medium`
- Section headers with "Implementation", "Tasks", "Action Items"
- JSON with `status`, `phases`, `currentPhase`, `passes` fields

**Semantic indicators:**
- Future tense language: "will implement", "should add", "needs to"
- Decision language: "decided to", "chose X over Y", "approach:"
- Tracking language: "remaining work", "blockers", "dependencies"

**READ the file content** - don't just match filenames.

### 1.6 Data Collection Protocol

**FIRST: Verify file is within 3-day window**
```bash
# Must show modification within last 3 days
find "<filepath>" -mtime -3 | grep -q . && echo "VALID" || echo "SKIP - TOO OLD"
```

For EACH valid file, extract:
1. **File path** and **exact modification timestamp**
2. **File type**: Plan/Review/Status-Tracker/Handoff/Notes/Other
3. **Status**: Complete/In-Progress/Not-Started/Blocked/Unknown
4. **Key content** (actual quotes, not summaries)
5. **Action items** with completion state
6. **Dependencies** on other work
7. **Contradictions** with other files (specific file:line)

**Output format for each file:**
```
FILE: <path>
MODIFIED: <exact timestamp from stat>
AGE: <X hours/days ago>
TYPE: <Plan|Review|Status|Handoff|Notes|Other>
STATUS: <Complete|In-Progress|Not-Started|Blocked|Unknown>
CONTENT_EVIDENCE:
  Line XX: "<exact quote showing this is a plan/review>"
  Line YY: "<exact quote showing status>"
ACTION_ITEMS:
  - [x] Completed: "<item>" (line XX)
  - [ ] Pending: "<item>" (line YY)
  - [BLOCKED] "<item>" - blocked by: <reason> (line ZZ)
DEPENDENCIES: <list with file references>
CONTRADICTS: <file:line if contradicts another plan>
```

## Phase 2: Implementation Verification

### 2.1 Verify Claimed Implementations

For each plan claiming implementation is "complete":
1. **READ the actual source files** mentioned in the plan
2. **Verify** the changes described actually exist in the code
3. **Check** for partial implementations or regressions
4. **Mark as VERIFIED or UNVERIFIED** with evidence

**Verification checklist per claimed implementation:**
```
PLAN: <plan file>
CLAIMED: <what was claimed implemented>
SOURCE_FILE: <path to check>
VERIFIED: [YES/NO]
EVIDENCE: <file:line showing the implementation OR what's missing>
```

### 2.2 Cross-Reference PRD Status Files

Compare the three prd.json files for consistency:
- `scripts/ralph/ui-pipeline/prd.json`
- `scripts/ralph/ios-pipeline/prd.json`
- `.factory/prd.json`

Look for:
- Conflicting status claims
- Same work tracked in multiple places
- Orphaned tasks (referenced but no plan)

## Phase 3: Contradiction Analysis

### 3.1 Identify Conflicting Plans

Search for contradictions:
- Different approaches to same problem
- Conflicting priority assignments
- Duplicate work across pipelines
- Stale plans superseded by newer ones

**For each contradiction found:**
```
CONTRADICTION:
  File A: <path>:<line> says "<quote>"
  File B: <path>:<line> says "<quote>"
  RESOLUTION: <which is correct or needs reconciliation>
```

### 3.2 Identify Unfinished Work

For each plan with status != Complete:
- What remains to be done?
- What is blocking it?
- Is it still relevant?
- Should it be deprecated or continued?

## Phase 4: GPT Review of Findings

After collecting all findings, delegate to GPT for cross-review:

```
Use mcp__codex__codex with:
  prompt: [Structured findings from Phases 1-3]
  developer-instructions: [Read from ${CLAUDE_PLUGIN_ROOT}/prompts/plan-reviewer.md]
  sandbox: "read-only"
```

**GPT Review should validate:**
1. Are the findings accurate and well-evidenced?
2. Are there additional contradictions missed?
3. What is the recommended priority order?
4. What should be deprecated vs continued?

## Phase 5: Master Plan Creation

### 5.1 Synthesize into Master Plan

Create `docs/MASTER_PLAN_2026-01-14.md` with:

```markdown
# AICaddyPro Master Plan
Generated: <timestamp>
Last Discovery Run: <timestamp>

## Executive Summary
- Total plans discovered: <N>
- Active/In-Progress: <N>
- Blocked: <N> (with blockers listed)
- Not Started: <N>
- Deprecated: <N>
- Contradictions resolved: <N>

## Priority 0 - Ship Blockers
<List with file:line evidence>

## Priority 1 - Before Release
<List with file:line evidence>

## Priority 2 - Post-Launch
<List with file:line evidence>

## Deprecated/Superseded Plans
<List with reason for deprecation>

## Open Questions
<Unresolved items needing user input>

## Appendix: Evidence Trail
<All file:line references supporting findings>
```

### 5.2 Create Machine-Readable Version

Also create `docs/MASTER_PLAN_2026-01-14.json` with structured data.

## Phase 6: Re-Validation

### 6.1 Second Pass Verification

After creating master plan:
1. Re-read ALL source files mentioned
2. Verify each claim against actual code
3. Flag any discrepancies found
4. Update master plan if corrections needed

### 6.2 GPT Verification

Run second GPT review to validate:
```
Use mcp__codex__codex with:
  prompt: [Master plan + verification findings]
  developer-instructions: "Critically review this master plan. Find any claims not backed by evidence. Flag assumptions vs verified facts."
  sandbox: "read-only"
```

## Completion Criteria

This loop is complete when:
1. **Full recursive search completed** - ALL directories (including hidden) have been scanned
2. **3-day filter applied** - ONLY files modified within last 3 days are included
3. **All plan-like files catalogued** - Based on content, not just filename
4. **All implementation claims verified** - Against actual source code with file:line evidence
5. **All contradictions documented** - With specific file:line references for each conflict
6. **GPT has reviewed findings twice** - Initial cross-review + validation pass
7. **Master plan created** - With full evidence trail and no assumptions
8. **No unverified claims remain** - Every statement backed by quoted evidence
9. **Skipped files logged** - Files excluded due to age are documented

## Output Files

Save all outputs to:
- `docs/MASTER_PLAN_2026-01-14.md` - Human-readable master plan
- `docs/MASTER_PLAN_2026-01-14.json` - Machine-readable version
- `.factory/reviews/discovery-2026-01-14/` - All intermediate findings

## Rules (MANDATORY)

### Date Filter Rules (ABSOLUTE)
1. **3-DAY CUTOFF IS ABSOLUTE** - Files older than 3 days do NOT exist for this analysis
2. **VERIFY EVERY FILE'S DATE** - Run `stat` or `find -mtime -3` before including ANY file
3. **NO EXCEPTIONS** - Even if a file looks important, if it's older than 3 days, SKIP IT
4. **LOG SKIPPED FILES** - Note files that were found but excluded due to age

### Evidence Rules
5. **NO ASSUMPTIONS** - Every claim must have file:line evidence
6. **READ BEFORE CLAIMING** - Always read source files before asserting implementation status
7. **QUOTE EVIDENCE** - Include actual code/text snippets as proof
8. **MARK UNCERTAINTY** - If unsure, mark as "UNVERIFIED - needs confirmation"
9. **NO HALLUCINATION** - If you can't find evidence, say "NOT FOUND" not "probably exists"
10. **CROSS-CHECK** - Verify important claims in at least 2 ways

### Search Rules
11. **FULL RECURSIVE SEARCH** - Check ALL subdirectories including hidden (`.folder/`)
12. **CONTENT-BASED DETECTION** - Don't rely on filenames; read content to detect plans
13. **THOROUGH CODE READING** - Read entire relevant files, not just grep matches
14. **INCLUDE ALL EXTENSIONS** - .md, .json, .yaml, .yml, .txt, .log files

### What Counts as a Plan/Review
15. **IMPLICIT PLANS COUNT** - A file with TODOs and priorities IS a plan, even if not named "plan"
16. **SESSION LOGS COUNT** - If a log contains decisions or action items, include it
17. **CONFIG FILES COUNT** - prd.json, progress.txt, status files are plans
18. **HANDOFFS COUNT** - Handoff documents are plans for future work
