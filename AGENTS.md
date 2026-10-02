\# CalmStacks Agent Factory



\## Mission



Build production-quality software through coordinated AI agents,

clear ownership, isolated worktrees, automated testing, and iterative review.



\## Core Principle



No agent should assume that its implementation is correct simply because

the code runs.



Every meaningful feature must go through:



REQUIREMENT

→ PLAN

→ IMPLEMENT

→ TEST

→ VERIFY

→ REVIEW

→ COMMIT



\## Project Rules



\### 1. Understand Before Coding



Before implementing a feature:



\- Read the relevant project files.

\- Understand the existing architecture.

\- Identify dependencies and affected areas.

\- Do not unnecessarily rewrite working code.

\- Ask for clarification only when a requirement is genuinely ambiguous.



\### 2. Agent Ownership



Each agent should stay within its assigned responsibility.



Examples:



\- Product Agent → requirements and acceptance criteria

\- Architect Agent → architecture and technical decisions

\- UI Agent → visual design and UX

\- Frontend Agent → frontend implementation

\- Backend Agent → APIs and server logic

\- Database Agent → schema and database work

\- AI Agent → AI/ML functionality

\- QA Agent → testing and bug detection

\- Security Agent → security review

\- DevOps Agent → deployment and infrastructure



Do not modify another agent's area without a clear reason.



\### 3. Git



\- `main` must remain stable.

\- Do not work directly on `main` for feature development.

\- Use a branch or isolated Git worktree.

\- Make focused commits.

\- Write meaningful commit messages.

\- Never commit secrets, API keys, passwords, or credentials.

\- Before merging, verify the branch is in a clean and testable state.



\### 4. Code Quality



\- Prefer simple, maintainable solutions.

\- Reuse existing components and utilities.

\- Avoid duplicated business logic.

\- Use strong typing.

\- Handle errors explicitly.

\- Validate external input.

\- Keep functions and modules reasonably focused.

\- Do not add dependencies without a reason.



\### 5. Testing



A feature is not complete merely because it compiles.



Depending on the change, run:



\- Type checking

\- Linting

\- Unit tests

\- Integration tests

\- End-to-end tests

\- Browser verification



Fix failures rather than ignoring them.



\### 6. Security



\- Never expose secrets in source code.

\- Validate and sanitize user-controlled input.

\- Apply authorization checks on protected operations.

\- Follow least-privilege principles.

\- Protect sensitive data.

\- Review authentication and authorization changes carefully.

\- Report security concerns instead of hiding them.



\### 7. UI / UX



Interfaces should be:



\- Responsive

\- Accessible

\- Consistent

\- Mobile-friendly

\- Clear

\- Production-ready



Do not introduce arbitrary visual styles when an existing design system exists.



\### 8. Browser Verification



For user-facing functionality:



1\. Start the application.

2\. Open the relevant page.

3\. Exercise the actual user flow.

4\. Check console/runtime errors.

5\. Check responsive behavior where relevant.

6\. Verify the result against the requirement.



\### 9. Documentation



Important architectural decisions, setup requirements,

environment variables, APIs, and workflows should be documented.



\### 10. Agent Communication



When finishing a task, report:



\- What was changed

\- Files changed

\- Tests performed

\- Test results

\- Known limitations

\- Any follow-up work required



Do not claim something was tested when it was not tested.



\## Definition of Done



A feature is considered complete only when:



\- The requirement is understood.

\- The implementation is complete.

\- Relevant tests pass.

\- User-facing behavior has been verified where applicable.

\- Security implications have been considered.

\- Documentation is updated where necessary.

\- The work is committed to its branch/worktree.



\## Conflict Resolution



When instructions conflict:



1\. Follow explicit project requirements.

2\. Preserve existing working architecture unless there is a reason to change it.

3\. Prefer the smallest safe change.

4\. Document important architectural decisions.

5\. Escalate genuinely ambiguous product decisions to the Lead Agent.



\## No Fabricated Results



Agents must never invent:



\- Test results

\- Performance numbers

\- User feedback

\- Business metrics

\- Credentials

\- API responses

\- External verification

\- Completed work



State clearly when something is unknown or not yet verified.

