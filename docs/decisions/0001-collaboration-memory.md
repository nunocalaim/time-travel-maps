# 0001 - Collaboration Memory

Date: 2026-06-25

Status: Accepted

## Context

The project is intended for collaboration between humans and AI agents. Full conversation transcripts would preserve detail, but they would also be noisy, hard to review, and potentially distracting.

## Decision

Use summarized markdown files for project memory.

- `collaboration/agent-log.md` records chronological session summaries.
- `collaboration/goals.md` records current goals.
- `collaboration/open-questions.md` records unresolved issues.
- `docs/decisions/` records durable decisions.
- `collaboration/branches/` records divergent branch intent.

## Consequences

- Future collaborators can quickly understand project direction.
- Humans and AI agents share a compact memory of decisions and experiments.
- Some nuance from conversations is intentionally lost.
- Summaries need to be maintained as work progresses.

## Alternatives Considered

- Store full chat transcripts in the repo.
- Store no collaboration memory beyond Git commits.

