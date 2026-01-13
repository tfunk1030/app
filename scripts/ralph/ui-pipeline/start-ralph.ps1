# Start Ralph Loop - Initializes state and launches Claude
# Usage: .\start-ralph.ps1

$ErrorActionPreference = "Stop"
$ProjectRoot = (Get-Item "$PSScriptRoot\..\..\..").FullName

Write-Host @"
╔════════════════════════════════════════════════════════════════╗
║              Ralph Wiggum Autonomous UI Pipeline               ║
║                                                                ║
║  This will start Claude Code with the Stop Hook enabled.      ║
║  The loop will run until all components pass or max reached.  ║
╚════════════════════════════════════════════════════════════════╝
"@ -ForegroundColor Magenta

# Initialize state files
Set-Location $ProjectRoot

Write-Host "[>>] Initializing Ralph state..." -ForegroundColor Cyan

# Create activation flag
New-Item -Path ".ralph-active" -ItemType File -Force | Out-Null
Write-Host "[OK] Created .ralph-active flag" -ForegroundColor Green

# Reset iteration counter
"0" | Set-Content ".ralph-iteration"
Write-Host "[OK] Reset iteration counter" -ForegroundColor Green

# Remove stale completion flag
Remove-Item ".ralph-complete" -Force -ErrorAction SilentlyContinue
Write-Host "[OK] Cleared completion flag" -ForegroundColor Green

# Show current PRD state
$PrdPath = "$PSScriptRoot\prd.json"
if (Test-Path $PrdPath) {
    $prd = Get-Content $PrdPath -Raw | ConvertFrom-Json
    $pending = ($prd.userStories | Where-Object { -not $_.passes }).Count
    $total = $prd.userStories.Count
    Write-Host "[--] Components: $($total - $pending) / $total complete" -ForegroundColor White
}

Write-Host ""
Write-Host "[>>] Starting Claude Code with Ralph Loop..." -ForegroundColor Cyan
Write-Host "[--] Use /ralph-loop to begin the autonomous pipeline" -ForegroundColor White
Write-Host "[--] Or run: claude '/ralph-loop'" -ForegroundColor White
Write-Host ""

# Option 1: Just show instructions
Write-Host "Run this command to start:" -ForegroundColor Yellow
Write-Host "  claude '/ralph-loop'" -ForegroundColor White
Write-Host ""
Write-Host "Or in an existing Claude session, type:" -ForegroundColor Yellow
Write-Host "  /ralph-loop" -ForegroundColor White
