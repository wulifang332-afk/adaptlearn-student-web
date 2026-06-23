# 03 Screen Inventory

Canonical screen count: 16. `ADM-CONTENT-001` combines Content Library and Content Editor. Do not create a second content-editor screen.

## Admin Web Screens

### ADM-AUTH-001
| Field | Value |
|---|---|
| Page name | Login / Organization Selection |
| Product domain | Admin web center |
| Roles | English teacher, curriculum researcher, expert, system administrator |
| Priority | P0 |
| Goal | Establish role, organization, and class scope before admin access |
| Entry | Admin URL |
| Exit | `ADM-DASH-001` |
| Core components | Login form, organization selector, role badge, class-scope confirmation |
| Core operations | Sign in, choose organization, choose role context |
| Data objects | `User`, `Organization`, `Class` |
| Required states | Loading, permission denied, empty organization, error retry |
| Acceptance | User lands in Dashboard with only authorized role/class scope |

### ADM-DASH-001
| Field | Value |
|---|---|
| Page name | Dashboard |
| Product domain | Admin web center |
| Roles | Teacher, curriculum researcher, admin |
| Priority | P0 |
| Goal | Summarize class status, pending reviews, quality alerts, and static LMS sync |
| Entry | `ADM-AUTH-001` |
| Exit | Content, diagnosis, path review, ReviewCase, monitoring |
| Core components | Class overview, pending queue cards, system status, static LMS sync strip |
| Core operations | Navigate to review, inspect sync failure, open diagnosis |
| Data objects | `Class`, `LearnerProfile`, `ReviewCase`, `LmsSyncStatus` |
| Required states | Loading, empty class, sync failed, permission denied |
| Acceptance | Shows P0 work queues without exposing student-private details outside scope |

### ADM-CONTENT-001
| Field | Value |
|---|---|
| Page name | Content Library & Editor |
| Product domain | Admin web center |
| Roles | Curriculum researcher, teacher |
| Priority | P0 |
| Goal | Browse, create/edit mock Unit 6 content, inspect source/copyright/version |
| Entry | Dashboard, assembly |
| Exit | AI annotation review, task assembly, ReviewCase |
| Core components | Content list, version panel, editor panel, source/copyright metadata |
| Core operations | Create, edit, copy, archive, inspect version, submit to annotation |
| Data objects | `ContentVersion`, `Task`, `KnowledgeNode`, `TaskAnnotation` |
| Required states | Draft, pre-lint, approved, published locked, withdrawn, blocked |
| Acceptance | Missing source/copyright cannot proceed to publish; published versions are locked |

### ADM-ANNOT-001
| Field | Value |
|---|---|
| Page name | AI Annotation Review |
| Product domain | Admin web center |
| Roles | Curriculum researcher, expert |
| Priority | P0 |
| Goal | Review candidate tags, evidence positions, confidence, Lint/QC routing |
| Entry | `ADM-CONTENT-001`, `ADM-QUALITY-001` |
| Exit | Content approval, ReviewCase |
| Core components | Candidate tag table, evidence locator, confidence bands, QC result |
| Core operations | Accept, modify, delete, return for relabeling, block, request new label review |
| Data objects | `TaskAnnotation`, `KnowledgeNode`, `LintResult`, `ReviewCase` |
| Required states | Auto-annotating, QC routing, review required, approved, blocked |
| Acceptance | LLM cannot create formal labels directly; REVIEW/BLOCK creates ReviewCase |

### ADM-ASSEMBLY-001
| Field | Value |
|---|---|
| Page name | Course & Task Assembly |
| Product domain | Admin web center |
| Roles | Curriculum researcher, teacher |
| Priority | P0 |
| Goal | Assemble Unit 6 tasks into course packages and candidate task sets |
| Entry | Dashboard, content |
| Exit | Path review, content publish |
| Core components | Unit blueprint, task sequence builder, target/time/type settings, Assembly Lint |
| Core operations | Select tasks, set goals, publish package, fix lint issue |
| Data objects | `Task`, `TaskAnnotation`, `KnowledgeNode`, `ContentVersion` |
| Required states | Empty task set, lint review, lint block, published locked |
| Acceptance | Assembly Lint failure blocks publish; only approved tasks enter candidates |

