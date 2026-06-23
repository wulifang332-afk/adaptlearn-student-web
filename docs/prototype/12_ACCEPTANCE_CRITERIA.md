# 12 Acceptance Criteria

## Phase 0 Documentation Acceptance
- `AGENTS.md` exists and is concise.
- `docs/source/` contains exactly the 3 approved source documents.
- `docs/data/` contains exactly the Unit 6 JSON and Excel baseline.
- `docs/prototype/` contains documents `00` through `12` plus `OPEN_DECISIONS.md`.
- Source/data copied file sizes and SHA-256 values match `00_SOURCE_OF_TRUTH.md`.
- Unit 6 copied JSON/Excel counts are nodes `128`, edges `669`, tasks `91`, sample path rows `36`.

## Product Coverage
- All 16 canonical screens appear in `03_SCREEN_INVENTORY.md` and `04_ROUTE_MAP.md`.
- `ADM-CONTENT-001` combines library/editor; no separate second content-editor screen exists.
- Required flows appear exactly by ID in `05_FLOW_INDEX.md`.
- `ContentVersion`, `TaskAnnotation`, `LearningPath`, `ReviewCase`, `StudentSubmission`, `MediaUpload`, and `LMS Sync` appear in `06_STATE_MATRIX.md`.
- REVIEW/BLOCK has visible queue and handling.
- Teacher approve, modify, reject, and replan paths exist.
- Student offline, microphone denial/revocation, recording/upload failure, queued submission, and retry states exist.

## Guardrail Acceptance
- No parent portal, payment, multi-subject expansion, reinforcement learning, or free-form chatbot is introduced.
- No real LMS, LLM, BKT, IRT, rule recommendation, or database is implemented.
- Mock outputs are labeled as mock and not real model effects.
- Public assets are self-made equivalent placeholders.
- Students can access only own data.
- Teacher override requires reason and DecisionTrace.
- `BLOCK` cannot publish/recommend/update; `REVIEW` must create ReviewCase.

## Static Checks
Run these after any Phase 0 documentation edit:

```bash
find docs/prototype -maxdepth 1 -type f | sort
test -f AGENTS.md
shasum -a 256 docs/source/* docs/data/*
rg -n "ADM-CONTENT-[0-9]{3}" docs/prototype/03_SCREEN_INVENTORY.md docs/prototype/04_ROUTE_MAP.md
rg -n "FLOW-CONTENT-01|FLOW-DIAGNOSIS-01|FLOW-PATH-01|FLOW-PATH-02|FLOW-STUDENT-01|FLOW-FEEDBACK-01|FLOW-REVIEW-01|FLOW-OFFLINE-01|FLOW-MEDIA-01" docs/prototype
rg -n "ContentVersion|TaskAnnotation|LearningPath|ReviewCase|StudentSubmission|MediaUpload|LMS Sync" docs/prototype/06_STATE_MATRIX.md
```

Only `ADM-CONTENT-001` should appear for content screens. Forbidden-scope terms may appear only in explicit non-goal/guardrail contexts.
