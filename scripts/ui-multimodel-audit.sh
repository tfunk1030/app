#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROMPTS_DIR="$ROOT_DIR/.factory/prompts"
REVIEWS_DIR="$ROOT_DIR/.factory/reviews"

MODEL_GPT="gpt-5.2"
MODEL_OPUS="claude-opus-4-5-20251101"
MODEL_GEMINI="gemini-3-pro-preview"

REASONING_GPT="high"
REASONING_OPUS="high"
REASONING_GEMINI="high"

timestamp="$(date -u +"%Y%m%d-%H%M%S")"
OUT_DIR="${OUT_DIR:-$REVIEWS_DIR/ui-multimodel-audit-$timestamp}"

# droid exec safety controls
# We run with --auto to allow the agent to use Execute for repo exploration,
# but we explicitly disable file-editing tools.
DROID_AUTO_LEVEL="${DROID_AUTO_LEVEL:-medium}"
DISABLED_TOOLS=("create-cli" "edit-cli")

SKIP_EXISTING="${SKIP_EXISTING:-1}"

require_file() {
  if [[ ! -f "$1" ]]; then
    echo "Missing required file: $1" >&2
    exit 1
  fi
}

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1" >&2
    exit 1
  fi
}

assert_nonempty() {
  local path="$1"
  local min_bytes="${2:-200}"
  local size
  size="$(wc -c <"$path" | tr -d ' ')"
  if [[ "$size" -lt "$min_bytes" ]]; then
    echo "Output too small (${size}B < ${min_bytes}B): $path" >&2
    exit 1
  fi
}

extract_first_json_block() {
  local in_md="$1"
  local out_json="$2"

  python3 - "$in_md" "$out_json" <<'PY'
import re
import sys

in_md, out_json = sys.argv[1], sys.argv[2]
text = open(in_md, 'r', encoding='utf-8', errors='replace').read()
m = re.search(r"```json\s*\n(.*?)\n```", text, re.DOTALL)
if not m:
    raise SystemExit(f"No ```json fenced block found in {in_md}")
open(out_json, 'w', encoding='utf-8').write(m.group(1).strip() + "\n")
PY
}

run_audit() {
  local model="$1"
  local reasoning="$2"
  local out="$3"

  if [[ "$SKIP_EXISTING" == "1" && -s "$out" ]]; then
    echo "[audit] skip (exists): $model → $out" >&2
    return 0
  fi

  echo "[audit] $model → $out" >&2
  local log="$out.log"
  droid exec \
    --cwd "$ROOT_DIR" \
    --auto "$DROID_AUTO_LEVEL" \
    --disabled-tools "${DISABLED_TOOLS[*]}" \
    -m "$model" \
    -r "$reasoning" \
    -f "$PROMPTS_DIR/ui-audit.md" \
    --output-format text \
    >"$out" 2>"$log"

  assert_nonempty "$out" 500
  extract_first_json_block "$out" "${out%.md}.json"
}

run_cross_review() {
  local model="$1"
  local reasoning="$2"
  local audit_a_path="$3"
  local audit_b_path="$4"
  local out="$5"

  if [[ "$SKIP_EXISTING" == "1" && -s "$out" ]]; then
    echo "[cross-review] skip (exists): $model → $out" >&2
    return 0
  fi

  echo "[cross-review] $model → $out" >&2

  local prompt
  prompt="$(cat "$PROMPTS_DIR/ui-cross-review.md")

---

## Inputs (file paths)

- Audit A: $audit_a_path
- Audit B: $audit_b_path
"

  local log="$out.log"

  droid exec \
    --cwd "$ROOT_DIR" \
    --auto "$DROID_AUTO_LEVEL" \
    --disabled-tools "${DISABLED_TOOLS[*]}" \
    -m "$model" \
    -r "$reasoning" \
    --output-format text \
    "$prompt" \
    >"$out" 2>"$log"

  assert_nonempty "$out" 300
  extract_first_json_block "$out" "${out%.md}.json"
}

