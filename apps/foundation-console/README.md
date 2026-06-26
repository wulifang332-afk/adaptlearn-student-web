# AdaptLearn Foundational Console

Standalone Next.js app for the platform-foundation surface described in `docs/prototype/16_FOUNDATIONAL_CONSOLE_SPEC.md`.

Local commands:

```bash
npm run dev:foundation
npm run typecheck:foundation
npm run test:foundation
npm run test:e2e:foundation
```

Boundary notes:
- This app owns tenant, role/scope, RLS, storage, RAG registry, agent/tool registry, queue, LMS connector, audit, environment, health, and generated CRUD governance previews.
- It must not publish student paths or bypass Admin Web teacher/expert decisions.
- It must not expose service-role secrets or raw student/admin-hidden internals in the browser.
