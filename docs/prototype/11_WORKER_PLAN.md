# 11 Worker Plan

No Workers are started in Phase 0. This plan is for later execution.

## Worker Shared Foundation
| Field | Contract |
|---|---|
| Recommended mode | Local or Worktree |
| Owned directories | `prototype/shared/`, `prototype/fixtures/`, `prototype/types/` |
| Inputs | `docs/prototype/09_MOCK_DATA_CONTRACT.md`, copied Unit 6 JSON/Excel |
| Outputs | Type definitions, fixture transforms, ID constants, state constants |
| Must not modify | `docs/source/`, `docs/data/`, `docs/prototype/` unless asked |
| Dependencies | None; starts first |
| Start condition | Phase 0 docs accepted |
| Acceptance | Fixtures preserve 128/669/91/36 counts and use real Unit 6 IDs |

## Worker Admin Web
| Field | Contract |
|---|---|
| Recommended mode | Worktree |
| Owned directories | `prototype/admin-web/` |
| Inputs | IA, screen inventory, route map, flows, shared fixtures |
| Outputs | Admin prototype screens for P0 plus P1 placeholders |
| Must not modify | Student prototype, source/data baseline, shared fixture contract without coordination |
| Dependencies | Shared Foundation |
| Start condition | Shared IDs and fixtures ready |
| Acceptance | P0 admin pages, ReviewCase queue, teacher override reason, static LMS status visible |

## Worker Student Mobile Prototype
| Field | Contract |
|---|---|
| Recommended mode | Worktree |
| Owned directories | `prototype/student-web/` |
| Inputs | Student screens, state/exception catalog, shared fixtures |
| Outputs | Responsive web iOS simulation for P0 student flows |
| Must not modify | Admin prototype, source/data baseline |
| Dependencies | Shared Foundation |
| Start condition | Shared task/path fixtures ready |
| Acceptance | Home, path, task, feedback/reflection plus offline, mic denial, recording failure, retry states |

## Worker Prototype QA
| Field | Contract |
|---|---|
| Recommended mode | Subagent or Worktree |
| Owned directories | `prototype/qa/`, `prototype/screenshots/` |
| Inputs | Acceptance criteria, implemented admin/student prototypes |
| Outputs | Static checks, screenshot matrix, basic interaction replay |
| Must not modify | Product implementation except test fixtures by coordination |
| Dependencies | Admin and Student workers |
| Start condition | P0 surfaces runnable |
| Acceptance | Screenshots and state replay prove required pages/flows/states |

## Directory Ownership Rule
Workers must not edit `docs/source/` or `docs/data/`. These are immutable baselines. Any product ambiguity found during implementation goes to `docs/prototype/OPEN_DECISIONS.md`.
