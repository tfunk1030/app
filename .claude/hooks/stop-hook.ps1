# Ralph Stop Hook - Intercepts session exit for autonomous loop
# This hook blocks Claude from exiting and re-injects the prompt
# until <promise>COMPLETE</promise> is detected or max iterations reached.

param()

$ErrorActionPreference = "SilentlyContinue"

# Paths
$ProjectDir = $env:CLAUDE_PROJECT_DIR
if (-not $ProjectDir) {
    $ProjectDir = "C:\Users\tfunk\aicaddypro"
}

$CompletionFile = Join-Path $ProjectDir ".ralph-complete"
$IterationFile = Join-Path $ProjectDir ".ralph-iteration"
$PromptFile = Join-Path $ProjectDir "scripts\ralph\ui-pipeline\prompt.md"
$PrdFile = Join-Path $ProjectDir "scripts\ralph\ui-pipeline\prd.json"

# Configuration
$MaxIterations = 50

# Check if Ralph loop is active
$RalphActiveFile = Join-Path $ProjectDir ".ralph-active"
if (-not (Test-Path $RalphActiveFile)) {
    # Ralph not active - allow normal exit
    exit 0
}

# Check for completion signal in recent output
# The hook receives tool output via stdin or environment
$recentOutput = $env:CLAUDE_TOOL_OUTPUT
if ($recentOutput -match "<promise>COMPLETE</promise>") {
    Write-Host "Ralph loop complete - all components passed!"
    Remove-Item $RalphActiveFile -Force -ErrorAction SilentlyContinue
    Remove-Item $IterationFile -Force -ErrorAction SilentlyContinue
    New-Item -Path $CompletionFile -ItemType File -Force | Out-Null
    exit 0
}

# Also check prd.json for all passes
if (Test-Path $PrdFile) {
    $prd = Get-Content $PrdFile -Raw | ConvertFrom-Json
    $allPassed = $true
    foreach ($story in $prd.userStories) {
        if (-not $story.passes) {
            $allPassed = $false
            break
        }
    }
    if ($allPassed) {
        Write-Host "All components passed - pipeline complete!"
        Remove-Item $RalphActiveFile -Force -ErrorAction SilentlyContinue
        exit 0
    }
}

# Check iteration count
$iteration = 0
if (Test-Path $IterationFile) {
    $iteration = [int](Get-Content $IterationFile -Raw)
}

if ($iteration -ge $MaxIterations) {
    Write-Host "Max iterations ($MaxIterations) reached - stopping Ralph loop"
    Remove-Item $RalphActiveFile -Force -ErrorAction SilentlyContinue
    exit 0
}

# Increment iteration
$iteration++
$iteration | Set-Content $IterationFile

# Get current state for context
$currentComponent = "unknown"
$currentPhase = "unknown"
if (Test-Path $PrdFile) {
    $prd = Get-Content $PrdFile -Raw | ConvertFrom-Json
    $pending = $prd.userStories | Where-Object { -not $_.passes } | Select-Object -First 1
    if ($pending) {
        $currentComponent = $pending.id
        $currentPhase = $pending.currentPhase
    }
}

# Output continuation signal and re-inject prompt
Write-Host ""
Write-Host "=========================================="
Write-Host "  RALPH ITERATION $iteration / $MaxIterations"
Write-Host "  Component: $currentComponent"
Write-Host "  Phase: $currentPhase"
Write-Host "=========================================="
Write-Host ""

# Re-inject the prompt
if (Test-Path $PromptFile) {
    Get-Content $PromptFile -Raw
}

# Exit code 2 blocks exit and feeds output as new prompt
exit 2
