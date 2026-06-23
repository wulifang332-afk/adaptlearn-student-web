# AdaptLearn Copilot Agent Rules

This repository is the Phase 0 interaction prototype contract for AdaptLearn Copilot.

## Source Of Truth
- Follow `docs/prototype/00_SOURCE_OF_TRUTH.md`.
- Priority: PRD v1.1 Unit 6 baseline > UML v4.0 > Unit 6 JSON/Excel > project proposal background.
- `docs/source/` and `docs/data/` are immutable baselines. Do not edit, move, overwrite, or regenerate them.

## Scope
- MVP is limited to Grade 7 Volume 1 Unit 6, "The Power of Plants".
- Do not add parent portal, paid features, multi-subject scope, reinforcement learning, or free-form chatbot.
- Do not present mock algorithm outputs as real BKT, IRT, LLM, or learning-effect results.

## Ownership
- Detailed worker ownership is in `docs/prototype/11_WORKER_PLAN.md`.
- Workers must stay inside their owned directories and must not modify another worker's area without coordination.
- All unresolved requirements go to `docs/prototype/OPEN_DECISIONS.md`.

## Naming
- Screen IDs use `ADM-*` and `STU-*`.
- Flow IDs use `FLOW-*`.
- State IDs use domain-specific prefixes documented in `docs/prototype/06_STATE_MATRIX.md`.

## Checks
- Build, lint, test, and screenshot commands are placeholders until a Worker initializes the chosen prototype stack.
- Before handoff, run the static checks listed in `docs/prototype/12_ACCEPTANCE_CRITERIA.md`.