### ADM-DIAG-001
| Field | Value |
|---|---|
| Page name | Student / Class Diagnosis |
| Product domain | Admin web center |
| Roles | Teacher |
| Priority | P0 |
| Goal | Show knowledge gaps, BKT, IRT, Bloom, thinking quality, behavior/strategy evidence |
| Entry | Dashboard, path review |
| Exit | Learning path review |
| Core components | Class filter, student selector, BKT panel, IRT panel, Bloom evidence, thinking profile |
| Core operations | Filter by student/class/node, inspect evidence, start path generation |
| Data objects | `LearnerProfile`, `BKTKnowledgeState`, `IRTAbilityState`, `BloomEvidenceProfile`, `ThinkingQualityProfile` |
| Required states | Loading, insufficient evidence, low confidence, empty evidence, permission denied |
| Acceptance | Does not output unsupported conclusions or collapse dimensions into one score |

### ADM-PATH-001
| Field | Value |
|---|---|
| Page name | Learning Path Review |
| Product domain | Admin web center |
| Roles | Teacher |
| Priority | P0 |
| Goal | Let teacher audit, approve, modify, reject, or replan a path |
| Entry | Dashboard, diagnosis, ReviewCase |
| Exit | Student publish, ReviewCase, replan, reject |
| Core components | Path goal, PathStep sequence, evidence drawer, rule hits/exclusions, Path Lint, Verifier, DecisionTrace |
| Core operations | Approve, replace task, reorder, shorten, set constraint, reject, replan |
| Data objects | `LearningPath`, `PathStep`, `RuleEvaluation`, `VerifierResult`, `TeacherAuditExplanation`, `DecisionTrace` |
| Required states | Candidate, lint review, verifier replan, teacher review, published, rejected, cancelled |
| Acceptance | Any manual change requires reason and creates a new path version |

### ADM-QUALITY-001
| Field | Value |
|---|---|
| Page name | ReviewCase / Quality Queue |
| Product domain | Admin web center |
| Roles | Teacher, curriculum researcher, expert, admin |
| Priority | P0-min |
| Goal | Handle REVIEW/BLOCK queue and close quality cases |
| Entry | Dashboard, Lint/Verifier output |
| Exit | Return to source object, approve, reject, block, resolve |
| Core components | Queue, object snapshot, risk reason, owner, deadline, decision panel |
| Core operations | Assign, review, approve, request fix, reject, mark final block, reopen |
| Data objects | `ReviewCase`, `LintResult`, `VerifierResult`, `DecisionTrace` |
| Required states | Open, assigned, in review, needs fix, approved, rejected, blocked final, resolved |
| Acceptance | REVIEW/BLOCK is visible and cannot continue silently; full analytics remains P1 |

### ADM-RULES-001
| Field | Value |
|---|---|
| Page name | Rules & Teacher Constraints |
| Product domain | Admin web center |
| Roles | Teacher, admin, curriculum researcher |
| Priority | P1 |
| Goal | Inspect rules, teacher constraints, profiles, thresholds, and rollback status |
| Entry | Path review, settings |
| Exit | Path replan |
| Core components | Constraint list, rule version card, lint profile, low-risk auto-delivery toggle |
| Core operations | View, configure mock constraint, trigger static regression status |
| Data objects | `RecommendationRule`, `RuleEvaluation`, `TeacherConstraint` |
| Required states | Draft rule, test failed, published, rolled back |
| Acceptance | P1 page does not upgrade hidden rule weights into student-visible content |

### ADM-RESEARCH-001
| Field | Value |
|---|---|
| Page name | Research Evidence |
| Product domain | Admin web center |
| Roles | Expert, curriculum researcher |
| Priority | P1 |
| Goal | Show Research Claim, source, matrix, Citation Lint, and expert decision lifecycle |
| Entry | Dashboard, settings |
| Exit | Evidence Registry |
| Core components | Claim list, source panel, claim-evidence matrix, expert decision |
| Core operations | Review claim, approve/condition/reject mock evidence |
| Data objects | `ResearchClaim`, `EvidenceSource`, `ResearchReviewCase` |
| Required states | Draft, citation lint, expert review, registry, rejected |
| Acceptance | Research Agent cannot directly approve registry entries |

