# Supabase Storage Buckets

The initial migration attempts to create these private buckets:

- `student-media`
- `rag-source-docs`
- `generated-feedback`
- `prototype-exports`

If the Supabase SQL role cannot write to `storage.buckets`, create the buckets manually in the dashboard with `Public bucket` off. Then keep the storage policies from the migration or add equivalent dashboard policies:

- Students can manage only their own folder in `student-media`, where the first path segment is `auth.uid()`.
- Curriculum researchers/admins can manage `rag-source-docs`.
- Staff can read generated feedback and prototype exports.
- Teachers, curriculum researchers, and admins can manage `prototype-exports`.

The service-role/secret key must stay backend-only. Browser code uses only the Supabase publishable key.
