# CalmStacks Agent Factory System Topology

## Overview
The CalmStacks Agent Factory is an autonomous software development factory driven by specialized AI agents. It orchestrates parallel development across isolated Git worktrees, guarantees contract-first coordination, and strictly verifies all outputs against the Definition of Done.

## System Topology

```
+---------------------------------------------------------------------------------+
|                               Lead Orchestrator                                 |
|          (Coordinates agents, reviews Definition of Done, manages merges)        |
+---------------------------------------------------------------------------------+
       |                                                                  |
       v                                                                  v
+-----------------------+                                      +--------------------+
|     Product Agent     |                                      |  Architect Agent   |
| (PRD, Specs, Stories) |                                      | (ADRs, Contracts)  |
+-----------------------+                                      +--------------------+
                                                                          |
                                                                          v
                                                               +--------------------+
                                                               |  Shared Contracts  |
                                                               | (OpenAPI, SQL, TS) |
                                                               +--------------------+
                                                                 /      |       \
                      +-----------------------------------------+       |        +----------------------------------------+
                      |                                                 |                                                 |
                      v                                                 v                                                 v
           +--------------------+                            +--------------------+                            +--------------------+
           |    UI/UX Agent     |                            |   Database Agent   |                            |    AI/ML Agent     |
           | (Tokens & States)  |                            | (Migrations/Seeds) |                            | (Prompt Pipelines) |
           +--------------------+                            +--------------------+                            +--------------------+
                      |                                                 |                                                 |
                      v                                                 v                                                 |
           +--------------------+                            +--------------------+                                       |
           |   Frontend Agent   |                            |   Backend Agent    |                                       |
           | (.worktrees/fe-*)  |                            | (.worktrees/be-*)  |                                       |
           +--------------------+                            +--------------------+                                       |
                      \                                                 /                                                /
                       +-------------------------------+---------------+------------------------------------------------+
                                                       |
                                                       v
                                            +--------------------+
                                            | Integration Branch |
                                            | (feature/<epic>)   |
                                            +--------------------+
                                                       |
                                           +-----------+-----------+
                                           |                       |
                                           v                       v
                                +--------------------+   +--------------------+
                                |      QA Agent      |   |   Security Agent   |
                                | (E2E & Integration)|   | (SAST, Audit, Sec) |
                                +--------------------+   +--------------------+
                                           \                       /
                                            +-----------+---------+
                                                        |
                                                        v
                                            +--------------------+
                                            |    DevOps Agent    |
                                            | (CI/CD, Packaging) |
                                            +--------------------+
                                                        |
                                                        v
                                            +--------------------+
                                            |    Main Branch     |
                                            | (Production-ready) |
                                            +--------------------+
```
