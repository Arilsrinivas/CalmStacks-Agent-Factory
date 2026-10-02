# CalmStacks Agent Factory: Multi-Agent Orchestration Workflow

## Overview
This document defines the operational workflow for the **Lead Orchestrator** to decompose incoming software engineering requests, coordinate specialized subagents, assign isolated Git worktrees, manage contract-driven handoffs, and enforce the CalmStacks Definition of Done.

---

## 1. Request Decomposition by the Lead Orchestrator

When a new feature or project request arrives:
1. **Scope Assessment**: The Lead Agent evaluates domain requirements (UI, server, database, AI/ML, security, infrastructure).
2. **Phase Partitioning**: The Lead Agent breaks down the work into 5 sequential pipeline stages:
   - **Stage 1**: Requirements & Architecture (Sequential)
   - **Stage 2**: Design Tokens & Database Schema (Concurrent)
   - **Stage 3**: Feature Implementation in Worktrees (Concurrent)
   - **Stage 4**: QA Validation & Security Audit (Concurrent)
   - **Stage 5**: DevOps Deployment & Integration Merge (Sequential)
3. **Contract Derivation**: Identifies mandatory contract interfaces required before implementation starts (`contracts/api.yaml`, `contracts/schema.sql`, `contracts/types.ts`).

---

## 2. Subagent Invocation & Lifecycle

The Lead Orchestrator invokes specialized subagents via Antigravity subagent mechanisms:
- Each subagent operates with its dedicated system instructions defined in `.agents/agents/<name>.md`.
- Subagents receive explicit inputs, write scope limitations, and expected handoff artifacts.
- The Lead Agent monitors subagent progress reactively without wasteful polling loops.

```
+-----------------------------------------------------------------------------------+
|                                  Lead Orchestrator                                |
|                                                                                   |
|  1. Dispatches Stage 1 Subagents (product -> architect)                           |
|  2. Freezes contracts/api.yaml & contracts/schema.sql                             |
|  3. Provisions worktrees using scripts/worktree/New-Worktree.ps1                 |
|  4. Concurrently invokes Stage 3 Subagents (frontend, backend, aiml)              |
|  5. Collects handoff manifests from docs/handoffs/                                |
|  6. Invokes Stage 4 Subagents (qa, security) against integrated branch            |
|  7. Verifies Definition of Done (0 fabricated results) and merges to main         |
|  8. Cleans up worktrees using scripts/worktree/Remove-Worktree.ps1                |
+-----------------------------------------------------------------------------------+
```

---

## 3. Concurrency & Synchronization Matrix

| Pipeline Stage | Agent Involved | Concurrency Mode | Worktree Needed? | Prerequisites | Deliverable Artifacts |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Stage 1A** | `product` | Sequential | No | User prompt | `docs/prd/<feature>.prd.md` |
| **Stage 1B** | `architect` | Sequential | No | Approved PRD | `contracts/api.yaml`, `contracts/types.ts`, `docs/adr/` |
| **Stage 2A** | `uiux` | **Concurrent** with 2B | No | PRD & Architecture | `design/`, `docs/ui/` |
| **Stage 2B** | `database` | **Concurrent** with 2A | No | Architecture specs | `database/migrations/`, `contracts/schema.sql` |
| **Stage 3A** | `frontend` | **Concurrent** with 3B, 3C | **Yes** (`.worktrees/<feat>-frontend`) | Frozen API contract & UI tokens | Client code, UI tests, handoff manifest |
| **Stage 3B** | `backend` | **Concurrent** with 3A, 3C | **Yes** (`.worktrees/<feat>-backend`) | Frozen API & DB contracts | Server code, API tests, handoff manifest |
| **Stage 3C** | `aiml` | **Concurrent** with 3A, 3B | **Yes** (`.worktrees/<feat>-aiml`) | Architecture contracts | Prompts, eval pipelines, handoff manifest |
| **Stage 4A** | `qa` | **Concurrent** with 4B | Optional (Integration branch) | Merged Stage 3 code | E2E test suites, QA report |
| **Stage 4B** | `security` | **Concurrent** with 4A | No | Merged Stage 3 code | SAST report, secret scan, audit report |
| **Stage 5A** | `devops` | Sequential | No | QA & Security approvals | Dockerfile, CI/CD workflows |
| **Stage 5B** | `Lead Agent` | Sequential | Root repo (`main`) | DoD clearance | Final merge to `main`, worktree removal |

---

## 4. Git Worktree Assignment Protocol

Worker implementation agents (`frontend`, `backend`, `aiml`) must **never modify `main` directly**.

### Worktree Provisioning Flow
1. The Lead Agent creates an epic integration branch:
   ```powershell
   git checkout -b feature/<epic-name> main
   ```
2. The Lead Agent provisions isolated worktrees for worker agents:
   ```powershell
   .\scripts\worktree\New-Worktree.ps1 -Feature "<epic-name>" -Agent "frontend" -BaseBranch "feature/<epic-name>"
   .\scripts\worktree\New-Worktree.ps1 -Feature "<epic-name>" -Agent "backend" -BaseBranch "feature/<epic-name>"
   .\scripts\worktree\New-Worktree.ps1 -Feature "<epic-name>" -Agent "aiml" -BaseBranch "feature/<epic-name>"
   ```
3. Worker agents develop, run tests, and commit solely inside their dedicated working folder (`.worktrees/<epic-name>-<agent>/`).
4. Upon successful handoff and QA approval, worktrees are pruned:
   ```powershell
   .\scripts\worktree\Remove-Worktree.ps1 -Feature "<epic-name>" -Agent "frontend" -DeleteBranch
   .\scripts\worktree\Remove-Worktree.ps1 -Feature "<epic-name>" -Agent "backend" -DeleteBranch
   .\scripts\worktree\Remove-Worktree.ps1 -Feature "<epic-name>" -Agent "aiml" -DeleteBranch
   ```

---

## 5. Inter-Agent Communication & Handoff Standard

Agents never communicate through vague chat summaries. All handoffs must be registered in standard machine-readable formats adhering to Rule 10 in `AGENTS.md`.

### Handoff Requirements:
1. Every completing agent writes:
   - JSON Manifest: `docs/handoffs/<feature>-<agent>.json`
   - Markdown Report: `docs/handoffs/<feature>-<agent>.md`
2. Every report must include:
   - What changed (files created, modified, deleted).
   - Contracts consumed and produced.
   - Verifiable test proof (exact test command, total tests, passed tests, exit code, log file path).
   - Known limitations or technical debt.
   - Concrete next steps for downstream agents.
3. Handoffs are validated via:
   ```powershell
   .\scripts\validation\Test-Handoff.ps1 -Path "docs/handoffs/<feature>-<agent>.json"
   ```

---

## 6. Verification & Quality Gates

The Lead Orchestrator enforces 5 mandatory quality gates:
- **Gate 1 (Self-Audit)**: Worker agents run type checks, linters, and unit tests inside their worktree. Zero errors permitted.
- **Gate 2 (Contract Conformance)**: API endpoints and data payloads are validated against `contracts/api.yaml`.
- **Gate 3 (QA & Security Audit)**: QA Agent runs integration/E2E test suites; Security Agent executes secret scanning and SAST audits.
- **Gate 4 (Anti-Fabrication Check)**: Lead Agent inspects test logs to ensure no fabricated results exist.
- **Gate 5 (Merge to Main)**: Lead Agent merges `feature/<epic-name>` into `main` and verifies the master build.