run_plan() {
  local model="$1"
  local reasoning="$2"
  local out="$3"
  shift 3
  local inputs=("$@")

  if [[ "$SKIP_EXISTING" == "1" && -s "$out" ]]; then
    echo "[plan] skip (exists): $model → $out" >&2
    return 0
  fi

  echo "[plan] $model → $out" >&2

  local prompt
  prompt="$(cat "$PROMPTS_DIR/ui-plan.md")

---

## Inputs (file paths)
"
  for f in "${inputs[@]}"; do
    prompt+="
- $f"
  done

  local log="$out.log"

  droid exec \
    --cwd "$ROOT_DIR" \
    --auto "$DROID_AUTO_LEVEL" \
    --disabled-tools "${DISABLED_TOOLS[*]}" \
    -m "$model" \
    -r "$reasoning" \
    --output-format text \
    "$prompt" \
    >"$out" 2>"$log"

  assert_nonempty "$out" 500
  extract_first_json_block "$out" "${out%.md}.json"
}

main() {
  require_cmd droid
  require_file "$PROMPTS_DIR/ui-audit.md"
  require_file "$PROMPTS_DIR/ui-cross-review.md"
  require_file "$PROMPTS_DIR/ui-plan.md"

  mkdir -p "$OUT_DIR"

  local audit_gpt="$OUT_DIR/audit-gpt-5.2.md"
  local audit_opus="$OUT_DIR/audit-opus-4.5.md"
  local audit_gemini="$OUT_DIR/audit-gemini-3-pro.md"

  run_audit "$MODEL_GPT" "$REASONING_GPT" "$audit_gpt"
  run_audit "$MODEL_OPUS" "$REASONING_OPUS" "$audit_opus"
  run_audit "$MODEL_GEMINI" "$REASONING_GEMINI" "$audit_gemini"

  local cross_gpt="$OUT_DIR/crossreview-gpt-5.2.md"
  local cross_opus="$OUT_DIR/crossreview-opus-4.5.md"
  local cross_gemini="$OUT_DIR/crossreview-gemini-3-pro.md"

  run_cross_review "$MODEL_GPT" "$REASONING_GPT" "$audit_opus" "$audit_gemini" "$cross_gpt"
  run_cross_review "$MODEL_OPUS" "$REASONING_OPUS" "$audit_gpt" "$audit_gemini" "$cross_opus"
  run_cross_review "$MODEL_GEMINI" "$REASONING_GEMINI" "$audit_gpt" "$audit_opus" "$cross_gemini"

  local plan_gpt="$OUT_DIR/plan-gpt-5.2.md"
  local plan_opus="$OUT_DIR/plan-opus-4.5.md"
  local plan_gemini="$OUT_DIR/plan-gemini-3-pro.md"

  run_plan "$MODEL_GPT" "$REASONING_GPT" "$plan_gpt" \
    "$audit_gpt" "$audit_opus" "$audit_gemini" \
    "$cross_gpt" "$cross_opus" "$cross_gemini"

  run_plan "$MODEL_OPUS" "$REASONING_OPUS" "$plan_opus" \
    "$audit_gpt" "$audit_opus" "$audit_gemini" \
    "$cross_gpt" "$cross_opus" "$cross_gemini"

  run_plan "$MODEL_GEMINI" "$REASONING_GEMINI" "$plan_gemini" \
    "$audit_gpt" "$audit_opus" "$audit_gemini" \
    "$cross_gpt" "$cross_opus" "$cross_gemini"

  local plan_final="$OUT_DIR/plan-final.md"
  run_plan "$MODEL_OPUS" "$REASONING_OPUS" "$plan_final" \
    "$audit_gpt" "$audit_opus" "$audit_gemini" \
    "$cross_gpt" "$cross_opus" "$cross_gemini" \
    "$plan_gpt" "$plan_opus" "$plan_gemini"

  cat >"$OUT_DIR/README.txt" <<EOF
Outputs written to:
  $OUT_DIR

Key files:
  - $audit_gpt
  - $audit_opus
  - $audit_gemini
  - $cross_gpt
  - $cross_opus
  - $cross_gemini
  - $plan_final
EOF

  echo "DONE: $OUT_DIR" >&2
}

main "$@"
