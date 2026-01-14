# Droid Factory - Autonomous Quality Pipeline
# Loops Claude Code to process task queue until complete

param(
    [int]$MaxIterations = 20
)

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectDir = Split-Path -Parent $ScriptDir

Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "  DROID FACTORY - Autonomous Quality Pipeline" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Max iterations: $MaxIterations"
Write-Host "Project: $ProjectDir"
Write-Host ""

# Ensure reviews directory exists
$ReviewsDir = Join-Path $ScriptDir "reviews"
if (-not (Test-Path $ReviewsDir)) {
    New-Item -ItemType Directory -Path $ReviewsDir -Force | Out-Null
}

# Initialize progress file if needed
$ProgressFile = Join-Path $ScriptDir "progress.txt"
if (-not (Test-Path $ProgressFile)) {
    @"
# Droid Factory Progress Log

## Codebase Patterns
(Add reusable patterns here)

---

"@ | Set-Content $ProgressFile
}

Set-Location $ProjectDir

for ($i = 1; $i -le $MaxIterations; $i++) {
    Write-Host ""
    Write-Host "===========================================" -ForegroundColor Yellow
    Write-Host "  Iteration $i of $MaxIterations" -ForegroundColor Yellow
    Write-Host "===========================================" -ForegroundColor Yellow
    Write-Host ""

    try {
        # Run Claude with the droid factory prompt
        $PromptPath = Join-Path $ScriptDir "prompt.md"
        $PromptContent = Get-Content $PromptPath -Raw

        $Output = $PromptContent | claude --dangerously-skip-permissions 2>&1 | Tee-Object -Variable OutputCapture
        $OutputText = $Output -join "`n"

        # Check for completion signal
        if ($OutputText -match "<promise>COMPLETE</promise>") {
            Write-Host ""
            Write-Host "==============================================" -ForegroundColor Green
            Write-Host "  DROID FACTORY COMPLETE" -ForegroundColor Green
            Write-Host "==============================================" -ForegroundColor Green
            Write-Host ""
            Write-Host "All tasks processed successfully!"
            Write-Host "See .factory/reviews/ for outputs"
            Write-Host "See .factory/progress.txt for learnings"
            exit 0
        }
    }
    catch {
        Write-Host "Error in iteration: $_" -ForegroundColor Red
        # Continue to next iteration
    }

    # Brief pause between iterations
    Start-Sleep -Seconds 2
}

Write-Host ""
Write-Host "==============================================" -ForegroundColor Red
Write-Host "  MAX ITERATIONS REACHED" -ForegroundColor Red
Write-Host "==============================================" -ForegroundColor Red
Write-Host ""
Write-Host "Completed $MaxIterations iterations without finishing."
Write-Host "Check .factory/prd.json for remaining tasks."
exit 1
