#!/usr/bin/env python3
"""Check live service readiness without printing configured secret values."""

from __future__ import annotations

import json
import os
import socket
import ssl
import sys
from pathlib import Path
from urllib import request
from urllib.error import HTTPError, URLError
from urllib.parse import urlparse


ROOT = Path(__file__).resolve().parents[1]
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


def result(name: str, status: str, message: str) -> dict[str, str]:
    return {"name": name, "status": status, "message": message}


def http_probe(name: str, url: str, headers: dict[str, str] | None = None) -> dict[str, str]:
    if not url:
        return result(name, "WARN", "Not configured.")
    req = request.Request(url, headers=headers or {})
    try:
        with request.urlopen(req, timeout=10) as response:
            return result(name, "PASS", f"HTTP {response.status}")
    except HTTPError as exc:
        if 400 <= exc.code < 500:
            return result(name, "WARN", f"Service reachable but returned HTTP {exc.code}.")
        return result(name, "FAIL", f"HTTP {exc.code}")
    except URLError as exc:
        return result(name, "FAIL", f"Network error: {exc.reason}")
    except TimeoutError:
        return result(name, "FAIL", "Timed out.")


def redis_probe(redis_url: str) -> dict[str, str]:
    if not redis_url:
        return result("redis", "WARN", "REDIS_URL is not configured; local BackgroundTasks/mock queue remains usable.")

    parsed = urlparse(redis_url)
    host = parsed.hostname
    port = parsed.port or (6379 if parsed.scheme in {"redis", "rediss"} else None)
    if not host or not port:
        return result("redis", "FAIL", "REDIS_URL is malformed.")

    try:
        raw_sock = socket.create_connection((host, port), timeout=10)
        sock = ssl.create_default_context().wrap_socket(raw_sock, server_hostname=host) if parsed.scheme == "rediss" else raw_sock
        with sock:
            username = parsed.username
            password = parsed.password
            if password:
                if username:
                    auth = f"*3\r\n$4\r\nAUTH\r\n${len(username)}\r\n{username}\r\n${len(password)}\r\n{password}\r\n"
                else:
                    auth = f"*2\r\n$4\r\nAUTH\r\n${len(password)}\r\n{password}\r\n"
                sock.sendall(auth.encode("utf-8"))
                sock.recv(256)
            sock.sendall(b"*1\r\n$4\r\nPING\r\n")
            response = sock.recv(256)
            if b"PONG" in response:
                return result("redis", "PASS", "PING returned PONG.")
            return result("redis", "WARN", "Connected, but PING did not return PONG.")
    except OSError as exc:
        return result("redis", "FAIL", f"Connection failed: {exc.__class__.__name__}")


def main() -> int:
    load_env_files()

    supabase_url = os.environ.get("SUPABASE_URL") or os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "")
    publishable_key = os.environ.get("SUPABASE_PUBLISHABLE_KEY") or os.environ.get("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "")
    openai_key = os.environ.get("OPENAI_API_KEY", "")
    redis_url = os.environ.get("REDIS_URL", "")
    lms_base_url = os.environ.get("LMS_BASE_URL", "")
    db_url = os.environ.get("SUPABASE_DB_URL", "")

    checks = [
        result("supabase_db_url", "PASS" if db_url else "WARN", "Configured." if db_url else "Missing backend-only SUPABASE_DB_URL."),
        http_probe(
            "supabase_auth_health",
            f"{supabase_url.rstrip('/')}/auth/v1/health" if supabase_url else "",
            {"apikey": publishable_key} if publishable_key else None,
        ),
        http_probe("openai_models", "https://api.openai.com/v1/models" if openai_key else "", {"Authorization": "Bearer " + openai_key} if openai_key else None),
        redis_probe(redis_url),
        http_probe("lms_base_url", lms_base_url),
    ]

    print(json.dumps({"secretValuesReturned": False, "checks": checks}, indent=2))
    return 1 if any(item["status"] == "FAIL" for item in checks) else 0


if __name__ == "__main__":
    raise SystemExit(main())
