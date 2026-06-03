<#
.SYNOPSIS
    Switches the active Cline agent by copying the chosen agent rules to .clinerules.

.DESCRIPTION
    Cline loads .clinerules at the start of every session.
    This script swaps .clinerules to activate a different agent persona.
    After running, start a NEW Cline task for the change to take effect.

.EXAMPLE
    .\switch-agent.ps1 xpath-discovery
    .\switch-agent.ps1 test-runner
    .\switch-agent.ps1              (interactive menu)
#>

param(
    [Parameter(Position=0)]
    [string]$Agent
)

$agents = [ordered]@{
    "1" = @{ slug = "framework-analyzer";    label = "[1] Framework Analyzer   "; desc = "Scan project, write framework-profile.json" }
    "2" = @{ slug = "jira-test-creator";     label = "[2] Jira Test Creator    "; desc = "Jira ticket -> generate tests in project style" }
    "3" = @{ slug = "xpath-discovery";       label = "[3] XPath Discovery      "; desc = "Open Edge -> discover + validate element locators" }
    "4" = @{ slug = "test-runner";           label = "[4] Test Runner          "; desc = "Execute suite, screenshots on failure, report" }
    "5" = @{ slug = "test-maintenance";      label = "[5] Test Maintenance     "; desc = "Diagnose failures, heal broken selectors" }
    "6" = @{ slug = "pipeline-orchestrator"; label = "[6] Pipeline Orchestrator"; desc = "Full end-to-end pipeline (all stages)" }
    "7" = @{ slug = "test-gap-analyzer";     label = "[7] Test Gap Analyzer    "; desc = "Which Jira tickets have no tests?" }
    "8" = @{ slug = "test-data-manager";     label = "[8] Test Data Manager    "; desc = "Extract hardcoded data to fixture JSON files" }
}

$rulesDir   = ".cline"
$targetFile = ".clinerules"

function Switch-To {
    param([string]$slug)
    $src = Join-Path $rulesDir "rules-$slug.md"
    if (-not (Test-Path $src)) {
        Write-Host "  ERROR: Rules file not found: $src" -ForegroundColor Red
        return $false
    }
    Copy-Item $src $targetFile -Force
    Write-Host ""
    Write-Host "  SWITCHED -> $slug" -ForegroundColor Green
    Write-Host "  Copied: $src -> $targetFile" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  Start a NEW Cline task for the change to take effect." -ForegroundColor Yellow
    Write-Host ""
    return $true
}

# Direct slug argument
if ($Agent) {
    $match = $agents.Values | Where-Object { $_.slug -eq $Agent }
    if (-not $match) {
        Write-Host ""
        Write-Host "  ERROR: Unknown agent '$Agent'" -ForegroundColor Red
        Write-Host "  Valid: " + ($agents.Values | ForEach-Object { $_.slug } | Out-String).Trim()
        Write-Host ""
        exit 1
    }
    Switch-To $Agent
    exit 0
}

# Interactive menu
Write-Host ""
Write-Host "  Selenium MCP -- Cline Agent Switcher" -ForegroundColor Cyan
Write-Host "  ======================================" -ForegroundColor Cyan
Write-Host ""

foreach ($key in $agents.Keys) {
    $a = $agents[$key]
    Write-Host ("  {0}  {1}" -f $a.label, $a.desc) -ForegroundColor White
}

Write-Host ""
$choice = Read-Host "  Enter number (1-8)"

if ($agents.ContainsKey($choice)) {
    Switch-To $agents[$choice].slug
} else {
    Write-Host "  ERROR: Invalid choice '$choice'" -ForegroundColor Red
    exit 1
}
