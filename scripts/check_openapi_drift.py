#!/usr/bin/env python3
"""Fail if the published OpenAPI schema has drifted from the API that serves it.

`scripts/check_phantom_endpoints.py` validates docs prose against
`public/openapi.json`. That is the schema this site publishes and renders, so
the check cannot notice when `public/openapi.json` itself falls behind
`arche-api`. This script closes that loop by comparing the committed schema
against a reference copy produced by the API.

Get the reference copy either way:

    # from a sibling arche-api checkout
    python3 scripts/check_openapi_drift.py --arche-api-root ../arche-api

    # from a schema fetched or downloaded elsewhere (CI)
    python3 scripts/check_openapi_drift.py --source /tmp/openapi.json

Exit codes: 0 in sync, 1 drifted, 2 no reference schema available.
"""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
from pathlib import Path
from typing import Any

DEFAULT_PUBLISHED = Path("public/openapi.json")
DEFAULT_ARCHE_API_ROOT = Path("../arche-api")
METHODS = ("get", "post", "put", "patch", "delete", "head", "options")

NO_REFERENCE = 2


def _operations(spec: dict[str, Any]) -> dict[str, dict[str, Any]]:
    """Return {"GET /v1/thing": operation} for every operation in the spec."""
    out: dict[str, dict[str, Any]] = {}
    for path, item in (spec.get("paths") or {}).items():
        if not isinstance(item, dict):
            continue
        for method, operation in item.items():
            if method.lower() in METHODS and isinstance(operation, dict):
                out[f"{method.upper()} {path}"] = operation
    return out


def _params(operation: dict[str, Any]) -> set[tuple[str, str, bool]]:
    return {
        (p.get("in", ""), p.get("name", ""), bool(p.get("required")))
        for p in operation.get("parameters", [])
        if isinstance(p, dict)
    }


def _response_codes(operation: dict[str, Any]) -> set[str]:
    return {str(code) for code in (operation.get("responses") or {})}


def _diff(published: dict[str, Any], reference: dict[str, Any]) -> list[str]:
    """Return human-readable drift findings, most structural first."""
    findings: list[str] = []

    pub_ops = _operations(published)
    ref_ops = _operations(reference)

    for key in sorted(set(ref_ops) - set(pub_ops)):
        findings.append(f"missing from published schema: {key}")
    for key in sorted(set(pub_ops) - set(ref_ops)):
        findings.append(f"published schema has an operation the API no longer serves: {key}")

    for key in sorted(set(pub_ops) & set(ref_ops)):
        pub, ref = pub_ops[key], ref_ops[key]

        added = _params(ref) - _params(pub)
        removed = _params(pub) - _params(ref)
        for loc, name, required in sorted(added):
            findings.append(
                f"{key}: parameter added upstream: {loc} {name}"
                f"{' (required)' if required else ''}"
            )
        for loc, name, required in sorted(removed):
            findings.append(
                f"{key}: parameter no longer served: {loc} {name}"
                f"{' (was required)' if required else ''}"
            )

        for code in sorted(_response_codes(ref) - _response_codes(pub)):
            findings.append(f"{key}: response {code} added upstream")
        for code in sorted(_response_codes(pub) - _response_codes(ref)):
            findings.append(f"{key}: response {code} no longer served")

        for field in ("summary", "description", "operationId"):
            if (pub.get(field) or "") != (ref.get(field) or ""):
                findings.append(f"{key}: {field} changed upstream")

    pub_schemas = set((published.get("components") or {}).get("schemas") or {})
    ref_schemas = set((reference.get("components") or {}).get("schemas") or {})
    for name in sorted(ref_schemas - pub_schemas):
        findings.append(f"schema added upstream: {name}")
    for name in sorted(pub_schemas - ref_schemas):
        findings.append(f"schema no longer served: {name}")

    return findings


def _reference_from_arche_api(root: Path) -> dict[str, Any]:
    """Read arche-api's committed schema, falling back to generating one.

    arche-api commits its raw schema at `openapi.json` and a test there keeps it
    current, so reading the file is both cheaper and closer to what CI compares
    against. Older checkouts predate that file; those still get regenerated.
    """
    committed = root / "openapi.json"
    if committed.exists():
        return json.loads(committed.read_text(encoding="utf-8"))

    script = Path(__file__).with_name("sync_openapi_snapshot.py")
    tmp = Path(".openapi-reference.json")
    try:
        subprocess.run(
            [sys.executable, str(script), "--arche-api-root", str(root), "--dest", str(tmp)],
            check=True,
            capture_output=True,
            text=True,
        )
        return json.loads(tmp.read_text(encoding="utf-8"))
    finally:
        tmp.unlink(missing_ok=True)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--published", type=Path, default=DEFAULT_PUBLISHED)
    parser.add_argument("--source", type=Path, help="Reference OpenAPI JSON to compare against.")
    parser.add_argument("--arche-api-root", type=Path, default=DEFAULT_ARCHE_API_ROOT)
    args = parser.parse_args()

    if not args.published.exists():
        print(f"Published schema not found: {args.published}", file=sys.stderr)
        return NO_REFERENCE

    if args.source is not None:
        if not args.source.exists():
            print(f"Reference schema not found: {args.source}", file=sys.stderr)
            return NO_REFERENCE
        reference = json.loads(args.source.read_text(encoding="utf-8"))
        origin = str(args.source)
    elif args.arche_api_root.exists():
        try:
            reference = _reference_from_arche_api(args.arche_api_root)
        except subprocess.CalledProcessError as exc:
            print("Could not generate a reference schema from arche-api:", file=sys.stderr)
            print(exc.stderr or exc.stdout, file=sys.stderr)
            return NO_REFERENCE
        origin = f"{args.arche_api_root}:/openapi.json"
    else:
        print(
            "No reference schema available. Pass --source, or check out arche-api at "
            f"{args.arche_api_root}. This check is INCONCLUSIVE, not passing.",
            file=sys.stderr,
        )
        return NO_REFERENCE

    published = json.loads(args.published.read_text(encoding="utf-8"))
    findings = _diff(published, reference)

    if findings:
        print(f"OpenAPI drift detected between {args.published} and {origin}:")
        for finding in findings:
            print(f"- {finding}")
        print(f"\n{len(findings)} difference(s). Refresh with: npm run sync:openapi")
        return 1

    print(f"{args.published} is in sync with {origin}.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
