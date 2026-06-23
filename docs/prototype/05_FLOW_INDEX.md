# 05 Flow Index

## FLOW-CONTENT-01: Content Import, Annotation, Review, Publish
| Field | Contract |
|---|---|
| Trigger | Curriculum researcher imports or edits Unit 6 content |
| Roles | Curriculum researcher, expert |
| Preconditions | Source/copyright/version metadata exists; content belongs to Unit 6 |
| Main path | Create/edit `ContentVersion` -> pre-Lint -> controlled LLM candidate annotation -> evidence location and QC -> confidence routing -> approve -> assemble tasks -> Assembly Lint -> publish locked |
| Branch paths | High confidence can auto-accept into sampling; medium/low confidence enters ReviewCase; new label request enters expert review |
| Exception paths | Missing source/copyright BLOCK; Lint REVIEW creates ReviewCase; published version cannot be edited in place |
| End state | Approved/published locked content or resolved ReviewCase |
| Screens | `ADM-CONTENT-001`, `ADM-ANNOT-001`, `ADM-ASSEMBLY-001`, `ADM-QUALITY-001` |
| Data objects | `ContentVersion`, `TaskAnnotation`, `KnowledgeNode`, `LintResult`, `ReviewCase` |

## FLOW-DIAGNOSIS-01: Student Diagnosis View
| Field | Contract |
|---|---|
| Trigger | Teacher opens class/student diagnosis or new evidence arrives |
| Roles | Teacher |
| Preconditions | Student belongs to teacher's class; evidence has passed access checks |
| Main path | Read evidence -> Data Lint -> read/update BKT/IRT -> aggregate Bloom/thinking evidence -> show confidence and sufficiency labels |
| Branch paths | Insufficient evidence shows low-confidence state; teacher can start path generation or inspect evidence |
| Exception paths | Evidence/Data Lint failure isolates evidence and does not update learner state |
| End state | Diagnosis ready for path generation or evidence-insufficient state |
| Screens | `ADM-DIAG-001` |
| Data objects | `LearnerProfile`, `BKTKnowledgeState`, `IRTAbilityState`, `BloomEvidenceProfile`, `ThinkingQualityProfile` |

## FLOW-PATH-01: Path Generation, Review, Publish
| Field | Contract |
|---|---|
| Trigger | Teacher requests path or system prepares next path after valid evidence |
| Roles | Teacher, mock learning backend |
| Preconditions | Valid learner state, approved Unit 6 tasks, teacher constraints, rule version |
| Main path | Candidate recall -> hard filtering -> rule scoring -> path assembly -> Path Lint -> Verifier -> teacher review |
| Branch paths | Low-risk automatic delivery is only possible when teacher explicitly enabled it; otherwise teacher review is required |
| Exception paths | No candidates, Path Lint fail, Verifier BLOCK/REPLAN, or version conflict routes to replan or ReviewCase |
| End state | `LearningPath` in teacher review, published, rejected, or blocked |
| Screens | `ADM-DIAG-001`, `ADM-PATH-001`, `ADM-QUALITY-001` |
| Data objects | `LearningPath`, `PathStep`, `RuleEvaluation`, `VerifierResult`, `DecisionTrace` |

## FLOW-PATH-02: Teacher Modify, Override, Reject, Replan
| Field | Contract |
|---|---|
| Trigger | Teacher reviews a proposed path |
| Roles | Teacher |
| Preconditions | Path is in teacher-review state and teacher owns class scope |
| Main path | Inspect evidence/rules/exclusions/Lint/Verifier -> approve or modify -> provide required reason -> generate new version -> write DecisionTrace -> publish or replan |
| Branch paths | Replace task, reorder steps, shorten duration, add constraint, reject path, request replan |
| Exception paths | Missing reason blocks override; stale version requires refresh; BLOCK cannot be bypassed |
| End state | Published path, rejected/cancelled path, or new replan version |
| Screens | `ADM-PATH-001`, `ADM-RULES-001`, `ADM-QUALITY-001` |
| Data objects | `LearningPath`, `PathStep`, `TeacherAuditExplanation`, `DecisionTrace` |

## FLOW-STUDENT-01: Student Receive, Execute, Submit
| Field | Contract |
|---|---|
| Trigger | Student opens published Unit 6 path |
| Roles | Student |
| Preconditions | Path is published, not expired/cancelled, belongs to student |
| Main path | Home -> path detail -> task execution -> hints/draft/redo/media as allowed -> submit -> feedback/reflection |
| Branch paths | Objective tasks can show immediate allowed feedback; writing/speaking may show review pending |
| Exception paths | Offline queues submission; stale version blocks execution; permission denied blocks recording |
| End state | Submission stored or queued; task moves to feedback/reflection |
| Screens | `STU-HOME-001`, `STU-PATH-001`, `STU-TASK-001`, `STU-FEEDBACK-001` |
| Data objects | `LearningPath`, `PathStep`, `Task`, `StudentSubmission`, `MediaUpload` |

