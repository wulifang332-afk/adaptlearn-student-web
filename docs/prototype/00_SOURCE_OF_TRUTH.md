# 00 Source Of Truth

## Purpose
This file defines the immutable baseline for Phase 0 prototype planning. When sources conflict, the priority rules here are binding.

## Baseline Copies
Copied into this repository on `2026-06-23 12:05:39 +08`.

| Priority | Baseline | Repository copy | Version | Size bytes | SHA-256 | Immutable status |
|---:|---|---|---|---:|---|---|
| 1 | PRD v1.1 Unit 6 decision baseline | `docs/source/AdaptLearn_Copilot_PRD_MVP.docx` | `v1.1 (Unit 6 决策基线)`, dated `2026-06-22` | 743419 | `5ea17629e570691f5c542f3132ccebd603d6fcfd88e84d33835d4e64e4b1a824` | Read-only baseline; do not edit, move, or overwrite |
| 2 | UML merged update | `docs/source/AdaptLearn_Copilot_UML建模说明书_融合版_v4.0.docx` | `v4.0`, dated `2026-06-22` | 4548016 | `f67272b390eb95322db1ee911f65d155da725777dcff9ac1c5e089d52ba97ce1` | Read-only baseline; do not edit, move, or overwrite |
| 3 | Unit 6 knowledge graph JSON | `docs/data/AdaptLearn_Unit6_KnowledgeGraph.json` | Unit 6 dataset copied from project materials | 361778 | `4809755e2d17c96360572ff30cf8acfcc76f3818dbfc9b7665b3fc77516a540f` | Read-only baseline; do not edit, move, or overwrite |
| 3 | Unit 6 workbook | `docs/data/AdaptLearn_Unit6_知识图谱与题目活动库.xlsx` | Unit 6 dataset copied from project materials | 96793 | `f80928474c676475f05fc3384cdaacf56bc341f4eff8f873eb8d38ede27fa2af` | Read-only baseline; do not edit, move, or overwrite |
| 4 | Project proposal merged edition | `docs/source/AdaptLearn_Copilot_项目方案.docx` | Project proposal background | 2979027 | `a34a1552c30507336305e69e558ff1ae51d2febddda90304f2e892ef7d8dbb6d` | Read-only baseline; background only |

## Data Counts
Counts were recomputed from the copied files after copy.

| Source | Nodes | Edges | Tasks | Sample path rows | Notes |
|---|---:|---:|---:|---:|---|
| JSON | 128 | 669 | 91 | 36 | Also contains 6 distinct `Path_ID` values |
| Excel | 128 | 669 | 91 | 36 | Also contains 103 node-task coverage rows |

The counts match the approved plan. No discrepancy was added to `OPEN_DECISIONS.md`.

## Conflict Rules
- Product scope, priorities, P0/P1 status, and acceptance requirements follow PRD v1.1.
- Flow order, state names, role relationships, and domain objects use UML v4.0 when PRD does not specify enough detail.
- Unit 6 IDs, task IDs, node IDs, and sample path rows use the JSON/Excel data.
- The project proposal is background only. It must not restore deleted, downgraded, or wider scope.
- Deprecated drafts, Word lock files, screenshots, and informal notes are not requirement sources.
- Ambiguity that cannot be resolved from the baseline goes to `OPEN_DECISIONS.md`.

## Non-Negotiable Product Rules
- Teachers retain final approval, modification, rejection, and replanning authority for learning paths.
- LLM does not decide task ordering.
- BKT, IRT, rule recommendation, Lint, and Verifier remain distinct responsibilities.
- BKT knowledge state, Bloom evidence profile, and thinking quality profile are not merged into one score.
- `BLOCK` cannot enter publication, recommendation, or state update.
- `REVIEW` must create a `ReviewCase`.
- Teacher overrides require a reason and must enter `DecisionTrace`.
- Students can access only their own data.
- Student views must not expose internal rule weights, teacher audit records, or unreliable precise rankings.
- Public prototype assets use self-made equivalent placeholders, not textbook screenshots or unauthorized source media.
