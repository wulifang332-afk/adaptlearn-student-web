# Supabase Cloud Runbook

This runbook moves the skeleton from local mock mode toward Supabase Cloud integration without committing secrets.

## Prerequisites

- A Supabase project.
- `SUPABASE_DB_URL` configured in `.env` or `apps/api/.env`.
- Optional Python dependency for the migration helper:

```bash
python3 -m pip install "psycopg[binary]>=3.2"
```

Do not put `SUPABASE_SECRET_KEY` or `SUPABASE_DB_URL` in any frontend `.env.local` file.

## 1. Configure Backend Environment

Copy the template:

```bash
cp .env.example .env
```

Fill backend-only values in `.env`:

```text
SUPABASE_URL=...
SUPABASE_PUBLISHABLE_KEY=...
SUPABASE_SECRET_KEY=...
SUPABASE_DB_URL=...
SUPABASE_REGION=ap-northeast-1
SUPABASE_ENABLE_PGVECTOR=true
```

The direct DB URL usually comes from Supabase Dashboard -> Project Settings -> Database -> Connection string.

## 2. Review SQL Files

Dry-run the migration helper:

```bash
npm run ops:supabase:dry-run
```

Expected SQL files:

- `supabase/migrations/202606260001_initial_student_web_schema.sql`
- `supabase/seed/001_mock_unit6.sql`

## 3. Apply Migrations

Apply schema only:

```bash
npm run ops:supabase:apply
```

Apply schema plus mock seed:

```bash
npm run ops:supabase:seed
```

The helper prints file names and status, but never prints the DB URL.

## 4. Storage Buckets

Create private buckets in Supabase Storage:

- `student-media`
- `rag-source-docs`
- `generated-feedback`
- `prototype-exports`

Follow [storage.md](storage.md) for policy expectations. Student media and RAG source documents must not be public buckets.

## 5. RLS Verification

Use [sql_rls_verification.md](sql_rls_verification.md) after Auth users are created. The mock seed creates user profile ids, but real Supabase Auth users must be mapped before browser-auth RLS tests are meaningful.

## 6. Live Readiness

After `.env` is configured:

```bash
npm run ops:readiness
```

The readiness helper checks:

- Supabase Auth health endpoint.
- OpenAI models endpoint when `OPENAI_API_KEY` exists.
- Redis PING when `REDIS_URL` exists.
- LMS base URL when configured.
- Backend-only `SUPABASE_DB_URL` presence.

It returns JSON with `secretValuesReturned: false`.

## 7. Rollback Notes

This skeleton migration is additive and uses `create table if not exists`, `create policy`, and safe views. For a competition project, prefer restoring the Supabase database from a project backup or branching snapshot instead of hand-dropping tables.
