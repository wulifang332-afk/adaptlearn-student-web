# 08 Role Permission Matrix

| Object / Action | Student | English teacher | Curriculum researcher | Expert | System admin | LMS |
|---|---|---|---|---|---|---|
| Own learning path | Read valid published only | Read assigned class | No default student read unless governance requires | No default | Scoped support view only | No UI access |
| Other student data | No | Assigned class only | Aggregated or governed access only | Governed review only | Permissioned support only | No |
| ContentVersion | No | Read/use approved content | Create/edit/archive/review | Approve high-risk/expert cases | Manage workflow/version metadata | No |
| TaskAnnotation | No | Read teacher-facing explanation | Create/review/modify | Approve expert cases | Configure workflow only | No |
| Diagnosis | Own safe feedback only | Full assigned class diagnosis | Aggregated QA only | Governed evidence review only | Operational metadata only | Provides mock evidence status |
| LearningPath approval | No | Approve/modify/reject/replan | No final teacher decision | No final teacher decision | Cannot silently override | No |
| Teacher override | No | Yes, with reason and DecisionTrace | No | No | No silent override | No |
| ReviewCase | Own output status only | Path/output cases for assigned class | Content/annotation cases | Expert/research/high-risk cases | Assign/monitor, no silent expert override | No |
| Rule settings | No | Teacher constraints | Rule draft/review | Advisory only | Version/release controls | No |
| LMS sync | No | View class publication/result status | View static quality status | No | View static retry/dead-letter/compensation | Static external actor |
| Research Evidence | No | Read approved summaries only | Manage claims/matrix | Approve/reject | Monitor workflow | No |

## Guardrails
- Students never see teacher audit records, internal rule weights, ReviewCase details, or unreliable exact ranking.
- Administrators cannot silently override teacher decisions or expert evidence conclusions.
- Low-risk auto-delivery requires teacher explicit enablement and ongoing sampling.
- Every human override must include reason, actor, timestamp, before/after, and version in `DecisionTrace`.
