# 10 Design System Requirements

## Product Tone
- Admin web center: dense, calm, operational, built for scanning, comparison, audit, and repeated action.
- Student responsive iOS simulation: focused, age-appropriate, accessible, reassuring, and task-first.

## Shared Requirements
- Keep BKT, IRT, Bloom, and thinking quality visually separate.
- Surface evidence sufficiency and uncertainty without overclaiming precision.
- REVIEW and BLOCK must be visually distinct and never hidden behind generic warnings.
- DecisionTrace and teacher override reasons must be visible on teacher/audit surfaces only.
- Public assets must be self-made equivalent placeholders.

## Admin UI Requirements
- Tables for review queues, content lists, and path steps.
- Side panels/drawers for evidence, rule hits, exclusions, and version details.
- Status chips for Lint, Verifier, ReviewCase, sync, and publication state.
- Required reason modal or inline field before teacher override.
- No student-facing language inside teacher audit details.

## Student UI Requirements
- Responsive iPhone/iPad simulation, not native SwiftUI in Phase 0.
- Large enough controls, dynamic text tolerance, clear focus order, and accessible button labels.
- Media states: buffering, playback, captions/text, speed, cached, unavailable.
- Recording states: permission, recording, re-record, upload, queued, failed.
- Offline queue must be visible and understandable.
- Do not show internal rule weights, teacher audit trail, or exact rankings.

## State Components
| Component | Required states |
|---|---|
| ReviewCase badge | REVIEW, BLOCK, assigned, resolved |
| Path status | draft/generated, teacher review, published, in progress, completed, rejected, cancelled |
| Evidence sufficiency | insufficient, emerging, confirmed, low confidence |
| Sync status | unsynced, syncing, failed, retry waiting, dead-letter, compensated, synced |
| Media control | loading, ready, failed, cached, permission required, recording, uploading |

## Screenshot Expectations
Later QA must capture desktop admin and mobile/iPad student surfaces for P0 happy path and required exception states.
