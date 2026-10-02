# ADR-002: LegalConnect System Architecture, Data Modeling, and Compliance Decoupling

## Status
Accepted

## Context
LegalConnect by CalmStacks is an informational gateway and workspace platform designed to bridge citizens and MSMEs with verified legal practitioners in India. Building this platform involves resolving multiple architectural, regulatory, and technological tensions:

1. **Regulatory Constraints (Bar Council of India Rule 36)**: Advocates are legally barred from advertising, commercial soliciting, or participating in competitive ranking/bidding platforms. The technical architecture must guarantee neutral, unranked, non-promoted directory presentation.
2. **Statutory Advice Boundary (Advocates Act 1961)**: Only enrolled advocates can give legal advice. The AI ingestion engine must be architecturally isolated to factual summarization and taxonomy classification, strictly preventing unauthorized practice of law or automated legal counseling.
3. **Data Protection & Legal Privilege (DPDPA 2023 & Indian Evidence Act / BSA 2023)**: Case documents, messages, and factual disclosures carry statutory confidentiality. Workspace data must be strictly isolated between verified case participants.
4. **Development Velocity & Multi-Agent Parallelism**: CalmStacks Agent Factory operates with multiple specialized agents (Backend, Frontend, Database, AI/ML, QA). Contracts and domain boundaries must be formally decoupled to permit frictionless parallel execution.

## Decision

We adopt the following architectural choices:

### 1. Architectural Topology: Modular Monolith with Contract-First Decoupling
- Implement an application modular monolith with clear domain boundaries (`Auth`, `Intake`, `Directory`, `Scheduling`, `Workspace`, `Admin`).
- Formalize all inter-component boundaries through machine-readable contracts:
  - `contracts/api.yaml` (OpenAPI 3.1)
  - `contracts/schema.sql` (PostgreSQL DDL)
  - `contracts/types.ts` (Universal TypeScript models)
- Decouple frontend and backend agents completely by freezing contracts prior to implementation.

### 2. Technology Stack Selection
- **Frontend Presentation**: React 18, Vite, and Tailwind CSS. Provides ultra-responsive client experiences with zero runtime layout overhead and modular component composition.
- **Backend Application Core**: Node.js 20 LTS with TypeScript and Fastify/Express. Enables high-throughput, non-blocking I/O with native schema validation against OpenAPI definitions.
- **Primary Relational Persistence**: PostgreSQL 16. Enforces ACID transactional guarantees essential for consultation slot reservations, supports JSONB for semi-structured intake facts, and supports robust foreign key cascading.
- **Test Portability Layer**: SQLite / In-Memory database adapter. Eliminates mandatory Docker/external database dependencies for fast, deterministic unit and integration test runs.
- **AI Engine Integration**: Google Gemini API via an isolated intake proxy. Enforces structured JSON output parsing, strict prompt containment against hallucination, and automatic statutory non-legal advice disclaimer injection.
- **Document Vault**: Encrypted file storage (AES-256) utilizing pre-signed access tokens, strict MIME-type allowlists, and workspace-level authorization checks.

### 3. Compliance and Security Architecture
- **Statutory AI Isolation**: The AI subsystem operates strictly as a data normalizer (extracting core facts, identified parties, timeline, and relief sought). Prompts strictly prohibit generating legal theories, cause-of-action evaluations, or chances of litigation success. Every AI response envelope carries mandatory statutory disclaimer metadata.
- **Zero-Ad Directory Algorithm**: Advocate directory queries enforce unranked result sets, deterministic filtering by factual attributes (jurisdiction, practice area, fee), and calendar availability sorting with random tie-breaks. No sponsored slots, badges, or review aggregations are permitted in the database schema or API contracts.
- **Strict Cryptographic Case Silos**: Row-level query validation enforces that workspace documents and messages are accessible only by the verified `client_id` and assigned `advocate_id`.

## Consequences

### Positive
- **Guaranteed Regulatory Compliance**: Architectural guardrails structurally prevent BCI Rule 36 violations and unauthorized legal advice generation.
- **High Concurrency & Atomic Consistency**: PostgreSQL transactions prevent race-condition double-booking of advocate consultation slots.
- **Frictionless Parallel Development**: Strict machine-readable contracts (`contracts/api.yaml`, `contracts/schema.sql`, `contracts/types.ts`) allow Frontend, Backend, AI/ML, and QA agents to implement features independently with mock servers.
- **Fast Test Cycles**: SQLite in-memory capability enables sub-second test runs in CI/CD pipelines without database setup overhead.

### Negative / Trade-offs
- **Schema Maintenance**: Dual compatibility between PostgreSQL (production) and SQLite (testing) requires avoiding proprietary Postgres-only extensions in common query paths (handled via standardized SQL and JSON serialization).
- **External AI Latency**: Dependency on Google Gemini requires asynchronous timeout handling, graceful fallback for intake parsing, and client retry handling.
