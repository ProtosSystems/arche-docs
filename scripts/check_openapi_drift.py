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

        # Parameters and response codes are called out above for readability.
        # Everything else in the operation - request bodies, response schema
        # references, descriptions - is compared structurally, because naming
        # each field to check is how drift goes unnoticed.
        findings.extend(_deep_findings(key, pub, ref, skip_keys={"parameters", "responses"}))

    pub_schemas = (published.get("components") or {}).get("schemas") or {}
    ref_schemas = (reference.get("components") or {}).get("schemas") or {}
    for name in sorted(set(ref_schemas) - set(pub_schemas)):
        findings.append(f"schema added upstream: {name}")
    for name in sorted(set(pub_schemas) - set(ref_schemas)):
        findings.append(f"schema no longer served: {name}")

    # Compare schema bodies, not just their names. A response field added
    # upstream, a field description corrected, or a field becoming optional all
    # live inside the schema body and are invisible to a name-only comparison.
    for name in sorted(set(pub_schemas) & set(ref_schemas)):
        findings.extend(_deep_findings(f"schema {name}", pub_schemas[name], ref_schemas[name]))

    return findings


def _deep_findings(
    label: str,
    published: Any,
    reference: Any,
    *,
    skip_keys: set[str] | None = None,
    path: str = "",
    depth: int = 0,
) -> list[str]:
    """Report every structural difference between two spec fragments.

    Reported from the published schema's point of view: "added upstream" means
    the API serves it and the published copy does not.
    """
    if depth > 12:
        return []
    findings: list[str] = []
    where = f"{label}{path}"

    if type(published) is not type(reference):
        return [f"{where}: type changed upstream ({_name(published)} -> {_name(reference)})"]

    if isinstance(published, dict):
        assert isinstance(reference, dict)
        for key in sorted(set(published) | set(reference)):
            if skip_keys and depth == 0 and key in skip_keys:
                continue
            if key not in published:
                findings.append(f"{where}.{key}: added upstream")
            elif key not in reference:
                findings.append(f"{where}.{key}: no longer served")
            else:
                findings.extend(
                    _deep_findings(
                        label,
                        published[key],
                        reference[key],
                        path=f"{path}.{key}",
                        depth=depth + 1,
                    )
                )
        return findings

    if isinstance(published, list):
        assert isinstance(reference, list)
        # Order is not meaningful for `required`, `enum`, and similar lists.
        if all(isinstance(item, str) for item in published + reference):
            for item in sorted(set(reference) - set(published)):
                findings.append(f"{where}: {item!r} added upstream")
            for item in sorted(set(published) - set(reference)):
                findings.append(f"{where}: {item!r} no longer served")
            return findings
        if len(published) != len(reference):
            return [f"{where}: {len(published)} entries upstream serves {len(reference)}"]
        for index, (pub_item, ref_item) in enumerate(zip(published, reference)):
            findings.extend(
                _deep_findings(
                    label, pub_item, ref_item, path=f"{path}[{index}]", depth=depth + 1
                )
            )
        return findings

    if published != reference:
        findings.append(f"{where}: changed upstream ({_truncate(published)} -> {_truncate(reference)})")
    return findings


def _name(value: Any) -> str:
    return type(value).__name__


def _truncate(value: Any, limit: int = 60) -> str:
    text = repr(value)
    return text if len(text) <= limit else f"{text[:limit]}..."


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
