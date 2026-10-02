# CalmStacks Agent Factory: Pilot Orchestration Test Plan

## Objective
Validate the multi-agent coordination mechanism, worktree isolation lifecycle, contract freeze, and handoff verification protocols before launching the full production software engineering team.

---

## Pilot Feature: "System Health Status Service" (Minimal Viable Feature)

To test the orchestration without creating complex application code, the factory will execute a minimal end-to-end slice: a system health status check.

### Test Workflow Steps

### Step 1: Requirements Formulation (`product` subagent)
- **Action**: Product Agent is invoked with a prompt to specify requirements for a system health status query.
- **Expected Artifact**: `docs/prd/pilot-health-check.prd.md` containing BDD criteria.
- **Verification Gate**: Lead Agent confirms Gherkin scenarios are defined and no application code was written.

### Step 2: Contract Definition (`architect` subagent)
- **Action**: Architect Agent is invoked to generate the formal contract.
- **Expected Artifact**: `contracts/api.yaml` containing the `/api/v1/health` endpoint definition.
- **Verification Gate**: `powershell -File .\scripts\validation\Test-Contracts.ps1` confirms valid contract.

### Step 3: Worktree Provisioning (Lead Agent)
- **Action**: Lead Agent provisions isolated worktrees for implementation:
  ```powershell
  .\scripts\worktree\New-Worktree.ps1 -Feature "pilot-health" -Agent "backend"
  .\scripts\worktree\New-Worktree.ps1 -Feature "pilot-health" -Agent "frontend"
  ```
- **Verification Gate**: `git worktree list` shows isolated directories; `git status` on root shows working tree clean.

### Step 4: Worker Agent Execution (`backend` & `frontend` subagents)
- **Action**:
  - `backend` agent develops solely inside `.worktrees/pilot-health-backend`.
  - `frontend` agent develops solely inside `.worktrees/pilot-health-frontend`.
- **Verification Gate**:
  - Root `main` branch remains 100% clean and unmodified.
  - Both agents produce handoff manifests in `docs/handoffs/`.

### Step 5: Quality & Security Clearance (`qa` & `security` subagents)
- **Action**:
  - `qa` agent verifies endpoint contract against test suite.
  - `security` agent runs secret check and dependency audit.
- **Verification Gate**:
  - Both agents output verifiable logs without fabrication.
  - `powershell -File .\scripts\validation\Test-Handoff.ps1 -Path <manifest>` passes.

### Step 6: Integration, Teardown & DoD Sign-Off (Lead Agent)
- **Action**:
  - Lead Agent merges feature branch into `main`.
  - Lead Agent dismantles worktrees:
    ```powershell
    .\scripts\worktree\Remove-Worktree.ps1 -Feature "pilot-health" -Agent "backend" -DeleteBranch
    .\scripts\worktree\Remove-Worktree.ps1 -Feature "pilot-health" -Agent "frontend" -DeleteBranch
    ```
- **Verification Gate**: `git worktree list` confirms zero lingering worktrees; `main` contains verified feature.
