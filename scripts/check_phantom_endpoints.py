#!/usr/bin/env python3
"""Fail if docs mention /v1 endpoints not present in OpenAPI."""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
from pathlib import Path
from typing import Iterable

DEFAULT_DOCS_ROOT = Path("src/app/docs")
DEFAULT_ARCHE_API_ROOT = Path("../arche_api")
DEFAULT_OPENAPI_SNAPSHOT = DEFAULT_ARCHE_API_ROOT / "tests/openapi/snapshots/openapi.json"

METHOD_PATTERN = re.compile(r"\b(?:GET|POST|PUT|PATCH|DELETE)\s+(/v1/[^\s`\"')>]+)")
PATH_PATTERN = re.compile(r"(/v1/[^\s`\"')>]+)")
TRAILING_PUNCT = ".,;:)]}>"


def _set_openapi_env_defaults() -> None:
    os.environ.setdefault("ENVIRONMENT", "test")
    os.environ.setdefault(
        "DATABASE_URL",
        "postgresql+asyncpg://arche:arche@127.0.0.1:5432/arche_test",
    )
    os.environ.setdefault("REDIS_URL", "redis://127.0.0.1:6379/2")
    os.environ.setdefault("ALLOWED_ORIGINS", "http://localhost")
    os.environ.setdefault("AUTH_ENABLED", "false")


def _load_openapi_from_arche_api(arche_api_root: Path) -> dict:
    _set_openapi_env_defaults()
    sys.path.insert(0, str(arche_api_root / "src"))
    import arche_api.main as main_module  # noqa: WPS433

    app = main_module.create_app()
    return app.openapi()


def _load_openapi(schema_path: Path | None, arche_api_root: Path | None) -> dict:
    if schema_path is not None:
        return json.loads(schema_path.read_text())

    if DEFAULT_OPENAPI_SNAPSHOT.exists():
        return json.loads(DEFAULT_OPENAPI_SNAPSHOT.read_text())

    if arche_api_root is None:
        arche_api_root = DEFAULT_ARCHE_API_ROOT
    if not arche_api_root.exists():
        raise FileNotFoundError(
            "OpenAPI schema not found. Provide --openapi-path or ensure ../arche_api exists.",
        )
    return _load_openapi_from_arche_api(arche_api_root)


def _iter_docs_files(docs_root: Path) -> Iterable[Path]:
    for path in docs_root.rglob("*.mdx"):
        yield path
    for path in docs_root.rglob("*.md"):
        yield path


def _extract_routes(line: str) -> list[str]:
    if "[HYPOTHETICAL]" in line:
        return []
    matches = METHOD_PATTERN.findall(line) + PATH_PATTERN.findall(line)
    routes: list[str] = []
    for raw in matches:
        cleaned = raw.split("?", 1)[0].rstrip(TRAILING_PUNCT)
        if cleaned not in routes:
            routes.append(cleaned)
    return routes


def _main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--docs-root", type=Path, default=DEFAULT_DOCS_ROOT)
    parser.add_argument("--openapi-path", type=Path)
    parser.add_argument("--arche-api-root", type=Path)
    args = parser.parse_args()

    docs_root = args.docs_root
    if not docs_root.exists():
        raise FileNotFoundError(f"Docs root not found: {docs_root}")

    openapi = _load_openapi(args.openapi_path, args.arche_api_root)
    openapi_paths = set(openapi.get("paths", {}).keys())

    missing: list[str] = []

    for doc_path in _iter_docs_files(docs_root):
        for line_no, line in enumerate(doc_path.read_text().splitlines(), start=1):
            for route in _extract_routes(line):
                if route not in openapi_paths:
                    missing.append(f"{doc_path}:{line_no} -> {route}")

    if missing:
        print("Missing OpenAPI paths referenced in docs:")
        for item in missing:
            print(f"- {item}")
        return 1

    print("Docs endpoints match OpenAPI paths.")
    return 0


if __name__ == "__main__":
    raise SystemExit(_main())
