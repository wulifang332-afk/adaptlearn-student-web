# AdaptLearn Production Skeleton

AdaptLearn is a competition MVP for adaptive learning across three separated surfaces:

- Student Web: mobile-first learner flow for Home -> Path -> Task -> Feedback.
- Admin Web: teacher/operator governance for content, review cases, safe projections, and LMS sync.
- Foundational Console: platform foundation for Supabase/RLS/storage, RAG, agents/tools, queue, LMS connector, audit, environment, health, and generated CRUD governance.

This repository is a production-oriented skeleton, not a full live school deployment. It keeps all external integrations mockable so the project can run locally without real student data or secret keys.

## Demo Videos

The videos below were recorded from the three local ports and can be used as dynamic interaction prototypes in a competition deck or GitHub README.

| Surface | Local port | Demo video |
|---|---:|---|
| Student Web | 3000 | [student-web-demo.mp4](docs/assets/demo/student-web-demo.mp4) |
| Admin Web | 3001 | [admin-web-demo.mp4](docs/assets/demo/admin-web-demo.mp4) |
| Foundational Console | 3002 | [foundation-console-demo.mp4](docs/assets/demo/foundation-console-demo.mp4) |

<video src="docs/assets/demo/student-web-demo.mp4" controls muted width="720"></video>

<video src="docs/assets/demo/admin-web-demo.mp4" controls muted width="720"></video>

<video src="docs/assets/demo/foundation-console-demo.mp4" controls muted width="720"></video>

## Repository Layout

```text
apps/web                    Next.js Student Web
apps/admin-web              Next.js Admin Web
apps/foundation-console     Standalone Next.js Foundational Console
apps/api                    FastAPI backend skeleton
packages/shared             Shared TypeScript schemas and DTO types
supabase/migrations         Supabase SQL schema, RLS, indexes, safe views
supabase/seed               Mock Unit 6 seed data
docs/integrations           Integration runbooks and API contracts
deliverables/competition-html
                             Offline static HTML judge package
```

## Local Development

Install JavaScript dependencies:

```bash
npm install
```

Start the API:

```bash
npm run dev:api
```

Start the three web apps in separate terminals:

```bash
npm run dev:web
npm run dev:admin
npm run dev:foundation
```

Open:

- Student Web: http://127.0.0.1:3000/student
- Admin Web: http://127.0.0.1:3001/admin
- Foundational Console: http://127.0.0.1:3002/foundation
- FastAPI health: http://127.0.0.1:8000/health

Mock mode is enabled by default. Real Supabase, OpenAI, Redis, and LMS credentials are optional for local UI work.

## Docker Development

The Compose stack runs Redis, FastAPI, and all three Next.js apps:

```bash
docker compose up --build
```

Ports:

- 8000: FastAPI
- 3000: Student Web
- 3001: Admin Web
- 3002: Foundational Console

The `.env` file is optional for Docker. If it exists, it is loaded; if it does not, mock defaults are used.

## Environment Files

Copy the template before real integration work:

```bash
cp .env.example .env
```

Frontend files must only contain browser-safe values:

- `apps/web/.env.local`
- `apps/admin-web/.env.local`
- `apps/foundation-console/.env.local`

Backend-only values belong in `.env`, `apps/api/.env`, or a deployment secret manager:

- `SUPABASE_SECRET_KEY`
- `SUPABASE_DB_URL`
- `OPENAI_API_KEY`
- `REDIS_URL`
- `LMS_CLIENT_SECRET`
- `LMS_WEBHOOK_SECRET`

See [environment-and-secrets.md](docs/integrations/environment-and-secrets.md).

## Supabase Cloud Migration

The SQL schema includes pgvector setup, core tables, indexes, RLS policies, service-role policies, and student-safe views.

Dry-run the migration file list:

```bash
npm run ops:supabase:dry-run
```

Install the optional Python dependency, then apply migrations:

```bash
python3 -m pip install "psycopg[binary]>=3.2"
npm run ops:supabase:apply
```

Apply migrations plus mock Unit 6 seed:

```bash
npm run ops:supabase:seed
```

Run live service checks after `.env` is configured:

```bash
npm run ops:readiness
```

The scripts never print configured secret values. See [cloud-runbook.md](docs/integrations/supabase/cloud-runbook.md).

## Tests

```bash
npm run test:web
npm run test:admin
npm run test:foundation
python -m pytest apps/api/tests
```

Foundation Playwright smoke:

```bash
npm run test:e2e:foundation
```

Student Playwright smoke:

```bash
npm run test:e2e
```

## Competition Static HTML

Generate the offline judge package:

```bash
npm run export:competition-html
```

The generated entry page is:

- [deliverables/competition-html/index.html](deliverables/competition-html/index.html)

Zip package:

- [deliverables/adaptlearn-competition-html.zip](deliverables/adaptlearn-competition-html.zip)

This static package contains mock data only and no real secrets.

## Current Integration Status

Completed in this skeleton:

- Student/Admin/Foundation app separation.
- Foundation Console migrated into independent `apps/foundation-console`.
- FastAPI student, admin, review, RAG, agent, LMS, media, and foundation endpoints.
- Foundation readiness/registry API with mock fallback.
- Supabase migration/seed skeleton with RLS and student-safe views.
- OpenAI/Redis/LMS mock adapters so local flows are not blocked.
- Offline static HTML judge package.
- Demo videos for all three surfaces.

Still requires real deployment credentials and vendor setup:

- Apply Supabase migrations to the cloud database.
- Create real Supabase Auth users and map metadata/roles.
- Run OpenAI adapter live calls from FastAPI only.
- Switch queue execution from mock/background mode to Redis/Celery.
- Replace `MockLmsAdapter` with a vendor LMS adapter and webhook secret.
- Deploy Student/Admin/Foundation to Vercel or equivalent, FastAPI to an API host, and Supabase to Supabase Cloud.

## Safety Boundaries

- No service-role or secret key is used in browser code.
- Student Web must never show internal rule weights, teacher review records, ReviewCase details, other student data, or precise ranking.
- Agent and tool calls are trace/audit-linked.
- Mock data is demo-only and intended for 7-day retention.
