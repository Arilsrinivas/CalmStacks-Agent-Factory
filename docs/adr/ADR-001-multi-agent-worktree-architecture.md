# ADR-001: Git Worktrees for Parallel Multi-Agent Isolation

## Status
Accepted

## Context
When orchestrating multiple autonomous AI agents (Frontend, Backend, AI/ML, QA) working concurrently on the same codebase:
1. Normal Git branching requires checking out one branch at a time within a single folder.
2. Concurrent checkouts in the same directory result in race conditions, overwriting uncommitted files, and broken dependency directories (`node_modules`, `.venv`).
3. On Windows, background services and file watchers lock files, frequently causing `git checkout` and build failures.

## Decision
We adopt **Git Worktrees** located under `.worktrees/` (ignored by `.gitignore`) for all worker agents:
- Each worker agent operates exclusively inside its dedicated worktree folder (`.worktrees/<feature>-<agent>`).
- Worktrees share the central `.git` metadata repository, saving disk space while providing completely isolated filesystems.
- PowerShell lifecycle automation scripts (`New-Worktree.ps1`, `Remove-Worktree.ps1`, etc.) manage worktree creation, synchronization, and safe cleanup.

## Consequences
- **Positive**: Complete filesystem isolation; true parallel execution of agents; elimination of Windows file locking conflicts across agents; zero risk of contaminated commits.
- **Negative**: Requires disk space for local build outputs in each worktree; requires explicit cleanup scripts when features are completed.
