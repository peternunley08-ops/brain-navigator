import copy
from pathlib import Path
import sys
import unittest
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'scripts'))
import reuse_gate as gate


def candidate(stage='proposal'):
    return {'schema_version': 1, 'stage': stage, 'existing_sufficient': False,
            'candidate': {'source': 'test-fixture', 'revision': 'fixture-revision', 'component': 'parser', 'mode': 'dev_dependency'},
            'gates': {k: {'status': 'pass', 'evidence': 'Synthetic test evidence, not a real repository review.'} for k in gate.GATES}}


class ReuseGateTests(unittest.TestCase):
    def test_existing_wins_without_installation(self):
        self.assertEqual(gate.evaluate({'schema_version': 1, 'stage': 'proposal', 'existing_sufficient': True})['decision'], 'NO_ADDITION')

    def test_proposal_is_only_pilot(self):
        self.assertEqual(gate.evaluate(candidate())['decision'], 'PILOT_ALLOWED')

    def test_license_failure_cannot_be_averaged_away(self):
        record = candidate(); record['gates']['license']['status'] = 'fail'
        self.assertEqual(gate.evaluate(record)['decision'], 'REJECT')

    def test_blank_evidence_and_missing_gate_hold(self):
        record = candidate(); record['gates']['identity']['evidence'] = ''
        del record['gates']['authorization']
        result = gate.evaluate(record)
        self.assertEqual(result['decision'], 'HOLD')
        self.assertEqual(set(result['reasons']), {'identity', 'authorization'})

    def test_retention_requires_post_checks(self):
        record = candidate('validated')
        self.assertEqual(gate.evaluate(record)['decision'], 'HOLD')
        record['gates'].update({k: {'status': 'pass', 'evidence': 'Fixture result'} for k in gate.POST_GATES})
        self.assertEqual(gate.evaluate(record)['decision'], 'KEEP')

    def test_bloat_or_regression_rejects_retention(self):
        for name in ['footprint_check', 'regression_test']:
            record = candidate('validated')
            record['gates'].update({k: {'status': 'pass', 'evidence': 'Fixture result'} for k in gate.POST_GATES})
            record['gates'][name]['status'] = 'fail'
            self.assertEqual(gate.evaluate(record)['decision'], 'REJECT')

    def test_malformed_types_not_truthy_approval(self):
        record = candidate(); record['existing_sufficient'] = 'false'
        with self.assertRaises(ValueError): gate.evaluate(record)
        record = candidate(); record['gates']['security']['status'] = True
        with self.assertRaises(ValueError): gate.evaluate(record)

    def test_evaluation_does_not_mutate_record(self):
        record = candidate(); before = copy.deepcopy(record)
        gate.evaluate(record)
        self.assertEqual(record, before)


if __name__ == '__main__': unittest.main()
