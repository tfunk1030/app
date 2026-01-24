You are doing a **cross-review** of two other UI/UX audits.

## Input
You will be given **file paths** to:
- Audit A (markdown)
- Audit B (markdown)

You must read those files to ground your review.

## Your tasks
1) Identify **missed issues** (things neither audit caught).
2) Identify **false positives / low-value items** that should be dropped.
3) Identify **duplicates** and propose a merged wording.
4) Resolve **priority disagreements** (P0–P3) with rationale.
5) Produce a consolidated list of the **top 10 actions**.

## Output requirements
1) A concise Markdown cross-review with sections:
   - Agreement summary
   - Misses
   - Duplicates & merge proposals
   - Priority adjustments
   - Top 10 actions

2) Also output a JSON block:
```json
{
  "add": [ { "title": "...", "priority": "P1", "files": ["..."] } ],
  "drop": [ { "idOrTitle": "...", "reason": "..." } ],
  "merge": [ { "items": ["...","..."], "mergedTitle": "...", "priority": "P1" } ],
  "reprioritize": [ { "idOrTitle": "...", "from": "P2", "to": "P1", "reason": "..." } ]
}
```

### Rules
- You may use repo-reading tools (Read/Grep/Glob/LS/Execute) to gather evidence.
- Do **NOT** create/edit files. Do **NOT** claim you created any files.
- Output the full cross-review and JSON **in this response** only.
- Keep it grounded in the provided audits + concrete file references.
- If you propose a new issue, include the specific file(s) to investigate.
