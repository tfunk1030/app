You are conducting a **full UI + UX audit** of a React Native + Expo app.

## Context
- App: AICaddyPro (golf app)
- Stack: React Native + Expo Router + TypeScript + NativeWind + Zustand
- Design constraints:
  - Must use design tokens (no hardcoded colors/spacing)
  - Must support light/dark modes
  - Outdoor readability matters (sunlight)
  - Touch targets >= 48x48dp
  - All interactive elements must have `accessibilityRole` + `accessibilityLabel`
  - Prefer FlashList for large lists

## Audit scope
Audit the codebase UI/UX as implemented (not hypothetical). Focus on:
1) Accessibility: labels/roles/states, focus order, reduced motion, screen reader friendliness
2) Touch targets & ergonomics (one-handed thumb zone)
3) Visual hierarchy / "card soup" avoidance / information density
4) Token usage consistency (spacing/typography/colors)
5) Error/loading/empty states and content clarity
6) Navigation & discoverability (Expo Router screens, tab flows)
7) Performance risks that affect UX (re-renders, heavy effects) — only when obvious

## Output requirements
1) Write a concise **Markdown report** with sections:
   - Summary (3–8 bullets)
   - P0 / P1 / P2 / P3 findings (each item must reference concrete file paths)
   - "Quick wins" (<= 10)
   - "Risks / Dependencies" (if any)

2) Also output a **machine-readable JSON** inside a fenced code block labeled `json`.
   The JSON must be an object: `{ "issues": [...] }`.
   Each issue must include:
   - `id` (string, stable, e.g. "UI-001")
   - `priority` ("P0"|"P1"|"P2"|"P3")
   - `title`
   - `screen` (if applicable)
   - `files` (array of file paths)
   - `evidence` (1–3 short quotes/snippets or line refs)
   - `whyItMatters`
   - `recommendedFix`
   - `acceptanceCriteria` (array)
   - `effort` ("S"|"M"|"L")
   - `category` ("a11y"|"ux"|"visual"|"performance"|"consistency"|"navigation")

### Rules
- You may use repo-reading tools (Read/Grep/Glob/LS/Execute) to gather evidence.
- Do **NOT** create/edit files. Do **NOT** claim you created any files.
- Output the full report and JSON **in this response** only.
- Do not propose changes without pointing to where in the code they apply.
- Prefer fewer, higher-quality issues over long lists.
- Assume validators exist; do not ask to run them.
