<#
.SYNOPSIS
    Syncs an agent's worktree with an upstream branch.
.PARAMETER Feature
    The feature or epic name.
.PARAMETER Agent
    The agent name.
.PARAMETER UpstreamBranch
    The upstream branch to pull from (default: "main").
.EXAMPLE
    .\scripts\worktree\Sync-Worktree.ps1 -Feature "auth" -Agent "frontend" -UpstreamBranch "main"
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$Feature,

    [Parameter(Mandatory = $true)]
    [string]$Agent,

    [Parameter(Mandatory = $false)]
    [string]$UpstreamBranch = "main"
)

$ErrorActionPreference = "Stop"

$cleanFeature = $Feature.ToLower().Trim()
$cleanAgent = $Agent.ToLower().Trim()
$worktreeDirName = "$cleanFeature-$cleanAgent"
$worktreePath = Join-Path ".worktrees" $worktreeDirName

if (-not (Test-Path $worktreePath)) {
    Write-Error "Worktree directory does not exist at: $worktreePath"
    exit 1
}

Write-Host "==> CalmStacks Agent Factory: Syncing Worktree" -ForegroundColor Cyan
Write-Host "    Worktree: $worktreePath"
Write-Host "    Pulling from: $UpstreamBranch"

Push-Location $worktreePath
try {
    git fetch origin
    git merge $UpstreamBranch --no-edit
    Write-Host "==> Sync complete." -ForegroundColor Green
} finally {
    Pop-Location
}
