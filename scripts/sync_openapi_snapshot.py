#!/usr/bin/env python3
"""Copy the current arche_api OpenAPI snapshot into this docs app."""

from __future__ import annotations

import argparse
import shutil
from pathlib import Path


DEFAULT_SOURCE = Path("../arche_api/tests/openapi/snapshots/openapi.json")
DEFAULT_DEST = Path("public/openapi.json")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", type=Path, default=DEFAULT_SOURCE)
    parser.add_argument("--dest", type=Path, default=DEFAULT_DEST)
    args = parser.parse_args()

    source = args.source.resolve()
    dest = args.dest.resolve()

    if not source.exists():
        raise SystemExit(f"OpenAPI snapshot not found: {source}")

    dest.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(source, dest)
    print(f"Synced OpenAPI snapshot: {source} -> {dest}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
