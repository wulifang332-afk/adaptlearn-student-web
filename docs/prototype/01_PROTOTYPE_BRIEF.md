# 01 Prototype Brief

## Goal
Build a Phase 0 interaction prototype contract that later Workers can implement in parallel without redefining product scope, data objects, page ownership, or acceptance rules.

## Demo Audience
- English teachers reviewing diagnosis, path recommendations, and ReviewCase handling.
- Curriculum/research staff reviewing Unit 6 content governance and task tagging.
- Project stakeholders reviewing the end-to-end teacher-student learning loop.

## P0 Demo Scope
- Admin web center: login/org selection, dashboard, content library/editor, AI annotation review, course/task assembly, student/class diagnosis, learning path review, ReviewCase queue.
- Student side: responsive web iOS simulation for learning home, path detail, task execution, feedback/reflection.
- Mock backend behavior: static fixtures, deterministic state playback, visible Lint/Verifier/ReviewCase/DecisionTrace artifacts.
- Unit scope: Grade 7 Volume 1 Unit 6 only.

## Non-Goals
- No production business pages in Phase 0.
- No database, real LMS integration, real LLM, BKT/IRT implementation, or recommendation algorithm.
- No parent portal, payment, multi-subject scope, reinforcement learning, free-form Q&A chatbot, real student data, or unauthorized textbook assets.

## Teacher And Student Relationship
The admin center is the governance surface. Teachers approve, modify, reject, or replan paths before they reach students unless an explicitly enabled low-risk delivery rule applies. The student side receives only valid published paths and age-appropriate explanations derived from structured trace data.

## Fidelity
- Medium-high interaction fidelity for navigation, state, queue, and task execution flows.
- Mock data fidelity must be high enough to preserve object boundaries and state rules.
- Visual fidelity is sufficient for stakeholder review, but not a production design system.

## Technology Recommendation
| Area | Recommended | Alternative | Reason |
|---|---|---|---|
| Admin web | React/Next.js in later Worker phase | Vite React if no SSR/routing need | Admin requires dense tables, routing, fixtures, and screenshot automation; defer initialization |
| Student side | Responsive web iOS simulation | SwiftUI native prototype | Default approved for Phase 0 speed and parallel web QA; keep iOS behavior constraints visible |
| Shared mock | Static JSON plus TypeScript fixtures | Mock API server | Static fixtures are sufficient for Phase 0; Mock API can be added by Shared Foundation Worker |
| Automation | Screenshot checks, basic interactions, state replay | Full E2E suite | Prototype needs repeatable evidence without building production backend |

Product-confirmation items are recorded in `OPEN_DECISIONS.md`.

## Success Standard
- A Worker can implement the prototype from the docs without reopening product scope.
- P0 pages, flows, states, exceptions, roles, and mock data contracts are explicit.
- Unit 6 data maps to task execution and learning-path review.
- REVIEW/BLOCK, teacher override, offline recovery, media permission, and LMS static failure states are visible.
