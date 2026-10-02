<#
.SYNOPSIS
    Creates an isolated Git worktree for an autonomous worker agent.
.PARAMETER Feature
    The feature or epic name (e.g., auth, billing, search).
.PARAMETER Agent
    The agent name (e.g., frontend, backend, aiml).
.PARAMETER BaseBranch
    The base branch to branch from (default: "main").
.EXAMPLE
    .\scripts\worktree\New-Worktree.ps1 -Feature "auth" -Agent "frontend"
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$Feature,

    [Parameter(Mandatory = $true)]
    [string]$Agent,

    [Parameter(Mandatory = $false)]
    [string]$BaseBranch = "main"
)

$ErrorActionPreference = "Stop"

$cleanFeature = $Feature.ToLower().Trim()
$cleanAgent = $Agent.ToLower().Trim()
$worktreeDirName = "$cleanFeature-$cleanAgent"
$worktreePath = Join-Path ".worktrees" $worktreeDirName
$branchName = "feature/$cleanFeature/$cleanAgent"

Write-Host "==> CalmStacks Agent Factory: Provisioning Worktree" -ForegroundColor Cyan
Write-Host "    Feature:     $cleanFeature"
Write-Host "    Agent:       $cleanAgent"
Write-Host "    Branch:      $branchName"
Write-Host "    Directory:   $worktreePath"

if (Test-Path $worktreePath) {
    Write-Error "Worktree directory already exists at: $worktreePath"
    exit 1
}

# Ensure .worktrees parent folder exists
if (-not (Test-Path ".worktrees")) {
    New-Item -ItemType Directory -Path ".worktrees" -Force | Out-Null
}

# Check if branch exists
$branchExists = git branch --list $branchName
if ($branchExists) {
    Write-Host "    Branch '$branchName' already exists. Checking out existing branch..." -ForegroundColor Yellow
    git worktree add $worktreePath $branchName
} else {
    Write-Host "    Creating new branch '$branchName' from '$BaseBranch'..." -ForegroundColor Green
    git worktree add -b $branchName $worktreePath $BaseBranch
}

if ($LASTEXITCODE -eq 0) {
    Write-Host "==> Worktree successfully created at: $((Resolve-Path $worktreePath).Path)" -ForegroundColor Green
} else {
    Write-Error "Failed to create Git worktree."
    exit 1
}
