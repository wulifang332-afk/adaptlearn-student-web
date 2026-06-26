# Environment And Secrets Setup

Do not commit real secrets. Use `.env.example` only as the template.

## Local Files

| Target | File | Contents |
|---|---|---|
| Next.js Student Web | `apps/web/.env.local` | `NEXT_PUBLIC_*` browser-safe values and `NEXT_PUBLIC_API_BASE_URL` |
| Next.js Admin Web | `apps/admin-web/.env.local` | Admin frontend browser-safe values only |
| Next.js Foundational Console | `apps/foundation-console/.env.local` | Foundation frontend browser-safe values only; optional `FOUNDATION_API_BASE_URL` for server-side readiness fetches |
| FastAPI backend | `apps/api/.env` | Supabase server keys, DB URL, OpenAI key, Redis URL, LMS secrets |
| Deployment | Provider secret manager | Same env names as local backend/frontend files |

Never put `SUPABASE_SECRET_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_DB_URL`, `OPENAI_API_KEY`, `LMS_CLIENT_SECRET`, or `LMS_WEBHOOK_SECRET` in a frontend `.env.local` file.

## Supabase

Find these in the Supabase project dashboard:

| Value | Where | Env var |
|---|---|---|
| Project URL | Project Settings -> API | `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_URL` |
| Publishable key | Project Settings -> API | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_PUBLISHABLE_KEY` |
| Secret/service-role key | Project Settings -> API | `SUPABASE_SECRET_KEY` or `SUPABASE_SERVICE_ROLE_KEY` |
| Direct DB URL | Project Settings -> Database -> Connection string | `SUPABASE_DB_URL` |
| Region | Project settings/general page | `SUPABASE_REGION` |

`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` is browser-safe. Service-role/secret key and DB URL are backend-only.

## OpenAI

Create or use an existing project API key from the OpenAI platform dashboard, then store it only in `apps/api/.env` and backend deployment secrets:

```bash
OPENAI_API_KEY=...
OPENAI_AGENT_MODEL=gpt-5.5
OPENAI_EMBEDDING_MODEL=text-embedding-3-large
OPENAI_EMBEDDING_DIMENSIONS=1024
OPENAI_TRANSCRIBE_MODEL=gpt-4o-mini-transcribe
```

Without `OPENAI_API_KEY`, the FastAPI skeleton uses the mock adapter.

## Redis

`REDIS_URL` comes from the Redis service used by the deployment target.

Common places:
- Local Docker: usually `redis://redis:6379/0` inside Compose, or `redis://127.0.0.1:6379/0` from the host.
- Managed Redis/Upstash/Valkey/Render/Fly/Railway: copy the provider's connection string from its dashboard.
- If no Redis is available for MVP, keep using the FastAPI BackgroundTasks adapter and leave `REDIS_URL` empty or local-only.

## LMS

These values come from the school's LMS vendor or developer/admin portal, not from AdaptLearn:

| Value | Where to get it | Env var |
|---|---|---|
| Vendor API docs/OpenAPI | LMS developer portal or vendor support contact | document under `docs/integrations/lms/` |
| Base API URL | LMS sandbox/production app settings | `LMS_BASE_URL` |
| OAuth client id | LMS developer app/client credentials page | `LMS_CLIENT_ID` |
| OAuth client secret | LMS developer app/client credentials page | `LMS_CLIENT_SECRET` |
| Token URL | LMS OAuth/OpenID metadata or docs | `LMS_TOKEN_URL` |
| Webhook secret | LMS webhook subscription settings | `LMS_WEBHOOK_SECRET` |

Until those exist, keep `MockLmsAdapter` active.

## Operational Helpers

After backend secrets are configured in `.env` or `apps/api/.env`, use:

```bash
npm run ops:supabase:dry-run
npm run ops:supabase:apply
npm run ops:supabase:seed
npm run ops:readiness
```

These commands report file names and readiness status only. They do not print secret values.
