# 06 State Matrix

## State Families
| Family | States |
|---|---|
| LintResult | `INFO`, `AUTO_FIX`, `WARN`, `REVIEW`, `BLOCK` |
| VerifierResult | `PASS`, `ADJUST`, `REPLAN`, `REVIEW`, `BLOCK` |
| UI | `LOADING`, `EMPTY`, `ERROR_RETRYABLE`, `ERROR_BLOCKING`, `OFFLINE_READY`, `OFFLINE_UNAVAILABLE`, `PERMISSION_REQUIRED`, `PERMISSION_REVOKED`, `SUBMITTING`, `QUEUED_SYNC`, `REVIEW_PENDING`, `VERSION_STALE`, `MEDIA_BUFFERING`, `RECORDING`, `COMPLETED` |

## Object Matrix
| Object | Business states | UI states | System states | Guards | Allowed operations | Forbidden operations | Recovery |
|---|---|---|---|---|---|---|---|
| `ContentVersion` | `DRAFT`, `PRE_LINT`, `AUTO_ANNOTATING`, `QC_ROUTING`, `APPROVED`, `PUBLISHED_LOCKED`, `WITHDRAWN`, `ARCHIVED`, `BLOCKED` | Loading, blocked, empty, version locked | Lint running, auto-fix diff, source check | Source/copyright required; BLOCK stops publish | Edit draft, archive, submit review, publish approved version, create new version | Edit published locked version in place; publish BLOCK | Fix metadata, rerun Lint, create new version, withdraw |
| `TaskAnnotation` | `AUTO_ANNOTATING`, `QC_ROUTING`, `REVIEW_REQUIRED`, `APPROVED`, `BLOCKED` | Loading, review pending, blocked | Confidence routing, taxonomy version bound | LLM only uses controlled label space | Accept, modify, delete, return for relabel, request new label review | Store student mastery; create formal label directly by LLM | Expert review, rerun QC, ReviewCase |
| `LearningPath` | `INITIATED`, `STATE_PREPARING`, `DIAGNOSING`, `CANDIDATE_RETRIEVAL`, `HARD_FILTERING`, `RULE_SCORING`, `ASSEMBLING`, `PATH_LINT`, `VERIFYING`, `REPLANNING`, `TEACHER_REVIEW`, `PUBLISHED`, `IN_PROGRESS`, `COMPLETED`, `STATE_UPDATING`, `ARCHIVED`, `REJECTED_CANCELLED`, `BLOCKED` | Loading, review pending, version stale, unavailable | Rule version, Verifier version, Trace snapshot | Teacher approval or explicit low-risk auto-delivery; no BLOCK | Approve, modify with reason, reject, replan, publish | Publish without required review; silent overwrite; LLM ranking | Limited replan, teacher override with reason, new version |
| `ReviewCase` | `OPEN`, `ASSIGNED`, `IN_REVIEW`, `NEEDS_FIX`, `APPROVED`, `CONDITIONALLY_APPROVED`, `REJECTED`, `BLOCKED_FINAL`, `RESOLVED`, `REOPENED` | Queue loading, empty queue, review form, blocking error | Owner, deadline, object snapshot, version | REVIEW/BLOCK must create case; owner/conclusion required | Assign, approve, request fix, reject, block, reopen | Continue source flow while unresolved; resolve without version/conclusion | Fix source object, rerun Lint, return to source flow |
| `StudentSubmission` | `DRAFT`, `SUBMITTING`, `QUEUED_OFFLINE`, `RECEIVED`, `LINT_PASS`, `ISOLATED`, `REVIEW_PENDING`, `APPLIED`, `COMPLETED` | Draft saved, submitting, queued sync, review pending, completed, error retry | Idempotency key, task/path version, evidence record | Valid student, task version, Data Lint pass before state update | Save draft, submit, retry, reflect, view status | Update BKT/IRT/Bloom/thinking before Data Lint pass | Idempotent retry, evidence isolation, teacher review |
| `MediaUpload` | `NOT_REQUIRED`, `PERMISSION_REQUIRED`, `RECORDING`, `RECORDED`, `UPLOADING`, `QUEUED_OFFLINE`, `UPLOADED`, `FAILED`, `REVIEW_PENDING` | Permission prompt, recording, buffering, upload failed, queued | 120 sec cap, resume token, local queue | Microphone permission; valid task version | Record, stop, re-record, upload, resume | Use revoked permission; auto high-risk speaking grade | Reauthorize, re-record, resume upload, text alternative |
| `LMS Sync` | `UNSYNCED`, `SYNCING`, `FAILED`, `RETRY_WAITING`, `DEAD_LETTER`, `COMPENSATED`, `SYNCED` | Dashboard status, failure banner, retry status | Static retry plan, mock dead-letter list | Phase 0 is static display only | Inspect status, show retry/compensation fixture | Connect real LMS or mutate external data | Manual replay placeholder, compensation marker |

## Learner State Boundaries
| Profile | Stored values | Display rule | Not allowed |
|---|---|---|---|
| `BKTKnowledgeState` | `P(L)`, evidence count, confidence, stability, parameter version | Evidence sufficiency plus understandable mastery label | Merge with Bloom or thinking; claim stable calibration without sample sufficiency |
| `IRTAbilityState` | theta, standard error, item difficulty `b`, calibration version | Difficulty fit and uncertainty | Treat as exact rank or public student label |
| `BloomEvidenceProfile` | `NOT_ASSESSED`, `INSUFFICIENT`, `EMERGING`, `CONFIRMED` per Bloom layer | Evidence depth by node | Replace BKT with "high-order mastery" |
| `ThinkingQualityProfile` | Three dimensions, T0-T4, evidence coverage, rubric version | Observed evidence and confidence | Collapse into one score or medical/psychological judgment |
