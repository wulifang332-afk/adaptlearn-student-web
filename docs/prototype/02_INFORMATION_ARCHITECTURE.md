# 02 Information Architecture

## Product Domains
| Domain | Purpose | Phase 0 surface |
|---|---|---|
| Admin web center | Content governance, annotation review, task assembly, diagnosis, path review, ReviewCase handling | Desktop web prototype |
| Student learning side | Receive paths, complete Unit 6 tasks, view feedback, reflect, sync evidence | Responsive web iOS simulation |
| Mock learning backend | Provide fixtures, deterministic state playback, trace and quality artifacts | Static JSON/TypeScript fixture contract only |

## Roles
- Student: accesses only own valid paths, tasks, feedback, offline queue, and non-sensitive progress.
- English teacher: views assigned classes/students, reviews diagnosis and paths, approves/modifies/rejects/replans, handles Path/Output ReviewCases.
- Curriculum researcher: manages content, taxonomy, task annotations, assembly, and content ReviewCases.
- Expert/research reviewer: approves high-risk content/evidence where required.
- System administrator: manages identity, permissions, workflow versions, and static monitoring status; cannot silently override teacher or expert decisions.
- LMS: external synchronization actor represented by static status only in Phase 0.

## Admin Sitemap
```text
ADM-AUTH-001 Login / Organization Selection
└─ ADM-DASH-001 Dashboard
   ├─ ADM-CONTENT-001 Content Library & Editor
   │  └─ ADM-ANNOT-001 AI Annotation Review
   │     └─ ADM-QUALITY-001 ReviewCase Queue
   ├─ ADM-ASSEMBLY-001 Course & Task Assembly
   ├─ ADM-DIAG-001 Student / Class Diagnosis
   │  └─ ADM-PATH-001 Learning Path Review
   │     ├─ ADM-QUALITY-001 ReviewCase Queue
   │     └─ ADM-RULES-001 Rules & Teacher Constraints (P1)
   ├─ ADM-QUALITY-001 ReviewCase Queue
   ├─ ADM-RESEARCH-001 Research Evidence (P1)
   └─ ADM-MONITOR-001 Monitoring (P1)
```

## Student Sitemap
```text
STU-HOME-001 Learning Home
├─ STU-PATH-001 Path Detail
│  └─ STU-TASK-001 Task Execution
│     └─ STU-FEEDBACK-001 Feedback & Reflection
│        ├─ next task
│        └─ STU-HOME-001
└─ STU-GROWTH-001 Growth Record (P1)
```

## Unit 6 Structure
The prototype uses Unit 6 "The Power of Plants" with 8 instructional modules: Starting out, Understanding ideas, Language focus, Developing ideas, Reading for writing, Presenting ideas, Reflection, and Phonetics & Language notes.

P0 task types include picture observation, video/audio understanding, reading, vocabulary, grammar, listening, short writing, controlled speaking, and reflection. Poster upload, speech presentation, peer voting, and classroom collaboration remain P1.
