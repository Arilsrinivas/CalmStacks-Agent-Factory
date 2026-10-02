# CalmStacks Contract System

The contract system provides the single source of truth for all inter-agent communication and parallel development.

## Core Principles
1. **Contract-First Development**: No frontend or backend implementation begins until the relevant contracts are approved and merged into `contracts/`.
2. **Immutability during Sprints**: Once a feature sprint starts, contracts in `contracts/` are frozen. Any change requires Lead Architect re-negotiation.
3. **Machine-Readable**: Contracts must be parseable by code generators, linters, and mock servers.

## Contract Types
- `api.yaml`: OpenAPI 3.1 specification for all HTTP/REST endpoints.
- `schema.sql`: SQL DDL defining entities, tables, relationships, and constraints.
- `types.ts`: Universal TypeScript / JSON Schema interfaces for cross-agent data sharing.