## FLOW-FEEDBACK-01: Feedback, Reflection, State Update
| Field | Contract |
|---|---|
| Trigger | Student submits a task |
| Roles | Student, teacher for high-risk review |
| Preconditions | Submission has idempotency key and valid task/path version |
| Main path | Submission -> Output/Evidence/Data Lint -> allowed feedback -> reflection/self-rating -> qualified evidence updates learner state -> next path planning |
| Branch paths | High-risk output becomes ReviewCase; low-risk feedback can show immediately |
| Exception paths | PII, abnormal duration, duplicate, or version mismatch isolates evidence |
| End state | Completed task, review pending, or evidence isolated |
| Screens | `STU-FEEDBACK-001`, `ADM-QUALITY-001`, `ADM-DIAG-001` |
| Data objects | `StudentSubmission`, `LearningEvidence`, `ReviewCase`, `BKTKnowledgeState`, `IRTAbilityState` |

## FLOW-REVIEW-01: REVIEW/BLOCK Handling
| Field | Contract |
|---|---|
| Trigger | Any Lint/Verifier outputs REVIEW or BLOCK |
| Roles | Teacher, curriculum researcher, expert, admin |
| Preconditions | ReviewCase has source object, risk reason, version, owner or assignment rule |
| Main path | Queue -> assign owner -> inspect object snapshot -> approve/modify/reject/block -> record conclusion and version -> return to source flow |
| Branch paths | Needs fix, conditionally approved, reopened after version change |
| Exception paths | REVIEW without ReviewCase is a blocker; BLOCK cannot be published/recommended/updated |
| End state | Resolved case or final block |
| Screens | `ADM-QUALITY-001`, source object screen |
| Data objects | `ReviewCase`, `LintResult`, `VerifierResult`, `DecisionTrace` |

## FLOW-OFFLINE-01: Offline Answer And Recovery Submit
| Field | Contract |
|---|---|
| Trigger | Student works while offline after path/media was authorized and cached |
| Roles | Student |
| Preconditions | Published path and necessary resources are cached or available |
| Main path | Offline-ready state -> answer task -> save encrypted queue -> reconnect -> idempotent upload -> Data Lint -> feedback/state update |
| Branch paths | Queue visible from home/task; manual retry allowed |
| Exception paths | Uncached task cannot start offline; repeated upload is deduplicated |
| End state | Submission synced, queued, or failed with retry |
| Screens | `STU-HOME-001`, `STU-TASK-001`, `STU-FEEDBACK-001` |
| Data objects | `StudentSubmission`, `MediaUpload`, `LmsSyncStatus` |

## FLOW-MEDIA-01: Audio Permission, Recording, Upload, Failure Recovery
| Field | Contract |
|---|---|
| Trigger | Student opens audio/video or speaking task |
| Roles | Student, teacher for review |
| Preconditions | Task version valid; media resource is authorized or placeholder equivalent |
| Main path | Load media -> play with subtitles/text and speed -> request microphone -> record up to 120 seconds -> re-record if needed -> upload with resume -> show review-pending or completion |
| Branch paths | Text alternative when media/permission fails; teacher review for high-risk speaking |
| Exception paths | Permission rejected, permission revoked, upload interrupted, resource invalid |
| End state | Media completed, recording uploaded/queued, or task unavailable |
| Screens | `STU-TASK-001`, `STU-FEEDBACK-001`, `ADM-QUALITY-001` |
| Data objects | `MediaUpload`, `StudentSubmission`, `ReviewCase` |

## FLOW-LMS-01: Static LMS Sync Status
| Field | Contract |
|---|---|
| Trigger | Dashboard or monitoring opens sync status |
| Roles | Teacher, admin |
| Preconditions | Static fixture exists; no real LMS connection |
| Main path | Display unsynced/syncing/failed/retry/dead-letter/compensated statuses |
| Branch paths | Teacher sees publication sync state; admin sees mock retry/dead-letter list |
| Exception paths | Static failure can open ReviewCase or monitoring detail |
| End state | Sync status inspected or compensation marked in fixture |
| Screens | `ADM-DASH-001`, `ADM-MONITOR-001` |
| Data objects | `LmsSyncStatus`, `TraceEvent` |

## FLOW-RESEARCH-01: Research Evidence Governance
| Field | Contract |
|---|---|
| Trigger | Expert reviews research support for claims |
| Roles | Expert, curriculum researcher |
| Preconditions | P1 surface; not required for P0 prototype path |
| Main path | Claim extraction -> source retrieval -> matrix -> Citation Lint -> expert review -> registry |
| Branch paths | Conditional approval, experimental, rejected |
| Exception paths | Citation Lint failure blocks registry |
| End state | Registry entry or rejected case |
| Screens | `ADM-RESEARCH-001` |
| Data objects | `ResearchClaim`, `EvidenceSource`, `ResearchReviewCase` |
