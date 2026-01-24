# Ralph UI Pipeline for Claude Code (PowerShell)
# 
# Multi-agent UI review pipeline:
# 1. RAMS reviews UI
# 2. GPT cross-reviews via moderator
# 3. ui-ux-pro-max skill synthesizes
# 4. RAMS creates final plan
# 5. Claude implements
# 6. Both review changes
# 7. Fix issues & commit
#
# Usage: .\ralph-ui-pipeline.ps1 [-MaxIterations 50] [-Verbose]

param(
    [int]$MaxIterations = 50,
    [switch]$Verbose,
    [switch]$DryRun
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = (Get-Item "$ScriptDir\..\..\..").FullName

# Colors for output
function Write-Phase { param($msg) Write-Host "[>>] $msg" -ForegroundColor Cyan }
function Write-Success { param($msg) Write-Host "[OK] $msg" -ForegroundColor Green }
function Write-Warning { param($msg) Write-Host "[!!] $msg" -ForegroundColor Yellow }
function Write-Error { param($msg) Write-Host "[XX] $msg" -ForegroundColor Red }
function Write-Info { param($msg) Write-Host "[--] $msg" -ForegroundColor White }

# Banner
Write-Host @"
╔════════════════════════════════════════════════════════════════╗
║         AICaddyPro UI Multi-Agent Review Pipeline              ║
║                                                                ║
║  Reviewers: RAMS → GPT → ui-ux-pro-max → RAMS                 ║
║  Strategy: Per-component, then global consistency              ║
╚════════════════════════════════════════════════════════════════╝
"@ -ForegroundColor Magenta

# Check prerequisites
Write-Phase "Checking prerequisites..."

if (-not (Get-Command "claude" -ErrorAction SilentlyContinue)) {
    Write-Error "Claude Code CLI not found. Install with: npm install -g @anthropic-ai/claude-code"
    exit 1
}

# Read current state
$PrdPath = "$ScriptDir\prd.json"
$PromptPath = "$ScriptDir\prompt.md"

if (-not (Test-Path $PrdPath)) {
    Write-Error "prd.json not found at $PrdPath"
    exit 1
}

$prd = Get-Content $PrdPath -Raw | ConvertFrom-Json

# Show current status
Write-Info "Branch: $($prd.branchName)"
Write-Info "Strategy: $($prd.pipelineConfig.strategy)"
Write-Info "Components to review: $($prd.userStories.Count)"

$pendingComponents = $prd.userStories | Where-Object { -not $_.passes }
$completedComponents = $prd.userStories | Where-Object { $_.passes }

Write-Info "Completed: $($completedComponents.Count) / $($prd.userStories.Count)"

if ($pendingComponents.Count -eq 0) {
    Write-Success "All components already complete!"
    exit 0
}

# Show pending components
Write-Host "`nPending components:" -ForegroundColor Yellow
foreach ($story in $pendingComponents) {
    $phase = $story.currentPhase
    Write-Host "  - [$($story.id)] $($story.title) (Phase: $phase)" -ForegroundColor Gray
}

Write-Host ""

# Ensure we're on the right branch
Set-Location $ProjectRoot
$currentBranch = git rev-parse --abbrev-ref HEAD 2>$null
if ($currentBranch -ne $prd.branchName) {
    Write-Phase "Switching to branch: $($prd.branchName)"
    
    # Check if branch exists
    $branchExists = git show-ref --verify --quiet "refs/heads/$($prd.branchName)" 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Info "Creating new branch: $($prd.branchName)"
        git checkout -b $prd.branchName
    } else {
        git checkout $prd.branchName
    }
}

# Main loop
Write-Phase "Starting Ralph iterations (max: $MaxIterations)"
Write-Host ""

for ($i = 1; $i -le $MaxIterations; $i++) {
    Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor DarkGray
    Write-Host "  Iteration $i / $MaxIterations" -ForegroundColor Yellow
    Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor DarkGray
    
    # Read current PRD state
    $prd = Get-Content $PrdPath -Raw | ConvertFrom-Json
    $currentComponent = $prd.userStories | Where-Object { -not $_.passes } | Select-Object -First 1
    
    if ($null -eq $currentComponent) {
        Write-Success "All components complete!"
        break
    }
    
    Write-Info "Current: [$($currentComponent.id)] $($currentComponent.title)"
    Write-Info "Phase: $($currentComponent.currentPhase)"
    
    if ($DryRun) {
        Write-Warning "DRY RUN - Would execute Claude with prompt.md"
        Start-Sleep -Seconds 2
        continue
    }
    
    try {
        # Execute Claude with the prompt
        $PromptContent = Get-Content $PromptPath -Raw
        
        if ($Verbose) {
            Write-Host "Sending to Claude..." -ForegroundColor Gray
        }
        
        $Output = $PromptContent | claude --dangerously-skip-permissions 2>&1 | Tee-Object -Variable OutputCapture
        
        # Display output
        Write-Host $Output
        
        # Check for completion
        if ($Output -match "<promise>COMPLETE</promise>") {
            Write-Host ""
            Write-Success "═══════════════════════════════════════════════════════════"
            Write-Success "  PIPELINE COMPLETE!"
            Write-Success "═══════════════════════════════════════════════════════════"
            Write-Host ""
            Write-Info "All components reviewed and polished."
            Write-Info "Reviews saved to: scripts/ralph/ui-pipeline/reviews/"
            Write-Info "Changes committed to branch: $($prd.branchName)"
            exit 0
        }
        
        # Brief pause between iterations
        Write-Host ""
        Write-Info "Iteration complete. Starting next iteration in 3 seconds..."
        Start-Sleep -Seconds 3
        
    } catch {
        Write-Error "Error during iteration: $_"
        Write-Warning "Continuing to next iteration..."
        Start-Sleep -Seconds 5
    }
}

Write-Warning "Maximum iterations ($MaxIterations) reached."
Write-Info "Pipeline may not be complete. Check prd.json for current state."
Write-Info "Run again to continue from where it left off."

exit 1