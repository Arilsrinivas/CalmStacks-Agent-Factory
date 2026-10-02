---
name: project-planning
description: Transforms high-level product and feature requests into structured problem definitions, user personas, user stories, BDD acceptance criteria, scope boundaries, dependencies, risks, and implementation tasks. Use during initial feature conception, epic planning, or when defining requirements.
---

# Project Planning Skill

## Overview
This skill guides the **Product Agent** and the **Lead Orchestrator** in converting unstructured stakeholder requests into unambiguous, execution-ready engineering specifications.

---

## 1. Problem Definition & Core Value
1. **Core Problem**: Articulate the exact pain point being solved. Avoid solution bias.
2. **Target Audience**: Identify specific user roles or agent personas interacting with the solution.
3. **Success Metrics**: Establish measurable criteria for success (e.g. latency, completion rate, error reduction).

---

## 2. User Stories & Acceptance Criteria (BDD)
Formulate user stories using the standard template:
> *As a [user role], I want [capability] so that [business value].*

For each user story, specify at least one **Behavior-Driven Development (BDD)** scenario:
```gherkin
Scenario: [Descriptive scenario title]
  Given [initial context / precondition]
  When [user or agent performs an action]
  Then [expected observable outcome]
  And [secondary side effect or state persistence]
```

---

## 3. Scope Boundaries
Explicitly partition requirements into two mandatory sections:
- **In-Scope**: Hard functional deliverables included in this milestone.
- **Out-of-Scope**: Adjacent features, future enhancements, or third-party integrations explicitly deferred to prevent scope creep.

---

## 4. Dependencies & Technical Interfaces
1. **Upstream Dependencies**: Existing services, contracts, schemas, or external APIs required.
2. **Downstream Dependencies**: Agents, client apps, or deployment pipelines that consume the deliverables.
3. **Contracts Required**: Identify OpenAPI endpoints (`contracts/api.yaml`) and database tables needed.

---

## 5. Risk Assessment & Mitigations
Document potential technical, operational, or architectural risks:
- Concurrency conflicts or data integrity hazards.
- Performance bottlenecks or rate-limiting thresholds.
- Security and authorization vulnerabilities.
- Fallback mitigation strategies for each identified risk.

---

## 6. Implementation Task Breakdown
Break down the epic into discrete, atomic worker tasks:
- **Architecture Tasks**: Contracts, ADRs, schema DDL.
- **Design Tasks**: UI tokens, component hierarchy, responsive layouts.
- **Frontend Tasks**: Client components, state management, client tests.
- **Backend Tasks**: API endpoints, business logic, authorization, integration tests.
- **QA & Security Tasks**: Test matrix, automated verification, security audits.

---

## 7. Deliverable Output
Save the complete specification to `docs/prd/<feature-name>.prd.md` and generate the standard handoff manifest in `docs/handoffs/`.