### ADM-MONITOR-001
| Field | Value |
|---|---|
| Page name | Monitoring |
| Product domain | Admin web center |
| Roles | Admin, curriculum researcher |
| Priority | P1 |
| Goal | Show static workflow status, trace IDs, latency, cost, resources, sync failures |
| Entry | Dashboard |
| Exit | ReviewCase, rules |
| Core components | Trace list, status cards, sync failure table, cost placeholder |
| Core operations | Inspect static trace, open failed case, view retry/compensation |
| Data objects | `TraceEvent`, `LmsSyncStatus`, `ReviewCase` |
| Required states | Healthy, degraded, failed, dead-letter, compensated |
| Acceptance | Does not connect real LMS or monitoring services |

## Student Screens

### STU-HOME-001
| Field | Value |
|---|---|
| Page name | Learning Home |
| Product domain | Student responsive web iOS simulation |
| Roles | Student |
| Priority | P0 |
| Goal | Show current Unit 6 goal, task count, duration, progress, media/cache state |
| Entry | Student login |
| Exit | Path detail, task execution, growth record P1 |
| Core components | Current path card, progress, offline/cache badge, reminders |
| Core operations | Continue learning, view path detail, inspect sync queue |
| Data objects | `LearningPath`, `PathStep`, `StudentSubmission`, `MediaUpload` |
| Required states | Loading, no valid path, path unpublished/cancelled, offline ready, queued sync |
| Acceptance | Student sees only own valid published path |

### STU-PATH-001
| Field | Value |
|---|---|
| Page name | Path Detail |
| Product domain | Student responsive web iOS simulation |
| Roles | Student |
| Priority | P0 |
| Goal | Explain task order, difficulty, time, completion standards, and age-appropriate reasons |
| Entry | Learning home |
| Exit | Task execution, feedback |
| Core components | Task timeline, reason chips, completion standard, explanation request |
| Core operations | Start task, resume task, request explanation |
| Data objects | `LearningPath`, `PathStep`, `TeacherAuditExplanation` student view |
| Required states | Loading, version stale, offline unavailable, output lint blocked |
| Acceptance | Does not show internal rule weights, teacher audit info, or unreliable exact rank |

### STU-TASK-001
| Field | Value |
|---|---|
| Page name | Task Execution |
| Product domain | Student responsive web iOS simulation |
| Roles | Student |
| Priority | P0 |
| Goal | Execute Unit 6 task types with progress, hints, draft, redo, media, and submission |
| Entry | Path detail |
| Exit | Feedback/reflection |
| Core components | Prompt, response control, media player, recorder, hints, draft, submit |
| Core operations | Answer, use hint, save draft, redo, record, upload, submit |
| Data objects | `Task`, `TaskAnnotation`, `StudentSubmission`, `MediaUpload` |
| Required states | Loading, media buffering, permission required, recording, submitting, offline queued, version stale |
| Acceptance | Task version must be valid; high-risk writing/speaking can enter teacher review |

### STU-FEEDBACK-001
| Field | Value |
|---|---|
| Page name | Feedback & Reflection |
| Product domain | Student responsive web iOS simulation |
| Roles | Student |
| Priority | P0 |
| Goal | Show allowed feedback, reflection prompts, self-rating, and review-pending status |
| Entry | Task submission |
| Exit | Next task, home |
| Core components | Correctness/allowed explanation, reflection form, difficulty rating, review pending banner |
| Core operations | Reflect, rate difficulty, continue next task |
| Data objects | `StudentSubmission`, `DecisionTrace`, `LearnerProfile` safe view |
| Required states | Review pending, output lint blocked, completed, queued sync |
| Acceptance | Feedback is age-appropriate, actionable, and free of sensitive internal fields |

### STU-GROWTH-001
| Field | Value |
|---|---|
| Page name | Growth Record |
| Product domain | Student responsive web iOS simulation |
| Roles | Student |
| Priority | P1 |
| Goal | Show node changes, path completion, and stage progress without precise rank |
| Entry | Learning home |
| Exit | Path detail |
| Core components | Progress summary, evidence sufficiency label, update timestamp |
| Core operations | View progress, open completed path |
| Data objects | `LearnerProfile`, `BKTKnowledgeState`, `BloomEvidenceProfile`, `ThinkingQualityProfile` safe view |
| Required states | Insufficient evidence, updated, empty |
| Acceptance | Does not label student by one score or show unreliable ranking |
