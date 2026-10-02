# CalmStacks Agent Factory: Skills Architecture & Workflow

## Overview
Workspace Skills in CalmStacks Agent Factory (`.agents/skills/<name>/SKILL.md`) provide reusable, specialized procedures, checklists, and runbooks that guide autonomous agents through distinct operational phases without cluttering global system prompts.

---

## 1. Definitive Agent-to-Skill Mapping Table

| Agent ID | Agent Role | Stage | Assigned Skills (YAML Frontmatter) | Primary Purpose & Usage |
| :--- | :--- | :---: | :--- | :--- |
| **`product`** | Product Agent | 1 | `skills/project-planning` | Decomposing product goals into user stories, acceptance criteria (BDD), scope boundaries, and task breakdowns. |
| **`architect`** | Architect Agent | 1 | `skills/project-planning` | Designing technical topology, dependency mapping, risk mitigation, and freezing interface contracts. |
| **`uiux`** | UI/UX Agent | 2 | `skills/implementation` | Disciplined design token authoring, component states, and responsive accessibility specs without duplication. |
| **`frontend`** | Frontend Agent | 3 | `skills/implementation`<br>`skills/iteration` | Disciplined client UI development within isolated worktrees, local checks, browser verification, and defect fixes. |
| **`backend`** | Backend Agent | 3 | `skills/implementation`<br>`skills/iteration` | Server API logic, strict contract compliance, database integration, service tests, and defect fixes. |
| **`database`** | Database Agent | 2 | `skills/implementation` | Idempotent migrations, normalized data modeling, indexing, and realistic seed data creation. |
| **`aiml`** | AI/ML Agent | 3 | `skills/implementation`<br>`skills/iteration` | Structured prompt engineering, model pipelines, evaluation harnesses, and iterative benchmark tuning. |
| **`qa`** | QA Agent | 4 | `skills/iteration`<br>`skills/code-review` | Executing integration/E2E test suites, browser automation, and reviewing candidate branches for regressions. |
| **`security`** | Security Agent | 4 | `skills/code-review` | Static application security testing (SAST), secret scanning, dependency CVE audits, and authorization checks. |
| **`devops`** | DevOps Agent | 5 | `skills/implementation`<br>`skills/iteration` | Containerization, CI/CD pipeline authoring, environment configurations, and iterative deployment verification. |

---

## 2. Skill Discovery & Selection Mechanisms

### Automatic Skill Selection
- Antigravity scans `.agents/skills/*/SKILL.md` and indexes their YAML frontmatter (`name`, `description`).
- Subagents configured with `skills:` in their YAML frontmatter automatically have those skills in their context catalog.
- When an agent encounters a problem matching a skill's description, the agent autonomously activates the skill and reads `SKILL.md` to guide its procedure.

### Explicit Skill Invocation
- During task dispatch, the Lead Orchestrator can mandate skill execution:
  ```json
  {
    "TypeName": "backend",
    "Role": "Backend Agent",
    "Prompt": "Implement the task status transition endpoint following .agents/skills/implementation/SKILL.md and contracts/api.yaml."
  }
  ```
- This ensures deterministic adherence to factory standards across all subagents.

### Skill Inheritance by Subagents
- Custom subagents inherit access to the workspace `.agents/skills/` catalog.
- Subagents declare their primary skill bindings in their YAML frontmatter (`skills: [...]`).
- When a subagent is launched, its assigned skills provide the operational boundaries and execution steps for that specific turn.

---

## 3. How the Lead Orchestrator Selects Skills for a Task

When decomposing a user request into tasks, the Lead Orchestrator assigns skills according to the operational phase:
1. **Requirements & Scoping Tasks**: Assign `skills/project-planning` to the Product and Architect agents.
2. **Implementation in Isolated Worktrees**: Assign `skills/implementation` to Frontend, Backend, AI/ML, and Database agents to enforce smallest safe changes and local type checks.
3. **Audit & Review Tasks**: Assign `skills/code-review` to QA and Security agents to verify PRD alignment, security vectors, and test validity.
4. **End-to-End Delivery & Remediation**: Assign `skills/iteration` across all worker agents and QA to enforce the full 11-stage loop.

---

## 4. How the Iteration Skill Controls Repeated Verification

The `iteration` skill operationalizes the core CalmStacks rule:
> **No feature is complete merely because code compiles.**

When QA, Security, or local unit tests report a failure:
1. **Defect Capture**: The failure log, failing test name, and stack trace are captured.
2. **Targeted Remediation**: The Lead Orchestrator dispatches a fix task to the responsible worker agent's existing worktree.
3. **Mandatory Re-Verification**: The worker agent applies the fix and re-runs local checks.
4. **Gate Repeat**: The QA and Security agents re-execute the exact tests that failed, plus the regression suite.
5. **No Skips**: An agent is never allowed to bypass a failed test or proceed to integration until the verification gate passes with 100% genuine proof.
