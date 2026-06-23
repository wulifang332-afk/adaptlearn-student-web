# 04 Route Map

Routes are planning contracts only. They are not implemented in Phase 0.

## Admin Routes
| Route | Screen ID | Priority | Role guard | Notes |
|---|---|---|---|---|
| `/admin/login` | `ADM-AUTH-001` | P0 | unauthenticated admin-side users | Organization selection included |
| `/admin` | `ADM-DASH-001` | P0 | authenticated staff | Default dashboard |
| `/admin/content` | `ADM-CONTENT-001` | P0 | teacher, curriculum researcher | Library and editor combined |
| `/admin/annotations` | `ADM-ANNOT-001` | P0 | curriculum researcher, expert | AI annotation review |
| `/admin/assembly` | `ADM-ASSEMBLY-001` | P0 | teacher, curriculum researcher | Unit 6 assembly |
| `/admin/diagnosis` | `ADM-DIAG-001` | P0 | teacher | Assigned classes only |
| `/admin/paths/:pathId/review` | `ADM-PATH-001` | P0 | teacher | Approve, modify, reject, replan |
| `/admin/review-cases` | `ADM-QUALITY-001` | P0-min | teacher, researcher, expert, admin | REVIEW/BLOCK queue only |
| `/admin/rules` | `ADM-RULES-001` | P1 | teacher, researcher, admin | Config surface, not student-visible |
| `/admin/research` | `ADM-RESEARCH-001` | P1 | expert, researcher | Research governance |
| `/admin/monitoring` | `ADM-MONITOR-001` | P1 | admin, researcher | Static trace/sync status |

## Student Routes
| Route | Screen ID | Priority | Role guard | Notes |
|---|---|---|---|---|
| `/student` | `STU-HOME-001` | P0 | student self only | Own valid path only |
| `/student/path/:pathId` | `STU-PATH-001` | P0 | student self only | No internal rule weights |
| `/student/tasks/:taskId` | `STU-TASK-001` | P0 | student self only | Version and permission checks |
| `/student/tasks/:taskId/feedback` | `STU-FEEDBACK-001` | P0 | student self only | Review-pending supported |
| `/student/growth` | `STU-GROWTH-001` | P1 | student self only | No exact ranking |

## Route Guards
- `BLOCK` prevents routes from showing publish/recommend/update actions.
- Stale task/path versions route students to unavailable/refresh state.
- Students cannot access other students' path IDs.
- Staff role scope is enforced by organization, role, and class assignment.
