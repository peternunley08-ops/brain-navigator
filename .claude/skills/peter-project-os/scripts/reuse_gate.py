#!/usr/bin/env python3
"""Evaluate a supplied reuse record. Does not verify evidence, install, or grant permission."""
import argparse
import json
from pathlib import Path
import sys

GATES = ('need', 'identity', 'compatibility', 'license', 'security', 'maintenance',
         'minimal_scope', 'footprint_plan', 'authorization', 'rollback')
POST_GATES = ('capability_test', 'regression_test', 'footprint_check')


def evaluate(record):
    if not isinstance(record, dict) or record.get('schema_version') != 1:
        raise ValueError('Expected schema_version 1 object.')
    if type(record.get('existing_sufficient')) is not bool:
        raise ValueError('existing_sufficient must be a boolean, not a string.')
    if record.get('stage') not in ('proposal', 'validated'):
        raise ValueError('stage must be proposal or validated.')
    if record['existing_sufficient']:
        return {'decision': 'NO_ADDITION', 'reasons': ['Existing capability meets the need.'], 'action': 'Reuse existing capability; do not add a duplicate.'}
    candidate = record.get('candidate')
    if not isinstance(candidate, dict) or not all(isinstance(candidate.get(k), str) and candidate[k].strip() for k in ('source', 'revision', 'component', 'mode')):
        raise ValueError('Candidate requires source, revision, component, and mode.')
    if candidate['mode'] not in ('reference', 'skill', 'temporary_tool', 'dev_dependency', 'runtime_dependency', 'platform'):
        raise ValueError('Unsupported integration mode.')
    gates = record.get('gates')
    if not isinstance(gates, dict):
        raise ValueError('gates must be an object.')
    required = GATES + (POST_GATES if record['stage'] == 'validated' else ())
    failures, unknowns = [], []
    for name in required:
        gate = gates.get(name)
        if gate is None:
            unknowns.append(name)
            continue
        if not isinstance(gate, dict) or gate.get('status') not in ('pass', 'fail', 'unknown'):
            raise ValueError(f'{name}: expected pass, fail, or unknown status.')
        evidence = gate.get('evidence')
        if gate['status'] == 'fail':
            failures.append(name)
        elif gate['status'] == 'unknown' or not isinstance(evidence, str) or not evidence.strip():
            unknowns.append(name)
    if failures:
        return {'decision': 'REJECT', 'reasons': failures, 'action': 'Do not retain this candidate as proposed; revise or choose a smaller alternative.'}
    if unknowns:
        return {'decision': 'HOLD', 'reasons': unknowns, 'action': 'Resolve missing evidence; continue independent project work.'}
    if record['stage'] == 'validated':
        return {'decision': 'KEEP', 'reasons': [], 'action': 'Retain only the validated scope; record provenance and removal steps.'}
    return {'decision': 'PILOT_ALLOWED', 'reasons': [], 'action': 'Run the smallest scoped pilot under host authorization; this is not production approval.'}


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('record', type=Path)
    args = parser.parse_args(argv)
    try:
        result = evaluate(json.loads(args.record.read_text(encoding='utf-8')))
    except (OSError, ValueError) as exc:
        print(json.dumps({'error': str(exc), 'decision': 'INVALID'}), file=sys.stderr)
        return 2
    result['notice'] = 'Based only on supplied assertions; does not independently verify evidence or override host policy.'
    print(json.dumps(result, indent=2))
    return 0 if result['decision'] in ('NO_ADDITION', 'PILOT_ALLOWED', 'KEEP') else 1


if __name__ == '__main__':
    raise SystemExit(main())
