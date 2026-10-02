# CalmStacks Agent Factory: Autonomous Orchestration (Minimum Human Intervention)

## Philosophy & Execution Model
To achieve maximum engineering velocity while upholding `AGENTS.md` and the **No Fabricated Results** rule, the Lead Orchestrator operates under **Autonomous Goal-Seeking Semantics** (inspired by `/goal`).

Once the user provides a high-level project goal, the Lead Orchestrator runs the entire multi-stage pipeline asynchronously to completion without asking for intermediate manual confirmations, pausing only when genuine blocking decisions require human authority.

---

## 1. What Is Fully Automated

| Phase | Automated Action | Automation Mechanism |
| :--- | :--- | :--- |
| **1. Requirements & Spec** | Decomposes goal into PRD and Gherkin scenarios | Invokes `product` subagent asynchronously |
| **2. Architecture & Contracts**| Designs topology, writes OpenAPI & DB contracts | Invokes `architect` subagent, freezes `contracts/` |
| **3. Design & Schema Prep** | Creates visual design tokens & SQL migrations | Invokes `uiux` and `database` subagents concurrently |
| **4. Worktree Provisioning** | Allocates isolated directory & branch per worker | Executes `.\scripts\worktree\New-Worktree.ps1` |
| **5. Parallel Implementation**| Implements client UI, backend APIs, and AI models | Concurrently dispatches `frontend`, `backend`, `aiml` subagents |
| **6. Asynchronous Monitoring**| Monitors background task states & completion events | Antigravity reactive event wakeup (no polling) |
| **7. Quality & Security Audits**| Executes E2E, contract tests, SAST, secret scan | Concurrently dispatches `qa` and `security` subagents |
| **8. Automated Bug Fix Loop** | Re-dispatches worker agent with exact error logs | Closes the loop on failed tests without user prompts |
| **9. Worktree Pruning & Cleanup**| Safely unlinks worktrees and prunes Git references | Executes `.\scripts\worktree\Remove-Worktree.ps1` |
| **10. Integration & Merge** | Validates DoD and fast-forwards/merges to `main` | Lead Orchestrator git integration checks |

---

## 2. Automated Defect Resolution Loop

If QA or Security discovers a defect:
1. QA/Security records the failure log (e.g. `tests/reports/test_auth_failure.log`).
2. Lead Orchestrator intercepts the failed handoff without stopping or asking the user.
3. Lead Orchestrator routes the defect to the responsible worker agent's existing worktree with:
   - Specific failure logs and stack traces.
   - Acceptance criteria that failed.
4. The worker agent fixes the code, reruns unit tests, and commits.
5. QA re-tests the updated branch.
6. The loop repeats until all quality gates pass (up to a configurable maximum retry limit, e.g., 3 attempts).

---

## 3. Human Intervention Triggers (Strictly Gated)

The Lead Agent **only** pauses to ask for user input when one of the following blocking conditions occurs:

1. **Product Ambiguity**: A fundamental contradiction or unresolvable trade-off in business scope (e.g. choosing between two mutually exclusive monetization strategies).
2. **Missing Secrets & Credentials**: The application requires private API keys, cloud tokens, or production database credentials.
3. **Irreversible Data Loss / Destruction**: Actions involving dropping production databases, deleting cloud infrastructure, or overwriting critical external repositories.
4. **Legal / Regulatory Concerns**: PII storage, GDPR/HIPAA compliance decisions, or licensing conflicts with external dependencies.
5. **Defect Loop Exhaustion**: An agent fails to resolve an automated test after 3 iterations.

---

## 4. Evaluation of `/teamwork-preview` vs. Custom Subagents

### `/teamwork-preview` Assessment
- **Status in Environment**: Available as an Antigravity user-facing slash command (`/teamwork-preview <task>`).
- **Nature**: Generic multi-agent collaboration preview designed for broad, open-ended problem solving and multi-day research/refactoring.
- **Limitations for CalmStacks**:
  - Does NOT enforce `AGENTS.md` stage progression (`REQUIREMENT -> PLAN -> IMPLEMENT -> TEST -> VERIFY -> REVIEW -> COMMIT`).
  - Does NOT understand Git worktree isolation scripts (`New-Worktree.ps1` / `Remove-Worktree.ps1`).
  - Does NOT enforce contract-first immutability (`contracts/api.yaml`).
  - Lacks strict domain boundaries for the 10 CalmStacks specialist roles.

### Decision
- **Recommended Core Engine**: CalmStacks Custom Subagent Orchestration driven by the Lead Orchestrator.
- **Recommended Usage of `/teamwork-preview`**: Can be used by human operators for open-ended creative brainstorming or exploratory research before feeding a defined feature goal into the CalmStacks Agent Factory.
