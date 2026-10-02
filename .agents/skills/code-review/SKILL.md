---
name: code-review
description: Comprehensive quality, security, and architectural code review guide. Evaluates changes for functional correctness, maintainability, architectural alignment, security vulnerabilities, test coverage, edge-case handling, PRD requirement compliance, and prevention of unnecessary complexity. Use during PR audits, pre-merge reviews, or QA/Lead gate checks.
---

# Code Review Skill

## Overview
This skill provides a systematic code review rubric used by the **Lead Orchestrator**, **QA Agent**, and **Security Agent** to inspect candidate branches before merging.

---

## 1. Functional Correctness
- **Logic Validation**: Does the implementation correctly execute the intended business logic?
- **State Integrity**: Are state transitions valid, deterministic, and free of race conditions?
- **Error Handling**: Are error paths explicitly handled with sensible fallbacks and logging?

---

## 2. Requirement Compliance (PRD Alignment)
- **Acceptance Criteria**: Does the change satisfy all Given/When/Then scenarios in the PRD?
- **Scope Discipline**: Does the change remain strictly within in-scope boundaries without unplanned extras?

---

## 3. Architecture & Contract Alignment
- **Contract Conformance**: Do endpoints, query params, and payloads strictly match `contracts/api.yaml`?
- **Schema Alignment**: Do data access queries adhere to `contracts/schema.sql`?
- **ADR Adherence**: Does the code respect patterns established in `docs/adr/`?

---

## 4. Maintainability & Simplicity
- **Simplicity**: Is this the simplest working solution? Avoid over-engineering, unnecessary abstractions, or speculative generalizations.
- **Readability**: Are naming conventions clear, domain-accurate, and self-documenting?
- **Code Duplication**: Is business logic deduplicated and modularized?

---

## 5. Security & Input Sanitization
- **Secrets Audit**: Are there zero hardcoded API keys, tokens, credentials, or private certificates?
- **Injection Defense**: Are database queries parameterized and inputs sanitized against SQLi and XSS?
- **Authorization**: Are authorization guards applied to all sensitive operations?

---

## 6. Testing & Edge Cases
- **Test Quality**: Do tests assert real behavioral invariants rather than testing implementation details?
- **Edge Cases**: Are null/undefined values, empty collections, boundary numbers, and timeouts tested?
- **Verifiable Proof**: Are test command outputs and log files attached? Zero fabricated results.

---

## 7. Review Verdicts
Every review must conclude with an explicit verdict:
- **APPROVED**: Meets all criteria; ready to merge.
- **REQUEST_CHANGES**: Specific defects identified with clear remediation steps.
- **BLOCKED**: Fundamental architectural flaw or missing human escalation.
