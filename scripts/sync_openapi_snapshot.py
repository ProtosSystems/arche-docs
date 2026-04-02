#!/usr/bin/env python3
"""Sync a raw Arche API OpenAPI schema into this docs app.

The backend test snapshot intentionally strips summaries, descriptions,
operationIds, and examples to keep contract diffs stable. That normalized
snapshot is suitable for tests, but not for publishing API reference docs.
"""

from __future__ import annotations

import argparse
import importlib
import json
import os
import sys
from pathlib import Path


DEFAULT_SOURCE = Path("../arche_api/openapi.json")
DEFAULT_DEST = Path("public/openapi.json")
DEFAULT_ARCHE_API_ROOT = Path("../arche_api")


def _set_stable_env() -> None:
    os.environ.setdefault("ENVIRONMENT", "test")
    os.environ.setdefault("SERVICE_NAME", "arche_api")
    os.environ.setdefault("SERVICE_VERSION", "0.0.0")
    os.environ.setdefault("LOG_LEVEL", "WARNING")
    os.environ.setdefault("ALLOWED_ORIGINS", "*")
    os.environ.setdefault(
        "DATABASE_URL", "postgresql+asyncpg://arche:arche@127.0.0.1:5432/arche_test"
    )
    os.environ.setdefault("REDIS_URL", "redis://127.0.0.1:6379/2")
    os.environ.setdefault("CELERY_BROKER_URL", "redis://127.0.0.1:6379/2")
    os.environ.setdefault("CELERY_RESULT_BACKEND", "redis://127.0.0.1:6379/3")
    os.environ.setdefault("MARKETSTACK_API_KEY", "__test__")
    os.environ.setdefault("EDGAR_BASE_URL", "https://data.sec.gov")
    os.environ.setdefault("RATE_LIMIT_ENABLED", "false")
    os.environ.setdefault("RATE_LIMIT_BACKEND", "memory")
    os.environ.setdefault("RATE_LIMIT_BURST", "5")
    os.environ.setdefault("RATE_LIMIT_WINDOW_SECONDS", "1")
    os.environ.setdefault("AUTH_ENABLED", "false")
    os.environ.setdefault("AUTH_ALGORITHM", "HS256")
    os.environ.setdefault("AUTH_HS256_SECRET", "test-secret")
    os.environ.setdefault("OTEL_ENABLED", "false")
    os.environ.setdefault("OTEL_EXPORTER_OTLP_ENDPOINT", "http://127.0.0.1:4317")
    os.environ.setdefault("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "pk_test_arche_test")
    os.environ.setdefault("CLERK_SECRET_KEY", "sk_test_arche_test")
    os.environ.setdefault("CLERK_ISSUER", "https://arche-test.clerk.accounts.dev")
    os.environ.setdefault("CLERK_AUDIENCE", "arche_api")
    os.environ.setdefault(
        "CLERK_JWKS_URL", "https://arche-test.clerk.accounts.dev/.well-known/jwks.json"
    )
    os.environ.setdefault("CLERK_WEBHOOK_SECRET", "whsec_test")
    os.environ.pop("ARCHE_TEST_MODE", None)


def _load_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def _looks_like_normalized_test_snapshot(spec: dict) -> bool:
    operations = 0
    operations_with_human_docs = 0

    for methods in spec.get("paths", {}).values():
        if not isinstance(methods, dict):
            continue
        for operation in methods.values():
            if not isinstance(operation, dict):
                continue
            operations += 1
            if any(
                key in operation for key in ("summary", "description", "operationId", "examples")
            ):
                operations_with_human_docs += 1

    return operations > 0 and operations_with_human_docs == 0


def _fetch_raw_openapi(arche_api_root: Path) -> dict:
    arche_api_root = arche_api_root.resolve()
    if not arche_api_root.exists():
        raise FileNotFoundError(f"arche_api root not found: {arche_api_root}")

    from fastapi.testclient import TestClient

    sys.path.insert(0, str(arche_api_root))
    _set_stable_env()

    import arche_api.config.settings as settings_module
    import arche_api.main as main_module

    importlib.reload(settings_module)
    settings_module.get_settings.cache_clear()
    api_router_module = importlib.import_module("arche_api.adapters.routers.api_router")
    importlib.reload(api_router_module)
    importlib.reload(main_module)

    app = main_module.create_app()
    with TestClient(app) as client:
        response = client.get("/openapi.json")
        if response.status_code != 200:
            raise RuntimeError(f"Cannot fetch raw openapi.json: {response.status_code} {response.text}")
        payload = response.json()

    if not isinstance(payload, dict):
        raise RuntimeError("Unexpected OpenAPI payload: expected a JSON object at /openapi.json")

    return payload


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--source",
        type=Path,
        help="Path to a raw OpenAPI JSON file. Do not use the normalized test snapshot.",
    )
    parser.add_argument(
        "--arche-api-root",
        type=Path,
        default=DEFAULT_ARCHE_API_ROOT,
        help="Path to the sibling arche_api repo used to generate a raw OpenAPI schema.",
    )
    parser.add_argument("--dest", type=Path, default=DEFAULT_DEST)
    args = parser.parse_args()

    dest = args.dest.resolve()
    if args.source is not None:
        source = args.source.resolve()
        if not source.exists():
            raise SystemExit(f"OpenAPI source not found: {source}")
        payload = _load_json(source)
        source_label = str(source)
    else:
        payload = _fetch_raw_openapi(args.arche_api_root)
        source_label = f"{args.arche_api_root.resolve()}:/openapi.json"

    if _looks_like_normalized_test_snapshot(payload):
        raise SystemExit(
            "Refusing to sync a normalized OpenAPI snapshot: it has no operation summaries/"
            "descriptions/examples. Use a raw /openapi.json export from arche_api instead."
        )

    dest.parent.mkdir(parents=True, exist_ok=True)
    serialized = json.dumps(payload, indent=2, sort_keys=False, ensure_ascii=False)
    if not serialized.endswith("\n"):
        serialized += "\n"
    dest.write_text(serialized, encoding="utf-8")
    print(f"Synced raw OpenAPI schema: {source_label} -> {dest}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
