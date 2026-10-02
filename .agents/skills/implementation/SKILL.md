---
name: implementation
description: Disciplined implementation workflow for autonomous worker agents. Enforces inspecting existing code, understanding architecture, respecting domain ownership, making minimal safe changes, running local verification checks, and committing focused work in isolated Git worktrees. Use during feature development or bug fixing.
---

# Implementation Skill

## Overview
This skill provides a disciplined, step-by-step engineering procedure for worker agents (`frontend`, `backend`, `aiml`, `database`) to produce clean, maintainable, and verified code within isolated Git worktrees.

---

## 1. Inspect Existing Code & Environment
1. **Explore the Codebase**: Read relevant existing files, models, and utility modules before writing new code.
2. **Examine Dependencies**: Check package manifests and configuration files. Never introduce unnecessary third-party packages.
3. **Verify Git Worktree**:
   - Confirm you are executing inside your assigned worktree (`.worktrees/<feature>-<agent>/`).
   - Confirm you are on your task branch (`feature/<feature>/<agent>`).
   - Never edit files on `main` directly.

---

## 2. Understand Architecture & Contracts
1. **Locate Canonical Contracts**: Read `contracts/api.yaml`, `contracts/schema.sql`, and `contracts/types.ts`.
2. **Review ADRs**: Inspect `docs/adr/` to align with established architectural decisions and design patterns.
3. **Preserve Working Logic**: Do not refactor or rewrite stable, functioning code unless strictly necessary for the feature.

---

## 3. Identify Ownership & Boundaries
1. **Respect Domain Scopes**: Stay strictly within your assigned domain (e.g. Frontend touches `frontend/`, Backend touches `backend/`).
2. **No Cross-Contamination**: Never modify another agent's assigned files without explicit Lead Orchestrator coordination.

---

## 4. Implement the Smallest Safe Change
1. **Single Responsibility**: Keep functions, classes, and modules reasonably focused.
2. **Strong Typing & Error Handling**:
   - Use explicit typing for all interfaces, function parameters, and return values.
   - Validate and sanitize external input. Handle errors explicitly rather than suppressing them.
3. **Avoid Duplication**: Reuse existing utilities and common components.

---

## 5. Execute Local Verification Checks
Before concluding any implementation turn, execute local checks:
1. **Type Checking**: Run compiler / type checker (e.g., `tsc --noEmit`, `mypy`). Must exit with 0 errors.
2. **Linting**: Run linter (e.g., `eslint`, `flake8`, `ruff`).
3. **Unit Tests**: Run relevant local tests covering the modified files.
4. **Log Proof**: Record exact execution commands and outcomes. Never fabricate results.

---

## 6. Document & Commit
1. **Document Non-Obvious Decisions**: Add clear inline comments for complex domain logic.
2. **Atomic Commits**: Stage only the relevant files (`git add <files>`).
3. **Meaningful Commit Message**: Follow conventional commits:
   ```
   feat(<scope>): add <description>
   fix(<scope>): resolve <issue>
   ```
4. **Generate Handoff**: Write the handoff manifest in `docs/handoffs/` adhering to Rule 10 in `AGENTS.md`.
