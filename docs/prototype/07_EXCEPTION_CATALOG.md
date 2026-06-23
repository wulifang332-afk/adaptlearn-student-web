# 07 Exception Catalog

| ID | Exception | Trigger | System behavior | User action | Blocks? |
|---|---|---|---|---|---|
| EX-LINT-REVIEW | Lint REVIEW | Any Lint returns REVIEW | Create ReviewCase and pause automatic continuation | Owner approves, modifies, or rejects | Yes until resolved |
| EX-LINT-BLOCK | Lint BLOCK | Critical gate failure | Stop publication, recommendation, and state update | Fix and rerun or final block | Yes |
| EX-VER-BLOCK | Verifier BLOCK | Path inappropriate or unsafe | Do not publish; create ReviewCase | Teacher/researcher handles | Yes |
| EX-VERSION-CONTENT | Published content edit attempt | In-place edit on locked version | Reject mutation; keep old version | Create new version or withdraw | Yes |
| EX-VERSION-TASK | Student submits stale task/path | Version mismatch | Isolate evidence; do not update state | Refresh path or wait for teacher | Yes for that submission |
| EX-SUB-DUP | Duplicate submission | Idempotency key repeats | Deduplicate or isolate | View submitted/queued status | No |
| EX-SUB-ABNORMAL | Abnormal time or score | Data Lint fails | Isolate evidence; preserve completion record if allowed | Teacher review or redo | Yes for model update |
| EX-PII | Sensitive information | PII in open text/reflection/teacher note | Isolate or redact; do not send to LLM | Revise or route to teacher | Yes until handled |
| EX-AUTH-STUDENT | Student accesses other student data | Bad path/student ID or session | Deny and audit | Return to own path/login | Yes |
| EX-AUTH-STAFF | Staff outside role/class scope | Unauthorized class/object | Deny and audit | Request permission through admin workflow | Yes |
| EX-PATH-UNAVAILABLE | Path unpublished, cancelled, expired | Student opens invalid path | Show unavailable/empty state | Return home or wait for new path | Yes |
| EX-MEDIA-RESOURCE | Media invalid or unauthorized | URI/placeholder missing | Block media task; show retry/alternative | Retry or use text alternative | Sometimes |
| EX-MEDIA-CACHE | Cache/playback failed | Network or cache failure | Keep position if possible; retry | Retry or switch network | No |
| EX-MIC-DENIED | Microphone denied/revoked | Permission rejected or withdrawn | Stop recording; do not create audio evidence | Reauthorize or use alternative | Yes for recording |
| EX-REC-LIMIT | Recording exceeds 120 seconds | Timer limit | Stop/reject over-limit clip | Re-record | Yes for clip |
| EX-REC-UPLOAD | Recording upload interrupted | Offline/network failure | Queue with resume/idempotency | Retry or wait for network | No |
| EX-OFFLINE-NOCACHE | Offline without cached resource | Student opens unavailable task | Show offline unavailable | Reconnect | Yes |
| EX-LMS-FAIL | Static LMS sync failure | Mock sync status failed | Show failed/retry/dead-letter/compensated state | Inspect or manual replay placeholder | No production side effect |
| EX-CONFLICT-CONSTRAINT | LMS/teacher constraint conflict | Two snapshots differ | Keep both snapshots; reject auto overwrite | Manual override/merge with reason | Yes until resolved |
| EX-TEACHER-WITHDRAW | Teacher withdraws path | Cancel/reject after publish | Stop future execution; show unavailable or refresh | Student returns home; teacher publishes replacement | Yes |
| EX-LLM-BOUNDARY | LLM output crosses boundary | LLM tries to rank tasks, update models, bypass gates, or create formal labels | Reject output; route to manual/retry template | Owner reviews | Yes |
| EX-COPYRIGHT | Missing or unauthorized asset | Source/copyright missing | Do not publish; use placeholder | Replace with self-made equivalent | Yes |

## Recovery Rules
- `REVIEW`: assign owner, show snapshot/reason/version, allow approve, modify-and-recheck, or reject.
- `BLOCK`: stop downstream flow; fix source and rerun Lint; never directly publish/recommend/update.
- Offline/upload: use queue, idempotency, resume token, and visible retry state.
- Version conflict: keep both snapshots; teacher/admin action requires reason and DecisionTrace.
- Teacher override: always creates new version and trace event.
