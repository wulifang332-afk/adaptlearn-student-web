#!/usr/bin/env python3
"""Apply AdaptLearn Supabase migrations and optional mock seed.

Reads SUPABASE_DB_URL from process env, .env, or apps/api/.env. Secret values are
never printed. Requires psycopg:

    python3 -m pip install "psycopg[binary]>=3.2"
"""

from __future__ import annotations

import argparse
import hashlib
import os
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
MIGRATIONS_DIR = ROOT / "supabase" / "migrations"
SEED_DIR = ROOT / "supabase" / "seed"
ENV_FILES = [ROOT / ".env", ROOT / "apps" / "api" / ".env"]


def load_env_files() -> None:
    for path in ENV_FILES:
        if not path.exists():
            continue
        for raw_line in path.read_text(encoding="utf-8").splitlines():
            line = raw_line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


def sql_files(include_seed: bool) -> list[Path]:
    files = sorted(MIGRATIONS_DIR.glob("*.sql"))
    if include_seed:
        files.extend(sorted(SEED_DIR.glob("*.sql")))
    return files


def require_psycopg():
    try:
        import psycopg  # type: ignore
    except ModuleNotFoundError:
        print("Missing dependency: psycopg. Install with: python3 -m pip install 'psycopg[binary]>=3.2'", file=sys.stderr)
        raise SystemExit(2)
    return psycopg


def migration_id(path: Path) -> str:
    return path.stem


def checksum(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def apply_sql_file(conn, path: Path) -> None:
    sql = path.read_text(encoding="utf-8")
    with conn.cursor() as cur:
        cur.execute(sql)
        if path.parent == MIGRATIONS_DIR:
            cur.execute(
                """
                insert into public.schema_versions (id, checksum, status, applied_at)
                values (%s, %s, 'APPLIED', now())
                on conflict (id) do update
                set checksum = excluded.checksum,
                    status = 'APPLIED',
                    applied_at = excluded.applied_at
                """,
                (migration_id(path), checksum(sql)),
            )


def main() -> int:
    parser = argparse.ArgumentParser(description="Apply Supabase migrations without printing secrets.")
    parser.add_argument("--include-seed", action="store_true", help="Apply supabase/seed/*.sql after migrations.")
    parser.add_argument("--dry-run", action="store_true", help="Only list files and environment readiness.")
    args = parser.parse_args()

    load_env_files()
    db_url = os.environ.get("SUPABASE_DB_URL", "").strip()
    files = sql_files(args.include_seed)

    print(f"SUPABASE_DB_URL configured: {bool(db_url)}")
    print(f"SQL files: {len(files)}")
    for path in files:
        print(f"- {path.relative_to(ROOT)}")

    if args.dry_run:
        return 0

    if not db_url:
        print("SUPABASE_DB_URL is missing. Copy .env.example to .env and set the backend-only DB URL.", file=sys.stderr)
        return 1

    psycopg = require_psycopg()
    with psycopg.connect(db_url, connect_timeout=20) as conn:
        for path in files:
            print(f"Applying {path.relative_to(ROOT)}")
            apply_sql_file(conn, path)
            conn.commit()

    print("Supabase SQL apply completed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
