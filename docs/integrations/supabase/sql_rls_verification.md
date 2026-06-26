# SQL And RLS Verification

Run migrations against a disposable Supabase project first:

```bash
supabase db push
psql "$SUPABASE_DB_URL" -f supabase/seed/001_mock_unit6.sql
```

Suggested RLS checks from SQL editor:

```sql
-- Students should never read canonical content/path/model tables directly.
set local role authenticated;
select * from public.tasks;
select * from public.learning_paths;
select * from public.path_steps;
select * from public.bkt_states;
select * from public.irt_states;

-- With a real JWT, auth.uid() should expose only student-safe projection rows.
select * from public.student_home_view;
select * from public.student_learning_path_view;
select * from public.student_task_view;
select * from public.student_profile_summary_view;
select * from public.student_submissions;

-- Staff-only objects must not be visible to student JWTs.
select * from public.review_cases;
select * from public.decision_traces;
select * from public.audit_logs;
select * from public.tool_registry;
select * from public.trace_events;
```

Expected results:

- Direct student reads for `tasks`, `learning_paths`, `path_steps`, `bkt_states`, and `irt_states` return no rows.
- Student-safe views return only own safe rows and never include answer keys, internal rule weights, ReviewCase details, DecisionTrace rows, raw BKT/IRT values, exact ranks, or other students.
- Student submission/media reads are scoped to `current_student_id()`; writes still go through FastAPI/idempotency in the production skeleton.
- ReviewCase, decision trace, queue, audit, tool registry, trace event, generated CRUD, and dead-letter details are staff/admin or service scoped.
- Storage object paths under `student-media` must start with the authenticated user id.
