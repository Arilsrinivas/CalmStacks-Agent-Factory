<#
.SYNOPSIS
    Safely tears down an agent's Git worktree and prunes worktree references.
.PARAMETER Feature
    The feature or epic name.
.PARAMETER Agent
    The agent name.
.PARAMETER DeleteBranch
    If specified, deletes the branch after removing worktree.
.PARAMETER Force
    Force removal even if untracked/uncommitted changes exist.
.EXAMPLE
    .\scripts\worktree\Remove-Worktree.ps1 -Feature "auth" -Agent "frontend"
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$Feature,

    [Parameter(Mandatory = $true)]
    [string]$Agent,

    [Parameter(Mandatory = $false)]
    [switch]$DeleteBranch,

    [Parameter(Mandatory = $false)]
    [switch]$Force
)

$ErrorActionPreference = "Stop"

$cleanFeature = $Feature.ToLower().Trim()
$cleanAgent = $Agent.ToLower().Trim()
$worktreeDirName = "$cleanFeature-$cleanAgent"
$worktreePath = Join-Path ".worktrees" $worktreeDirName
$branchName = "feature/$cleanFeature/$cleanAgent"

Write-Host "==> CalmStacks Agent Factory: Removing Worktree" -ForegroundColor Cyan
Write-Host "    Worktree Path: $worktreePath"

if (-not (Test-Path $worktreePath)) {
    Write-Warning "Worktree directory does not exist at $worktreePath. Pruning references..."
    git worktree prune
    exit 0
}

# Check uncommitted status if not Force
if (-not $Force) {
    Push-Location $worktreePath
    $status = git status --porcelain
    Pop-Location
    if ($status) {
        Write-Error "Worktree has uncommitted changes! Commit or stash them, or use -Force to discard."
        exit 1
    }
}

# Execute git worktree remove
if ($Force) {
    git worktree remove --force $worktreePath
} else {
    git worktree remove $worktreePath
}

git worktree prune

if (Test-Path $worktreePath) {
    Write-Warning "Folder still exists after worktree remove (possible Windows lock). Attempting directory cleanup..."
    Remove-Item -Recurse -Force $worktreePath -ErrorAction SilentlyContinue
}

if ($DeleteBranch) {
    Write-Host "    Deleting branch '$branchName'..." -ForegroundColor Yellow
    git branch -D $branchName
}

Write-Host "==> Worktree successfully removed." -ForegroundColor Green
