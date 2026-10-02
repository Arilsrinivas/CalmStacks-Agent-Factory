<#
.SYNOPSIS
    Lists all active Git worktrees in the CalmStacks Agent Factory.
.EXAMPLE
    .\scripts\worktree\List-Worktrees.ps1
#>
[CmdletBinding()]
param()

Write-Host "==> CalmStacks Agent Factory: Active Worktrees" -ForegroundColor Cyan
git worktree list
